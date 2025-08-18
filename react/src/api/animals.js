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
 * 공통 GET 폴백: /animals → 실패 시 /pets
 * ============================== */
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

/** ==============================
 * 목록 (정규화 포함)
 * ============================== */
export const fetchAnimals = async (params = {}) => {
  const data = await getWithFallback('/animals', { params });
  const items = pickApiItems(data) || data?.content || data?.items || [];
  const meta  = pickPageMeta(data);
  return { ...meta, content: (items || []).map(normalizePet) };
};

/** ==============================
 * 보호소 기준 목록 (careNm/affiliation 또는 shelterId로 필터)
 * ============================== */
export const fetchAnimalsByShelter = async ({ shelterId, careNm, page = 1, size = 100 } = {}) => {
  const { content } = await fetchAnimals({ page, size });
  let list = content;
  if (careNm) list = list.filter(a => (a.careNm || '').trim() === careNm.trim());
  if (shelterId) list = list.filter(a => String(a._raw?.shelterId || '') === String(shelterId));
  return list;
};

/** ==============================
 * 추천 목록
 * ============================== */
export const fetchRecommendedPets = async (params = {}) => {
  const data = await getWithFallback('/animals/recommended', { params });
  const items = pickApiItems(data) || data?.content || data?.items || [];
  return (items || []).map(normalizePet);
};

/** ==============================
 * 생성 / 업로드
 * ============================== */
export const createAnimal = async (payload = {}) => {
  try {
    const { data } = await api.post('/animals', payload);
    return data;
  } catch {
    const { data } = await api.post('/pets', payload);
    return data;
  }
};

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

/** ==============================
 * Slider용 유틸/API
 * ============================== */

/** 강아지 여부 판별 (오픈API kindCd: "[개] 믹스" 고려) */
const isDog = (a) => {
  const s = (a.species || a._raw?.kindCd || '').toString().toLowerCase();
  return s.includes('개') || s.includes('dog');
};

/** 사진 있는 것만 */
const hasPhoto = (a) => !!a.photoUrl;

/** 간단 셔플 */
const shuffle = (arr=[]) => {
  const r = arr.slice();
  for (let i=r.length-1; i>0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

/** 중복 제거 (id 기준) */
const uniqById = (arr=[]) => {
  const seen = new Set();
  return arr.filter(x => {
    const k = String(x.id ?? '');
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/**
 * 메인 슬라이드: 보호 중인 강아지들
 * - 우선 /animals?kind=DOG 요청 (지원 시 서버 필터)
 * - 폴백: 전체 받아서 프론트에서 강아지/사진 필터
 * - 결과: normalizePet 적용된 리스트
 */
export const fetchFeaturedDogs = async ({
  take = 18,            // 슬라이드에 뿌릴 개수
  page = 1,
  size = 120,           // 넉넉히 가져와서 전처리 후 자르기
  status = 'AVAILABLE', // 필요 없으면 null/'' 가능
  sort = 'createdAt,DESC',
} = {}) => {
  // 1) 서버 필터 시도
  let items = [];
  try {
    const data = await getWithFallback('/animals', {
      params: { page, size, status, kind: 'DOG', sort }
    });
    const raw = pickApiItems(data) || data?.content || data?.items || [];
    items = (raw || []).map(normalizePet);
  } catch {
    // 2) 폴백: 클라이언트 필터
    const { content } = await fetchAnimals({ page, size, status, sort });
    items = content;
  }

  return shuffle(
    uniqById(items.filter(isDog).filter(hasPhoto))
  ).slice(0, take);
};

/**
 * 최신 강아지(사진 포함) – 정렬을 최신 기준으로 강제하고 싶을 때
 */
export const fetchLatestDogs = async ({ take = 18 } = {}) => {
  const { content } = await fetchAnimals({ page: 1, size: 120, sort: 'createdAt,DESC' });
  return content.filter(isDog).filter(hasPhoto).slice(0, take);
};
