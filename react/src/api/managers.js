import api, { logApiError } from './apiClient';

// 내 큐(담당 or 미배정 대기)
export const fetchManagerQueue = async ({
  page = 0,
  size = 20,
  status,          // 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'ALL'
  onlyUnassigned,  // true면 미배정만
  signal,
} = {}) => {
  const params = { page, size };
  if (status && status !== 'ALL') params.status = status;
  if (onlyUnassigned) params.unassigned = true; // 백엔드에서 해석(미배정 필터)

  const { data } = await api.get('/applications/for-manager', { params, signal });
  // 백엔드 준비 전에는 /applications 로 바꿔서 managerId로 프론트 필터링해도 됨
  return data;
};

// 신청 Claim (담당자 배정)
export const claimApplication = async (applicationId, { signal } = {}) => {
  try {
    const { data } = await api.post(`/applications/${applicationId}/claim`, null, { signal });
    return data;
  } catch (e) {
    logApiError?.(e);
    throw e;
  }
};

// 신청 Unclaim (담당자 해제)
export const unclaimApplication = async (applicationId, { signal } = {}) => {
  try {
    const { data } = await api.post(`/applications/${applicationId}/unclaim`, null, { signal });
    return data;
  } catch (e) {
    logApiError?.(e);
    throw e;
  }
};

// 예약/메모 업데이트 (기존 shelter에서 쓰던 update 재활용)
export const updateApplicationLite = async (applicationId, payload, { signal } = {}) => {
  // payload: { reservedAt?: ISO, memo?: string }
  try {
    const { data } = await api.patch(`/applications/${applicationId}`, payload, { signal });
    return data;
  } catch (e) {
    logApiError?.(e);
    throw e;
  }
};

// 방문/케어 완료 표시
export const completeApplication = async (applicationId, { signal } = {}) => {
  try {
    const { data } = await api.post(`/applications/${applicationId}/complete`, null, { signal });
    return data;
  } catch (e) {
    logApiError?.(e);
    throw e;
  }
};
