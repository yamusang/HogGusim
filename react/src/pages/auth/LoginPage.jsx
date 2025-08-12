import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/apiClient';
import Button from '../../components/ui/Button';
import FormField from '../../components/common/FormField';
import './auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  // 이메일 정규식
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isInvalidEmail = useMemo(() => email && !emailRegex.test(email), [email]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // 중복 제출 방지
    setErr('');

    // 클라이언트 측 사전검증
    if (!email) return setErr('이메일을 입력하세요.');
    if (isInvalidEmail) return setErr('올바른 이메일 형식을 입력하세요.');
    if (!password) return setErr('비밀번호를 입력하세요.');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: email.trim(), password });
      localStorage.setItem('token', data.token);
      if (data.role) localStorage.setItem('role', data.role);

      if (data.role === 'SENIOR') navigate('/senior');
      else if (data.role === 'SHELTER') navigate('/shelter');
      else if (data.role === 'MANAGER') navigate('/manager');
      else navigate('/');
    } catch (e2) {
      setErr(e2?.response?.data?.error?.message || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  const disabled = !email || !password || isInvalidEmail || loading;

  return (
    <div className="auth auth--center">
      <div className="auth__card">
        <h1 className="auth__title">로그인</h1>
        {err && <div className="auth__error">{err}</div>}

        <form onSubmit={onSubmit} className="auth__form" noValidate>
          <FormField
            id="email"
            label="이메일"
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
            error={isInvalidEmail ? '올바른 이메일 형식이 아닙니다.' : ''}
          />
          <FormField
            id="pw"
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          <Button
            presetName="login"
            sizeName="lg"
            type="submit"
            loading={loading}
            className="auth__submit"
            disabled={disabled}
          >
            로그인
          </Button>
        </form>

        <div className="auth__footer">
          아직 계정이 없나요? <Link to="/signup" className="auth__link">회원가입</Link>
        </div>
      </div>
    </div>
  );
}
