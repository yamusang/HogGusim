import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './main-page.css'

import slide1 from '../../assets/hero/slide1.jpg'
import slide2 from '../../assets/hero/slide2.jpg'
import slide3 from '../../assets/hero/slide3.webp'

import seniorIcon from '../../assets/icons/senior.png'
import managerIcon from '../../assets/icons/manager.png'
import shelterIcon from '../../assets/icons/shelter.png'

import logo from '../../assets/brand/dog.png'

/** 하단 인포카드 아이콘 */
import iconView from '../../assets/icons/view.png'
import iconProcess from '../../assets/icons/process.png'
import iconLocation from '../../assets/icons/location.png'

export default function MainPage() {
  const images = [slide1, slide2, slide3]
  const [idx, setIdx] = useState(0)
  const timer = useRef(null)

  const [mx, setMx] = useState(-9999)
  const [my, setMy] = useState(-9999)

  const next  = () => setIdx(i => (i + 1) % images.length)
  const stop  = () => { if (timer.current) clearTimeout(timer.current) }
  const start = () => { stop(); timer.current = setTimeout(next, 5000) }

  useEffect(() => { start(); return stop }, [idx])

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMx(e.clientX - rect.left)
    setMy(e.clientY - rect.top)
  }
  const onLeave = () => { setMx(-9999); setMy(-9999) }

  return (
    <main className="landing" role="main" aria-label="메인">
      {/* ✅ 헤더 바 제거하고, 로고를 슬라이드 안 텍스트 상단으로 이동 */}
      <section className="hero">
        <div
          className="hero__bg"
          style={{ backgroundImage: `url(${images[idx]})`, '--mx': `${mx}px`, '--my': `${my}px` }}
          onMouseEnter={stop}
          onMouseLeave={() => { start(); onLeave(); }}
          onMouseMove={onMove}
        >
          <div className="hero__tint" />
          <div className="hero__scrim" />
          <div className="hero__glass" />

          {/* ⬅ 왼쪽: 로고 + 제목 + 부가설명 */}
          <div className="hero__copy">
            <img className="hero__logo" src={logo} alt="다녀올개 로고" />
            <h1 className="hero__title">따뜻한 연결, 가벼운 시작</h1>
            <p className="hero__desc">유기동물과 사람을 안전하게 잇는 우리 동네 플랫폼</p>
          </div>

          {/* ➡ 오른쪽: 버튼 3개 (수직) */}
          <nav className="hero__roles-vertical" aria-label="역할 선택">
            <Link to="/login?role=SENIOR" className="role-btn"
                  onClick={() => sessionStorage.setItem('selectedRole','SENIOR')}>
              <img src={seniorIcon} alt="" />
              <div className="role-text">
                <span className="role-title">고령자</span>
                <span className="role-sub">도움 요청하고 산책·돌봄 매칭</span>
              </div>
            </Link>

            <Link to="/login?role=MANAGER" className="role-btn"
                  onClick={() => sessionStorage.setItem('selectedRole','MANAGER')}>
              <img src={managerIcon} alt="" />
              <div className="role-text">
                <span className="role-title">펫매니저</span>
                <span className="role-sub">가까운 의뢰 수락하고 활동</span>
              </div>
            </Link>

            <Link to="/login?role=SHELTER" className="role-btn"
                  onClick={() => sessionStorage.setItem('selectedRole','SHELTER')}>
              <img src={shelterIcon} alt="" />
              <div className="role-text">
                <span className="role-title">보호소</span>
                <span className="role-sub">분양 공고·봉사 매칭 관리</span>
              </div>
            </Link>
          </nav>

          {/* 도트 */}
          <div className="hero__dots" role="tablist" aria-label="슬라이드 선택">
            {images.map((_, i) => (
              <button key={i} className={`dot ${i===idx?'active':''}`}
                      onClick={()=>setIdx(i)} aria-selected={i===idx} />
            ))}
          </div>
        </div>
      </section>

      {/* 하단 소개 */}
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
    </main>
  )
}
