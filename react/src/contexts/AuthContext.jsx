import React, { createContext, useEffect, useMemo, useState } from 'react';
import api, { setAuth, clearAuth } from '../api/apiClient';

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
        // SHELTER면 affiliation 폴백
        if (parsed?.role === 'SHELTER' && !parsed?.affiliation) {
          const aff =
            localStorage.getItem('selectedCareNm') ||
            sessionStorage.getItem('affiliation') ||
            '';
          if (aff) parsed.affiliation = aff;
        }
        setUser(parsed);
      }
    } catch {}
    setLoading(false);
  }, []);

  // 응답 → 표준화
  const normalizeUser = (data) => {
    const roleUpper = (data?.role || '').toUpperCase();

    const careRegNo =
      data?.careRegNo ??
      data?.care_reg_no ??
      data?.shelter?.careRegNo ??
      null;

    // (A안) shelterId 미사용. 그래도 혹시 내려오면 보존만.
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
      shelterId,            // 보존만, 실제 필터는 affiliation(careNm)로
      careRegNo,
      affiliation: affiliationText, // ★ 핵심
      orgNm: data?.orgNm ?? null,
    };

    // SHELTER 폴백
    if (u.role === 'SHELTER' && !u.affiliation) {
      const aff =
        localStorage.getItem('selectedCareNm') ||
        sessionStorage.getItem('affiliation') ||
        '';
      if (aff) u.affiliation = aff;
    }
    return u;
  };

  const login = async (email, password, role) => {
    const payload = { email, password };
    if (role) payload.role = role;

    const { data } = await api.post('/auth/login', payload);
    const u = normalizeUser(data);

    if (!u.token) throw new Error('로그인 응답에 토큰이 없습니다.');
    if (!u.role) throw new Error('로그인 응답에 역할이 없습니다.');

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
    clearAuth();
    localStorage.removeItem('selectedCareNm');
    sessionStorage.removeItem('affiliation');
    sessionStorage.removeItem('selectedRole');
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, setUser, login, logout, loading }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
