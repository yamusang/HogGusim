import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { fetchAnimals } from '../../api/animals';
import './shelter.css';

// 날짜 포맷 보조
const fmtDate = (d) => {
  if (!d) return '';
  return String(d).slice(0, 10).replaceAll('-', '.'); // YYYY.MM.DD
};

// 전체 페이지 모아서 가져오기
async function loadAllAnimals(params) {
  const pageSize = 100; // 한 번에 100개씩
  let page = 0;
  let all = [];
  while (true) {
    const { content, totalPages } = await fetchAnimals({ ...params, page, size: pageSize, sort: 'id,DESC' });
    all = all.concat(content || []);
    page += 1;
    if (page >= (totalPages || 1)) break;
  }
  return all;
}

export default function ShelterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ---- shelter meta
  const [shelterName, setShelterName] = useState('');
  const [metaLoading, setMetaLoading] = useState(true);

  // ---- animals list
  const [animals, setAnimals] = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [animalsError, setAnimalsError] = useState('');

  const displayEmail = user?.email || '';

  // 로그인 시 저장해둔 보호소명(affiliation = careNm)
  const careNm = useMemo(() => {
    const v =
      user?.affiliation ||
      sessionStorage.getItem('affiliation') ||
      localStorage.getItem('selectedCareNm') ||
      '';
    return (v || '').trim();
  }, [user]);

  // 헤더 표시용 보호소 이름
  useEffect(() => {
    setMetaLoading(true);
    setShelterName(careNm || '보호소');
    setMetaLoading(false);
  }, [careNm]);

  // 보호소 소유 동물 로드: GET /animals?careNm=...
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      if (!careNm) {
        setAnimals([]);
        setAnimalsLoading(false);
        setAnimalsError('로그인 정보에 보호소명이 없습니다.');
        return;
      }
      setAnimalsLoading(true);
      setAnimalsError('');

      try {
        console.log('[Shelter] careNm =', careNm);

        // 전체 페이지 모아 로드 (careNm 우선)
        let list = await loadAllAnimals({ careNm });

        // 백 파라미터 철자 예외(carenm) 대비
        if (list.length === 0) {
          try { list = await loadAllAnimals({ carenm: careNm }); } catch {}
        }

        if (!ignore) {
          console.log('[Shelter] setAnimals len=', list.length, 'sample=', list?.[0]);
          setAnimals(list);
        }
      } catch (e) {
        if (ignore) return;
        const status = e?.response?.status || e?.status;
        if (status === 401 || status === 403) {
          setAnimalsError('권한이 없습니다. 다시 로그인해주세요.');
        } else {
          setAnimalsError(
            e?.response?.data?.message ||
            e?.message ||
            '보호 중인 동물을 불러오지 못했어요.'
          );
        }
      } finally {
        if (!ignore) setAnimalsLoading(false);
      }
    };

    load();
    return () => { ignore = true; };
  }, [careNm, navigate]);

  const goNewPet  = () => navigate('/shelter/pets/new');
  const goAllPets = () => navigate('/pet/connect');
  const goLogout  = () => navigate('/logout');

  const count = animals?.length || 0;

  return (
    <div className="shelter">
      {/* Header */}
      <header className="shelter__header">
        <div className="shelter__titlebox">
          <h1 className="shelter__title">
            {metaLoading ? '보호소 불러오는 중…' : (shelterName || '보호소')}
          </h1>
          <p className="shelter__subtitle">
            관리자: {displayEmail || '이메일 확인 불가'}
          </p>
        </div>

        <div className="shelter__actions">
          <Button presetName="primary" onClick={goNewPet}>보호 동물 등록</Button>
          <Button presetName="ghost" onClick={goAllPets}>전체 목록 보기</Button>
          <Button presetName="danger" onClick={goLogout}>로그아웃</Button>
        </div>
      </header>

      {/* Content */}
      <main className="shelter__content">
        {/* Animals Card */}
        <section className="card">
          <div className="card__head">
            <h2 className="card__title">보호 중인 동물</h2>
            <span className="card__meta" style={{fontSize:12, color:'#6b7280'}}>총 {count}마리</span>
            <Link to="/pet/connect" className="card__link">더 보기</Link>
          </div>

          {animalsLoading && <div className="card__body">목록을 불러오는 중…</div>}
          {animalsError && !animalsLoading && (
            <div className="card__error">{animalsError}</div>
          )}

          {!animalsLoading && !animalsError && count === 0 && (
            <div className="card__body">등록된 보호 동물이 없습니다. 먼저 등록해 보세요.</div>
          )}

          {!animalsLoading && !animalsError && count > 0 && (
            <ul className="list">
              {animals.map((a, i) => {
                const title = a.name || a.species || a.breed || a.color || '이름/품종 미상';
                const metaParts = [a.gender || a.sex, a.age, a.weight].filter(Boolean);
                if (metaParts.length === 0 && a.color) metaParts.push(a.color);
                const date = fmtDate(a.happenDt || a.createdAt);

                const neuterLabel = a.neuter === 'Y' ? '중성화 O'
                                 : a.neuter === 'N' ? '중성화 X'
                                 : '중성화 미상';
                const statusLabel = a.status === '보호중' || a.status === 'AVAILABLE' ? '보호중'
                                 : a.status === '입양완료' || a.status === 'ADOPTED' ? '입양완료'
                                 : a.status || '상태 미상';

                return (
                  <li
                    key={a.id ?? a._raw?.id ?? a._raw?.desertionNo ?? a._raw?.noticeNo ?? `${a.careNm}-${i}`}
                    className="list__item"
                    style={{
                      display:'flex', gap:12, alignItems:'center',
                      padding:'12px 14px', border:'1px solid #e5e7eb',
                      borderRadius:12, marginBottom:10, background:'#fff'
                    }}
                  >
                    {/* 썸네일 */}
                    <div style={{
                      width:64, height:64, borderRadius:10, overflow:'hidden',
                      background:'#f3f4f6', flex:'0 0 auto', display:'flex', alignItems:'center', justifyContent:'center'
                    }}>
                      {a.photoUrl ? (
                        <img
                          src={a.photoUrl}
                          alt={title}
                          loading="lazy"
                          style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          onError={(e) => { e.currentTarget.style.display='none'; }}
                        />
                      ) : (
                        <span style={{fontSize:12, color:'#9ca3af'}}>no image</span>
                      )}
                    </div>

                    {/* 본문 */}
                    <div style={{flex:'1 1 auto', minWidth:0}}>
                      <div style={{fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                        {title}
                      </div>
                      <div style={{fontSize:13, color:'#6b7280', marginTop:2}}>
                        {metaParts.join(' · ')}
                      </div>
                      <div style={{fontSize:12, color:'#9ca3af', marginTop:4, display:'flex', gap:8, flexWrap:'wrap'}}>
                        <span>{a.careNm || shelterName}</span>
                        {date && <span>입소: {date}</span>}
                      </div>
                    </div>

                    {/* 라벨 */}
                    <div style={{display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end'}}>
                      <span style={{fontSize:12, padding:'2px 8px', borderRadius:999, background:'#eef2ff', color:'#4338ca'}}>
                        {statusLabel}
                      </span>
                      <span style={{fontSize:12, padding:'2px 8px', borderRadius:999, background:'#f1f5f9', color:'#334155'}}>
                        {neuterLabel}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Tips / Shortcuts */}
        <section className="card">
          <div className="card__head">
            <h2 className="card__title">빠른 작업</h2>
          </div>
          <div className="quickgrid">
            <button className="quick" onClick={goNewPet}>신규 보호 동물 등록</button>
            <Link className="quick" to="/pet/connect">봉사/임보 연결 관리</Link>
            <Link className="quick" to="/shelter">대시보드 새로고침</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
