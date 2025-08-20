// src/pages/senior/ConnectPage.jsx
import React, { useEffect, useRef, useState } from 'react';
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
    PENDING: { label: '대기', cls: 'chip chip--pending' },
    APPROVED: { label: '승인', cls: 'chip chip--approved' },
    REJECTED: { label: '거절', cls: 'chip chip--rejected' },
  };
  const meta = map[s] || map.PENDING;
  return <span className={meta.cls}>{meta.label}</span>;
};

export default function ConnectPage() {
  const { user } = useAuth();

  // seniorId: user.seniorId -> user.id -> localStorage.seniorId
  const seniorId =
    user?.seniorId ??
    user?.id ??
    (localStorage.getItem('seniorId') ? Number(localStorage.getItem('seniorId')) : null);

  const [page1, setPage1] = useState(1); // UI 1-based
  const [data, setData] = useState({
    content: [],
    number: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    empty: true,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [actingId, setActingId] = useState(null);

  // 진행 중 요청 취소용
  const abortRef = useRef(null);

  const load = async () => {
    if (!seniorId) return;
    setLoading(true);
    setErr('');

    // 이전 요청 취소
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetchMyApplications({
        seniorId,
        page: Math.max(0, page1 - 1),
        size: data.size || 10,
        signal: ctrl.signal,
      });
      if (ctrl.signal.aborted) return;
      setData(
        res || {
          content: [],
          number: page1 - 1,
          size: 10,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
          empty: true,
        },
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
  }, [page1, seniorId]);

  const onCancel = async (id) => {
    if (!window.confirm('이 신청을 취소할까요?')) return;
    try {
      setActingId(id);
      await cancelApplication(id);
      await load();
    } catch (e) {
      alert(e?.message || '취소 실패');
    } finally {
      setActingId(null);
    }
  };

  const list = Array.isArray(data.content) ? data.content : [];
  const totalPages =
    data.totalPages || Math.max(0, Math.ceil((data.totalElements || 0) / (data.size || 10)));
  const noPages = !totalPages || totalPages <= 0;

  return (
    <div className="senior">
      <header className="senior__header">
        <h1>내 신청 현황</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button presetName="ghost" onClick={() => (window.location.href = '/senior?mode=recommend')}>
            추천 보러가기
          </Button>
        </div>
      </header>

      {loading && <div className="card">불러오는 중…</div>}
      {err && !loading && <div className="card" style={{ color: 'crimson' }}>{err}</div>}

      {!loading && !err && list.length === 0 && (
        <div className="card">신청 내역이 없습니다.</div>
      )}

      {!loading && !err && list.length > 0 && (
        <section className="card">
          <ul className="list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {list.map((app) => {
              const pending = String(app.status || 'PENDING').toUpperCase() === 'PENDING';
              const animalLabel = app.animalName || app.petName || `Animal#${app.animalId}`;
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
                  }}
                >
                  <div>
                    <div className="list__name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b>{animalLabel}</b> <StatusChip status={app.status} />
                    </div>
                    <div className="list__meta" style={{ fontSize: 12, color: '#6b7280' }}>
                      신청일: {fmtDateTime(app.createdAt)}
                      {app.reservedAt ? ` / 예약일: ${fmtDateTime(app.reservedAt)}` : ''}
                    </div>
                  </div>
                  <div>
                    <Button
                      presetName="danger"
                      disabled={actingId === app.id || !pending}
                      onClick={() => onCancel(app.id)}
                    >
                      {actingId === app.id ? '취소 중…' : '신청 취소'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* 페이지네이션 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
            <Button
              presetName="ghost"
              disabled={noPages || page1 <= 1 || data.first}
              onClick={() => setPage1((p) => Math.max(1, p - 1))}
            >
              이전
            </Button>
            <span style={{ alignSelf: 'center' }}>{noPages ? 0 : page1} / {noPages ? 0 : totalPages}</span>
            <Button
              presetName="ghost"
              disabled={noPages || data.last || page1 >= totalPages}
              onClick={() => setPage1((p) => p + 1)}
            >
              다음
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
