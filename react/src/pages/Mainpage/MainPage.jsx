import React from 'react'
import { Link } from 'react-router-dom'
import './main-page.css'

// 아이콘(assets)
import seniorIcon from '../../assets/icons/senior.png'
import managerIcon from '../../assets/icons/manager.png'
import shelterIcon from '../../assets/icons/shelter.png'

export default function MainPage() {
  const roles = [
    { key:'senior',  title:'고령자',   to:'/senior',  icon: seniorIcon,  color:'--accent-purple', desc:'추천 동물 확인 · 체험/입양 신청' },
    { key:'manager', title:'펫매니저', to:'/manager', icon: managerIcon, color:'--accent-amber',  desc:'매칭 보조 · 방문 기록 관리' },
    { key:'shelter', title:'보호소',   to:'/shelter', icon: shelterIcon, color:'--accent-orange', desc:'동물 등록 · 신청 승인/관리' },
  ]

  const cycleFontScale = () => {
    const html = document.documentElement
    const cur = html.dataset.fontscale || '1'
    html.dataset.fontscale = cur === '1' ? '2' : cur === '2' ? '3' : '1'
  }

  return (
    <main className="landing" role="main" aria-label="유기동물 매칭 메인">
      {/* 내부 상단바 */}
      <div className="landing__top">
        <div className="brand">
          <span aria-hidden>🐾</span>
          <strong>서비스명 뭐할까요 아이디어 주십샤</strong>
        </div>
        <button className="btn-a11y" onClick={cycleFontScale}>크게 보기</button>
      </div>

      {/* 히어로 */}
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">어떤 역할로 시작할까요?</h1>
        <p className="hero__desc">간단한 선택으로 매칭부터 신청까지 한 번에.</p>

        {/* 역할 카드 그리드 */}
        <div className="role-grid" role="list">
          {roles.map(r => (
            <Link
              key={r.key}
              to={r.to}
              role="listitem"
              className="role-card"
              style={{ ['--card-accent']: `var(${r.color})` }}
            >
              <div className="role-card__icon">
                <img src={r.icon} alt="" />
              </div>
              <div className="role-card__title">{r.title}</div>
              <div className="role-card__desc">{r.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* 하단 3컬럼 안내 */}
      <section className="features" aria-label="주요 기능">
        <article className="feature">
          <h3>빠른 매칭</h3>
          <p>지역·건강·생활환경을 반영한 추천.</p>
        </article>
        <article className="feature">
          <h3>간편 신청</h3>
          <p>큰 입력창과 단계형 흐름으로 실수 없이.</p>
        </article>
        <article className="feature">
          <h3>안심 연계</h3>
          <p>복지사 방문과 응급 연락체계로 안전하게.</p>
        </article>
      </section>
    </main>
  )
}
