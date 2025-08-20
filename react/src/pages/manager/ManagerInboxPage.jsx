import React, { useEffect, useRef, useState } from 'react';
import Button from '../../components/ui/Button';
import { fetchManagerQueue, takeApplication, releaseApplication } from '../../api/manager';
import './manager.css';

const fmt = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('ko-KR');
};

export default function ManagerInboxPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [items, setItems] = useState([]);
  const [actingId, setActingId] = useState(null);
  const abortRef = useRef(null);

  const load = async () => {
    setLoading(true); setErr('');
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await getManagerQueue({ signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      setItems(Array.isArray(res) ? res : Array.isArray(res?.content) ? res.content : []);
    } catch (e) {
      if (!ctrl.signal.aborted) setErr(e?.message || '목록을 불러오지 못했습니다.');
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, []);

  const onAccept = async (id) => {
    if (!window.confirm('이 배정을 수락할까요?')) return;
    try {
      setActingId(id);
      await acceptAssignment(id);
      await load();
    } catch (e) {
      alert(e?.message || '수락 실패');
    } finally {
      setActingId(null);
    }
  };
  const onDecline = async (id) => {
    if (!window.confirm('이 배정을 거절할까요?')) return;
    try {
      setActingId(id);
      await declineAssignment(id);
      await load();
    } catch (e) {
      alert(e?.message || '거절 실패');
    } finally {
      setActingId(null);
    }
  };

  return (
    <section className="card">
      <div className="card__head">
        <h2 className="card__title">받은 신청함</h2>
        <div style={{marginLeft:'auto'}}><Button presetName="ghost" onClick={load}>새로고침</Button></div>
      </div>

      {loading && <div className="card__body">불러오는 중…</div>}
      {err && !loading && <div className="card__error" style={{color:'crimson'}}>{err}</div>}

      {!loading && !err && items.length === 0 && <div className="list__empty">대기 중인 배정이 없습니다.</div>}

      {!loading && !err && items.length > 0 && (
        <ul className="mgr__list">
          {items.map(it => (
            <li key={it.id} className="mgr__row">
              <div className="mgr__row-main">
                <div className="title">
                  신청 #{it.applicationId ?? it.id} · 동물: <b>{it.animalName || `Animal#${it.animalId}`}</b>
                </div>
                <div className="sub">
                  신청자: {it.seniorName || `Senior#${it.seniorId}`} · 연락처: {it.seniorPhone || '-'} ·
                  배정일: {fmt(it.assignedAt)} {it.reservedAt ? `· 예약: ${fmt(it.reservedAt)}` : ''}
                </div>
              </div>
              <div className="mgr__actions">
                <Button
                  disabled={actingId === it.id}
                  onClick={() => onAccept(it.id)}
                >
                  {actingId === it.id ? '수락 중…' : '수락'}
                </Button>
                <Button
                  presetName="ghost"
                  disabled={actingId === it.id}
                  onClick={() => onDecline(it.id)}
                >
                  {actingId === it.id ? '거절 중…' : '거절'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
