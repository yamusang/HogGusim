import api from './apiClient';

/** 공백/한글/상대경로까지 안전하게 절대 URL로 변환 */
export const toAbsoluteUrl = (url) => {
  if (!url) return '';
  if (typeof url !== 'string') url = String(url || '');
  url = url.trim();

  // 이미 절대 URL이면 path 세그먼트만 안전 인코딩
  try {
    if (/^https?:\/\//i.test(url)) {
      const u = new URL(url);
      u.pathname = u.pathname
        .split('/')
        .map(seg => encodeURIComponent(decodeURIComponent(seg)))
        .join('/');
      return u.toString();
    }
  } catch (_) {}

  // 상대경로 → baseURL 붙이기 (+ 인코딩)
  const base = (api.defaults.baseURL || '').replace(/\/+$/, '');
  const rel  = (`/${url}`).replace(/\/+/, '/');
  const encoded = rel
    .split('/')
    .map((seg, i) => (i === 0 ? seg : encodeURIComponent(decodeURIComponent(seg))))
    .join('/');
  return `${base}${encoded}`;
};

/** 다양한 키를 하나의 표준 개체로 정규화 */
export const normalizePet = (it = {}) => {
  const sc = (it.sexCd ?? it.sex_cd ?? it.sex ?? '').toString().toUpperCase();
  const gender = sc === 'M' ? '수컷' : sc === 'F' ? '암컷' : (it.gender || '미상');

  // 사진(여러 후보 키 → 절대 URL 보장)
  const rawPhoto =
    it.popfile ?? it.filename ?? it.photoUrl ?? it.thumb ?? it.image ?? '';
  const photoUrl = rawPhoto ? toAbsoluteUrl(rawPhoto) : '';

  // 종/품종 정리
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

    photoUrl,                // ← 절대 URL 보장됨
    specialMark: it.specialMark || '',

    noticeSdt: it.noticeSdt || null,
    noticeEdt: it.noticeEdt || null,

    careNm: it.careNm || it.careName || '',
    careTel: it.careTel || '',
    careAddr: it.careAddr || '',
    orgNm: it.orgNm || '',

    _raw: it,                // 원본 보관 (popfile 등 접근용)
  };
};

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

/** 페이지네이션 동물 목록 */
export const fetchAnimals = async (params = {}, axiosCfg = {}) => {
  const { page = 0, size = 20, careNm } = params;
  const query = { page, size };
  if (careNm && careNm.trim()) query.careNm = careNm.trim();

  const { data } = await api.get('/animals', { params: query, ...(axiosCfg || {}) });
  const contentRaw = data?.content ?? pickApiItems(data) ?? (Array.isArray(data) ? data : []) ?? [];
  const meta = pickPageMeta(data);

  return {
    content: (contentRaw || []).map(normalizePet),
    ...meta,
  };
};

export const fetchAnimalsByShelter = async ({ careNm, page = 0, size = 100 } = {}, axiosCfg = {}) => {
  const { content } = await fetchAnimals({ careNm, page, size }, axiosCfg);
  return content;
};

/** 조건 추천(시연용: 서버 필터만 활용) */
export const fetchRecommendedAnimals = async (
  { page = 0, size = 20, careNm, ...rest } = {},
  axiosCfg = {}
) => {
  const { data } = await api.get('/animals', { params: { page, size, careNm, ...rest }, ...(axiosCfg || {}) });
  const raw = pickApiItems(data) || data?.content || data?.items || [];
  return (raw || []).map(normalizePet);
};
export const fetchRecommendedPets = fetchRecommendedAnimals;

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

// 시연용 도우미
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

export const fetchFeaturedDogs = async (
  { take = 18, page = 0, size = 120, status = 'AVAILABLE' } = {},
  axiosCfg = {}
) => {
  const { data } = await api.get('/animals', { params: { page, size, status, kind: 'DOG' }, ...(axiosCfg || {}) });
  const raw = pickApiItems(data) || data?.content || data?.items || [];
  const items = (raw || []).map(normalizePet);

  const onlyDogs = items.filter(isDog);
  const ranked = [...onlyDogs].sort((a, b) => (b.photoUrl ? 1 : 0) - (a.photoUrl ? 0 : 1));
  const uniq = uniqById(ranked);
  return uniq.slice(0, take);
};

export const fetchLatestDogs = async ({ take = 18 } = {}, axiosCfg = {}) => {
  const { content } = await fetchAnimals({ page: 0, size: 120 }, axiosCfg);
  return content.filter(isDog).filter(hasPhoto).slice(0, take);
};
