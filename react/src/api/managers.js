import api, { logApiError } from './apiClient';

export const fetchManagerQueue = async ({
  page = 0,
  size = 20,
  status,        
  onlyUnassigned,  
  signal,
} = {}) => {
  const params = { page, size };
  if (status && status !== 'ALL') params.status = status;
  if (onlyUnassigned) params.unassigned = true; 

  const { data } = await api.get('/applications/for-manager', { params, signal });

  return data;
};

export const claimApplication = async (applicationId, { signal } = {}) => {
  try {
    const { data } = await api.post(`/applications/${applicationId}/claim`, null, { signal });
    return data;
  } catch (e) {
    logApiError?.(e);
    throw e;
  }
};

export const unclaimApplication = async (applicationId, { signal } = {}) => {
  try {
    const { data } = await api.post(`/applications/${applicationId}/unclaim`, null, { signal });
    return data;
  } catch (e) {
    logApiError?.(e);
    throw e;
  }
};


export const updateApplicationLite = async (applicationId, payload, { signal } = {}) => {
  try {
    const { data } = await api.patch(`/applications/${applicationId}`, payload, { signal });
    return data;
  } catch (e) {
    logApiError?.(e);
    throw e;
  }
};

export const completeApplication = async (applicationId, { signal } = {}) => {
  try {
    const { data } = await api.post(`/applications/${applicationId}/complete`, null, { signal });
    return data;
  } catch (e) {
    logApiError?.(e);
    throw e;
  }
};
