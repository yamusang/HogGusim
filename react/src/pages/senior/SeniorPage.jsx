import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { fetchAnimals, toAbsoluteUrl } from '../../api/animals';
import { mockTemperament, fakeMatchScore } from '../../utils/tempermock';
import './senior.css';

// 시연 고정 보호소
const CARE_NM = '동부동물보호협회';
const CARE_ADDR = '부산광역시 해운대구 송정2로13번길 46 (송정동)';

const normalizeYN = (v) => String(v ?? '').toUpperCase();
const isProtected = (st='') => {
  const s = String(st).toUpperCase();
  return s.includes('보호') || s.includes('PROTECT') || s.includes('AVAILABLE') || s.includes('SHELTER');
};

function PetImg({ pet }) {
  const [ok, setOk] = useState(true);
  const candidates = [
    pet?.photoUrl,
    pet?._raw?.popfile,
    pet?._raw?.filename,
    pet?.popfile,
  ].filter(Boolean);

  let src = '';
  for (const c of candidates) {
    const abs = toAbsoluteUrl(c);
    if (abs) { src = abs; break; }
  }

  const isMixedBlocked = (() => {
    try { return window.location.protocol === 'https:' && /^http:\/\//i.test(src); }
    catch { return false; }
  })();

  const finalSrc = ok && src ? src : '/placeholder-dog.png';

  return (
    <div style={{ position:'relative' }}>
      <img
        src={finalSrc}
        alt={pet?.name || '유기동물'}
        loading="lazy"
        onError={() => setOk(false)}
        style={{ width:'100%', height:'auto', display:'block' }}
      />
      {isMixedBlocked && (
        <span
          style={{
            position:'absolute', left:8, top:8, fontSize:12,
            color:'#ef4444', textShadow:'0 0 3px #fff', fontWeight:700
          }}
          title="https 페이지에서 http 이미지는 브라우저가 차단할 수 있어요"
        >
          http 이미지 차단됨
        </span>
      )}
    </div>
  );
}

export default function SeniorPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth?.() || {};

  const senior = useMemo(() => ({
    id: user?.seniorId || user?.id,
    name: user?.name,
    address: user?.address || user?.city || '부산',
  }), [user]);

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let off = false;
    setLoading(true);
    (async () => {
      try {
        const page = await fetchAnimals({ page: 0, size: 60, careNm: CARE_NM });
        const items = (page?.content || []).filter(p => isProtected(p?.status || '보호중'));
        const enriched = items.map(p => ({
          ...p,
          careAddr: p.careAddr || CARE_ADDR,
          matchScore: fakeMatchScore({ senior, pet: p }),
          temperament: mockTemperament(p),
        })).sort((a,b)=> (b.matchScore ?? 0) - (a.matchScore ?? 0));
        if (!off) setPets(enriched);
      } finally {
        !off && setLoading(false);
      }
    })();
    return ()=>{ off = true; };
  }, [senior]);

  const onApply = (pet) => {
    localStorage.setItem('selectedPet', JSON.stringify(pet));
    navigate(`/pet/${pet.id}/apply`);
  };

  const onLogout = () => {
    if (typeof logout === 'function') logout();
    localStorage.removeItem('token');
    sessionStorage.removeItem('selectedRole');
    navigate('/', { replace: true }); // ← 메인으로 이동
  };

  return (
    <div className="senior">
      <div className="senior__header">
        <div>
          <h1>추천 유기동물</h1>
          <div style={{color:'#667085', fontSize:14, marginTop:4}}>
            보호소: <strong>{CARE_NM}</strong> · {CARE_ADDR}
          </div>
        </div>
        <div className="senior__actions">
          <Button onClick={()=>window.location.reload()}>새로고침</Button>
          <Button variant="ghost" onClick={onLogout}>로그아웃</Button>
        </div>
      </div>

      {loading && <p>불러오는 중…</p>}

      <div className="senior__grid">
        {pets.map((pet) => {
          const neutered = normalizeYN(pet.neuter) === 'Y';
          const sex = (pet.gender || pet.sex || '').toString() || '-';
          const kind = pet.breed || pet.species || '-';
          return (
            <Card key={pet.id}>
              <div
                className="pet-card"
                role="button"
                tabIndex={0}
                onClick={()=>onApply(pet)}
                onKeyDown={(e)=> (e.key==='Enter' || e.key===' ') && onApply(pet)}
                style={{ cursor:'pointer' }}
              >
                <PetImg pet={pet} />
                <div className="pet-card__body">
                  <div className="pet-card__head">
                    <strong>{pet.name || '(이름없음)'}</strong>
                    <Badge color="green">점수 {pet.matchScore}</Badge>
                  </div>
                  <div className="pet-card__meta" style={{flexWrap:'wrap'}}>
                    <span>{kind}</span>
                    <span>{sex}</span>
                    <span>{neutered ? '중성화' : '미중성화'}</span>
                    <span>상태: {pet.status || '보호중'}</span>
                  </div>
                  <div style={{display:'flex', flexWrap:'wrap', gap:6, margin:'6px 0 10px'}}>
                    {(pet.temperament || []).map((t,i)=>(
                      <span key={`${t}-${i}`} style={{
                        fontSize:12, padding:'4px 8px', borderRadius:999,
                        background:'#f3f4f6', color:'#374151'
                      }}>{t}</span>
                    ))}
                  </div>
                  <Button className="applibtn" onClick={(e)=>{ e.stopPropagation(); onApply(pet); }}>
                    신청하기
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
