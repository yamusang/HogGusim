// src/pages/senior/ConnectPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { fetchMyApplications, cancelApplication } from '../../api/applications';
import Button from '../../components/ui/Button';
import './senior.css';

const fmtDateTime = (iso) => {
  try {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('ko-KR');
  } catch {
    return iso ?? '-';
  }
};

const StatusChip = ({ status }) => {
  const s = String(status || 'PENDING').toUpperCase();
  const map = {
    PENDING:   { label: '대기',   cls: 'chip chip--pending'  },
    APPROVED:  { label: '승인',   cls: 'chip chip--approved' },
    REJECTED:  { label: '거절',   cls: 'chip chip--rejected' },
    IN_PROGRESS: { label: '진행중', cls: 'chip chip--approved' },
    FORWARDED: { label: '전달',   cls: 'chip chip--approved' },
  };
  const meta = map[s] || map.PENDING;
  return <span className={meta.cls}>{meta.label}</span>;
};

export default function ConnectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // seniorId: user.seniorId -> user.id -> localStorage.seniorId
  const seniorId = useMemo(() => {
    const ls = localStorage.getItem('seniorId');
    return user?.seniorId ?? user?.id ?? (ls ? Number(ls) : null);
  }, [user]);

  // pagination & data
  const [page, setPage] = useState(0);      // 0-based (서버 기준)
  const [size, setSize] = useState(10);
  const [data, setData] = useState({
    content: [],
    number: 0,
    size,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    empty: true,
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [actingId, setActingId] = useState(null);
  const abortRef = useRef(null);

  const load = async () => {
    if (!seniorId) return;
    setLoading(true);
    setErr('');

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetchMyApplications({
        seniorId,
        page,
        size,
        signal: ctrl.signal,
      });
      if (ctrl.signal.aborted) return;

      setData(
        res || {
          content: [],
          number: page,
          size,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
          empty: true,
        }
      );
    } catch (e) {
      if (!ctrl.signal.aborted) setErr(e?.message || '신청 내역을 불러오지 못했습니다.');
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seniorId, page, size]);

  const rows = Array.isArray(data.content) ? data.content : [];
  const totalPages = data?.totalPages || Math.max(0, Math.ceil((data?.totalElements || 0) / (data?.size || size)));
  const uiPage = (data?.number ?? page) + 1;
  const noPages = !totalPages || totalPages <= 0;

  const onCancel = async (id) => {
    if (!window.confirm('이 신청을 취소할까요?')) return;
    try {
      setActingId(id);
      await cancelApplication(id);
      await load();
      alert('취소되었습니다.');
    } catch (e) {
      alert(e?.message || '취소 실패');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="senior">
      <header className="senior__header">
        <h1>내 신청 현황</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button presetName="ghost" onClick={() => navigate('/senior?mode=recommend')}>추천 보기</Button>
          <Button presetName="applibtn" onClick={() => navigate('/senior/apply')}>새 신청</Button>
        </div>
      </header>

      <section className="card">
        <div className="card__head">
          <h2 className="card__title">신청 목록</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <select
              value={size}
              onChange={(e) => {
                setPage(0);
                setSize(Number(e.target.value));
              }}
            >
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
            </select>
            <Button presetName="ghost" onClick={load}>새로고침</Button>
          </div>
        </div>

        {loading && <div className="card__body">불러오는 중…</div>}
        {err && !loading && <div className="card__error" style={{ color: 'crimson' }}>{err}</div>}

        {!loading && !err && rows.length === 0 && (
          <div className="list__empty">
            아직 신청이 없습니다. <Button presetName="ghost" onClick={() => navigate('/senior/apply')}>신청하러 가기</Button>
          </div>
        )}

        {!loading && !err && rows.length > 0 && (
          <ul className="list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map((app) => {
              const status = String(app.status || 'PENDING').toUpperCase();
              const pending = status === 'PENDING';
              const animalLabel = app.animal?.name || app.petName || app.breed || `Animal#${app.animalId ?? ''}`;
              const shelterName = app.shelter?.name || app.careNm || app.careName || '';
              const memo = app.memo || app.note || '';

              return (
                <li
                  key={app.id}
                  className="list__item"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 12,
                    alignItems: 'center',
                    border: '1px solid #eee',
                    borderRadius: 12,
                    padding: 12,
                    background: '#fff',
                  }}
                >
                  <div>
                    <div className="list__name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b>{animalLabel}</b> <StatusChip status={status} />
                    </div>
                    <div className="list__meta" style={{ fontSize: 12, color: '#6b7280' }}>
                      신청일: {fmtDateTime(app.createdAt)}
                      {app.reservedAt ? ` · 예약: ${fmtDateTime(app.reservedAt)}` : ''}
                      {shelterName ? ` · 보호소: ${shelterName}` : ''}
                      {memo ? ` · 메모: ${memo}` : ''}
                    </div>
                  </div>

                  <div className="mgr__actions" style={{ display: 'flex', gap: 8 }}>
                    {pending && (
                      <Button
                        presetName="ghost"
                        disabled={actingId === app.id}
                        onClick={() => onCancel(app.id)}
                      >
                        {actingId === app.id ? '취소 중…' : '신청 취소'}
                      </Button>
                    )}
                    <Button onClick={() => navigate(`/pet/${app.animalId ?? app.petId ?? app.id}/connect`)}>
                      상세
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && totalPages > 1 && (
          <div className="senior__pagination">
            <Button
              presetName="ghost"
              disabled={noPages || page <= 0 || data.first}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              이전
            </Button>
            <span>{noPages ? 0 : uiPage} / {noPages ? 0 : totalPages}</span>
            <Button
              presetName="ghost"
              disabled={noPages || data.last || uiPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
