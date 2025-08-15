import React, { useEffect, useState } from 'react';
import '../../styles/base.css';
import './pet.css';
import Card from '../../components/common/Card';
import Button from '../../components/ui/Button';
import { listByPet, approve, reject } from '../../api/applications';
import { fetchAnimals } from '../../api/animals';

export default function PetConnectPage(){
  const [pet, setPet] = useState(null);
  const [apps, setApps] = useState([]);

  // 데모: 첫 번째 AVAILABLE 동물 선택
  useEffect(()=>{
    (async ()=>{
      const list = await fetchAnimals({ available:true, page:0, size:1, sort:'createdAt,DESC' });
      const p = list?.content?.[0];
      setPet(p || null);
      if (p) {
        const a = await listByPet(p.id);
        setApps(a || []);
      }
    })();
  },[]);

  const onApprove = async (id)=>{
    await approve(id);
    const a = await listByPet(pet.id);
    setApps(a);
  };

  const onReject = async (id)=>{
    await reject(id);
    const a = await listByPet(pet.id);
    setApps(a);
  };

  if (!pet) return <div className="container pet-wrap">연결할 동물을 불러오는 중...</div>;

  return (
    <div className="container pet-wrap">
      <div className="pet-grid">
        <Card>
          <img className="pet-photo" src={pet.photoUrl || ''} alt="" />
          <div className="section">
            <div className="kv"><b>이름</b><span>{pet.name}</span></div>
            <div className="kv"><b>품종</b><span>{pet.breed}</span></div>
            <div className="kv"><b>나이</b><span>{pet.age}</span></div>
            <div className="kv"><b>중성화</b><span>{pet.neutered ? '예' : '아니오'}</span></div>
            <div className="kv"><b>상태</b><span>{pet.status}</span></div>
          </div>
        </Card>

        <div>
          <h2 style={{margin:'0 0 12px'}}>신청 목록</h2>
          <div className="grid">
            {apps.length === 0 && <Card>신청이 없습니다.</Card>}
            {apps.map(a=>(
              <Card key={a.id}>
                <div className="kv"><b>이름</b><span>{a.name}</span></div>
                <div className="kv"><b>성별</b><span>{a.gender}</span></div>
                <div className="kv"><b>나이</b><span>{a.age}</span></div>
                <div className="kv"><b>주소</b><span>{a.address}</span></div>
                <div className="kv"><b>요일</b><span>{a.days?.join(', ')}</span></div>
                <div className="kv"><b>약관</b><span>{a.agreeBodycam ? '바디캠 동의' : '미동의'}</span></div>
                <div className="action-row">
                  <Button onClick={()=>onApprove(a.id)} variant="manager">승인</Button>
                  <Button onClick={()=>onReject(a.id)} variant="ghost">거절</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
