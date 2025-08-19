import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { fetchMyApplications, cancelApplication } from '../../api/applications';
import Button from '../../components/ui/Button';
import './senior.css';

export default function ConnectPage() {
  const { user } = useAuth();
  const seniorId = user?.id || user?.seniorId || Number(localStorage.getItem('userId'));

  const [page, setPage] = useState(1); // UI 1-base
  const [data, setData] = useState({ content: [], total: 0, size: 10, number: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [actingId, setActingId] = useState(null);

  const load = async (signal) => {
    if (!seniorId) return;
    setLoading(true); setErr('');
    try {
      let res;
      try {
        res = await fetchMyApplications({ seniorId, page: Math.max(0, page - 1), size: 10 });
      } catch {
        // /me 미지원 시 백업
        const { fetchApplicationsBySenior } = await import('../../api/applications');
        res = await fetchApplicationsBySenior(seniorId, Math.max(0, page - 1), 10);
      }

      if (signal?.aborted) return;

      const content = Array.isArray(res) ? res : (res?.content ?? res?.items ?? []);
      const total   = Array.isArray(res) ? res.length : (res?.totalElements ?? res?.total ?? content.length ?? 0);
      const size    = res?.size ?? 10;
      const number  = res?.number ?? Math.max(0, page - 1);

      setData({ content, total, size, number });
    } catch (e) {
      if (!signal?.aborted) setErr(e.message || '매칭 현황을 불러오지 못했습니다.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seniorId, page]);

  const onCancel = async (app) => {
    if (!window.confirm('이 신청을 취소할까요?')) return;
    try {
      setActingId(app.id);
      await cancelApplication(app.id);
      await load();
    } catch (e) {
      alert(e.message || '취소에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const pageHasNext = page * (data.size || 10) < (data.total || 0);

  return (
    <div className="p-4">
      <h2>매칭 현황</h2>
      {err && <div className="auth__error">{err}</div>}
      {loading ? <p>불러오는 중…</p> : (
        <>
          <div className="connect__list">
            {(data.content || []).map((it) => (
              <div key={it.id} className="connect__row">
                <div className="connect__main">
                  <div className="connect__title">
                    동물 #{it.pet?.desertionNo || it.petId} · 매니저 {it.manager?.name || `#${it.managerId}`}
                  </div>
                  <div className="connect__sub">
                    상태: <b>{it.status}</b>
                    {it.createdAt && <> · 신청일: {new Date(it.createdAt).toLocaleString()}</>}
                    {it.reservedAt && <> · 예약일: {new Date(it.reservedAt).toLocaleString()}</>}
                  </div>
                </div>

                {it.status === 'REQUESTED' && (
                  <Button presetName="ghost" disabled={actingId === it.id} onClick={() => onCancel(it)}>
                    {actingId === it.id ? '취소 중…' : '신청 취소'}
                  </Button>
                )}
              </div>
            ))}
            {(!data.content || data.content.length === 0) && <div className="muted">신청 내역이 없어요.</div>}
          </div>

          <div className="senior__pagination">
            <Button presetName="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>이전</Button>
            <span>{page}</span>
            <Button presetName="ghost" disabled={!pageHasNext} onClick={() => setPage(p => p + 1)}>다음</Button>
          </div>
        </>
      )}
    </div>
  );
}
