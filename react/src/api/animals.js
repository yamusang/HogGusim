// src/api/animals.js
import api from './apiClient';

/** 🔎 동물 목록 (필터/페이지네이션 가능)
 *  ex) fetchAnimals({ available: true, page:1, size:10, sort:'createdAt,DESC' })
 */
export const fetchAnimals = (params = {}) =>
  api.get('/pets', { params }).then((r) => r.data);

/** ⭐ 추천 동물 목록 (SeniorPage에서 사용)
 *  백엔드 경로가 다르면 '/pets/recommended'만 실제 경로로 바꿔줘.
 */
export const fetchRecommendedPets = ({ seniorId, page = 1, size = 10 } = {}) =>
  api
    .get('/pets/recommended', { params: { seniorId, page, size } })
    .then((r) => r.data);

/** 단건 조회 */
export const fetchAnimalById = (petId) =>
  api.get(`/pets/${petId}`).then((r) => r.data);

/** 등록 */
export const createAnimal = (payload) =>
  api.post('/pets', payload).then((r) => r.data);

/** 수정 */
export const updateAnimal = (petId, payload) =>
  api.put(`/pets/${petId}`, payload).then((r) => r.data);

/** 삭제 */
export const deleteAnimal = (petId) =>
  api.delete(`/pets/${petId}`).then((r) => r.data);

/** 사진 업로드 */
export const uploadPetPhoto = (petId, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api
    .post(`/pets/${petId}/photo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};
