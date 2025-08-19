// src/api/recommendations.js
import api from './apiClient';

/** 공통 Page 변환 */
const toPage = (res, { page = 0, size = 10 } = {}) => {
  if (Array.isArray(res)) return { content: res, total: res.length, size, number: page };
  const content = res?.content ?? res?.items ?? [];
  const total   = res?.totalElements ?? res?.total ?? content.length ?? 0;
  const number  = res?.number ?? page;
  const _size   = res?.size ?? size;
  return { content, total, size: _size, number };
};

/** 표준화: 추천 펫 */
const normalizePetReco = (it = {}) => {
  const score = it.matchScore ?? it.score ?? it.match_score ?? null;
  return {
    id: it.id ?? it.petId ?? it.animalId ?? null,
    name: it.name ?? it.petName ?? it.animalName ?? '',
    breed: it.breed ?? it.kindCd ?? '',
    energyLevel: it.energyLevel ?? it.energy_level ?? null,
    temperament: it.temperament ?? null,
    photo: it.photoUrl ?? it.popfile ?? it.filename ?? '',
    status: it.status ?? 'AVAILABLE',
    matchScore: typeof score === 'number' ? score : null,
    raw: it,
  };
};

/** 표준화: 추천 매니저 */
const normalizeManagerReco = (it = {}) => {
  const score = it.matchScoreManager ?? it.matchScore ?? it.score ?? null;
  return {
    id: it.id ?? it.managerId ?? null,
    name: it.name ?? it.managerName ?? '',
    elderlyExpLevel: it.elderlyExpLevel ?? it.elderly_exp_level ?? null,
    reliability: it.reliability ?? it.reliabilityScore ?? it.reliability_score ?? null,
    distanceKm: it.distanceKm ?? it.distance_km ?? null,
    matchScoreManager: typeof score === 'number' ? score : null,
    raw: it,
  };
};

/** 표준화: 페어(펫+매니저) */
const normalizePairReco = (it = {}) => ({
  pet: normalizePetReco(it.pet ?? it),
  manager: normalizeManagerReco(it.manager ?? {}),
  pairScore: it.pairScore ?? it.score ?? null,
  raw: it,
});

/** 시니어 → 펫 추천 */
export const getPetsRecommended = async (seniorId, page = 0, size = 10) => {
  const { data } = await api.get('/reco/pets', { params: { seniorId, page, size } });
  const pageData = toPage(data, { page, size });
  return { ...pageData, content: pageData.content.map(normalizePetReco) };
};

/** 특정 동물 → 매니저 추천 */
export const getManagersRecommended = async (seniorId, animalId, page = 0, size = 10) => {
  const { data } = await api.get('/reco/managers', { params: { seniorId, animalId, page, size } });
  const pageData = toPage(data, { page, size });
  return { ...pageData, content: pageData.content.map(normalizeManagerReco) };
};

/** (옵션) 페어 추천 */
export const getPairsRecommended = async (seniorId, page = 0, size = 10) => {
  const { data } = await api.get('/reco/pairs', { params: { seniorId, page, size } });
  const pageData = toPage(data, { page, size });
  return { ...pageData, content: pageData.content.map(normalizePairReco) };
};
