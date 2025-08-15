import api from './apiClient';

export const createApplication = (payload) =>
  api.post('/applications', payload).then((r) => r.data);

export const myApplications = () =>
  api.get('/applications/me').then((r) => r.data);

export const listByPet = (petId) =>
  api.get(`/pets/${petId}/applications`).then((r) => r.data);

export const approve = (id) =>
  api.post(`/applications/${id}/approve`).then((r) => r.data);

export const reject = (id) =>
  api.post(`/applications/${id}/reject`).then((r) => r.data);
