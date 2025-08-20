// src/pages/manager/ManagerHome.jsx
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import './manager.css';

export default function ManagerHome() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();           // 토큰/유저정보 제거
    navigate('/'); 
  };

  return (
    <div className="manager">
      <header className="manager__header">
        <div>
          <h1 className="manager__title">펫 매니저</h1>
          <p className="manager__subtitle">신청 배정/예약 관리 · 프로필</p>
        </div>
        <div className="manager__actions">
          <nav className="manager__tabs">
            <NavLink
              to="/manager/inbox"
              className={({ isActive }) => (isActive ? 'tab is-active' : 'tab')}
            >
              받은 신청함
            </NavLink>
            <NavLink
              to="/manager/profile"
              className={({ isActive }) => (isActive ? 'tab is-active' : 'tab')}
            >
              프로필
            </NavLink>
          </nav>
          <Button onClick={handleLogout} className="ml-2">
            로그아웃
          </Button>
        </div>
      </header>

      <main className="manager__main">
        <Outlet />
      </main>
    </div>
  );
}
