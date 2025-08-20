// src/api/manager.js
import api, { logApiError } from './apiClient';

/** 유틸: 배열이면 Page로 감싸기 */
const wrapPage = (arr, { page = 0, size = 20 } = {}) => ({
  content: Array.isArray(arr) ? arr : [],
  number: page,
  size,
  totalElements: Array.isArray(arr) ? arr.length : 0,
  totalPages: 1,
  first: true,
  last: true,
  empty: !arr || arr.length === 0,
});

/** ===============================
 *  큐(배정/대기 목록)
 *  =============================== */
/**
 * 매니저 큐 조회
 * - 기본 엔드포인트: GET /manager/applications
 *   query: status(PENDING|IN_PROGRESS|FORWARDED|APPROVED|REJECTED|ALL), page, size, unassigned
 * - 구버전/대안: GET /applications/for-manager (status, page, size, unassigned)
 */
export async function fetchManagerQueue({
  status = 'ALL',
  page = 0,
  size = 20,
  onlyUnassigned = false,
  signal,
} = {}) {
  const params = { page, size };
  if (status && status !== 'ALL') params.status = status;
  if (onlyUnassigned) params.unassigned = true;

  try {
    const { data } = await api.get('/manager/applications', { params, signal });
    if (Array.isArray(data)) return wrapPage(data, { page, size });
    return data;
  } catch (err) {
    // 구버전/대안으로 한 번 더 시도
    try {
      const { data } = await api.get('/applications/for-manager', { params, signal });
      if (Array.isArray(data)) return wrapPage(data, { page, size });
      return data;
    } catch (e2) {
      // 데모 폴백
      const demo = JSON.parse(localStorage.getItem('mgr_queue_demo') || '[]');
      return wrapPage(demo, { page, size });
    }
  }
}

/** ===============================
 *  배정/소유권(락) 액션
 *  =============================== */
/**
 * 배정 수락(내가 가져오기)
 * 우선순위: /manager/applications/{id}/accept -> /manager/applications/{id}/take
 */
export async function acceptAssignment(id, { signal } = {}) {
  try {
    const { data } = await api.post(`/manager/applications/${id}/accept`, null, { signal });
    return data;
  } catch (err1) {
    try {
      const { data } = await api.post(`/manager/applications/${id}/take`, null, { signal });
      return data;
    } catch (err2) {
      logApiError?.(err2);
      // 데모 폴백: 로컬 큐에서 제거
      const demo = JSON.parse(localStorage.getItem('mgr_queue_demo') || '[]').filter(x => x.id !== id);
      localStorage.setItem('mgr_queue_demo', JSON.stringify(demo));
      throw err2;
    }
  }
}

/**
 * 배정 거절(내려놓기)
 * 우선순위: /manager/applications/{id}/decline -> /manager/applications/{id}/release
 */
export async function declineAssignment(id, { signal } = {}) {
  try {
    const { data } = await api.post(`/manager/applications/${id}/decline`, null, { signal });
    return data;
  } catch (err1) {
    try {
      const { data } = await api.post(`/manager/applications/${id}/release`, null, { signal });
      return data;
    } catch (err2) {
      logApiError?.(err2);
      // 데모 폴백: 로컬 큐에서 제거
      const demo = JSON.parse(localStorage.getItem('mgr_queue_demo') || '[]').filter(x => x.id !== id);
      localStorage.setItem('mgr_queue_demo', JSON.stringify(demo));
      throw err2;
    }
  }
}

/** 별칭(다른 페이지에서 쓰는 이름과 호환) */
export const takeApplication = (id, opts) => acceptAssignment(id, opts);
export const releaseApplication = (id, opts) => declineAssignment(id, opts);
export const claimApplication = (id, opts) => acceptAssignment(id, opts);
export const unclaimApplication = (id, opts) => declineAssignment(id, opts);

/** 보호소로 전달(매니저 검토 완료) */
export async function forwardToShelter(id, payload = {}, { signal } = {}) {
  try {
    const { data } = await api.post(`/manager/applications/${id}/forward`, payload, { signal });
    return data;
  } catch (err) {
    logApiError?.(err);
    throw err;
  }
}

/** 예약/메모 간단 업데이트 (공용 PATCH) */
export async function updateApplicationLite(applicationId, payload, { signal } = {}) {
  try {
    const { data } = await api.patch(`/applications/${applicationId}`, payload, { signal });
    return data;
  } catch (e) {
    logApiError?.(e);
    throw e;
  }
}

/** 방문/케어 완료 표시 */
export async function completeApplication(applicationId, { signal } = {}) {
  try {
    const { data } = await api.post(`/applications/${applicationId}/complete`, null, { signal });
    return data;
  } catch (e) {
    logApiError?.(e);
    throw e;
  }
}

/** ===============================
 *  매니저 프로필
 *  =============================== */
/** 로드: /managers/me/profile -> 폴백 localStorage */
export async function loadMyProfile({ signal } = {}) {
  try {
    const { data } = await api.get('/managers/me/profile', { signal });
    return data;
  } catch {
    // 폴백
    return JSON.parse(localStorage.getItem('mgr_profile') || 'null') || {
      days: [],
      timeRange: { start: '09:00', end: '18:00' },
      zones: [],
      memo: '',
    };
  }
}

/** 저장: /managers/me/profile -> 폴백 localStorage */
export async function saveMyProfile(payload, { signal } = {}) {
  try {
    const { data } = await api.patch('/managers/me/profile', payload, { signal });
    return data;
  } catch {
    // 폴백
    localStorage.setItem('mgr_profile', JSON.stringify(payload));
    return payload;
  }
}
