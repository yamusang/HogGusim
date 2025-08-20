// 매니저 전용 API
import api, { logApiError } from './apiClient';

/** 매니저 큐 목록
 * GET /manager/applications
 * query: status(PENDING|IN_PROGRESS|FORWARDED|ALL), page, size
 */
export const fetchManagerQueue = async ({ status = 'ALL', page = 0, size = 20, signal } = {}) => {
  const params = { page, size };
  if (status && status !== 'ALL') params.status = status;
  const { data } = await api.get('/manager/applications', { params, signal });
  // 서버가 Page 포맷이면 그대로 반환, 배열이면 간단 래핑
  if (Array.isArray(data)) {
    return { content: data, number: page, size, totalElements: data.length, totalPages: 1, first: true, last: true, empty: data.length===0 };
  }
  return data;
};

/** 내가 처리 맡기 (락/소유권 획득)
 * POST /manager/applications/{id}/take
 */
export const takeApplication = async (id, { signal } = {}) => {
  const { data } = await api.post(`/manager/applications/${id}/take`, null, { signal });
  return data;
};

/** 맡은 거 내려놓기
 * POST /manager/applications/{id}/release
 */
export const releaseApplication = async (id, { signal } = {}) => {
  const { data } = await api.post(`/manager/applications/${id}/release`, null, { signal });
  return data;
};

/** 보호소로 전달(매니저 검토 완료)
 * POST /manager/applications/{id}/forward
 */
export const forwardToShelter = async (id, payload = {}, { signal } = {}) => {
  try {
    const { data } = await api.post(`/manager/applications/${id}/forward`, payload, { signal });
    return data;
  } catch (err) {
    logApiError?.(err);
    throw err;
  }
};
