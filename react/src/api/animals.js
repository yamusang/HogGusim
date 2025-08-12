import api from './apiClient';

// 동물 목록 (필터/페이지네이션 합의 반영)
export const fetchAnimals = (params) =>
  api.get('/pets', { params }).then((r) => r.data); // { content, page, size, total }

// 동물 등록(보호소)
export const createAnimal = (payload) =>
  api.post('/pets', payload).then((r) => r.data);

// 이미지 업로드
export const uploadAnimalImage = (petId, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post(`/pets/${petId}/photo`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
// 추천(매칭) 리스트: 고령자 전용
export const fetchRecommendedPets = ({ seniorId, page = 1, size = 10 }) =>
  api.get('/pets/match', { params: { seniorId, page, size } }).then(r => r.data);
