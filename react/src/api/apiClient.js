import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  // withCredentials: true, // 쿠키 인증 쓸 때만 주석 해제
})

// 요청: 토큰 자동 주입
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 응답: 에러 포맷 통일 + 401 처리
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    // 서버가 내려준 표준 에러 형태 우선
    const std = error?.response?.data?.error
    const message =
      std?.message ||
      error?.response?.data?.message ||
      error?.message ||
      '요청 중 오류가 발생했어요.'

    // 401: 토큰 만료/인증 실패
    if (status === 401) {
      localStorage.clear()
      // location.href = '/login' // 필요하면 활성화
    }

    // 프론트에서 일관되게 쓰도록 포맷 고정
    return Promise.reject({
      status,
      code: std?.code || 'UNKNOWN',
      message,
      details: std?.details || error?.response?.data || null,
      raw: error,
    })
  }
)

export default api
// .