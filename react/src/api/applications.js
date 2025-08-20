// src/api/applications.js
import api, { logApiError } from './apiClient';

/** 공통 페이지 변환 */
const toPage = (data, { page = 0, size = 20 } = {}) => {
  const content = data?.content ?? [];
  const total   = data?.totalElements ?? content.length ?? 0;
  const number  = data?.number ?? page;
  const _size   = data?.size ?? size;
  const totalPages = Math.max(1, Math.ceil(total / _size));
  return { content, total, size: _size, number, totalPages };
};

/* ───────────────────────
 * Senior(고령자)
 * ─────────────────────── */
export const fetchMyApplications = async ({ seniorId, page = 0, size = 10 }) => {
  const { data } = await api.get(`/applications/by-senior/${seniorId}`, {
    params: { page, size },
  });
  return toPage(data, { page, size });
};

export const cancelApplication = async (applicationId) => {
  const { data } = await api.post(`/applications/${applicationId}/cancel`);
  return data;
};

/* ───────────────────────
 * Shelter(보호소)
 * ─────────────────────── */
export const listApplicationsByShelter = async ({ careNm, status, page = 0, size = 20 } = {}) => {
  const params = { careNm, page, size }; // ✅ 서버 필드명 통일
  if (status) params.status = status;    // PENDING | APPROVED | REJECTED
  const { data } = await api.get('/applications', { params });
  return toPage(data, { page, size });
};

export const approveApplication = async (applicationId) => {
  const { data } = await api.post(`/applications/${applicationId}/approve`);
  return data;
};

export const rejectApplication = async (applicationId) => {
  const { data } = await api.post(`/applications/${applicationId}/reject`);
  return data;
};

/* ───────────────────────
 * Pet(동물) 단위
 * ─────────────────────── */
export const listByPet = async (animalId, { page = 0, size = 20 } = {}) => {
  const { data } = await api.get(`/applications/by-pet/${animalId}`, { params: { page, size } });
  return toPage(data, { page, size });
};

/* ───────────────────────
 * 공통: 신청 생성 (ApplyPage, Reco 페이지에서 사용)
 * ─────────────────────── */
export const createApplication = async (payload) => {
  try {
    const { data } = await api.post('/applications', payload);
    return data;
  } catch (err) {
    logApiError?.(err);
    throw err;
  }
};
