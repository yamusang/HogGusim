// src/api/recommendations.js
import api, { logApiError } from './apiClient';

export const RecoMode = Object.freeze({
  CONSERVATIVE: 'conservative',
  BALANCED: 'balanced',
  MANAGER: 'manager',
});
export const isValidMode = (m) =>
  m === RecoMode.CONSERVATIVE || m === RecoMode.BALANCED || m === RecoMode.MANAGER;

export const toAbsoluteUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = (api.defaults.baseURL || '').replace(/\/+$/, '');
  const rel  = (`/${String(url)}`).replace(/\/+/, '/');
  return `${base}${rel}`;
};

export function parseReason(reason = '') {
  if (!reason || typeof reason !== 'string') return [];
  return reason
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((chunk) => {
      const m = chunk.match(/(.+)\s+([+-]?\d+(?:\.\d+)?)(?!.*\d)/);
      if (m) return { label: m[1].trim(), delta: Number(m[2]) };
      return { label: chunk, delta: null };
    });
}

export function mapRecoPet(it = {}) {
  const photo = it.photoUrl ?? it.image ?? it.thumbnail ?? it.thumb ?? '';
  const sex = it.sex ?? it.gender ?? '-';
  const neuter = it.neuter ?? it.neutered ?? '-';

  return {
    id: it.id ?? it.desertionNo ?? null,
    desertionNo: it.desertionNo ?? null,
    name: it.name ?? null,
    breed: it.breed ?? it.kind ?? null,
    age: it.age ?? null,
    photoUrl: photo ? toAbsoluteUrl(photo) : null,
    thumbnail: it.thumbnail ? toAbsoluteUrl(it.thumbnail) : null,
    sex: typeof sex === 'string' ? sex : '-',
    neuter: typeof neuter === 'string' ? neuter : '-',
    matchScore: typeof it.matchScore === 'number'
      ? it.matchScore
      : (typeof it.score === 'number' ? it.score : 0),
    reason: it.reason ?? '',
    careName: it.careNm ?? it.careName ?? it.shelterName ?? null,
    temperament: it.temperament ?? null,
    reasonChips: parseReason(it.reason ?? ''),
  };
}

export const isEmptyPage = (page) =>
  !page || !Array.isArray(page.content) || page.content.length === 0;

export const mergePage = (prev, next) => {
  if (!prev) return next;
  if (!next) return prev;
  return { ...next, content: [...(prev.content || []), ...(next.content || [])] };
};

/**
 * ✅ 추천 동물 목록 (Page<RecoPetDto>)
 * getPetsRecommended(seniorId, {mode,page,size}, axiosConfig?)
 * axiosConfig에 signal 전달 가능 (AbortController)
 */
export const getPetsRecommended = async (
  seniorId,
  { mode = RecoMode.BALANCED, page = 0, size = 12 } = {},
  axiosConfig = {}
) => {
  if (!seniorId) throw new Error('INVALID_SENIOR_ID');
  if (!isValidMode(mode)) mode = RecoMode.BALANCED;

  try {
    const { data } = await api.get('/reco/pets', {
      params: { seniorId, mode, page, size },
      ...axiosConfig, // ← 중요: signal 등 전달
    });

    const content = Array.isArray(data?.content) ? data.content.map(mapRecoPet) : [];
    // 페이지 메타 안전 보강
    const number = typeof data?.number === 'number' ? data.number : page;
    const sz = typeof data?.size === 'number' ? data.size : size;
    const totalElements = typeof data?.totalElements === 'number'
      ? data.totalElements
      : content.length;
    const totalPages = typeof data?.totalPages === 'number'
      ? data.totalPages
      : Math.max(1, Math.ceil(totalElements / (sz || 1)));

    return {
      ...data,
      content,
      number,
      size: sz,
      totalElements,
      totalPages,
      first: data?.first ?? number === 0,
      last: data?.last ?? number >= totalPages - 1,
      empty: content.length === 0,
    };
  } catch (err) {
    logApiError?.(err);
    throw err;
  }
};

/** (옵션) 추천 매니저 목록 */
export const getManagersRecommended = async (
  seniorId,
  petId,
  { page = 0, size = 12 } = {},
  axiosConfig = {}
) => {
  if (!seniorId || !petId) throw new Error('INVALID_PARAMS');
  try {
    const { data } = await api.get('/reco/managers', {
      params: { seniorId, petId, page, size },
      ...axiosConfig,
    });
    return data;
  } catch (err) {
    logApiError?.(err);
    throw err;
  }
};

export const fetchPetsRecommended = getPetsRecommended;
export const fetchManagersRecommended = getManagersRecommended;
