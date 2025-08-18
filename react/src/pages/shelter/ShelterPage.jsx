// src/pages/shelter/ShelterPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import './shelter.css';

/**
 * 보호소 대시보드
 * - /shelter (SHELTER 전용)
 */
export default function ShelterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ---- shelter meta (이름은 로그인 시 저장된 affiliation 사용)
  const [shelterName, setShelterName] = useState('');
  const [metaLoading, setMetaLoading] = useState(true);

  // ---- animals list (recent)
  const [animals, setAnimals] = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [animalsError, setAnimalsError] = useState('');

  const displayEmail = user?.email || '';
  const shelterId = user?.shelterId || user?.id || null;

  // 이름 폴백: Auth에 저장된 affiliation → 세션/로컬 보관명
  const inferredName = useMemo(() => {
    return (
      user?.affiliation ||
      sessionStorage.getItem('affiliation') ||
      localStorage.getItem('selectedCareNm') ||
      ''
    );
  }, [user]);

  // --- set header name only (백의 /shelters/me 호출 제거)
  useEffect(() => {
    setMetaLoading(true);
    setShelterName(inferredName || '보호소');
    setMetaLoading(false);
  }, [inferredName]);

  // --- load animals owned by this shelter (/animals?shelterId=)
  useEffect(() => {
    let ignore = false;
    (async () => {
      setAnimalsLoading(true);
      setAnimalsError('');
      try {
        const params = new URLSearchParams();
        if (shelterId) params.set('shelterId', String(shelterId));
        params.set('size', '10');
        params.set('sort', 'createdAt,DESC');

        const { data } = await api.get(`/animals?${params.toString()}`);
        const list =
          Array.isArray(data) ? data :
          Array.isArray(data?.content) ? data.content :
          [];
        if (!ignore) setAnimals(list);
      } catch (e) {
        setAnimalsError(
          e?.message || e?.response?.data?.message || '보호 중인 동물을 불러오지 못했어요.'
        );
      } finally {
        if (!ignore) setAnimalsLoading(false);
      }
    })();
    return () => (ignore = true);
  }, [shelterId]);

  const goNewPet = () => navigate('/shelter/pets/new');
  const goAllPets = () => navigate('/pet/connect');
  const goLogout = () => navigate('/logout');

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
          <Button presetName="primary" onClick={goNewPet}>
            보호 동물 등록
          </Button>
          <Button presetName="ghost" onClick={goAllPets}>
            전체 목록 보기
          </Button>
          <Button presetName="danger" onClick={goLogout}>
            로그아웃
          </Button>
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
              {animals.map((a) => (
                <li key={a.id || `${a.careNm}-${a.noticeNo || a.desertionNo || Math.random()}`} className="list__item">
                  <div className="list__main">
                    <strong className="list__name">{a.kindCd || a.breed || '품종 미상'}</strong>
                    <span className="list__meta">
                      {[
                        a.sexCd ? (a.sexCd === 'M' ? '수컷' : a.sexCd === 'F' ? '암컷' : a.sexCd) : null,
                        a.age || a.ageTag || null,
                        a.weight || null,
                      ].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <div className="list__sub">
                    <span className="list__shelter">{a.careNm || shelterName}</span>
                    {a.happenDt && <span className="list__date">입소: {a.happenDt}</span>}
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
            <button className="quick" onClick={goNewPet}>
              신규 보호 동물 등록
            </button>
            <Link className="quick" to="/pet/connect">
              봉사/임보 연결 관리
            </Link>
            <Link className="quick" to="/shelter">
              대시보드 새로고침
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
