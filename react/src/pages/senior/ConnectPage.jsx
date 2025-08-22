// src/pages/senior/ConnectPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import './senior.css';

import dog1 from '../../assets/dogs/dog1.png';
import { getApps, updateApp, confirmSchedule, getManagerByApp } from '../../utils/storage';

const fmt = (tsOrIso) => { try { const d=typeof tsOrIso==='number'?new Date(tsOrIso):new Date(tsOrIso); return d.toLocaleString('ko-KR'); } catch { return tsOrIso ?? '-'; } };

const StatusChip = ({ s }) => {
  const map = { PENDING:'승인 대기', FORWARDED:'보호소 검토중', APPROVED:'보호소 승인', REJECTED:'거절' };
  const cls = s === 'APPROVED' ? 'chip chip--approved'
           : s === 'REJECTED' ? 'chip chip--rejected'
           : s === 'FORWARDED' ? 'chip chip--pending'
           : 'chip chip--pending';
  return <span className={cls}>{map[s] || '승인 대기'}</span>;
};

export default function ConnectPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const seniorId = useMemo(() => user?.seniorId || user?.id, [user]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoOn, setAutoOn] = useState(true);
  const [tick, setTick] = useState(0);

  const timerRef = useRef(null);
  const blinkRef = useRef(null);

  const load = () => { setLoading(true); setItems(getApps()); setLoading(false); };
  useEffect(() => { load(); }, [seniorId]);

  useEffect(() => {
    const start = () => {
      if (timerRef.current || !autoOn) return;
      timerRef.current = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 3000);
    };
    const stop = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
    if (autoOn) start(); const onVis = () => { if (document.visibilityState === 'visible') start(); else stop(); };
    document.addEventListener('visibilitychange', onVis); return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, [autoOn]);

  useEffect(() => { if (!autoOn) { setTick(0); window.clearInterval(blinkRef.current); return; } blinkRef.current = window.setInterval(() => setTick(t => (t+1)%4), 600); return () => window.clearInterval(blinkRef.current); }, [autoOn]);

  const onConfirm = (app) => {
    if (app.status !== 'APPROVED') return; // 보호소 승인 후 확정 가능
    confirmSchedule(app.id);
    load();
    alert('일정이 확정되었어요! (매니저에게도 전달됨)');
  };

  return (
    <div className="senior connect">
      <div className="connect__topbar"><button className="btn-ghost" onClick={()=>nav(-1)}>← 뒤로가기</button></div>

      <div className="senior__header" style={{marginBottom:8}}>
        <div><h1 style={{margin:0}}>매칭 현황</h1><div className="senior__sub">최근 신청 순으로 보여드려요.</div></div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <Button onClick={load}>{loading ? '새로고침 중…' : '새로고침'}</Button>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, color:'#667085' }}>
            <input type="checkbox" checked={autoOn} onChange={e=>setAutoOn(e.target.checked)} />
            {autoOn ? `실시간 업데이트 중${'.'.repeat(tick)}` : '자동 새로고침 꺼짐'}
          </label>
        </div>
      </div>

      <div className="connect__list-cards">
        {items.map(app => {
          const m = getManagerByApp(app.id) || null;
          const imgSrc = app.pet?.photoUrl || dog1;
          return (
            <div className="connect-card" key={app.id}>
              <div className="connect-card__left">
                <div className="thumb"><img src={imgSrc} alt="동물" onError={(e)=>{ e.currentTarget.src = dog1; }} /></div>
                <div className="meta">
                  <div className="title">{app.pet?.name || '(이름 미정)'} {app.pet?.breed ? `(${app.pet.breed})` : ''}</div>
                  <div className="rows">
                    <div className="row"><span>체험</span><b>{app.mode} · {app.slot || '-'}</b></div>
                    <div className="row"><span>날짜</span><b>{app.dayLabel || '-'}</b></div>
                    <div className="row"><span>신청일</span><b>{fmt(app.createdAt)}</b></div>
                    {app.schedule?.confirmed && (<div className="row"><span>확정</span><b>{app.schedule.date} · {app.schedule.slot}</b></div>)}
                  </div>
                </div>
              </div>

              <div className="connect-card__right">
                <StatusChip s={app.status} />
                {m && app.status === 'APPROVED' && (
                  <div className="manager">
                    <div className="manager__title">담당 매니저</div>
                    <div className="manager__row"><span>이름</span><b>{m.name || '-'}</b></div>
                    <div className="manager__row"><span>연락처</span><b>{m.phone || '-'}</b></div>
                    <div className="manager__row"><span>경력</span><b>{m.career ? `${m.career}` : '-'}</b></div>
                    {m.bio && <div className="manager__bio">{m.bio}</div>}
                  </div>
                )}
                <div className="connect-card__actions">
                  {app.status === 'APPROVED' && !app.schedule?.confirmed && (
                    <Button onClick={()=>onConfirm(app)}>일정 확정하기</Button>
                  )}
                  {app.schedule?.confirmed && <Button onClick={()=>nav('/senior')}>확정 완료</Button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && items.length === 0 && (
        <div className="empty">아직 신청한 매칭이 없어요. 시니어 페이지에서 동물을 선택해 신청해보세요!</div>
      )}
    </div>
  );
}
