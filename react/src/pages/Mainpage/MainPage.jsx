import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './main-page.css'

import slide1 from '../../assets/hero/slide1.jpg'
import slide2 from '../../assets/hero/slide2.jpg'
import slide3 from '../../assets/hero/slide3.webp'

import seniorIcon from '../../assets/icons/senior.png'
import managerIcon from '../../assets/icons/manager.png'
import shelterIcon from '../../assets/icons/shelter.png'

export default function MainPage() {
  const images = [slide1, slide2, slide3]
  const [idx, setIdx] = useState(0)
  const timer = useRef(null)

  const [mx, setMx] = useState(-9999)
  const [my, setMy] = useState(-9999)

  const next = () => setIdx(i => (i + 1) % images.length)
  const stop = () => { if (timer.current) clearTimeout(timer.current) }
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
      <header className="landing__top">
        <div className="container top__inner">
          <div className="brand"><span aria-hidden>🐾</span><strong>서비스명(가칭)</strong></div>
        </div>
      </header>

      {/* 컨테이너 제거 → .hero 스스로 중앙정렬 + 여백/둥근모서리 */}
      <section className="hero">
        <div
          className="hero__bg"
          style={{ backgroundImage: `url(${images[idx]})`, '--mx': `${mx}px`, '--my': `${my}px` }}
          onMouseEnter={stop} onMouseLeave={() => { start(); onLeave(); }}
          onMouseMove={onMove}
        >
          <div className="hero__scrim" />
          <div className="hero__glass" />
          <div className="hero__spot-invert" />

          <div className="hero__copy">
            <h1 className="hero__title">따뜻한 연결, 가벼운 시작</h1>
            <p className="hero__desc">유기동물과 사람을 안전하게 잇는 우리 동네 플랫폼</p>
          </div>

          <div className="hero__roles" aria-label="역할 선택">
            <Link to="/login?role=SENIOR" className="role-btn pastel-lavender lg"
                  onClick={() => sessionStorage.setItem('selectedRole','SENIOR')}>
              {seniorIcon ? <img src={seniorIcon} alt="" /> : null}
              <span>고령자</span>
            </Link>
            <Link to="/login?role=MANAGER" className="role-btn pastel-mint lg"
                  onClick={() => sessionStorage.setItem('selectedRole','MANAGER')}>
              {managerIcon ? <img src={managerIcon} alt="" /> : null}
              <span>펫매니저</span>
            </Link>
            <Link to="/login?role=SHELTER" className="role-btn pastel-peach lg"
                  onClick={() => sessionStorage.setItem('selectedRole','SHELTER')}>
              {shelterIcon ? <img src={shelterIcon} alt="" /> : null}
              <span>보호소</span>
            </Link>
          </div>

          <div className="hero__dots" role="tablist" aria-label="슬라이드 선택">
            {images.map((_, i) => (
              <button key={i} className={`dot ${i===idx?'active':''}`} onClick={()=>setIdx(i)} aria-selected={i===idx} />
            ))}
          </div>
        </div>
      </section>

      <section className="features container" aria-label="간단 소개">
        <article className="feature"><h3>한눈에 보기</h3><p>사진과 기본 정보만 깔끔하게.</p></article>
        <article className="feature"><h3>간단한 절차</h3><p>필수 정보만 빠르게.</p></article>
        <article className="feature"><h3>지역 중심</h3><p>가까운 곳부터 찾아보기.</p></article>
      </section>
    </main>
  )
}
