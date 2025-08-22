// src/pages/pet/ApplyPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './apply.css';

import dog1 from '../../assets/dogs/dog1.png';
import dog2 from '../../assets/dogs/dog2.png';
import dog3 from '../../assets/dogs/dog3.png';
import dog4 from '../../assets/dogs/dog4.png';
import dog5 from '../../assets/dogs/dog5.png';
import dog6 from '../../assets/dogs/dog6.png';
import dog7 from '../../assets/dogs/dog7.png';

import { getApps, setApps } from '../../utils/storage';

const CARE_NM   = '동부동물보호협회';
const CARE_ADDR = '부산광역시 해운대구 송정2로13번길 46 (송정동)';

const FALLBACK_PETS = [
  { id:'p1', name:'(이름 미정)', breed:'아메리칸 숏헤어', sex:'수컷', age:'2살', neuter:'예', status:'보호중', careName:CARE_NM, careAddr:CARE_ADDR, temperament:['친화적'], photoUrl:dog1, note:'사람을 잘 따르고, 손길을 좋아함' },
  { id:'p2', name:'(이름 미정)', breed:'웰시코기 믹스',   sex:'암컷', age:'3살', neuter:'아니오', status:'보호중', careName:CARE_NM, careAddr:CARE_ADDR, temperament:['물지 않음','차분함'], photoUrl:dog2, note:'조용하고 낯가림이 덜함.' },
  { id:'p3', name:'(이름 미정)', breed:'믹스',           sex:'수컷', age:'1살', neuter:'예', status:'보호중', careName:CARE_NM, careAddr:CARE_ADDR, temperament:['활발','산책 좋아함'], photoUrl:dog3, note:'활발하고 사람을 좋아함.' },
  { id:'p4', name:'(이름 미정)', breed:'치와와',         sex:'암컷', age:'4살', neuter:'예', status:'보호중', careName:CARE_NM, careAddr:CARE_ADDR, temperament:['조용함','소형'], photoUrl:dog4, note:'작고 조용해서 실내 체험에 적합.' },
  { id:'p5', name:'(이름 미정)', breed:'시바',           sex:'수컷', age:'2살', neuter:'예', status:'보호중', careName:CARE_NM, careAddr:CARE_ADDR, temperament:['산책 선호','활발'], photoUrl:dog5, note:'외출을 좋아해서 산책 체험 추천!' },
  { id:'p6', name:'(이름 미정)', breed:'믹스',           sex:'수컷', age:'5살', neuter:'아니오', status:'보호중', careName:CARE_NM, careAddr:CARE_ADDR, temperament:['순함','온순'], photoUrl:dog6, note:'순하고 온순함, 배변훈련 잘 되어있음' },
  { id:'p7', name:'(이름 미정)', breed:'푸들',           sex:'암컷', age:'3살', neuter:'예', status:'보호중', careName:CARE_NM, careAddr:CARE_ADDR, temperament:['털 빠짐 적음','산책 OK'], photoUrl:dog7, note:'털빠짐이 적고 산책도 무난해요.' },
];

