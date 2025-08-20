import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './manager.css';

export default function ManagerHome() {
  const navigate = useNavigate();

  return (
    <div className="manager">
      <header className="manager__header">
        <div>
          <h1 className="manager__title">펫 매니저</h1>
          <p className="manager__subtitle">신청 배정/예약 관리 · 프로필</p>
        </div>
        <nav className="manager__tabs">
          <NavLink to="/manager/inbox" className={({isActive}) => isActive ? 'tab is-active' : 'tab'}>
            받은 신청함
          </NavLink>
          <NavLink to="/manager/profile" className={({isActive}) => isActive ? 'tab is-active' : 'tab'}>
            프로필
          </NavLink>
        </nav>
      </header>

      <main className="manager__main">
        {/* /manager 는 기본으로 inbox로 라우팅되지만, 주소로 직접 들어와도 Outlet이 렌더됨 */}
        <Outlet />
      </main>
    </div>
  );
}
