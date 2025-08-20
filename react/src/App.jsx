// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import useAuth from './hooks/useAuth';

// pages
import MainPage from './pages/Mainpage/MainPage';   // 폴더명 대소문자 주의
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import LogoutPage from './pages/auth/LogoutPage';

import SeniorPage from './pages/senior/SeniorPage';
import ConnectPage from './pages/senior/ConnectPage';
import SeniorApplicationsPage from './pages/senior/SeniorApplicationsPage';
import ApplyPage from './pages/senior/ApplyPage'; // ⭐ 추가

import ManagerPage from './pages/manager/ManagerPage';

import ShelterPage from './pages/shelter/ShelterPage';
import ShelterApplicationsPage from './pages/shelter/ShelterApplicationsPage';
import ShelterAnimalsPage from './pages/shelter/ShelterAnimalsPage';
import PetNewPage from './pages/shelter/PetNewPage';

import PetConnectPage from './pages/pet/PetConnectPage';
import PetManagerRecoPage from './pages/pet/PetManagerRecoPage';

// ---------- Routes Consts
const PATHS = {
  ROOT: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  LOGOUT: '/logout',

  // SENIOR
  SENIOR_HOME: '/senior',
  SENIOR_CONNECT: '/senior/connect',
  SENIOR_APPS: '/senior/applications',

  // MANAGER
  MANAGER_HOME: '/manager',

  // SHELTER
  SHELTER_HOME: '/shelter',
  SHELTER_ANIMALS: '/shelter/animals',
  SHELTER_ANIMAL_NEW: '/shelter/animals/new',
  SHELTER_ANIMAL_APPS: '/shelter/animals/:animalId/applications',

  // COMMON (Pet)
  PET_APPLY: '/pet/:petId/apply',        // ⭐ 신청 페이지 (필수)
  PET_CONNECT: '/pet/:petId/connect',    // ⭐ 특정 동물 연결/확인 (파라미터 버전)
  PET_CONNECT_LEGACY: '/pet/connect',    // (선택) 레거시 경로 유지 시
  PET_MANAGERS: '/pet/:petId/managers',
};

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
  if (!user) {
    return <Navigate to={`${PATHS.LOGIN}?from=${encodeURIComponent(loc.pathname)}`} replace />;
  }
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
          <Route
            path={PATHS.SENIOR_APPS}
            element={
              <Protected allow={['SENIOR']}>
                <SeniorApplicationsPage />
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
            path={PATHS.SHELTER_ANIMALS}
            element={
              <Protected allow={['SHELTER']}>
                <ShelterAnimalsPage />
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
          <Route
            path={PATHS.SHELTER_ANIMAL_APPS}
            element={
              <Protected allow={['SHELTER']}>
                <ShelterApplicationsPage />
              </Protected>
            }
          />

          {/* 공용(로그인 필요) */}
          <Route
            path={PATHS.PET_APPLY}
            element={
              <Protected allow={['SENIOR']}>
                <ApplyPage />
              </Protected>
            }
          />
          <Route
            path={PATHS.PET_CONNECT}
            element={
              <Protected allow={['SENIOR', 'SHELTER', 'MANAGER']}>
                <PetConnectPage />
              </Protected>
            }
          />
          {/* (선택) 과거 링크 호환 */}
          <Route
            path={PATHS.PET_CONNECT_LEGACY}
            element={
              <Protected allow={['SENIOR', 'SHELTER', 'MANAGER']}>
                <PetConnectPage />
              </Protected>
            }
          />
          <Route
            path={PATHS.PET_MANAGERS}
            element={
              <Protected allow={['SENIOR']}>
                <PetManagerRecoPage />
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
