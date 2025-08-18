import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './main-page.css';

import slide1 from '../../assets/hero/slide1.jpg';
import slide2 from '../../assets/hero/slide2.jfif';
import slide3 from '../../assets/hero/slide3.webp';
import slide4 from '../../assets/hero/slide4.jfif';

import seniorIcon from '../../assets/icons/senior.png';
import managerIcon from '../../assets/icons/manager.png';
import shelterIcon from '../../assets/icons/shelter.png';
import logo from '../../assets/brand/dog.png';

import iconView from '../../assets/icons/view.png';
import iconProcess from '../../assets/icons/process.png';
import iconLocation from '../../assets/icons/location.png';

import FeaturedDogsSlider from '../../components/FeatureDogsSlider'; // ✅ 추가

export default function MainPage() {
  const images = [slide1, slide2, slide3, slide4];
  const [idx, setIdx] = useState(0);
  const timer = useRef(null);

  const next  = () => setIdx(i => (i + 1) % images.length);
  const stop  = () => { if (timer.current) clearTimeout(timer.current) };
  const start = () => { stop(); timer.current = setTimeout(next, 5000) };

  useEffect(() => { start(); return stop; }, [idx]);

  return (
    <main className="landing" role="main" aria-label="메인">
      <section className="hero">
        <div
          className="hero__bg"
          style={{ backgroundImage: `url(${images[idx]})` }}
          onMouseEnter={stop}
          onMouseLeave={start}
        >
          <div className="hero__inner">
            <div className="hero__columns">
              <div className="hero__copy">
                <img className="hero__logo fade-up d0" src={logo} alt="다녀올개 로고" />
                <h1 className="hero__title fade-up d1">따뜻한 연결, 가벼운 시작</h1>
                <p className="hero__desc fade-up d2">유기동물과 사람을 안전하게 잇는 우리 동네 플랫폼</p>
              </div>

              <aside className="hero__panel" role="region" aria-label="역할 빠른 선택">
                <div className="hero_nav"><p>{"<당신의 역할을 선택해주세요>"}</p></div>

                <nav className="hero__roles-vertical" aria-label="역할 선택">
                  {/* SENIOR: 텍스트 먼저, 아이콘 나중 */}
                  <Link to="/login?role=SENIOR" className="role-btn" onClick={() => sessionStorage.setItem('selectedRole','SENIOR')}>
                    <div className="role-text">
                      <span className="role-title">고령자</span>
                      <span className="role-sub">도움 요청하고 산책·돌봄 매칭</span>
                    </div>
                    <span className="icon-wrap"><img src={seniorIcon} alt="" /></span>
                  </Link>

                  {/* MANAGER */}
                  <Link to="/login?role=MANAGER" className="role-btn" onClick={() => sessionStorage.setItem('selectedRole','MANAGER')}>
                    <div className="role-text">
                      <span className="role-title">펫매니저</span>
                      <span className="role-sub">가까운 의뢰 수락하고 활동</span>
                    </div>
                    <span className="icon-wrap"><img src={managerIcon} alt="" /></span>
                  </Link>

                  {/* SHELTER */}
                  <Link to="/login?role=SHELTER" className="role-btn" onClick={() => sessionStorage.setItem('selectedRole','SHELTER')}>
                    <div className="role-text">
                      <span className="role-title">보호소</span>
                      <span className="role-sub">분양 공고·봉사 매칭 관리</span>
                    </div>
                    <span className="icon-wrap"><img src={shelterIcon} alt="" /></span>
                  </Link>
                </nav>
              </aside>
            </div>
          </div>

          <div className="hero__dots" role="tablist" aria-label="슬라이드 선택">
            {images.map((_, i) => (
              <button
                key={i}
                className={`dot ${i===idx ? 'active' : ''}`}
                onClick={() => setIdx(i)}
                role="tab"
                aria-selected={i===idx}
                aria-label={`슬라이드 ${i+1}`}
                tabIndex={i===idx ? 0 : -1}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="features center info-cards" aria-label="간단 소개">
        <article className="info-card">
          <div className="info-text">
            <strong>한눈에 보기</strong>
            <span>사진과 기본 정보만 깔끔하게.</span>
          </div>
          <img src={iconView} alt="한눈에 보기" className="info-icon" />
        </article>

        <article className="info-card">
          <div className="info-text">
            <strong>간단한 절차</strong>
            <span>필수 정보만 빠르게.</span>
          </div>
          <img src={iconProcess} alt="간단한 절차" className="info-icon" />
        </article>

        <article className="info-card">
          <div className="info-text">
            <strong>지역 중심</strong>
            <span>가까운 곳부터 찾아보기.</span>
          </div>
          <img src={iconLocation} alt="지역 중심" className="info-icon" />
        </article>
      </section>

      {/* 🔽 여기 추가 */}
      <section className="section-spacing" aria-label="보호 중인 강아지">
        <FeaturedDogsSlider title="보호 중인 강아지" take={20} />
      </section>
    </main>
  );
}
