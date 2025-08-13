import api from './apiClient'

// 목록 (보호소 필터/페이지네이션)
export const fetchAnimals = (params) =>
  api.get('/pets', { params }).then(r => r.data) // { content, totalElements, ... }

// 단건
export const fetchAnimalById = (id) =>
  api.get(`/pets/${id}`).then(r => r.data)

// 등록
export const createAnimal = (payload) =>
  api.post('/pets', payload).then(r => r.data)

// 수정
export const updateAnimal = (id, payload) =>
  api.put(`/pets/${id}`, payload).then(r => r.data)

// 삭제
export const deleteAnimal = (id) =>
  api.delete(`/pets/${id}`).then(r => r.data)

// 이미지 업로드 (axios가 boundary 자동 세팅)
export const uploadAnimalImage = (petId, file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post(`/pets/${petId}/photo`, fd).then(r => r.data) // { photoUrl }
}

// (옵션) 추천 목록 – 백 경로에 맞춰 사용
export const fetchRecommendedPets = ({ seniorId, page = 1, size = 10 }) =>
  api.get('/pets/match', { params: { seniorId, page, size } }).then(r => r.data)
// 또는 토큰 기반이면 ↓
// export const fetchRecommendedPets = ({ page=1, size=10, ...filters } = {}) =>
//   api.get('/match/senior/recommendations', { params: { page, size, ...filters } })
//     .then(r => r.data)
