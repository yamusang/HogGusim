import api from './apiClient';

export const fetchAnimals = (params) =>
  api.get('/pets', { params }).then((r) => r.data);

export const createAnimal = (payload) =>
  api.post('/pets', payload).then((r) => r.data);

export const uploadPetPhoto = (petId, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post(`/pets/${petId}/photo`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};
