// src/api/apiClient.js
import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

const authClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

const ACCESS_KEY = 'token';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

/** 현재 사용자 객체(로컬스토리지) */
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setAuth = ({ accessToken, refreshToken, user } = {}) => {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
};

// ====== 요청 인터셉터: Bearer + X-MOCK-SENIOR-ID ======
api.interceptors.request.use((config = {}) => {
  if (config.__noAuth) return config;

  // 1) 토큰
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // 2) 개발용 seniorId 헤더 (백엔드 @RequestHeader("X-MOCK-SENIOR-ID") 훅)
  //    필요 없으면 아래 블록을 지우거나 주석 처리하면 됨.
  if (!config.__noMockHeader) {
    const me = getCurrentUser();
    const userId = me?.seniorId ?? me?.id ?? null;
    if (userId != null) {
      config.headers = config.headers || {};
      // 중복 설정 방지
      if (!config.headers['X-MOCK-SENIOR-ID']) {
        config.headers['X-MOCK-SENIOR-ID'] = String(userId);
      }
    }
  }

  return config;
});

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (newAccessToken) => {
  refreshSubscribers.forEach((cb) => cb(newAccessToken));
  refreshSubscribers = [];
};
const addRefreshSubscriber = (cb) => refreshSubscribers.push(cb);

const callRefreshToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');

  const { data } = await authClient.post('/auth/refresh', { refreshToken });
  const newAccessToken = data?.token || data?.accessToken;
  const newRefreshToken = data?.refreshToken || refreshToken;
  if (!newAccessToken) throw new Error('INVALID_REFRESH_RESPONSE');

  setAuth({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  return newAccessToken;
};

const normalizeError = (error) => {
  const status = error?.response?.status;
  const std = error?.response?.data?.error;
  const message =
    std?.message ||
    error?.response?.data?.message ||
    error?.message ||
    '요청 중 오류가 발생했어요.';
  return {
    status,
    code: std?.code || 'UNKNOWN',
    message,
    details: std?.details || error?.response?.data || null,
    raw: error,
  };
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;

    // __noAuth 호출은 바로 에러 반환
    if (status === 401 && originalRequest.__noAuth) {
      return Promise.reject(normalizeError(error));
    }

    // 401: 토큰 갱신 시도
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((newToken) => {
            try {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              originalRequest._retry = true;
              resolve(api(originalRequest));
            } catch (e) {
              reject(normalizeError(e));
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const newToken = await callRefreshToken();
        isRefreshing = false;
        onRefreshed(newToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        const norm = normalizeError(refreshErr);
        try { clearAuth(); } catch {}
        const here = typeof window !== 'undefined' ? window.location.pathname : '/';
        if (typeof window !== 'undefined') {
          window.location.assign(`/login?from=${encodeURIComponent(here)}&expired=1`);
        }
        return Promise.reject(norm);
      }
    }

    // 기타 401
    if (status === 401) {
      const norm = normalizeError(error);
      try { clearAuth(); } catch {}
      const here = typeof window !== 'undefined' ? window.location.pathname : '/';
      if (typeof window !== 'undefined') {
        window.location.assign(`/login?from=${encodeURIComponent(here)}&expired=1`);
      }
      return Promise.reject(norm);
    }

    return Promise.reject(normalizeError(error));
  }
);

// 업로드 헬퍼
export const apiUpload = (url, formData, config = {}) => {
  const cfg = { ...config, headers: { ...(config.headers || {}) } };
  delete cfg.headers['Content-Type'];
  return api.post(url, formData, cfg);
};

export const logApiError = (err) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('API Error:', {
      status: err?.status,
      code: err?.code,
      message: err?.message,
      details: err?.details,
    });
  }
};

export default api;
