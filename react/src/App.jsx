import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/base.css';
import AuthProvider from './contexts/AuthContext';

import MainPage from './pages/MainPage/MainPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

function Placeholder({ title }) {
  return <div className="container" style={{ padding: '24px 0' }}>{title}</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route path="/senior" element={<Placeholder title="SeniorPage" />} />
          <Route path="/manager" element={<Placeholder title="ManagerPage" />} />
          <Route path="/shelter" element={<Placeholder title="ShelterPage" />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
