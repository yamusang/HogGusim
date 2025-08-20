// src/pages/shelter/ShelterApplicationsPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  listByPet,
  approveApplication,
  rejectApplication,
} from '../../api/applications';
import Button from '../../components/ui/Button';
import './shelter.css';

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

export default function ShelterApplicationsPage() {
  const { animalId } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ number: 0, size: 20, totalPages: 0, first: true, last: true });
  const [page1, setPage1] = useState(1); // UI 1-based
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [actingId, setActingId] = useState(null);

  const abortRef = useRef(null);

  const load = async () => {
    if (!animalId) return;
    setLoading(true); setErr('');

    // 취소 관리
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await listByPet(Number(animalId), {
        page: Math.max(0, page1 - 1),
        size: 12,
        signal: ctrl.signal,
      });
      if (ctrl.signal.aborted) return;

      const rows = Array.isArray(res?.content)
        ? res.content
        : Array.isArray(res) ? res : [];

      setItems(rows);
      setMeta({
        number: res?.number ?? 0,
        size: res?.size ?? 12,
        totalPages: res?.totalPages ?? 0,
        first: !!res?.first,
        last: !!res?.last,
      });
    } catch (e) {
      if (!ctrl.signal.aborted) setErr(e?.message || '신청자 목록을 불러오지 못했습니다.');
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalId, page1]);

  const onApprove = async (id) => {
    if (!window.confirm('이 신청을 승인할까요?')) return;
    try {
      setActingId(id);
      await approveApplication(id);
      await load();
    } catch (e) {
      alert(e?.message || '승인에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const onReject = async (id) => {
    if (!window.confirm('이 신청을 거절할까요?')) return;
    try {
      setActingId(id);
      await rejectApplication(id);
      await load();
    } catch (e) {
      alert(e?.message || '거절에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const noPages = !meta.totalPages || meta.totalPages <= 0;

  return (
    <div className="shelter">
      <header className="shelter__header">
        <div>
          <h1>동물 #{animalId} 신청자 관리</h1>
          <p className="muted">보호소에서 접수된 신청을 확인하고 승인/거절하세요.</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Button presetName="ghost" onClick={() => navigate('/shelter/animals')}>동물 목록</Button>
          <Button presetName="ghost" onClick={() => navigate('/shelter')}>보호소 홈</Button>
        </div>
      </header>

      {err && <div className="alert alert--error">{err}</div>}
      {loading && !err && <div className="card">불러오는 중…</div>}

      {!loading && !err && (
        <section className="connect__card">
          <div className="shelter__apps">
            {items.map((it) => {
              const seniorName = it.senior?.name || it.seniorName || `Senior#${it.seniorId}`;
              const managerName = it.manager?.name || it.managerName || (it.managerId ? `Manager#${it.managerId}` : '미배정');
              const pending = String(it.status || 'PENDING').toUpperCase() === 'PENDING';

              return (
                <div key={it.id} className="shelter__app-row">
                  <div className="shelter__app-main">
                    <div className="title">
                      신청자: <b>{seniorName}</b> <span className="bar">|</span> 매니저: {managerName} <span className="bar">|</span> <StatusChip status={it.status} />
                    </div>
                    <div className="sub">
                      신청일: {fmtDateTime(it.createdAt)}
                      {it.reservedAt && <> · 예약일: {fmtDateTime(it.reservedAt)}</>}
                      {it.phone && <> · 연락처: <a href={`tel:${it.phone}`}>{it.phone}</a></>}
                      {it.address && <> · 주소: {it.address}</>}
                    </div>
                    {it.memo && <div className="memo">메모: {it.memo}</div>}
                  </div>

                  <div className="shelter__app-actions">
                    <Button
                      disabled={actingId === it.id || !pending}
                      onClick={() => onApprove(it.id)}
                    >
                      {actingId === it.id ? '승인 중…' : '승인'}
                    </Button>
                    <Button
                      presetName="ghost"
                      disabled={actingId === it.id || !pending}
                      onClick={() => onReject(it.id)}
                    >
                      {actingId === it.id ? '거절 중…' : '거절'}
                    </Button>
                  </div>
                </div>
              );
            })}
            {items.length === 0 && <div className="muted" style={{ padding:16 }}>신청자가 없습니다.</div>}
          </div>

          {/* 페이지네이션 */}
          <div className="shelter__pagination">
            <Button
              presetName="ghost"
              disabled={noPages || page1 <= 1 || meta.first}
              onClick={() => setPage1((p) => Math.max(1, p - 1))}
            >
              이전
            </Button>
            <span>{noPages ? 0 : page1}</span>
            <Button
              presetName="ghost"
              disabled={noPages || meta.last || (page1 >= meta.totalPages)}
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
