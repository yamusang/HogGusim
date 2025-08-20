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
export const normalizePet = (it = {}) => {
  const sc = (it.sexCd ?? it.sex_cd ?? it.sex ?? '').toString().toUpperCase();
  const gender = sc === 'M' ? '수컷' : sc === 'F' ? '암컷' : '미상';

  const rawPhoto =
    it.popfile ?? it.filename ?? it.photoUrl ?? it.thumb ?? it.image ?? '';
  const photoUrl = rawPhoto ? toAbsoluteUrl(rawPhoto) : '';

  const rawKind =
    it.kind ?? it.kindNm ?? it.kindName ?? it.kind_name ?? it.kind_cd_name ??
    it.kindCd ?? it.species ?? '';
  let species = String(rawKind || '');
  if (/^\[[^\]]+\]\s*/.test(species)) species = species.replace(/^\[[^\]]+\]\s*/, '');
  if (/^\d+$/.test(species)) species = '';

  return {
    id: it.id ?? it.desertionNo ?? it.noticeNo ?? it.externalId ?? it.desertion_no ?? null,
    name: it.name ?? null,

    species,
    breed: it.breed ?? null,
    color: it.colorCd || it.color || '',
    gender,
    sex: it.sex || it.sexCd || '',
    age: it.age || '',
    weight: it.weight || '',
    neuter: it.neuterYn || it.neuter || '',
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
 * 목록 (정규화 포함)
 * ============================== */
export const fetchAnimals = async (params = {}, axiosCfg = {}) => {
  const { page = 0, size = 20, careNm } = params;

  const query = { page, size };
  if (careNm && careNm.trim()) query.careNm = careNm.trim();

  // __noAuth, headers, signal 등 외부 옵션 그대로 전달
  const { data } = await api.get('/animals', {
    params: query,
    ...(axiosCfg || {}),
  });

  const contentRaw = data?.content ?? pickApiItems(data) ?? (Array.isArray(data) ? data : []) ?? [];
  const meta = pickPageMeta(data);

  return {
    content: (contentRaw || []).map(normalizePet),
    ...meta,
  };
};

/** 보호소 기준 목록 */
export const fetchAnimalsByShelter = async ({ careNm, page = 0, size = 100 } = {}, axiosCfg = {}) => {
  const { content } = await fetchAnimals({ careNm, page, size }, axiosCfg);
  return content;
};

/** 추천 목록 (임시: /animals 폴백) */
export const fetchRecommendedAnimals = async (
  { page = 0, size = 20, careNm, ...rest } = {},
  axiosCfg = {}
) => {
  const { data } = await api.get('/animals', {
    params: { page, size, careNm, ...rest },
    ...(axiosCfg || {}),
  });
  const raw = pickApiItems(data) || data?.content || data?.items || [];
  return (raw || []).map(normalizePet);
};
export const fetchRecommendedPets = fetchRecommendedAnimals;

/** 생성 / 업로드 */
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
const uniqById = (arr=[]) => {
  const seen = new Set();
  return arr.filter(x => {
    const k = String(x.id ?? '');
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/** 메인 슬라이드 */
export const fetchFeaturedDogs = async (
  { take = 18, page = 0, size = 120, status = 'AVAILABLE' } = {},
  axiosCfg = {}
) => {
  const { data } = await api.get('/animals', {
    params: { page, size, status, kind: 'DOG' },
    ...(axiosCfg || {}),
  });
  const raw = pickApiItems(data) || data?.content || data?.items || [];
  const items = (raw || []).map(normalizePet);

  const onlyDogs = items.filter(isDog);
  const ranked = [...onlyDogs].sort((a, b) => (b.photoUrl ? 1 : 0) - (a.photoUrl ? 1 : 0));
  const uniq = uniqById(ranked);
  return uniq.slice(0, take);
};

/** 최신 강아지 */
export const fetchLatestDogs = async ({ take = 18 } = {}, axiosCfg = {}) => {
  const { content } = await fetchAnimals({ page: 0, size: 120 }, axiosCfg);
  return content.filter(isDog).filter(hasPhoto).slice(0, take);
};
