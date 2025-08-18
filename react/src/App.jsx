import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import useAuth from './hooks/useAuth';

// pages
import MainPage from './pages/Mainpage/MainPage'; // ← 실제 폴더명 확인!
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import SeniorPage from './pages/senior/SeniorPage';
import ConnectPage from './pages/senior/ConnectPage';
import ManagerPage from './pages/manager/ManagerPage';
import ShelterPage from './pages/shelter/ShelterPage';
import PetConnectPage from './pages/pet/PetConnectPage';
import LogoutPage from './pages/auth/LogoutPage';
import PetNewPage from './pages/shelter/PetNewPage';

// helpers
const toUpper = (v) => (v || '').toUpperCase();
const routeForRole = (role) => {
  switch (toUpper(role)) {
    case 'SENIOR':  return '/senior';
    case 'MANAGER': return '/manager';
    case 'SHELTER': return '/shelter';
    default:        return '/';
  }
};

// Guards
function Protected({ children, allow }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to={`/login?from=${encodeURIComponent(loc.pathname)}`} replace />;

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
          <Route path="/" element={<MainPage />} />

          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <LoginPage />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/signup"
            element={
              <RedirectIfAuthed>
                <SignupPage />
              </RedirectIfAuthed>
            }
          />

          {/* 로그아웃은 공개 */}
          <Route path="/logout" element={<LogoutPage />} />

          {/* 고령자 */}
          <Route
            path="/senior"
            element={
              <Protected allow={['SENIOR']}>
                <SeniorPage />
              </Protected>
            }
          />
          <Route
            path="/senior/connect"
            element={
              <Protected allow={['SENIOR']}>
                <ConnectPage />
              </Protected>
            }
          />

          {/* 매니저 */}
          <Route
            path="/manager"
            element={
              <Protected allow={['MANAGER']}>
                <ManagerPage />
              </Protected>
            }
          />

          {/* 보호소 */}
          <Route
            path="/shelter"
            element={
              <Protected allow={['SHELTER']}>
                <ShelterPage />
              </Protected>
            }
          />
          <Route
            path="/shelter/pets/new"
            element={
              <Protected allow={['SHELTER']}>
                <PetNewPage />
              </Protected>
            }
          />

          {/* 공용(로그인 필요) */}
          <Route
            path="/pet/connect"
            element={
              <Protected allow={['SENIOR', 'SHELTER', 'MANAGER']}>
                <PetConnectPage />
              </Protected>
            }
          />

          {/* 기타 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
