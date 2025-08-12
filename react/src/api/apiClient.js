import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 에러 포맷 고정: { error: { code, message, details } }
    const msg = err?.response?.data?.error?.message || err.message
    return Promise.reject({ ...err, message: msg })
  }
);

export default api
