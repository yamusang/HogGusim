// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuth from './hooks/useAuth'

// pages
import MainPage from './pages/Mainpage/MainPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import SeniorPage from './pages/senior/SeniorPage'
import ApplyPage from './pages/senior/ApplyPage'
import ConnectPage from './pages/senior/ConnectPage'
import ManagerPage from './pages/manager/ManagerPage'
import ShelterPage from './pages/shelter/ShelterPage'
import PetConnectPage from './pages/pet/PetConnectPage'

// 공통 보호 컴포넌트
function Protected({ children, allow }) {
  const { user, loading } = useAuth()
  if (loading) return null // TODO: 스피너 컴포넌트 연결 가능
  if (!user) return <Navigate to="/login" replace />
  if (allow && !allow.includes(user.role)) return <Navigate to="/" replace />
  return children
}

// 이미 로그인되어 있으면 로그인/회원가입 접근 차단
function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return children
  // 역할별 기본 대시보드로
  if (user.role === 'SENIOR') return <Navigate to="/senior" replace />
  if (user.role === 'MANAGER') return <Navigate to="/manager" replace />
  if (user.role === 'SHELTER') return <Navigate to="/shelter" replace />
  return <Navigate to="/" replace />
}

export default function App() {
  return (
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
        path="/senior/apply"
        element={
          <Protected allow={['SENIOR']}>
            <ApplyPage />
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

      {/* 매칭 연결 페이지 (공용) */}
      <Route
        path="/pet/connect"
        element={
          <Protected allow={['SENIOR', 'SHELTER', 'MANAGER']}>
            <PetConnectPage />
          </Protected>
        }
      />

      {/* 그 외 */}
      <Route path="*" element={<Navigate to="/" replace />} />
        {/* 로그아웃 */}
      <Route path="/logout" element={<LogoutPage/>} />
    </Routes>
  )
}
