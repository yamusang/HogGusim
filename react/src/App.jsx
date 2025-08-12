
import { Routes, Route, Navigate } from 'react-router-dom'

import Header from './components/layout/Header'
import useAuth from './hooks/useAuth'

// pages
import MainPage from './pages/Mainpage/MainPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'          // 없으면 임시 컴포넌트로 대체 가능
import SeniorPage from './pages/senior/SeniorPage'
import ApplyPage from './pages/senior/ApplyPage'
import ConnectPage from './pages/senior/ConnectPage'
import ManagerPage from './pages/manager/ManagerPage'
import ShelterPage from './pages/shelter/ShelterPage'
import PetConnectPage from './pages/pet/PetConnectPage' // 나중에 구현 예정

function Protected({ children, allow }) {
  const { user, loading } = useAuth()
  if (loading) return null                 // 스피너 넣어도 됨
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/" replace />
  return children;
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        {/* 공개 */}
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

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

        {/* 매칭된 반려 상세/연결 */}
        <Route
          path="/pet/:id"
          element={
            <Protected allow={['SENIOR', 'SHELTER', 'MANAGER']}>
              <PetConnectPage />
            </Protected>
          }
        />
      <Route path="/pet/connect" element={<PetConnectPage />} />

        {/* 그 외 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
