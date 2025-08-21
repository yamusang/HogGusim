import React, { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import { fetchAnimalsByShelter } from '../../api/animals';
import { listByPet, approveApplication, rejectApplication } from '../../api/applications';
import useAuth from '../../hooks/useAuth';
import './pet.css';

export default function PetConnectPage() {
  const { user } = useAuth();
  const careNm = user?.careNm || user?.affiliation || sessionStorage.getItem('affiliation') || localStorage.getItem('selectedCareNm') || '';

  const [petId, setPetId] = useState('');
  const [petList, setPetList] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=> {
    fetchAnimalsByShelter({ careNm }).then(setPetList).catch(()=>setPetList([]));
  }, [careNm]);

  const load = async () => {
    if (!petId) return;
    setLoading(true);
    try {
      const page = await listByPet(petId, { page: 0, size: 50 });
      setApps(page.content || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=> { load(); }, [petId]);

  const onApprove = async (id) => { await approveApplication(id); await load(); };
  const onReject  = async (id) => { await rejectApplication(id);  await load(); };

  return (
    <div className="pet-connect">
      <h1>강아지 매칭 확인</h1>
      <div className="bar">
        <select value={petId} onChange={e=>setPetId(Number(e.target.value) || '')}>
          <option value="">동물 선택</option>
          {petList.map(p => <option key={p.id} value={p.id}>{p.name || '(이름없음)'} · {p.breed || p.species || '-'}</option>)}
        </select>
        <Button onClick={load} disabled={!petId || loading}>{loading ? '불러오는 중…' : '새로고침'}</Button>
      </div>

      <ul className="apps">
        {apps.map(it => (
          <li key={it.id} className="app-item">
            <div className="left">
              <img src={it.pet?.photoUrl || it.pet?.popfile || '/placeholder-dog.png'} alt="" />
              <div>
                <div className="title">{it.pet?.name || '(이름없음)'}</div>
                <div className="sub">{(it.pet?.breed || it.pet?.species || '-')}</div>
                <div className="note">{it.note || '-'}</div>
              </div>
            </div>
            <div className="right">
              {it.status === 'PENDING' ? (
                <div className="row">
                  <Button onClick={()=>onApprove(it.id)}>수락</Button>
                  <Button variant="ghost" onClick={()=>onReject(it.id)}>거절</Button>
                </div>
              ) : (
                <span className="chip">{it.status}</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {(!loading && petId && apps.length === 0) && <div className="empty">해당 동물의 신청이 없습니다.</div>}
    </div>
  );
}
