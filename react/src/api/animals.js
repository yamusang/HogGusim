// src/api/animals.js
import api from './apiClient';

/** 절대 URL 보정 */
export const toAbsoluteUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = (api.defaults.baseURL || '').replace(/\/+$/, '');
  const rel  = (`/${String(url)}`).replace(/\/+/, '/');
  return `${base}${rel}`;
};

/** 🔁 백엔드 DTO(Item) → 앱 표준 모델 */
export const normalizePet = (it) => {
  if (!it) return null;
  const sc = (it.sexCd || '').toUpperCase();
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
    photoUrl: it.popfile ? toAbsoluteUrl(it.popfile) : (it.photoUrl ? toAbsoluteUrl(it.photoUrl) : ''),
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

/** 📦 오픈API 응답에서 rows 꺼내기 */
const pickApiItems = (data) => data?.response?.body?.items?.item ?? [];
const pickPageMeta = (data) => ({
  total: data?.response?.body?.totalCount ?? 0,
  page:  data?.response?.body?.pageNo ?? 1,
  size:  data?.response?.body?.numOfRows ?? 0,
});

/** 공통 GET 폴백: /animals → 실패 시 /pets */
const getWithFallback = async (path, opts) => {
  try {
    const r = await api.get(path, opts);
    return r.data;
  } catch {
    const alt = path.replace(/^\/animals/, '/pets');
    const r2 = await api.get(alt, opts);
    return r2.data;
  }
};

/** 목록 (정규화 포함) */
export const fetchAnimals = async (params = {}) => {
  const data = await getWithFallback('/animals', { params });
  const items = pickApiItems(data) || data?.content || data?.items || [];
  const meta  = pickPageMeta(data);
  return { ...meta, content: (items || []).map(normalizePet) };
};

/** 보호소 기준 목록 (careNm/affiliation 또는 shelterId로 필터) */
export const fetchAnimalsByShelter = async ({ shelterId, careNm, page = 1, size = 100 } = {}) => {
  const { content } = await fetchAnimals({ page, size });
  let list = content;
  if (careNm) list = list.filter(a => (a.careNm || '').trim() === careNm.trim());
  if (shelterId) list = list.filter(a => String(a._raw?.shelterId || '') === String(shelterId));
  return list;
};

/** 추천 목록 */
export const fetchRecommendedPets = async (params = {}) => {
  const data = await getWithFallback('/animals/recommended', { params });
  const items = pickApiItems(data) || data?.content || data?.items || [];
  return (items || []).map(normalizePet);
};

/** ✅ 새 동물 등록 (내부 DB용). 백이 /animals 미구현이면 /pets로 폴백 */
export const createAnimal = async (payload = {}) => {
  try {
    const { data } = await api.post('/animals', payload);
    return data;
  } catch {
    const { data } = await api.post('/pets', payload);
    return data;
  }
};

/** ✅ 대표사진 업로드 (multipart). /animals → /pets 폴백 */
export const uploadAnimalPhoto = async (animalId, file) => {
  const fd = new FormData();
  fd.append('file', file);
  try {
    const { data } = await api.post(`/animals/${animalId}/photo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch {
    const { data } = await api.post(`/pets/${animalId}/photo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }
};
