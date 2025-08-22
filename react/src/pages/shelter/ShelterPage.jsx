// src/pages/shelter/ShelterPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './shelter.css';
import Button from '../../components/ui/Button';
import { getApps, setApps } from '../../utils/storage';

import dog1 from '../../assets/dogs/dog1.png';
import dog2 from '../../assets/dogs/dog2.png';
import dog3 from '../../assets/dogs/dog3.png';
import dog4 from '../../assets/dogs/dog4.png';
import dog5 from '../../assets/dogs/dog5.png';
import dog6 from '../../assets/dogs/dog6.png';
import dog7 from '../../assets/dogs/dog7.png';
import dog8 from '../../assets/dogs/dog8.png';
import dog9 from '../../assets/dogs/dog9.png';
import dog10 from '../../assets/dogs/dog10.png';
import dog11 from '../../assets/dogs/dog11.png';

const CARE_NM = '동부동물보호협회';

const seed11 = [
  { id:'p1',  name:'(이름 미정)', breed:'아메리칸 숏헤어', sex:'수컷', age:'2살', neuter:'예', status:'보호중', photoUrl:dog1,  note:'사람을 잘 따르고 손길을 좋아함' },
  { id:'p2',  name:'(이름 미정)', breed:'웰시코기 믹스',   sex:'암컷', age:'3살', neuter:'아니오', status:'보호중', photoUrl:dog2,  note:'조용하고 낯가림이 덜함' },
  { id:'p3',  name:'(이름 미정)', breed:'믹스',           sex:'수컷', age:'1살', neuter:'예', status:'보호중', photoUrl:dog3,  note:'활발하고 사람을 좋아함' },
  { id:'p4',  name:'(이름 미정)', breed:'치와와',         sex:'암컷', age:'4살', neuter:'예', status:'보호중', photoUrl:dog4,  note:'작고 조용해서 실내 체험에 적합' },
  { id:'p5',  name:'(이름 미정)', breed:'시바',           sex:'수컷', age:'2살', neuter:'예', status:'보호중', photoUrl:dog5,  note:'산책 선호, 활발' },
  { id:'p6',  name:'(이름 미정)', breed:'믹스',           sex:'수컷', age:'5살', neuter:'아니오', status:'보호중', photoUrl:dog6,  note:'순함, 배변훈련 잘 됨' },
  { id:'p7',  name:'(이름 미정)', breed:'푸들',           sex:'암컷', age:'3살', neuter:'예', status:'보호중', photoUrl:dog7,  note:'털빠짐 적고 산책 무난' },
  // 8~11 새로운 샘플
  { id:'p8',  name:'(이름 미정)', breed:'말티즈',         sex:'암컷', age:'2살', neuter:'예', status:'보호중', photoUrl:dog8,  note:'소형, 사람 친화' },
  { id:'p9',  name:'(이름 미정)', breed:'진돗개 믹스',     sex:'수컷', age:'4살', neuter:'예', status:'보호중', photoUrl:dog9,  note:'충성심 강함, 산책 좋아함' },
  { id:'p10', name:'(이름 미정)', breed:'러시안블루',     sex:'암컷', age:'3살', neuter:'예', status:'보호중', photoUrl:dog10, note:'차분, 실내 교류 선호' },
  { id:'p11', name:'(이름 미정)', breed:'스피츠',         sex:'수컷', age:'1살', neuter:'아니오', status:'보호중', photoUrl:dog11, note:'활발, 사람과 놀이 좋아함' },
];

