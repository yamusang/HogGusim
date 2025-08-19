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
        const tryLoad = async (params) => {
          const { content, totalElements } = await fetchAnimals({
            page: 0, size: 10, sort: 'id,DESC', ...params,
          });
          console.log('[Shelter] API totalElements=', totalElements, 'len=', content?.length);
          return Array.isArray(content) ? content : [];
        };

        console.log('[Shelter] careNm =', careNm);
        let list = await tryLoad({ careNm });

        if (list.length === 0) {
          console.log('[Shelter] fallback (carenm) =', careNm);
          try { list = await tryLoad({ carenm: careNm }); } catch {}
        }

        if (list.length === 0) {
          const probe = await tryLoad({});
          if (probe.length > 0) {
            console.warn('[Shelter] filter mismatch: careNm 값이 DB와 다를 수 있음');
          } else {
            console.warn('[Shelter] endpoint returns 0 without filter (데이터 없음/권한 가능)');
          }
        }

        if (!ignore) {
          console.log('[Shelter] setAnimals len=', list.length, 'sample=', list?.[0]);
          setAnimals(list);
        }
      } catch (e) {
        if (ignore) return;
        const status = e?.response?.status || e?.status;
        if (status === 401 || e?.response?.status === 403) {
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

                return (
                  <li
                    key={a.id ?? a._raw?.id ?? a._raw?.desertionNo ?? a._raw?.noticeNo ?? `${a.careNm}-${i}`}
                    className="list__item"
                    style={{
                      padding:'12px 14px', border:'1px solid #e5e7eb',
                      borderRadius:12, marginBottom:10, background:'#fff'
                    }}
                  >
                    <div className="list__main" style={{fontWeight:600}}>
                      {title}
                    </div>
                    <div className="list__meta" style={{fontSize:13, color:'#6b7280'}}>
                      {metaParts.join(' · ')}
                    </div>
                    <div className="list__sub" style={{fontSize:12, color:'#9ca3af', marginTop:4}}>
                      <span>{a.careNm || shelterName}</span>
                      {date && <span style={{marginLeft:8}}>입소: {date}</span>}
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
