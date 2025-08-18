// src/api/dashboard.js
import api from './apiClient';

// 대시보드: 보호소 내 등록 현황 + 최근 목록
export const fetchShelterOverview = async ({ from, to } = {}) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await api.get('/shelters/me/overview', { params });
  return data; // { counts: {...}, recent: [...] }
};

// 폴백: /pets 목록을 받아 프론트에서 집계
export const computeOverviewFromPets = (pets = []) => {
  const counts = pets.reduce((acc, p) => {
    const k = (p.status || 'UNKNOWN').toUpperCase();
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const recent = [...pets]
    .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
    .slice(0, 10);
  return { counts, recent };
};
