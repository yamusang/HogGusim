// src/pages/manager/ManagerHome.jsx
import React from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button';
import './manager.css';

export default function ManagerHome() {
  const nav = useNavigate();
  const loc = useLocation();

  // /manager(슬래시 포함/미포함)일 때만 환영 섹션 표시
  const isIndexPath = loc.pathname === '/manager' || loc.pathname === '/manager/';

  return (
    <div className="manager">
      <header className="manager__header">
        {/* 좌측: 타이틀 */}
        <div className="manager__brand">
          <h1 className="manager__title">펫 매니저</h1>
          <p className="manager__subtitle">신청 배정/예약 관리 · 프로필</p>
        </div>

        {/* 가운데: 탭 */}
        <nav className="manager__tabs" aria-label="매니저 내비게이션">
          <NavLink to="/manager/inbox"  className={({isActive}) => isActive ? 'tab is-active' : 'tab'}>
            받은 신청함
          </NavLink>
          <NavLink to="/manager/queue"  className={({isActive}) => isActive ? 'tab is-active' : 'tab'}>
            작업 큐
          </NavLink>
          <NavLink to="/manager/profile" className={({isActive}) => isActive ? 'tab is-active' : 'tab'}>
            프로필
          </NavLink>
        </nav>

        {/* 우측: 로그아웃 */}
        <div className="manager__actions">
          <Link to="/logout?to=/" className="btn btn--ghost">로그아웃</Link>
        </div>
      </header>

      <main className="manager__main">
        {/* 인덱스(/manager)로 들어왔을 때만 안내 섹션 */}
        {isIndexPath && (
          <div style={{ padding: 16 }}>
            <h2 style={{ marginBottom: 8 }}>매니저 홈</h2>
            <p style={{ color:'#6b7280', marginBottom: 16 }}>
              신청 심사와 보호소 전달을 진행하세요.
            </p>
            <Button onClick={() => nav('/manager/inbox')}>인박스로 이동</Button>
          </div>
        )}

        {/* 중첩 라우트가 여기 렌더링됨 */}
        <Outlet />
      </main>
    </div>
  );
}
