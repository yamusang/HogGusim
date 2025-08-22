import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Button from '../../components/ui/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import './senior.css';

import dog1 from '../../assets/dogs/dog1.png';
import dog2 from '../../assets/dogs/dog2.png';
import dog3 from '../../assets/dogs/dog3.png';
import dog4 from '../../assets/dogs/dog4.png';
import dog5 from '../../assets/dogs/dog5.png';
import dog6 from '../../assets/dogs/dog6.png';
import dog7 from '../../assets/dogs/dog7.png';

const CARE_NM = '동부동물보호협회';
const CARE_ADDR = '부산광역시 해운대구 송정2로13번길 46 (송정동)';

export default function SeniorPage() {
  const nav = useNavigate();
  const location = useLocation();

  // 하얀 배경 + 아이콘 제거 토스트
  useEffect(() => {
    const t = location.state?.toast;
    if (t?.msg) {
      toast[t.type === 'error' ? 'error' : 'success'](t.msg, {
        position: 'top-center',
        autoClose: 3500,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        icon: false,                // ✅ 이모지/아이콘 제거
        theme: 'light'              // ✅ 흰 배경
      });
      // 중복 방지
      nav(location.pathname, { replace: true, state: {} });
    }
  }, [location, nav]);

  const pets = useMemo(() => ([
    { id:'p1', name:'(이름 미정)', breed:'아메리칸 숏헤어', sex:'수컷', age:'2살', neuter:'예', status:'보호중', careName:CARE_NM, careAddr:CARE_ADDR, temperament:['친화적'], photoUrl:dog1, note:'사람을 잘 따르고, 손길을 좋아함' },
    { id:'p2', name:'(이름 미정)', breed:'웰시코기 믹스',   sex:'암컷', age:'3살', neuter:'아니오', status:'보호중', careName:CARE_NM, careAddr:CARE_ADDR, temperament:['물지 않음','차분함'], photoUrl:dog2, note:'조용하고 낯가림이 덜함.' },
    { id:'p3', name:'(이름 미정)', breed:'믹스',           sex:'수컷', age:'1살', neuter:'예', status:'보호중', careName:CARE_NM, careAddr:CARE_ADDR, temperament:['활발','산책 좋아함'], photoUrl:dog3, note:'활발하고 사람을 좋아함.' },
    { id:'p4', name:'(이름 미정)', breed:'치와와',         sex:'암컷', age:'4살', neuter:'예', status:'보호중', careName:CARE_NM, careAddr:CARE_ADDR, temperament:['조용함','소형'], photoUrl:dog4, note:'작고 조용해서 실내 체험에 적합.' },
    { id:'p5', name:'(이름 미정)', breed:'시바',           sex:'수컷', age:'2살', neuter:'예', status:'보호중', careName:CARE_NM, careAddr:CARE_ADDR, temperament:['산책 선호','활발'], photoUrl:dog5, note:'활발함, 외향적임' },
    { id:'p6', name:'(이름 미정)', breed:'믹스',           sex:'수컷', age:'5살', neuter:'아니오', status:'보호중', careName:CARE_NM, careAddr:CARE_ADDR, temperament:['순함','온순'], photoUrl:dog6, note:'순하고 온순함, 배변훈련 잘 되어있음' },
    { id:'p7', name:'(이름 미정)', breed:'푸들',           sex:'암컷', age:'3살', neuter:'예', status:'보호중', careName:CARE_NM, careAddr:CARE_ADDR, temperament:['털 빠짐 적음','산책 OK'], photoUrl:dog7, note:'털빠짐이 적음, 산책 좋아함' },
  ]), []);

  const [quick, setQuick] = useState(null);

  const onApply = (pet) => {
    try { localStorage.setItem('selectedPet', JSON.stringify(pet)); } catch {}
    nav(`/pet/${pet.id}/apply`, { state: { pet } });
  };

  return (
    <div className="senior">
      <div className="senior__header">
        <div>
          <h1 style={{ margin: 0 }}>추천 유기동물</h1>
          <div className="senior__sub">가까운 보호소와 안전도·동물친화 등을 반영해 보여드려요.</div>
        </div>
        <div className="senior__actions">
          <Button presetName="secondary" onClick={() => window.location.reload()}>새로고침</Button>
          <Button presetName="secondary" onClick={() => nav('/senior/connect')}>신청 내역 보기</Button>
          <Button presetName="secondary" onClick={() => nav('/logout?to=/')}>로그아웃</Button>
        </div>
      </div>

      <div className="senior__grid">
        {pets.map((it) => (
          <Card key={it.id} className="pet-card">
            <div className="pet-card__media">
              <img src={it.photoUrl} alt={it.name || it.breed || `#${it.id}`}
                   onError={(e)=>{e.currentTarget.src = dog1;}} />
            </div>

            <div className="pet-card__body">
              <div className="pet-card__head">
                <div className="pet-card__title">{it.name || '(이름 미정)'}</div>
                <div className="pet-card__care">{it.careName || '-'}</div>
              </div>

              <div className="pet-card__meta">
                {it.breed || '-'} · {it.sex || '-'} · {it.age || '-'}
              </div>

              {it.note && <div className="pet-card__note">{it.note}</div>}

              <div className="pet-card__tags">
                <Badge>{it.status || '보호중'}</Badge>
                {it.neuter && <Badge>중성화: {it.neuter}</Badge>}
              </div>

              {!!(it.temperament?.length) && (
                <div className="pet-card__tags">
                  {it.temperament.slice(0, 3).map((t, i) => <span key={i} className="tag">{t}</span>)}
                </div>
              )}

              <div className="card-actions">
                <button className="btn-soft" onClick={() => setQuick(it)}>자세히 보기</button>
                <button className="btn-primary" onClick={() => onApply(it)}>신청하기</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {quick && (
        <div className="modal" onClick={() => setQuick(null)}>
          <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{quick.name || '(이름 미정)'}</h3>
              <button className="modal__close" aria-label="닫기" onClick={() => setQuick(null)}>×</button>
            </div>

            <div className="modal__body">
              <div className="detail">
                <div className="detail__media">
                  <img src={quick.photoUrl} alt={quick.name || '동물 사진'}
                       onError={(e)=>{e.currentTarget.src = dog1;}} />
                </div>

                <div className="detail__info">
                  <div className="detail__row">
                    <div className="detail__label">보호소</div>
                    <div className="detail__value">{quick.careName || '-'}</div>
                  </div>
                  <div className="detail__row">
                    <div className="detail__label">기본 정보</div>
                    <div className="detail__value">{(quick.breed || '종 미상')} · {quick.sex || '-'} · {quick.age || '나이 미상'}</div>
                  </div>
                  <div className="detail__row">
                    <div className="detail__label">중성화</div>
                    <div className="detail__value">{quick.neuter || '-'}</div>
                  </div>

                  {!!(quick.temperament?.length) && (
                    <div>
                      <div className="detail__label" style={{ marginBottom: 6 }}>성격/특징</div>
                      <div className="detail__chips">
                        {quick.temperament.map((t, i) => <span key={i} className="tag">{t}</span>)}
                      </div>
                    </div>
                  )}

                  {quick.note && <div className="detail__note">{quick.note}</div>}
                </div>
              </div>
            </div>

            <div className="modal__footer">
              <button className="btn-soft" onClick={() => setQuick(null)}>닫기</button>
              <button className="btn-primary" onClick={() => { setQuick(null); onApply(quick); }}>신청하기</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 흰배경/아이콘 없는 토스트 컨테이너 */}
      <ToastContainer />
    </div>
  );
}
