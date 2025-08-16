import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import useAuth from './hooks/useAuth';

// pages
import MainPage from './pages/MainPage/MainPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import SeniorPage from './pages/senior/SeniorPage';
import ConnectPage from './pages/senior/ConnectPage';
import ManagerPage from './pages/manager/ManagerPage';
import ShelterPage from './pages/shelter/ShelterPage';
import PetConnectPage from './pages/pet/PetConnectPage';
import LogoutPage from './pages/auth/LogoutPage'; // ✅ 분리한 로그아웃 사용

// ── Guards
function Protected({ children, allow }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return children;

  if (user.role === 'SENIOR')  return <Navigate to="/senior" replace />;
  if (user.role === 'MANAGER') return <Navigate to="/manager" replace />;
  if (user.role === 'SHELTER') return <Navigate to="/shelter" replace />;
  return <Navigate to="/" replace />;
}

// ── App
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

          {/* 공용 */}
          <Route
            path="/pet/connect"
            element={
              <Protected allow={['SENIOR', 'SHELTER', 'MANAGER']}>
                <PetConnectPage />
              </Protected>
            }
          />

          {/* 로그아웃 */}
          <Route path="/logout" element={<LogoutPage />} />

          {/* 기타 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
