import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import './manager.css';

export default function ManagerHome() {
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
          {/* LogoutPage가 to=/ 읽어서 메인으로 이동 */}
          <Link to="/logout?to=/" className="btn btn--ghost">로그아웃</Link>
        </div>
      </header>

      <main className="manager__main">
        <Outlet />
      </main>
    </div>
  );
}
