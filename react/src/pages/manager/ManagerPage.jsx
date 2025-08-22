import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import './manager.css';

/* storage */
const getApps = () => { try { return JSON.parse(localStorage.getItem('applications')||'[]'); } catch { return []; } };
const setApps = (arr) => { try { localStorage.setItem('applications', JSON.stringify(arr)); } catch {} };

const getManagerProfile = () => { try { return JSON.parse(localStorage.getItem('managerProfile')||'{}'); } catch { return {}; } };
const setManagerProfile = (p) => { try { localStorage.setItem('managerProfile', JSON.stringify(p)); } catch {} };

const StatusChip = ({ s }) => {
  const map = { PENDING:'대기', FORWARDED:'보호소 검토중', APPROVED:'승인', REJECTED:'거절' };
  const label = map[s] || s || '대기';
  const cls = s === 'APPROVED' ? 'chip chip--approved'
           : s === 'REJECTED' ? 'chip chip--rejected'
           : 'chip chip--pending';
  return <span className={cls}>{label}</span>;
};

export default function ManagerPage(){
  const nav = useNavigate();
  const [apps, setAppsState] = useState(getApps());
  const [profile, setProfile] = useState(() => getManagerProfile());

  useEffect(() => {
    const onStorage = () => setAppsState(getApps());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const approve = (id) => {
    const next = apps.map(a => a.id===id ? { ...a, status:'APPROVED' } : a);
    setApps(next); setAppsState(next);
  };
  const reject = (id) => {
    const next = apps.map(a => a.id===id ? { ...a, status:'REJECTED' } : a);
    setApps(next); setAppsState(next);
  };

  const saveProfile = (e) => {
    e.preventDefault();
    setManagerProfile(profile);
    alert('매니저 프로필이 저장되었습니다.');
  };

  return (
    <div className="manager">
      <div className="manager__header">
        <h1>매니저 대시보드</h1>
        <div style={{display:'flex', gap:8}}>
          <Button presetName="secondary" onClick={()=>window.location.reload()}>새로고침</Button>
          <Button presetName="secondary" onClick={()=>nav('/logout?to=/')}>로그아웃</Button> {/* ✅ 로그아웃 */}
        </div>
      </div>

      {/* 매니저 프로필 */}
      <section className="panel">
        <h2 className="panel__title">내 프로필</h2>
        <form className="profileform" onSubmit={saveProfile}>
          <label>이름<input value={profile.name||''} onChange={e=>setProfile(p=>({...p, name:e.target.value}))} /></label>
          <label>연락처<input value={profile.phone||''} onChange={e=>setProfile(p=>({...p, phone:e.target.value}))} /></label>
          <label>경력<textarea rows={2} value={profile.career||''} onChange={e=>setProfile(p=>({...p, career:e.target.value}))}/></label>
          <div className="right"><Button type="submit">저장</Button></div>
        </form>
      </section>

      {/* 신청 목록 */}
      <section className="panel">
        <h2 className="panel__title">신청 목록</h2>
        <ul className="app__list">
          {apps.map(a => (
            <li key={a.id} className="app__item">
              <div className="left">
                <img src={a.photoUrl || '/placeholder-dog.png'} alt="" />
                <div>
                  <div className="title">{a.petName} <span className="muted">({a.petBreed})</span></div>
                  <div className="sub">
                    {a.mode} · {a.days?.join(', ')} · {a.slot}
                  </div>
                  <div className="sub">
                    <b>시니어</b> {a.userName} / 나이 {a.userAge || '-'} / {a.userPhone}
                  </div>
                  <div className="sub">
                    <b>주소</b> {a.address}
                  </div>
                </div>
              </div>
              <div className="right">
                <StatusChip s={a.status} />
                <div className="rowbtn">
                  <Button disabled={a.status==='APPROVED'} onClick={()=>approve(a.id)}>승인</Button>
                  <Button presetName="secondary" disabled={a.status==='REJECTED'} onClick={()=>reject(a.id)}>거절</Button>
                </div>
              </div>
            </li>
          ))}
          {apps.length === 0 && <li className="empty">접수된 신청이 없습니다.</li>}
        </ul>
      </section>
    </div>
  );
}
