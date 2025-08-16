import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth'; // AuthContext 훅

export default function LogoutPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth(); // AuthProvider에서 setUser 노출 필요

  useEffect(() => {
    // 저장된 인증 관련 데이터 삭제
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('selectedRole');

    // context도 초기화
    if (setUser) setUser(null);

    // 메인 페이지로 이동
    navigate('/', { replace: true });
  }, [navigate, setUser]);

  return null;
}
