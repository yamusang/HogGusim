// src/pages/auth/LogoutPage.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { clearAuth } from '../../api/apiClient';

export default function LogoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  useEffect(() => {
    // 1) 스토리지/토큰 정리
    try {
      clearAuth(); // token/refresh/user 제거
    } catch {}
    try {
      localStorage.removeItem('selectedCareNm');
      sessionStorage.removeItem('affiliation');
      sessionStorage.removeItem('selectedRole');
    } catch {}

    // 2) 컨텍스트 비우기
    setUser?.(null);

    // 3) 목적지 결정 (기본 '/')
    const qs = new URLSearchParams(location.search);
    const to = qs.get('to') || '/';

    // 4) 이동
    navigate(to, { replace: true });
  }, [location.search, navigate, setUser]);

  return null;
}
