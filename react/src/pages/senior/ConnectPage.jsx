// src/pages/senior/ConnectPage.jsx
import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { fetchMyApplications, cancelApplication } from '../../api/applications';
import Button from '../../components/ui/Button';
import './senior.css';

export default function ConnectPage() {
  const { user } = useAuth();
  const seniorId = user?.id || user?.seniorId || Number(localStorage.getItem('userId'));

  const [page, setPage] = useState(1);               // UI 1-base
  const [data, setData] = useState({ content: [], total: 0, size: 10, number: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [actingId, setActingId] = useState(null);

  const load = async (signal) => {
    if (!seniorId) return;
    setLoading(true); setErr('');
    try {
      const res = await fetchMyApplications({ seniorId, page: Math.max(0, page - 1), size: 10 });
      if (signal?.aborted) return;
      setData(res);
    } catch (e) {
      if (!signal?.aborted) setErr(e?.message || '신청 내역을 불러오지 못했습니다.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [page, seniorId]);

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

  const list = data.content || [];
  const totalPages = data.totalPages || Math.max(1, Math.ceil((data.total || 0) / (data.size || 10)));

  return (
    <div className="senior">
      <header className="senior__header">
        <h1>내 신청 현황</h1>
      </header>

      {loading && <div className="card">불러오는 중…</div>}
      {err && !loading && <div className="card" style={{ color: 'crimson' }}>{err}</div>}

      {!loading && !err && list.length === 0 && (
        <div className="card">신청 내역이 없습니다.</div>
      )}

      {!loading && !err && list.length > 0 && (
        <section className="card">
          <ul className="list">
            {list.map(app => (
              <li key={app.id} className="list__item" style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12 }}>
                <div>
                  <div className="list__name">
                    {app.animalName || `Animal#${app.animalId}`} · 상태: {app.status}
                  </div>
                  <div className="list__meta" style={{ fontSize:12, color:'#6b7280' }}>
                    신청일: {app.createdAt?.replace('T',' ').slice(0,16).replaceAll('-','.')}
                  </div>
                </div>
                <div>
                  <Button
                    presetName="ghost"
                    disabled={actingId === app.id || app.status !== 'PENDING'}
                    onClick={() => onCancel(app.id)}
                  >
                    {actingId === app.id ? '취소 중…' : '신청 취소'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:12 }}>
              <Button presetName="ghost" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>이전</Button>
              <span style={{ alignSelf:'center' }}>{page} / {totalPages}</span>
              <Button presetName="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>다음</Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
