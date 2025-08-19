// src/pages/shelter/ShelterPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { fetchAnimals } from '../../api/animals';
import './shelter.css';

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
    return (
      user?.affiliation ||
      sessionStorage.getItem('affiliation') ||
      localStorage.getItem('selectedCareNm') ||
      ''
    );
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
    (async () => {
      if (!careNm) {
        setAnimals([]);
        setAnimalsLoading(false);
        setAnimalsError('로그인 정보에 보호소명이 없습니다.');
        return;
      }
      setAnimalsLoading(true);
      setAnimalsError('');
      try {
        const res = await fetchAnimals({
          careNm,            // ★ 백엔드가 받는 파라미터명
          page: 0,           // Spring Pageable은 0부터
          size: 10,
          sort: 'createdAt,DESC', // 백 정렬필드명에 맞춰 필요시 변경
        });
        const content = res?.content ?? res?.data?.content ?? [];
        if (!ignore) setAnimals(content);
      } catch (e) {
        if (ignore) return;
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          setAnimalsError('권한이 없습니다. 다시 로그인해주세요.');
          // 필요시 자동 이동
          // navigate('/login', { replace: true });
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
    })();
    return () => { ignore = true; };
  }, [careNm, navigate]);

  const goNewPet  = () => navigate('/shelter/pets/new');
  const goAllPets = () => navigate('/pet/connect');
  const goLogout  = () => navigate('/logout');

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
            <Link to="/pet/connect" className="card__link">더 보기</Link>
          </div>

          {animalsLoading && <div className="card__body">목록을 불러오는 중…</div>}
          {animalsError && !animalsLoading && (
            <div className="card__error">{animalsError}</div>
          )}

          {!animalsLoading && !animalsError && (
            <ul className="list">
              {animals.length === 0 && (
                <li className="list__empty">등록된 보호 동물이 없습니다. 먼저 등록해 보세요.</li>
              )}
              {animals.map((a, i) => (
                <li
                  key={a.id ?? a.desertionNo ?? a.noticeNo ?? `${a.careNm}-${i}`}
                  className="list__item"
                >
                  <div className="list__main">
                    <strong className="list__name">{a.species || a.breed || '품종 미상'}</strong>
                    <span className="list__meta">
                      {[a.gender || a.sex, a.age, a.weight].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <div className="list__sub">
                    <span className="list__shelter">{a.careNm || shelterName}</span>
                    {(a.happenDt || a.createdAt) && (
                      <span className="list__date">입소: {a.happenDt || a.createdAt}</span>
                    )}
                  </div>
                </li>
              ))}
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
