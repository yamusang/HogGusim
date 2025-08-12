import React, { useState } from 'react';
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      if (data.role) localStorage.setItem('role', data.role);

      // role이 있으면 역할별 페이지로 이동
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

  return (
    <div className="auth auth--center">
      <div className="auth__card">
        <h1 className="auth__title">로그인</h1>
        {err && <div className="auth__error">{err}</div>}

        <form onSubmit={onSubmit} className="auth__form">
          <FormField
            id="email"
            label="이메일"
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />
          <FormField
            id="pw"
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          <Button presetName="login" sizeName="lg" type="submit" loading={loading} className="auth__submit">
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
