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
  const s = String(url);
  if (/^https?:\/\//i.test(s)) return s;
  if (/^(data|blob):/i.test(s)) return s;
  if (/^\/\//.test(s)) return s; 
  const base = (api.defaults?.baseURL || '').replace(/\/+$/, '');
  if (s.startsWith('/')) return `${base}${s}`;
  const rel = `/${s}`.replace(/\/{2,}/g, '/');
  return `${base}${rel}`;
};

export function parseReason(reason = '') {
  if (!reason || typeof reason !== 'string') return [];

  return reason
    .split(/(?:·|•|,)/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((chunk) => {
      const m = chunk.match(/(.+?)\s+([+-]?\d+(?:\.\d+)?)(?!.*\d)/);
      if (m) return { label: m[1].trim(), delta: Number(m[2]) };
      return { label: chunk, delta: null };
    });
}

function normalizeSex(v) {
  const s = String(v ?? '').trim().toUpperCase();
  if (s === 'M') return '수컷';
  if (s === 'F') return '암컷';
  if (s === 'Q' || s === 'U' || s === '' || s === '-') return '미상';
  return v || '-';
}
function normalizeNeuter(v) {
  const s = String(v ?? '').trim().toUpperCase();
  if (s === 'Y') return '예';
  if (s === 'N') return '아니오';
  if (s === 'U' || s === '' || s === '-') return '-';
  return v || '-';
}

export function mapRecoPet(it = {}) {
  const photo = it.photoUrl ?? it.image ?? it.thumbnail ?? it.thumb ?? '';
  const sexRaw = it.sex ?? it.gender ?? it.sexCd;
  const neuterRaw = it.neuter ?? it.neutered ?? it.neuterYn;
  return {
    id: it.id ?? it.petId ?? it.animalId ?? it.desertionNo ?? it.seq ?? null,
    desertionNo: it.desertionNo ?? null,
    name: it.name ?? null,
    breed: it.breed ?? it.kind ?? it.kindCd ?? null,
    age: it.age ?? null,

    photoUrl: photo ? toAbsoluteUrl(photo) : null,
    thumbnail: it.thumbnail ? toAbsoluteUrl(it.thumbnail) : null,

    sex: normalizeSex(sexRaw),
    neuter: normalizeNeuter(neuterRaw),

    matchScore:
      typeof it.matchScore === 'number'
        ? it.matchScore
        : typeof it.score === 'number'
        ? it.score
        : typeof it.match_score === 'number'
        ? it.match_score
        : 0,

    reason: it.reason ?? '',
    reasonChips: parseReason(it.reason ?? ''),

    careName: it.careNm ?? it.careName ?? it.shelterName ?? null,
    temperament: it.temperament ?? null,

    _raw: it,
  };
}

export const isEmptyPage = (page) =>
  !page || !Array.isArray(page.content) || page.content.length === 0;

export const mergePage = (prev, next) => {
  if (!prev) return next;
  if (!next) return prev;
  return { ...next, content: [...(prev.content || []), ...(next.content || [])] };
};

export const getPetsRecommended = async (
  seniorId,
  { mode = RecoMode.BALANCED, page = 0, size = 7 } = {},
  axiosConfig = {}
) => {
  if (!seniorId) throw new Error('INVALID_SENIOR_ID');
  if (!isValidMode(mode)) mode = RecoMode.BALANCED;

  try {
    const { data } = await api.get('/reco/pets', {
      params: { seniorId, mode, page, size },
      ...axiosConfig, 
    });

    const rawContent = Array.isArray(data?.content) ? data.content : [];
    const content = rawContent.map(mapRecoPet);

    const number = Number.isFinite(data?.number) ? data.number : page;
    const sz = Number.isFinite(data?.size) ? data.size : size;
    const totalElements = Number.isFinite(data?.totalElements)
      ? data.totalElements
      : content.length;
    const totalPages = Number.isFinite(data?.totalPages)
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
