import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AuthProvider from './contexts/AuthContext';
import useAuth from './hooks/useAuth';

import MainPage from './pages/Mainpage/MainPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import SeniorPage from './pages/senior/SeniorPage';
import ApplyPage from './pages/senior/ApplyPage';
import ConnectPage from './pages/senior/ConnectPage';
import ManagerPage from './pages/manager/ManagerPage';
import ShelterPage from './pages/shelter/ShelterPage';
import PetConnectPage from './pages/pet/PetConnectPage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainPage/>} />
          <Route path="/login" element={<LoginPage/>} />
          <Route path="/signup" element={<SignupPage/>} />

          <Route path="/senior" element={<PrivateRoute><SeniorPage/></PrivateRoute>} />
          <Route path="/senior/connect" element={<PrivateRoute><ConnectPage/></PrivateRoute>} />
          <Route path="/pet/:petId/apply" element={<PrivateRoute><ApplyPage/></PrivateRoute>} />

          <Route path="/manager" element={<PrivateRoute><ManagerPage/></PrivateRoute>} />
          <Route path="/shelter" element={<PrivateRoute><ShelterPage/></PrivateRoute>} />
          <Route path="/pet/connect" element={<PrivateRoute><PetConnectPage/></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace/>} />
        </Routes>

        {/* ✅ 전역 토스트 컨테이너 (페이지 전환에도 유지) */}
        <ToastContainer
          position="top-center"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable={false}
          theme="light"
          limit={1}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
