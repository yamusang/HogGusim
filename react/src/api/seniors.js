// src/api/seniors.js
import api, { logApiError } from './apiClient';

const LS_KEY = 'senior_profile_cache';

export async function getMySeniorProfile(userId) {
  try {
    const { data } = await api.get(`/seniors/${userId}/profile`);
    if (data) localStorage.setItem(LS_KEY, JSON.stringify(data));
    return data;
  } catch (e) {
    // 폴백: 로컬스토리지
    try {
      const cached = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      return cached?.userId === userId ? cached : null;
    } catch {}
    logApiError?.(e);
    return null;
  }
}

export async function upsertMySeniorProfile(userId, payload) {
  const body = { userId, ...payload };
  try {
    const { data } = await api.post(`/seniors/${userId}/profile`, body);
    localStorage.setItem(LS_KEY, JSON.stringify(data || body));
    return data || body;
  } catch (e) {
    // 폴백 저장
    localStorage.setItem(LS_KEY, JSON.stringify(body));
    logApiError?.(e);
    return body;
  }
}
