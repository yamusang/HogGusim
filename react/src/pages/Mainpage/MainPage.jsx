// src/pages/main/MainPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './main-page.css'

// 아이콘
import seniorIcon from '../../assets/icons/senior.png'
import managerIcon from '../../assets/icons/manager.png'
import shelterIcon from '../../assets/icons/shelter.png'

// 슬라이드 이미지
import slide1 from '../../assets/hero/slide1.jpg'
import slide2 from '../../assets/hero/slide2.jpg'
import slide3 from '../../assets/hero/slide3.webp'

export default function MainPage() {
  const roles = useMemo(() => ([
    { key: 'senior',  title: '고령자',   icon: seniorIcon },
    { key: 'manager', title: '펫매니저', icon: managerIcon },
    { key: 'shelter', title: '보호소',   icon: shelterIcon },
  ]), [])

  const images = [slide1, slide2, slide3]
  const [idx, setIdx] = useState(0)
  const timer = useRef(null)

  const start = () => {
    stop()
    timer.current = setTimeout(() => setIdx(i => (i + 1) % images.length), 4500)
  }
  const stop = () => { if (timer.current) clearTimeout(timer.current) }

  useEffect(() => { start(); return stop }, [idx])

  return (
    <main className="landing" role="main" aria-label="유기동물 매칭 메인">
      {/* 상단바 */}
      <header className="landing__top">
        <div className="container top__inner">
          <div className="brand">
            <span aria-hidden>🐾</span>
            <strong>서비스명(가칭)</strong>
          </div>
        </div>
      </header>

      {/* 슬라이드 + 역할 타일 */}
      <section className="container">
        <div
          className="hero-bg"
          style={{ backgroundImage: `url(${images[idx]})` }}
          onMouseEnter={stop}
          onMouseLeave={start}
          aria-roledescription="carousel"
          aria-label="서비스 미리보기"
        >
          <div className="hero-bg__overlay" />

          <div className="hero-actions" aria-label="역할 선택">
            {roles.map(r => (
              <Link
                key={r.key}
                to={`/login?role=${r.key.toUpperCase()}`}
                onClick={() => sessionStorage.setItem('selectedRole', r.key.toUpperCase())}
                className={`role-tile ${r.key}`}
              >
                <div className="icon-box">
                  <img src={r.icon} alt="" className="icon-img" />
                </div>
                <span className="role-tile__label">{r.title}</span>
              </Link>
            ))}
          </div>

          <div className="dots" role="tablist" aria-label="슬라이드 선택">
            {images.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === idx ? 'active' : ''}`}
                aria-selected={i === idx}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 하단 기능 */}
      <section className="features container" aria-label="주요 기능">
        <article className="feature"><h3>빠른 매칭</h3><p>보호소 동물 데이터와 고령자 조건을 결합해 맞춤 매칭을 제공합니다.
주소·건강·환경 조건을 기반으로 최적 후보를 선별합니다.</p></article>
        <article className="feature"><h3>간편 신청</h3><p>이름, 나이, 경험, 주소 등 필수 항목만 입력하면 신청이 완료됩니다.
날짜와 이용 시간 선택도 간단하게 할 수 있습니다.</p></article>
        <article className="feature"><h3>안심 연계</h3><p>복지사 초기 방문 확인으로 안전성을 확보합니다.
응급 상황 시 보호소와 즉시 연락할 수 있도록 연결합니다.</p></article>
      </section>
    </main>
  )
}
