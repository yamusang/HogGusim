// src/api/recommendations.js
// ✅ 백엔드 추천 엔드포인트 사용 버전

import api from './apiClient';

/* -------------------------
 * 공통 유틸
 * ------------------------- */
const toPage = (res, { page = 0, size = 10 } = {}) => {
  if (Array.isArray(res)) return { content: res, total: res.length, size, number: page };
  const content = res?.content ?? res?.items ?? [];
  const total   = res?.totalElements ?? res?.total ?? content.length ?? 0;
  const number  = res?.number ?? page;
  const _size   = res?.size ?? size;
  return { content, total, size: _size, number };
};

const toAbsoluteUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = (api.defaults.baseURL || '').replace(/\/+$/, '');
  const rel  = (`/${String(url)}`).replace(/\/+/, '/');
  return `${base}${rel}`;
};

// 추천 응답 정규화(있으면 그대로, 없으면 안전 폴백)
const normalizePetReco = (it = {}) => {
  const photo =
    it.photoUrl ?? it.popfile ?? it.filename ?? it.thumb ?? it.image ?? '';
  return {
    id: it.id ?? it.desertionNo ?? it.desertion_no ?? it.noticeNo ?? null,
    desertionNo: it.desertionNo ?? it.desertion_no ?? it.id ?? null,
    name: it.name ?? it.petName ?? it.animalName ?? null,
    breed: it.breed ?? it.species ?? it.kind ?? it.kindNm ?? null,
    age: it.age ?? null,
    photoUrl: photo ? toAbsoluteUrl(photo) : null,
    matchScore: it.matchScore ?? it.score ?? it.match_score ?? null,
  };
};

/* -------------------------
 * 추천: 동물 (SeniorPage)
 * ------------------------- */
/**
 * getPetsRecommended(seniorId, page, size)
 * 반환 형태: { content: [...], total, size, number }
 */
export const getPetsRecommended = async (seniorId, page = 0, size = 10) => {
  const { data } = await api.get('/reco/pets', { params: { seniorId, page, size } });

  // 백엔드가 바로 Page<RecoPetDto>를 주면 그대로, 아닐 때 방어
  const rawContent =
    data?.content ?? data?.items ?? (Array.isArray(data) ? data : []) ?? [];

  const pageObj = {
    content: rawContent.map(normalizePetReco),
    totalElements: data?.totalElements ?? rawContent.length ?? 0,
    size: data?.size ?? size,
    number: data?.number ?? page,
  };

  return toPage(pageObj, { page, size });
};

/* -------------------------
 * 추천: 매니저 (PetManagerRecoPage)
 * ------------------------- */
/**
 * getManagersRecommended(seniorId, petId, page, size)
 * 반환 형태: { content: [...], total, size, number }
 */
export const getManagersRecommended = async (
  seniorId,
  petId,
  page = 0,
  size = 10
) => {
  const { data } = await api.get('/reco/managers', {
    params: { seniorId, petId, page, size },
  });

  const rawContent =
    data?.content ?? data?.items ?? (Array.isArray(data) ? data : []) ?? [];

  // 매니저 카드에서 필요한 최소 필드만 유지
  const mapped = rawContent.map((it) => ({
    id: it.id ?? it.managerId ?? null,
    name: it.name ?? it.displayName ?? null,
    intro: it.intro ?? it.bio ?? null,
    photoUrl: toAbsoluteUrl(it.photoUrl ?? it.avatarUrl ?? ''),
    matchScore: it.matchScore ?? it.score ?? null,
  }));

  const pageObj = {
    content: mapped,
    totalElements: data?.totalElements ?? mapped.length ?? 0,
    size: data?.size ?? size,
    number: data?.number ?? page,
  };

  return toPage(pageObj, { page, size });
};

/* -------------------------
 * (선택) 호환 별칭
 * ------------------------- */
export const fetchPetsRecommended = getPetsRecommended;
export const fetchManagersRecommended = getManagersRecommended;
