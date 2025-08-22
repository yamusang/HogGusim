// src/pages/manager/ManagerPage.jsx
import React, { useEffect, useState } from 'react';
import './manager.css';
import Button from '../../components/ui/Button';
import {
  getApps, setApps, updateApp,
  getManagerProfile, setManagerProfile,
  setManagerByApp
} from '../../utils/storage';
import dog1 from '../../assets/dogs/dog1.png';

export default function ManagerPage(){
  const [profile, setProfile] = useState({ name:'', phone:'', career:'', bio:'' });
  const [apps, setAppsState] = useState([]);

  const load = () => { setProfile(getManagerProfile()); setAppsState(getApps()); };
  useEffect(() => { load(); }, []);

  const saveProfile = () => { setManagerProfile(profile); load(); };

  const approve = (id) => {
    setApps(getApps().map(a => a.id === id ? ({ ...a, status:'FORWARDED' }) : a));
    setManagerByApp(id, profile); // 신청별 매니저 연결
    load();
  };
  const reject = (id) => { setApps(getApps().map(a => a.id === id ? ({ ...a, status:'REJECTED' }) : a)); load(); };

  return (
    <div className="manager-page">
      <div className="manager-page__header">
        <h1>매니저 대시보드</h1>
        <div className="manager-page__actions">
          <Button onClick={load}>새로고침</Button>
          <Button onClick={()=>window.location.assign('/logout?to=/')}>로그아웃</Button>
        </div>
      </div>

      <section className="mgr-profile">
        <div className="mgr-profile__row">
          <label>이름</label><input value={profile.name||''} onChange={e=>setProfile(p=>({...p, name:e.target.value}))} placeholder="예) 김OO"/>
          <label>연락처</label><input value={profile.phone||''} onChange={e=>setProfile(p=>({...p, phone:e.target.value}))} placeholder="010-0000-0000"/>
          <label>경력(년)</label><input value={profile.career||''} onChange={e=>setProfile(p=>({...p, career:e.target.value}))} placeholder="예) 4"/>
        </div>
        <textarea className="mgr-profile__bio" value={profile.bio||''} onChange={e=>setProfile(p=>({...p, bio:e.target.value}))} placeholder="간단 소개/특이사항"/>
        <div style={{textAlign:'right', marginTop:8}}><Button onClick={saveProfile}>저장</Button></div>
      </section>

      <section className="mgr-list">
        <h2>신청 목록</h2>
        {apps.map(app => (
          <div className="mgr-card" key={app.id}>
            <div className="mgr-card__media">
              <img src={app.pet?.photoUrl || dog1} alt="동물" onError={(e)=>{ e.currentTarget.src = dog1; }}/>
            </div>
            <div className="mgr-card__body">
              <div className="mgr-card__title">
                {app.pet?.name || '(이름 미정)'} {app.pet?.breed ? `(${app.pet.breed})` : ''}
              </div>
              <div className="mgr-kv"><span>체험</span><b>{app.mode} · {app.slot || '-'}</b></div>
              <div className="mgr-kv"><span>날짜</span><b>{app.dayLabel || '-'}</b></div>
              <div className="mgr-kv"><span>시니어</span><b>{app.applicant?.name || '-'}</b></div>
              <div className="mgr-kv"><span>연락처</span><b>{app.applicant?.phone || '-'}</b></div>
              {app.schedule?.confirmed && (
                <div className="mgr-kv"><span>확정</span><b>{app.schedule.date} · {app.schedule.slot}</b></div>
              )}
            </div>
            <div className="mgr-card__actions">
              {app.status === 'PENDING' && (<><Button onClick={()=>approve(app.id)}>승인(보호소로)</Button><Button onClick={()=>reject(app.id)} presetName="secondary">거절</Button></>)}
              {app.status === 'FORWARDED' && <span className="mgr-status mgr-status--wait">보호소 검토중</span>}
              {app.status === 'APPROVED' && <span className="mgr-status mgr-status--ok">보호소 승인</span>}
              {app.status === 'REJECTED' && <span className="mgr-status mgr-status--bad">거절</span>}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
