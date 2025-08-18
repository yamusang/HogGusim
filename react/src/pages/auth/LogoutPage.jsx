import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { clearAuth } from '../../api/apiClient';

export default function LogoutPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    // 1) 스토리지/토큰 정리
    clearAuth();                             // token/refresh/user 일괄 제거 :contentReference[oaicite:4]{index=4}
    localStorage.removeItem('selectedCareNm');
    sessionStorage.removeItem('affiliation');
    sessionStorage.removeItem('selectedRole');

    // 2) 컨텍스트 비우기
    if (setUser) setUser(null);

    // 3) 메인으로 이동
    navigate('/', { replace: true });
  }, [navigate, setUser]);

  return null;
}
