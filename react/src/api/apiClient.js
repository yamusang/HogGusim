// src/api/apiClient.js
import axios from 'axios';

/** =========================
 *  기본 설정
 *  ========================= */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  // withCredentials: true, // 쿠키 인증 시만 사용
});

// 리프레시 전용 클라이언트 (인터셉터 없음)
const authClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

/** =========================
 *  토큰 저장/조회 유틸
 *  ========================= */
const ACCESS_KEY = 'token';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user'; // 선택: 사용자 정보 저장 시

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

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

const addAuthHeader = (config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

/** =========================
 *  요청 인터셉터: 토큰 주입
 *  ========================= */
api.interceptors.request.use((config) => addAuthHeader(config));

/** ==================================================
 *  응답 인터셉터: 에러 표준화 + 401 자동 재발급
 *  - 동시 401 발생 시 요청 큐잉 → 토큰 재발급 후 재시도
 *  ================================================== */
let isRefreshing = false;
let refreshSubscribers = [];

// 재발급 성공 후 큐에 쌓인 요청들 재시도
const onRefreshed = (newAccessToken) => {
  refreshSubscribers.forEach((cb) => cb(newAccessToken));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb) => refreshSubscribers.push(cb);

// 재발급 호출 (엔드포인트/응답키는 백엔드에 맞춰 변경)
const callRefreshToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');

  // 예시: POST /auth/refresh { refreshToken } → { token, refreshToken? }
  const { data } = await authClient.post('/auth/refresh', { refreshToken });
  // 백엔드 스펙에 맞춰 키 이름 조정
  const newAccessToken = data?.token || data?.accessToken;
  const newRefreshToken = data?.refreshToken || refreshToken;

  if (!newAccessToken) throw new Error('INVALID_REFRESH_RESPONSE');

  setAuth({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  return newAccessToken;
};

// 에러 표준화 헬퍼
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
    const originalRequest = error?.config;
    const status = error?.response?.status;

    // 401 처리 (토큰 만료)
    if (status === 401 && !originalRequest?._retry && !originalRequest?.__isRefreshCall) {
      // 리프레시 중이면 큐에 대기 → 완료 후 재시도
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

      // 리프레시 시작
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await callRefreshToken();
        isRefreshing = false;
        onRefreshed(newToken);

        // 실패했던 원요청 재시도
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        // 리프레시 실패 → 전체 로그아웃
        clearAuth();
        // 필요 시 즉시 이동
        // window.location.href = '/login';
        if (import.meta.env.DEV) {
          console.error('Refresh failed:', refreshErr);
        }
        return Promise.reject(normalizeError(refreshErr));
      }
    }

    // 403, 419 등 기타 인증/권한 에러는 그대로 표준화해서 throw
    return Promise.reject(normalizeError(error));
  }
);

/** =========================
 *  업로드 헬퍼 (FormData)
 *  =========================
 *  - json 기본 헤더가 걸려있어도 여기선 자동으로 멀티파트로 바꿈
 */
export const apiUpload = (url, formData, config = {}) => {
  const cfg = { ...config, headers: { ...(config.headers || {}) } };
  delete cfg.headers['Content-Type']; // 브라우저가 boundary 포함하여 자동 설정
  return api.post(url, formData, cfg);
};

/** =========================
 *  개발 편의: 공용 에러 로깅
 *  ========================= */
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

/** =========================
 *  사용 예시
 *  =========================
 *  // 로그인 성공 시
 *  setAuth({ accessToken: data.token, refreshToken: data.refreshToken, user: { role: data.role } });
 *
 *  // 로그아웃 시
 *  clearAuth();
 *
 *  // 파일 업로드
 *  const fd = new FormData();
 *  fd.append('file', file);
 *  await apiUpload(`/pets/${petId}/photo`, fd);
 */
