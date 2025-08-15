import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { Accept: 'application/json' },
  paramsSerializer: (params) => {
    const sp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v == null || v === '') return;
      if (Array.isArray(v)) v.forEach((it) => sp.append(k, it));
      else sp.append(k, v);
    });
    return sp.toString();
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // FormData일 땐 Content-Type 제거 (boundary 자동)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else {
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
  }

  config.headers['Accept-Language'] = 'ko-KR';
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const resp = error?.response;
    const std = resp?.data?.error;
    const status = resp?.status;
    const message =
      std?.message || resp?.data?.message || error?.message || '요청 중 오류가 발생했어요.';

    if (status === 401) {
      // 인증만 정리 (전체 clear는 권장 X)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // window.location.href = '/login';
    }

    // Error 객체에 메타를 붙여 던지기
    const e = new Error(message);
    e.status = status;
    e.code = std?.code || 'UNKNOWN';
    e.details = std?.details || resp?.data || null;
    e.response = resp;
    throw e;
  }
);

export default api;
