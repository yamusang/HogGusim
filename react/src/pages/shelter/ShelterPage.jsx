// src/pages/shelter/ShelterPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import './shelter.css';

/**
 * 보호소 대시보드
 * - 회원가입 폼과 무관. 관리용 페이지 전용.
 * - /shelter 에 매핑됨 (App.jsx Protected allow=['SHELTER'])
 */
export default function ShelterPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // ---- shelter meta
  const [shelterName, setShelterName] = useState('');
  const [shelterMeta, setShelterMeta] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState('');

  // ---- animals list (recent)
  const [animals, setAnimals] = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [animalsError, setAnimalsError] = useState('');

  const displayEmail = user?.email || '';
  // 이름 폴백: Auth에 저장된 affiliation → 세션/로컬 보관명
  const inferredName = useMemo(() => {
    return (
      user?.affiliation ||
      sessionStorage.getItem('affiliation') ||
      localStorage.getItem('selectedCareNm') ||
      ''
    );
  }, [user]);

  // --- load shelter meta (optional endpoint: /shelters/me)
  useEffect(() => {
    let ignore = false;
    (async () => {
      setMetaLoading(true);
      setMetaError('');
      try {
        // 1) 선반영: 헤더에 이름 즉시 표시
        setShelterName(inferredName);

        // 2) 백엔드에서 상세 정보가 있으면 가져와서 덮어쓰기
        // 존재하지 않는다면 이 호출은 404일 수 있으니 무시 가능
        const { data } = await api.get('/shelters/me'); // <-- 서버에 맞게 변경 가능
        if (!ignore && data) {
          setShelterMeta(data);
          if (data?.careNm || data?.name) {
            setShelterName(data.careNm || data.name);
          }
        }
      } catch (e) {
        // 상세 정보가 필수는 아님 (이름만으로도 동작)
        setMetaError(
          e?.message || e?.response?.data?.message || '보호소 정보를 불러오지 못했어요.'
        );
      } finally {
        if (!ignore) setMetaLoading(false);
      }
    })();
    return () => (ignore = true);
  }, [inferredName]);

  // --- load animals owned by this shelter
  useEffect(() => {
    let ignore = false;
    (async () => {
      setAnimalsLoading(true);
      setAnimalsError('');
      try {
        // 서버 스펙 예시:
        // GET /animals?shelter=부산OO보호소&size=10&sort=regDt,DESC
        const params = new URLSearchParams();
        if (inferredName) params.set('shelter', inferredName);
        params.set('size', '10');
        params.set('sort', 'regDt,DESC');

        const { data } = await api.get(`/animals?${params.toString()}`);
        // 백엔드 구조에 맞춰 파싱
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
  }, [inferredName]);

  const goNewPet = () => navigate('/shelter/pets/new');
  const goAllPets = () => navigate('/pet/connect'); // 공용 목록(권한 있음)
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
          {metaError && (
            <p className="shelter__hint" aria-live="polite">{metaError}</p>
          )}
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
