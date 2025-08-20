// src/api/animals.js
import api from './apiClient';

/** ==============================
 * 절대 URL 보정
 * ============================== */
export const toAbsoluteUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url; // 이미 절대경로면 그대로
  const base = (api.defaults.baseURL || '').replace(/\/+$/, '');
  const rel  = (`/${String(url)}`).replace(/\/+/, '/');
  return `${base}${rel}`;
};

/** ==============================
 * 🔁 백엔드 DTO(Item) → 앱 표준 모델
 * ============================== */
export const normalizePet = (it = {}) => {
  const sc = (it.sexCd ?? it.sex_cd ?? it.sex ?? '').toString().toUpperCase();
  const gender = sc === 'M' ? '수컷' : sc === 'F' ? '암컷' : '미상';

  const rawPhoto =
    it.popfile ?? it.filename ?? it.photoUrl ?? it.thumb ?? it.image ?? '';
  const photoUrl = rawPhoto ? toAbsoluteUrl(rawPhoto) : '';

  // ✅ 종 추출 보강
  const rawKind =
    it.kind ?? it.kindNm ?? it.kindName ?? it.kind_name ?? it.kind_cd_name ??
    it.kindCd ?? it.species ?? '';
  let species = String(rawKind || '');
  if (/^\[[^\]]+\]\s*/.test(species)) species = species.replace(/^\[[^\]]+\]\s*/, '');
  if (/^\d+$/.test(species)) species = ''; // 숫자코드면 표시 X

  return {
    id: it.id ?? it.desertionNo ?? it.noticeNo ?? it.externalId ?? it.desertion_no ?? null,
    name: it.name ?? null,

    species,
    breed: it.breed ?? null,
    color: it.colorCd || it.color || '',
    gender,                                // 🇰🇷 레이블(수컷/암컷/미상)
    sex: it.sex || it.sexCd || '',         // 원본 코드 보존
    age: it.age || '',
    weight: it.weight || '',
    neuter: it.neuterYn || it.neuter || '',// 'Y'|'N'|'U' or ''
    status: it.processState || it.status || '보호중',

    happenDt: it.happenDt || null,
    createdAt: it.createdAt || it.happenDt || null,

    photoUrl,
    specialMark: it.specialMark || '',

    noticeSdt: it.noticeSdt || null,
    noticeEdt: it.noticeEdt || null,

    careNm: it.careNm || it.careName || '',
    careTel: it.careTel || '',
    careAddr: it.careAddr || '',
    orgNm: it.orgNm || '',

    _raw: it,
  };
};

/** ==============================
 * 오픈API/페이지 응답 파서
 * ============================== */
const pickApiItems = (data) => data?.response?.body?.items?.item ?? [];
const pickPageMeta = (data) => ({
  totalElements: data?.response?.body?.totalCount ?? data?.totalElements ?? 0,
  number:        data?.response?.body?.pageNo     ?? data?.number        ?? 0,
  size:          data?.response?.body?.numOfRows  ?? data?.size          ?? 0,
  totalPages:    data?.totalPages ??
                 (data?.response?.body?.totalCount && data?.response?.body?.numOfRows
                   ? Math.ceil(Number(data.response.body.totalCount) / Number(data.response.body.numOfRows))
                   : 0),
  first:         data?.first ?? (data?.number === 0),
  last:          data?.last  ?? false,
  empty:         Array.isArray(data?.content) ? data.content.length === 0
                 : Array.isArray(pickApiItems(data)) ? pickApiItems(data).length === 0
                 : false,
});

/** ==============================
 * 목록 (정규화 포함) — animals
 *  - sort/status는 백엔드 지원 확인 전엔 보내지 않음
 * ============================== */
export const fetchAnimals = async (params = {}, axiosCfg = {}) => {
  const { page = 0, size = 20, careNm /*, sort, status*/ } = params;

  const query = { page, size };
  if (careNm && careNm.trim()) query.careNm = careNm.trim();
  // ⛔ 백엔드 필드명이 불명확해서 일단 sort/status 제거
  // if (sort) query.sort = sort;
  // if (status) query.status = status;

  const { data } = await api.get('/animals', { params: query, signal: axiosCfg?.signal });

  // ✅ 스프링 Page 우선 → 오픈API → 배열
  const contentRaw = data?.content ?? pickApiItems(data) ?? (Array.isArray(data) ? data : []) ?? [];
  const meta = pickPageMeta(data);

  return {
    content: (contentRaw || []).map(normalizePet),
    ...meta,
  };
};

/** ==============================
 * 보호소 기준 목록(A안: careNm)
 * ============================== */
export const fetchAnimalsByShelter = async ({ careNm, page = 0, size = 100 } = {}) => {
  const query = {};
  if (careNm) query.careNm = careNm;
  const { content } = await fetchAnimals({ ...query, page, size });
  return content;
};

/** ==============================
 * 추천 목록 (임시: /animals 폴백)
 *  - 정렬 파라미터 제거(백 호환성)
 * ============================== */
export const fetchRecommendedAnimals = async ({ page = 0, size = 20, careNm, ...rest } = {}) => {
  const { data } = await api.get('/animals', { params: { page, size, careNm, ...rest } });
  const raw = pickApiItems(data) || data?.content || data?.items || [];
  return (raw || []).map(normalizePet);
};
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

/** 메인 슬라이드 (정렬 파라미터 제거) */
export const fetchFeaturedDogs = async ({
  take = 18,
  page = 0,
  size = 120,
  status = 'AVAILABLE',
  // sort 제거
} = {}) => {
  const { data } = await api.get('/animals', { params: { page, size, status, kind: 'DOG' } });
  const raw = pickApiItems(data) || data?.content || data?.items || [];
  const items = (raw || []).map(normalizePet);

  const onlyDogs = items.filter(isDog);
  const ranked = [...onlyDogs].sort((a, b) => (b.photoUrl ? 1 : 0) - (a.photoUrl ? 1 : 0));
  const uniq = uniqById(ranked);
  return uniq.slice(0, take);
};

/** 최신 강아지 (fetchAnimals 내부가 sort 무시하므로 안전) */
export const fetchLatestDogs = async ({ take = 18 } = {}) => {
  const { content } = await fetchAnimals({ page: 0, size: 120 });
  return content.filter(isDog).filter(hasPhoto).slice(0, take);
};
