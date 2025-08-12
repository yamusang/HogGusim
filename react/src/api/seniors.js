import api from './apiClient'

// 매칭 알고리즘 기반 고령자 추천
export const fetchRecommendedSeniors = ({ managerId, page = 1, size = 10 }) =>
  api.get('/seniors/match', { params: { managerId, page, size } }).then(r => r.data)
