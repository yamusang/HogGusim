// src/api/animals.js
import api from './apiClient';

/** ==============================
 * 절대 URL 보정
 * ============================== */
export const toAbsoluteUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = (api.defaults.baseURL || '').replace(/\/+$/, '');
  const rel  = (`/${String(url)}`).replace(/\/+/, '/');
  return `${base}${rel}`;
};

/** ==============================
 * 🔁 백엔드 DTO(Item) → 앱 표준 모델
 * ============================== */
export const normalizePet = (it) => {
  if (!it) return null;
  const sc = (it.sexCd || it.sex || '').toString().toUpperCase();
  const gender = sc === 'M' ? '수컷' : sc === 'F' ? '암컷' : '미상';

  return {
    id: it.desertionNo ?? it.id ?? null,
    name: it.name ?? null,
    species: it.kindCd || it.species || '',
    color: it.colorCd || it.color || '',
    gender,
    age: it.age || '',
    weight: it.weight || '',
    neuter: it.neuterYn || it.neuter || '',
    status: it.processState || it.status || 'AVAILABLE',
    happenDt: it.happenDt || null,
    createdAt: it.createdAt || it.happenDt || null,
    photoUrl: it.popfile
      ? toAbsoluteUrl(it.popfile)
      : (it.photoUrl ? toAbsoluteUrl(it.photoUrl) : ''),
    specialMark: it.specialMark || '',
    noticeSdt: it.noticeSdt || null,
    noticeEdt: it.noticeEdt || null,
    careNm: it.careNm || '',
    careTel: it.careTel || '',
    careAddr: it.careAddr || '',
    orgNm: it.orgNm || '',
    _raw: it,
  };
};

/** ==============================
 * 오픈API 응답 파서
 * ============================== */
const pickApiItems = (data) => data?.response?.body?.items?.item ?? [];
const pickPageMeta = (data) => ({
  total: data?.response?.body?.totalCount ?? data?.totalElements ?? 0,
  page:  data?.response?.body?.pageNo ?? data?.number ?? 1,
  size:  data?.response?.body?.numOfRows ?? data?.size ?? 0,
});

/** ==============================
 * 목록 (정규화 포함)  — /animals 고정
 * ============================== */
export const fetchAnimals = async (params = {}) => {
  const { data } = await api.get('/animals', { params });
  const items = pickApiItems(data) || data?.content || data?.items || [];
  const meta  = pickPageMeta(data);
  return { ...meta, content: (items || []).map(normalizePet) };
};

/** ==============================
 * 보호소 기준 목록 (shelterId로 필터)
 * ============================== */
export const fetchAnimalsByShelter = async ({ shelterId, page = 1, size = 100 } = {}) => {
  const { content } = await fetchAnimals({ shelterId, page, size });
  return content;
};

/** ==============================
 * 추천 목록
 * ============================== */
export const fetchRecommendedAnimals = async (params = {}) => {
  const { data } = await api.get('/animals/recommended', { params });
  const items = pickApiItems(data) || data?.content || data?.items || [];
  return (items || []).map(normalizePet);
};
// (하위호환)
export const fetchRecommendedPets = fetchRecommendedAnimals;

/** ==============================
 * 생성 / 업로드
 * ============================== */
export const createAnimal = async (payload = {}) => {
  const { data } = await api.post('/animals', payload);
  return data;
};

export const uploadAnimalPhoto = async (animalId, file) => {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post(`/animals/${animalId}/photo`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

/** ==============================
 * Slider용 유틸/API
 * ============================== */
const isDog = (a) => {
  const s = (a.species || a._raw?.kindCd || '').toString().toLowerCase();
  return s.includes('개') || s.includes('dog');
};
const hasPhoto = (a) => !!a.photoUrl;
const shuffle = (arr=[]) => {
  const r = arr.slice();
  for (let i=r.length-1; i>0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};
const uniqById = (arr=[]) => {
  const seen = new Set();
  return arr.filter(x => {
    const k = String(x.id ?? '');
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/** 메인 슬라이드: 보호 중인 강아지들 */
export const fetchFeaturedDogs = async ({
  take = 18,
  page = 1,
  size = 120,
  status = 'AVAILABLE',
  sort = 'createdAt,DESC',
} = {}) => {
  const { data } = await api.get('/animals', {
    params: { page, size, status, kind: 'DOG', sort }
  });
  const raw = pickApiItems(data) || data?.content || data?.items || [];
  const items = (raw || []).map(normalizePet);
  return shuffle(uniqById(items.filter(isDog).filter(hasPhoto))).slice(0, take);
};

/** 최신 강아지(사진 포함) */
export const fetchLatestDogs = async ({ take = 18 } = {}) => {
  const { content } = await fetchAnimals({ page: 1, size: 120, sort: 'createdAt,DESC' });
  return content.filter(isDog).filter(hasPhoto).slice(0, take);
};