const pad = n => String(n).padStart(2,'0');
const makeSlots = (duration=1)=>{ const open=9, close=18, last=close-duration; const arr=[]; for(let h=open; h<=last; h++) arr.push({key:`${h}-${h+duration}`, label:`${pad(h)}:00 ~ ${pad(h+duration)}:00`}); return arr; };
const todayStr = () => { const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const yoil = ['일','월','화','수','목','금','토'];

export default function ApplyPage(){
  const nav = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const selectedPet = useMemo(() => {
    const fromState = location?.state?.pet;
    if (fromState?.id) return fromState;
    try { const raw=localStorage.getItem('selectedPet'); if(raw){const p=JSON.parse(raw); if(p?.id) return p;} } catch {}
    if (id) { const hit = FALLBACK_PETS.find(p => p.id === id); if (hit) return hit; }
    return FALLBACK_PETS[0];
  }, [id, location?.state]);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [mode, setMode] = useState('산책');
  const [duration, setDuration] = useState(1);
  const [slot, setSlot] = useState(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeBodycam, setAgreeBodycam] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);

  const slots = useMemo(() => makeSlots(duration), [duration]);

  const termsRef = useRef(null);
  useEffect(() => {
    const el=termsRef.current; if(!el) return;
    const onScroll=()=>{ if(el.scrollTop+el.clientHeight>=el.scrollHeight-4) setHasReadTerms(true); };
    el.addEventListener('scroll', onScroll); return ()=> el.removeEventListener('scroll', onScroll);
  }, []);

  const canSubmit = name.trim() && phone.trim() && address.trim() && date && slot && agreeTerms && agreeBodycam;

  const handleSubmit = (e)=>{
    e.preventDefault(); if(!canSubmit) return;
    const d = new Date(date);
    const dayLabel = `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}(${yoil[d.getDay()]})`;
    const app = {
      id: crypto?.randomUUID?.() || String(Date.now()),
      pet: { id:selectedPet.id, name:selectedPet.name, breed:selectedPet.breed, photoUrl:selectedPet.photoUrl },
      applicant: { name, age, phone, address, altPhone },
      mode, duration, slot, date, dayLabel, note,
      status: 'PENDING',
      createdAt: Date.now()
    };
    setApps([app, ...getApps()]);
    nav('/senior', { replace:true, state:{ toast:{ type:'success', msg:`신청이 접수되었습니다!\n날짜: ${dayLabel}\n시간: ${slot}\n보호소의 최종 승인까지 조금만 기다려 주세요.` } } });
  };

  const pet = {
    name: selectedPet?.name || '이름 미상',
    breed: selectedPet?.breed || '품종 정보 없음',
    sex: selectedPet?.sex || '-',
    age: selectedPet?.age || '-',
    neuter: selectedPet?.neuter ?? '-',
    temperament: selectedPet?.temperament || [],
    careName: selectedPet?.careName || CARE_NM,
    careAddr: selectedPet?.careAddr || CARE_ADDR,
    photoUrl: selectedPet?.photoUrl || dog1,
    profileNote: selectedPet?.note || '',
  };

  return (
    <div className="apply-page">
      <div className="apply__topbar"><button className="btn-ghost" onClick={()=>nav(-1)}>← 뒤로가기</button></div>
      <h1 className="apply__title">신청서 작성</h1>

      <section className="profile">
        <div className="profile__media"><img src={pet.photoUrl} alt={pet.name} onError={(e)=>{e.currentTarget.src=dog1;}}/></div>
        <div className="profile__body">
          <div className="profile__head"><h2 className="profile__title">({pet.name})</h2><div className="profile__shelter">{pet.careName}</div></div>
          <div className="kv">
            <div className="kv__row"><div className="kv__k">기본</div><div className="kv__v">{pet.breed} · {pet.sex} · {pet.age}</div></div>
            <div className="kv__row"><div className="kv__k">중성화</div><div className="kv__v">{pet.neuter}</div></div>
          </div>
          {!!pet.temperament.length && (<><div className="kv__label">성격/특징</div><div className="chips">{pet.temperament.map((t,i)=><span key={i} className="chip">{t}</span>)}</div></>)}
          {pet.profileNote && (<div className="profile__note">{pet.profileNote}</div>)}
          {pet.careAddr && (<div className="profile__addr muted">보호소 주소: {pet.careAddr}</div>)}
        </div>
      </section>

      <form className="apply__form" onSubmit={handleSubmit}>
        <fieldset className="fs">
          <legend>신청자 정보</legend>
          <label><span>이름</span><input className="big" value={name} onChange={e=>setName(e.target.value)} placeholder="예) 김OO" /></label>
          <label><span>나이</span><input className="big" value={age} onChange={e=>setAge(e.target.value)} placeholder="예) 73" /></label>
          <label><span>연락처(휴대폰)</span><input className="big" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="예) 010-0000-0000" /></label>
          <label><span>상세 주소</span><input className="big" value={address} onChange={e=>setAddress(e.target.value)} placeholder="예) 부산 수영구 광안동 123-4, 101동 1001호" /></label>
          <label><span>비상 연락망(선택)</span><input className="big" value={altPhone} onChange={(e)=>setAltPhone(e.target.value)} placeholder="예) 담당 복지사 010-1234-5678 / 가족·이웃 연락처"/></label>
        </fieldset>

        <fieldset className="fs">
          <legend>체험 방식</legend>
          <div className="radio-row">
            <label className={`radio-big ${mode==='산책' ? 'on': ''}`}><input type="radio" name="mode" checked={mode==='산책'} onChange={()=>setMode('산책')} /> 산책 체험(외부)</label>
            <label className={`radio-big ${mode==='실내' ? 'on': ''}`}><input type="radio" name="mode" checked={mode==='실내'} onChange={()=>setMode('실내')} /> 실내 교류(가정/실내)</label>
          </div>
        </fieldset>

        <fieldset className="fs">
          <legend>희망 날짜 · 시간</legend>
          <div className="date-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <label><span>날짜 선택</span><input className="big" type="date" value={date} onChange={e=>setDate(e.target.value)} min={todayStr()}/></label>
            <label><span>희망 시간(길이)</span>
              <div className="duration__chips">
                {[1,2,3].map(h => (<button key={h} type="button" onClick={()=>{setDuration(h); setSlot(null);}} className={`chip-lg ${duration===h?'chip--on':''}`}>{h}시간</button>))}
              </div>
            </label>
          </div>
          <div className="slot-grid">
            {slots.map(s => (
              <label key={s.key} className={`slot ${slot===s.label ? 'slot--on' : ''}`}>
                <input type="radio" name="slot" checked={slot===s.label} onChange={()=>setSlot(s.label)} />{s.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="fs">
          <legend>요청 사항(선택)</legend>
          <textarea className="big area" rows={4} value={note} onChange={(e)=>setNote(e.target.value)} placeholder="예) 무릎이 불편해 엘리베이터가 있는 곳에서 만났으면 합니다."/>
        </fieldset>

        <fieldset className="fs">
          <legend>이용 약관</legend>
          <div className="termsbox" ref={termsRef} tabIndex={0}>
            <p className="muted">※ 스크롤을 끝까지 내려야 동의가 활성화됩니다.</p>
            <p><strong>서비스 이용 지침(요약)</strong></p>
            <ul><li>매니저 및 보호소의 안내를 따릅니다.</li><li>동물/본인 안전을 최우선으로 합니다.</li><li>위험상황은 즉시 보호소/매니저에게 알립니다.</li><li>동물 컨디션에 따라 일정이 변경될 수 있습니다.</li></ul>
            <p><strong>개인정보 및 촬영</strong></p>
            <ul><li>연락처/주소는 매칭·연락 용도로만 사용됩니다.</li><li>안전 기록을 위해 바디캠을 사용할 수 있습니다.</li><li>영상은 분쟁 예방 목적으로만 보관되며 외부 공개하지 않습니다.</li></ul>
          </div>
          <div className="agree-rows">
            <label className="tgl"><input type="checkbox" checked={agreeTerms} disabled={!hasReadTerms} onChange={(e)=>setAgreeTerms(e.target.checked)} /><span className={`tgl__track ${!hasReadTerms?'is-disabled':''}`} /><span className="tgl__label">이용 약관에 동의합니다.</span></label>
            <label className="tgl"><input type="checkbox" checked={agreeBodycam} onChange={(e)=>setAgreeBodycam(e.target.checked)} /><span className="tgl__track" /><span className="tgl__label">안전을 위한 바디캠 촬영에 동의합니다.</span></label>
          </div>
        </fieldset>

        <button className="btn-primary xl block" disabled={!canSubmit}>신청하기</button>
      </form>
    </div>
  );
}
