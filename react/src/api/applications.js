// src/api/applications.js
import api, { logApiError } from './apiClient';

/** 공통 페이지 변환 (Spring Data Page 호환) */
const toPage = (data, { page = 0, size = 20 } = {}) => {
  const content = Array.isArray(data?.content) ? data.content : [];
  const total = Number.isFinite(data?.totalElements) ? data.totalElements : content.length;
  const number = Number.isFinite(data?.number) ? data.number : page;
  const _size = Number.isFinite(data?.size) ? data.size : size;

  const totalPages =
    Number.isFinite(data?.totalPages) ? data.totalPages : (total > 0 ? Math.ceil(total / _size) : 0);

  return {
    content,
    number,         // 0-based
    size: _size,
    totalElements: total,
    totalPages,
    first: data?.first ?? number === 0,
    last: data?.last ?? (number >= totalPages - 1 && totalPages > 0),
    empty: data?.empty ?? content.length === 0,
  };
};

/* ───────────────────────
 * Senior(고령자)
 * ─────────────────────── */
export const fetchMyApplications = async ({ seniorId, page = 0, size = 10, signal } = {}) => {
  const { data } = await api.get(`/applications/by-senior/${seniorId}`, {
    params: { page, size },
    signal,
  });
  return toPage(data, { page, size });
};

export const cancelApplication = async (applicationId, { signal } = {}) => {
  const { data } = await api.post(`/applications/${applicationId}/cancel`, null, { signal });
  return data;
};

/* ───────────────────────
 * Shelter(보호소)
 * ─────────────────────── */
export const listApplicationsByShelter = async ({ careNm, status, page = 0, size = 20, signal } = {}) => {
  const params = { page, size };
  if (careNm) params.careNm = careNm;
  if (status) params.status = status; // PENDING | APPROVED | REJECTED
  const { data } = await api.get('/applications', { params, signal });
  return toPage(data, { page, size });
};

export const approveApplication = async (applicationId, { signal } = {}) => {
  const { data } = await api.post(`/applications/${applicationId}/approve`, null, { signal });
  return data;
};

export const rejectApplication = async (applicationId, { signal } = {}) => {
  const { data } = await api.post(`/applications/${applicationId}/reject`, null, { signal });
  return data;
};

/* ✅ 예약일/메모 등 부분 수정 */
export const updateApplication = async (applicationId, payload = {}, { signal } = {}) => {
  try {
    const { data } = await api.patch(`/applications/${applicationId}`, payload, { signal });
    return data;
  } catch (err) {
    logApiError?.(err);
    throw err;
  }
};

/* ───────────────────────
 * Pet(동물) 단위
 * ─────────────────────── */
export const listByPet = async (animalId, { page = 0, size = 20, signal } = {}) => {
  const { data } = await api.get(`/applications/by-pet/${animalId}`, { params: { page, size }, signal });
  return toPage(data, { page, size });
};

/* ───────────────────────
 * 공통: 신청 생성
 * ─────────────────────── */
export const createApplication = async (payload, { signal } = {}) => {
  // 기대 payload: { seniorId, animalId, type, memo, meta? }
  try {
    const { data } = await api.post('/applications', payload, { signal });
    return data;
  } catch (err) {
    logApiError?.(err);
    throw err;
  }
};
