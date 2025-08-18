// src/pages/auth/SignupPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import Button from '../../components/ui/Button';
import FormField from '../../components/common/FormField';
import { fetchCareNames } from '../../api/shelters';
import './auth.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const roleParam = (params.get('role') || sessionStorage.getItem('selectedRole') || 'SENIOR').toUpperCase();
  const [role] = useState(roleParam);

  // ===== form states =====
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [affiliation, setAffiliation] = useState(''); // SHELTER 소속 선택값
  const [error, setError] = useState('');

  // 보호소 드롭다운 옵션
  const [careList, setCareList] = useState([]);
  const [loadingCare, setLoadingCare] = useState(false);

  // ===== validations =====
  const minLen = 8;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isInvalidEmail = useMemo(() => !!email && !emailRegex.test(email), [email]);
  const isMismatch = useMemo(() => confirm.length > 0 && password !== confirm, [password, confirm]);
  const isWeak = useMemo(() => !!password && password.length < minLen, [password]);

  const isAffiliationRequired = role === 'SHELTER';

  // 보호소 드롭다운 옵션 로드
  useEffect(() => {
    if (!isAffiliationRequired) return;
    (async () => {
      setLoadingCare(true);
      try {
        const names = await fetchCareNames(); // shelters.js: 전용 엔드포인트→폴백까지 처리됨
        setCareList(names || []);
        // 이전 선택 복구
        const saved = localStorage.getItem('selectedCareNm');
        if (saved && names?.includes(saved)) setAffiliation(saved);
      } catch {
        // 무시
      } finally {
        setLoadingCare(false);
      }
    })();
  }, [isAffiliationRequired]);

  const disabled =
    !email ||
    !password ||
    !confirm ||
    isInvalidEmail ||
    isMismatch ||
    isWeak ||
    (isAffiliationRequired && !affiliation);

  // ===== submit =====
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isInvalidEmail) return setError('올바른 이메일 형식을 입력하세요.');
    if (isWeak) return setError(`비밀번호는 ${minLen}자리 이상이어야 합니다.`);
    if (isMismatch) return setError('비밀번호가 일치하지 않습니다.');
    if (isAffiliationRequired && !affiliation) return setError('보호소를 선택하세요.');

    // 서버에 맞는 최소 필드만 전송
    const payload = {
      email: email.trim(),
      password,
      role,
      ...(isAffiliationRequired ? { affiliation } : {}),
    };

    try {
      await api.post('/auth/signup', payload);
      // UX용 저장(선택): 다음 로그인 페이지에서 선택 역할/소속 복원
      sessionStorage.setItem('selectedRole', role);
      if (isAffiliationRequired) {
        sessionStorage.setItem('affiliation', affiliation);
        localStorage.setItem('selectedCareNm', affiliation);
      }
      alert('회원가입이 완료되었습니다. 로그인 해주세요.');
      navigate(`/login?role=${role}`);
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        '회원가입 실패';
      setError(msg);
    }
  };

  return (
    <div className="auth auth--center">
      <div className="auth__card">
        <h1 className="auth__title">회원가입</h1>
        <p style={{ margin: '0 0 8px', color: '#667085', fontSize: 14 }}>
          선택된 역할: {role === 'SENIOR' ? '고령자' : role === 'MANAGER' ? '펫매니저' : '보호소 관리자'}
        </p>

        {error && <div className="auth__error">{error}</div>}

        <form onSubmit={onSubmit} className="auth__form">
          <FormField
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={isInvalidEmail ? '올바른 이메일 형식이 아닙니다.' : ''}
          />

          <FormField
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            hint={`※ 비밀번호는 ${minLen}자리 이상 입력하세요.`}
            error={isWeak ? `비밀번호는 ${minLen}자리 이상이어야 합니다.` : ''}
          />

          <FormField
            label="비밀번호 확인"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            error={isMismatch ? '비밀번호가 일치하지 않습니다.' : ''}
          />

          {/* SHELTER 전용: 보호소 드롭다운 */}
          {role === 'SHELTER' && (
            <div className="form-field">
              <label className="form-field__label">보호소 선택</label>
              <div className="form-field__control">
                <select
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  disabled={loadingCare}
                  required
                >
                  <option value="">선택하세요</option>
                  {careList.map((nm) => (
                    <option key={nm} value={nm}>{nm}</option>
                  ))}
                </select>
                {loadingCare && <div className="hint">보호소 목록을 불러오는 중…</div>}
              </div>
            </div>
          )}

          <Button
            presetName="primary"
            type="submit"
            disabled={disabled}
            className="auth__submit auth__submit--primary"
          >
            회원가입
          </Button>
        </form>
      </div>
    </div>
  );
}
