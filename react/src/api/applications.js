import api from './apiClient'

// 신청 생성 (Senior)
export const createApplication = (payload) =>
  api.post('/applications', payload).then(r => r.data)

// 특정 동물의 신청 목록 (Shelter)
export const getApplicationsByPet = (petId) =>
  api.get(`/pets/${petId}/applications`).then(r => r.data)

// 승인/거절 (body 없음)
export const approveApplication = (id) =>
  api.post(`/applications/${id}/approve`).then(r => r.data)
export const rejectApplication = (id) =>
  api.post(`/applications/${id}/reject`).then(r => r.data)

// 내가 신청한 매칭 현황 (Senior, 토큰 기반)
export const fetchMyApplications = () =>
  api.get('/applications/me').then(r => r.data)
// (선호하면 별칭 추가)
// export const getMyApplications = fetchMyApplications
// .
