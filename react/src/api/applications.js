// src/api/applications.js
import api from './apiClient';

/** 신청 생성 */
export const createApplication = (payload) =>
  api.post('/api/applications', payload).then(r => r.data);

/** 내 신청 목록 (1순위: /me, 폴백: seniorId 파라미터) */
export const fetchMyApplications = async ({ seniorId, page = 0, size = 10 } = {}) => {
  try {
    const { data } = await api.get('/api/applications/me', { params: { page, size } });
    return data;
  } catch (_) {
    // 백엔드에 /me 없으면 seniorId 쿼리로 폴백
    const { data } = await api.get('/api/applications', { params: { seniorId, page, size } });
    return data;
  }
};

/** 특정 동물의 신청 목록 (보호소/관리 화면) */
export const listByPet = (animalId, page = 0, size = 10) =>
  api.get(`/api/animals/${animalId}/applications`, { params: { page, size } })
     .then(r => r.data);

/** 시니어 취소 */
export const cancelApplication = (appId) =>
  api.post(`/api/applications/${appId}/cancel`).then(r => r.data);

/** 보호소 승인/거절 */
export const approveApplication = (appId) =>
  api.post(`/api/applications/${appId}/approve`).then(r => r.data);

export const rejectApplication = (appId) =>
  api.post(`/api/applications/${appId}/reject`).then(r => r.data);
