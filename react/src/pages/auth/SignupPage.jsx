// src/pages/auth/SignupPage.jsx
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import Button from '../../components/ui/Button';
import FormField from '../../components/common/FormField';
import CareNmDropdown from '../../components/shelter/CareNmDropdown';
import './auth.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const roleParam = (params.get('role') || sessionStorage.getItem('selectedRole') || 'SENIOR').toUpperCase();
  const [role] = useState(roleParam);

  // 공통
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // SENIOR 전용
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // SHELTER 전용
  const [affiliation, setAffiliation] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const minLen = 8;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9\-+()\s]{9,20}$/; // 간단 검증

  const isInvalidEmail = useMemo(() => !!email && !emailRegex.test(email), [email]);
  const isMismatch = useMemo(() => confirm.length > 0 && password !== confirm, [password, confirm]);
  const isWeak = useMemo(() => !!password && password.length < minLen, [password]);

  const isSenior = role === 'SENIOR';
  const isAffiliationRequired = role === 'SHELTER';

  // 버튼 비활성 조건
  const disabled =
    loading ||
    !email ||
    !password ||
    !confirm ||
    isInvalidEmail ||
    isMismatch ||
    isWeak ||
    (isAffiliationRequired && !affiliation) ||
    (isSenior && (!phoneNumber || !address || !emergencyContact));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    // 공통 검증
    if (isInvalidEmail) return setError('올바른 이메일 형식을 입력하세요.');
    if (isWeak) return setError(`비밀번호는 ${minLen}자리 이상이어야 합니다.`);
    if (isMismatch) return setError('비밀번호가 일치하지 않습니다.');

    // 역할별 추가 검증
    if (isAffiliationRequired && !affiliation) return setError('보호소를 선택하세요.');
    if (isSenior) {
      if (!phoneRegex.test(phoneNumber)) return setError('연락처 형식을 확인해 주세요. (예: 010-1234-5678)');
      if (address.trim().length < 3) return setError('주소를 정확히 입력해 주세요.');
      if (!phoneRegex.test(emergencyContact)) return setError('비상연락망(전화번호) 형식을 확인해 주세요.');
    }

    // 요청 payload
    const payload = {
      email: email.trim(),
      password,
      role,
      ...(isAffiliationRequired ? { affiliation } : {}),
      ...(isSenior ? {
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
      } : {}),
    };

    setLoading(true);
    try {
      await api.post('/auth/signup', payload);
      sessionStorage.setItem('selectedRole', role);
      if (isAffiliationRequired) {
        sessionStorage.setItem('affiliation', affiliation);
        localStorage.setItem('selectedCareNm', affiliation);
      }
      alert('회원가입이 완료되었습니다. 로그인 해주세요.');
      navigate(`/login?role=${role}`, { replace: true });
    } catch (err) {
      const status = err?.status || err?.response?.status;
      if (status === 409) {
        setError('이미 가입된 이메일입니다. 다른 이메일로 진행하거나 로그인하세요.');
      } else {
        const msg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          '회원가입 실패';
        setError(msg);
      }
    } finally {
      setLoading(false);
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

        <form onSubmit={onSubmit} className="auth__form" noValidate>
          {/* 공통 입력 */}
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

          {/* SENIOR 전용 필드 */}
          {isSenior && (
            <>
              <FormField
                label="연락처"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                hint="예) 010-1234-5678"
              />
              <FormField
                label="주소"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                hint="예) 부산광역시 ○○구 ○○동 …"
              />
              <FormField
                label="비상연락망"
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                required
                hint="예) 가족/지인 연락처"
              />
            </>
          )}

          {/* SHELTER 전용 필드 (드롭다운) */}
          {isAffiliationRequired && (
            <div className="form-field">
              <CareNmDropdown
                value={affiliation}
                onChange={setAffiliation}
                required
                allowFreeInput={true}   // 필요 시 false로
                placeholder="보호소명 검색"
              />
            </div>
          )}

          <Button
            presetName="primary"
            type="submit"
            disabled={disabled}
            loading={loading}
            className="auth__submit auth__submit--primary"
          >
            회원가입
          </Button>
        </form>
      </div>
    </div>
  );
}