export default function ShelterPage() {
  // ---- 신청 현황 ----
  const [apps, setAppsState] = useState([]);
  const loadApps = () => setAppsState(getApps());
  useEffect(() => { loadApps(); }, []);
  const forwarded = useMemo(() => apps.filter(a => a.status === 'FORWARDED'), [apps]);

  const approve = (id) => { setApps(getApps().map(a => a.id === id ? ({ ...a, status:'APPROVED' }) : a)); loadApps(); };
  const reject  = (id) => { setApps(getApps().map(a => a.id === id ? ({ ...a, status:'REJECTED' }) : a)); loadApps(); };

  // ---- 보호동물 11 관리 (로컬 상태만; 수정/토글/삭제 가능)
  const [pets, setPets] = useState(seed11);
  const [edit, setEdit] = useState(null);

  const patch = (id, data) => setPets(ps => ps.map(p => p.id===id ? ({...p, ...data}) : p));
  const remove = (id) => setPets(ps => ps.filter(p => p.id!==id));
  const addPet = () => {
    const blank = { id: crypto?.randomUUID?.() || String(Date.now()), name:'(이름 미정)', breed:'종 미상', sex:'-', age:'-', neuter:'-', status:'보호중', photoUrl:'', note:'' };
    setPets(ps => [blank, ...ps]); setEdit(blank.id);
  };
  const toggleStatus = (id) => patch(id, (p => ({ status: (pets.find(x=>x.id===id)?.status === '보호중') ? '입양완료':'보호중' })));

  return (
    <div className="shelter">
      <div className="shelter__header">
        <h1>보호소 대시보드</h1>
        <div className="shelter__actions"><Button onClick={loadApps}>새로고침</Button></div>
      </div>

      <section className="panel">
        <div className="panel__title">신청 현황 <span className="muted">/ 보호소 최종 승인</span></div>
        {forwarded.length === 0 ? <div className="empty">현재 보호소 검토중인 신청이 없습니다.</div> : (
          <ul className="appcards">
            {forwarded.map(a => (
              <li key={a.id} className="appcard">
                <div className="appcard__left">
                  <img src={a.pet?.photoUrl} alt="" />
                  <div className="appcard__meta">
                    <div className="t1">{a.pet?.name || '(이름 미정)'} {a.pet?.breed ? `(${a.pet.breed})` : ''}</div>
                    <div className="row"><span>시니어</span><b>{a.applicant?.name || '-'}</b></div>
                    <div className="row"><span>연락처</span><b>{a.applicant?.phone || '-'}</b></div>
                    <div className="row"><span>일정</span><b>{a.dayLabel || '-'} · {a.slot || '-'}</b></div>
                    {a.note && <div className="note">{a.note}</div>}
                  </div>
                </div>
                <div className="appcard__right">
                  <Button onClick={()=>approve(a.id)}>최종 승인</Button>
                  <Button presetName="secondary" onClick={()=>reject(a.id)}>거절</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="panel__title">
          보호 중인 동물 관리 <span className="muted">/ {pets.length}마리</span>
          <div className="panel__right"><Button onClick={addPet}>신규 등록</Button></div>
        </div>
        <div className="petgrid">
          {pets.map(pet => (
            <div key={pet.id} className="petcard">
              <div className="petcard__media"><img src={pet.photoUrl} alt="" /></div>
              {edit === pet.id ? (
                <div className="petform">
                  <input value={pet.name} onChange={e=>patch(pet.id,{name:e.target.value})} placeholder="이름"/>
                  <input value={pet.breed} onChange={e=>patch(pet.id,{breed:e.target.value})} placeholder="품종"/>
                  <div className="row2">
                    <input value={pet.sex} onChange={e=>patch(pet.id,{sex:e.target.value})} placeholder="성별"/>
                    <input value={pet.age} onChange={e=>patch(pet.id,{age:e.target.value})} placeholder="나이"/>
                  </div>
                  <input value={pet.neuter} onChange={e=>patch(pet.id,{neuter:e.target.value})} placeholder="중성화(예/아니오)"/>
                  <textarea rows={2} value={pet.note} onChange={e=>patch(pet.id,{note:e.target.value})} placeholder="메모"/>
                  <input value={pet.photoUrl} onChange={e=>patch(pet.id,{photoUrl:e.target.value})} placeholder="사진 URL/경로"/>
                  <div className="rowbtn"><Button onClick={()=>setEdit(null)}>완료</Button><Button presetName="secondary" onClick={()=>remove(pet.id)}>삭제</Button></div>
                </div>
              ) : (
                <div className="petcard__body">
                  <div className="petcard__title">{pet.name}</div>
                  <div className="petcard__meta">{pet.breed} · {pet.sex} · {pet.age}</div>
                  <div className="tags">
                    <span className="tag">중성화: {pet.neuter}</span>
                    <span className={`tag ${pet.status==='보호중'?'tag--good':'tag--muted'}`}>{pet.status}</span>
                  </div>
                  {pet.note && <div className="petcard__note">{pet.note}</div>}
                  <div className="rowbtn"><Button onClick={()=>setEdit(pet.id)}>수정</Button><Button presetName="secondary" onClick={()=>toggleStatus(pet.id)}>상태 토글</Button></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
