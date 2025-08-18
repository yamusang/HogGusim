// src/contexts/AuthContext.jsx
import React, { createContext, useEffect, useMemo, useState } from 'react';
import api, { setAuth, clearAuth } from '../api/apiClient'; // ✅ 토큰 유틸 사용 (일괄 관리) :contentReference[oaicite:0]{index=0}

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 초기 복구
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        // SHELTER인데 affiliation이 없으면 로컬 저장값으로 폴백
        if (parsed?.role === 'SHELTER' && !parsed?.affiliation) {
          const aff =
            localStorage.getItem('selectedCareNm') ||
            sessionStorage.getItem('affiliation') ||
            '';
          if (aff) parsed.affiliation = aff;
        }
        setUser(parsed);
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  // 응답 → 표준 유저 오브젝트로 정리
  const normalizeUser = (data) => {
    const roleUpper = (data?.role || '').toUpperCase();

    const careRegNo =
      data?.careRegNo ??
      data?.care_reg_no ??
      data?.shelter?.careRegNo ??
      null;

    const shelterId =
      data?.shelterId ??
      data?.shelter?.id ??
      careRegNo ??
      (roleUpper === 'SHELTER' ? (data?.id ?? data?.userId ?? null) : null);

    const affiliationText =
      data?.affiliation ??
      data?.careNm ??
      data?.organization ??
      data?.orgNm ??
      null;

    const u = {
      id: data?.id ?? data?.userId ?? null,
      role: roleUpper,
      token: data?.token ?? data?.accessToken ?? null,
      displayName: data?.displayName ?? data?.name ?? null,
      email: data?.email ?? null,
      shelterId,
      careRegNo,
      affiliation: affiliationText,
      orgNm: data?.orgNm ?? null,
    };

    // 폴백: 로컬에 저장된 보호소명
    if (u.role === 'SHELTER' && !u.affiliation) {
      const aff =
        localStorage.getItem('selectedCareNm') ||
        sessionStorage.getItem('affiliation') ||
        '';
      if (aff) u.affiliation = aff;
    }

    return u;
  };

  /**
   * 로그인
   * - login(email, password, role?) 시그 유지 (role은 옵션)
   */
  const login = async (email, password, role) => {
    const payload = { email, password };
    if (role) payload.role = role;

    const { data } = await api.post('/auth/login', payload);
    const u = normalizeUser(data);

    if (!u.token) throw new Error('로그인 응답에 토큰이 없습니다.');

    // ✅ 토큰/유저를 apiClient 유틸로 저장 (재발급 인터셉터와 일관) :contentReference[oaicite:1]{index=1}
    setAuth({
      accessToken: u.token,
      refreshToken: data?.refreshToken,
      user: u,
    });

    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    // ✅ 인증/선택값 일괄 삭제 (apiClient 유틸 + 로컬 키) :contentReference[oaicite:2]{index=2}
    clearAuth();
    localStorage.removeItem('selectedCareNm');
    sessionStorage.removeItem('affiliation');
    sessionStorage.removeItem('selectedRole');
    setUser(null); // 라우팅 가드가 즉시 풀리도록 컨텍스트 먼저 비움
  };

  const value = useMemo(
    () => ({ user, setUser, login, logout, loading }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
