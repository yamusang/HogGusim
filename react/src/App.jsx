// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import useAuth from './hooks/useAuth';

// pages
import MainPage from './pages/Mainpage/MainPage';   // 폴더/파일명 확인!
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import SeniorPage from './pages/senior/SeniorPage';
import ConnectPage from './pages/senior/ConnectPage';
import ManagerPage from './pages/manager/ManagerPage';
import ShelterPage from './pages/shelter/ShelterPage';
import PetConnectPage from './pages/pet/PetConnectPage';
import LogoutPage from './pages/auth/LogoutPage';
import PetNewPage from './pages/shelter/PetNewPage';

// ---------- Routes Consts (경로 상수)
const PATHS = {
  ROOT: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  LOGOUT: '/logout',
  SENIOR_HOME: '/senior',
  SENIOR_CONNECT: '/senior/connect',
  MANAGER_HOME: '/manager',
  SHELTER_HOME: '/shelter',
  SHELTER_ANIMAL_NEW: '/shelter/animals/new', // ← 등록 경로 통일
  PET_CONNECT: '/pet/connect',
};

// helpers
const toUpper = (v) => (v || '').toUpperCase();
const routeForRole = (role) => {
  switch (toUpper(role)) {
    case 'SENIOR':  return PATHS.SENIOR_HOME;
    case 'MANAGER': return PATHS.MANAGER_HOME;
    case 'SHELTER': return PATHS.SHELTER_HOME;
    default:        return PATHS.ROOT;
  }
};

// Guards
function Protected({ children, allow }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to={`${PATHS.LOGIN}?from=${encodeURIComponent(loc.pathname)}`} replace />;
  if (allow && !allow.map(toUpper).includes(toUpper(user.role))) {
    return <Navigate to={routeForRole(user.role)} replace />;
  }
  return children;
}
function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return children;
  return <Navigate to={routeForRole(user.role)} replace />;
}

// App
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 공개 */}
          <Route path={PATHS.ROOT} element={<MainPage />} />

          <Route
            path={PATHS.LOGIN}
            element={
              <RedirectIfAuthed>
                <LoginPage />
              </RedirectIfAuthed>
            }
          />
          <Route
            path={PATHS.SIGNUP}
            element={
              <RedirectIfAuthed>
                <SignupPage />
              </RedirectIfAuthed>
            }
          />

          {/* 로그아웃은 공개 */}
          <Route path={PATHS.LOGOUT} element={<LogoutPage />} />

          {/* 고령자 */}
          <Route
            path={PATHS.SENIOR_HOME}
            element={
              <Protected allow={['SENIOR']}>
                <SeniorPage />
              </Protected>
            }
          />
          <Route
            path={PATHS.SENIOR_CONNECT}
            element={
              <Protected allow={['SENIOR']}>
                <ConnectPage />
              </Protected>
            }
          />

          {/* 매니저 */}
          <Route
            path={PATHS.MANAGER_HOME}
            element={
              <Protected allow={['MANAGER']}>
                <ManagerPage />
              </Protected>
            }
          />

          {/* 보호소 */}
          <Route
            path={PATHS.SHELTER_HOME}
            element={
              <Protected allow={['SHELTER']}>
                <ShelterPage />
              </Protected>
            }
          />
          <Route
            path={PATHS.SHELTER_ANIMAL_NEW}
            element={
              <Protected allow={['SHELTER']}>
                <PetNewPage />
              </Protected>
            }
          />

          {/* 공용(로그인 필요) */}
          <Route
            path={PATHS.PET_CONNECT}
            element={
              <Protected allow={['SENIOR', 'SHELTER', 'MANAGER']}>
                <PetConnectPage />
              </Protected>
            }
          />

          {/* 기타 */}
          <Route path="*" element={<Navigate to={PATHS.ROOT} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
