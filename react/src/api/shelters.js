// src/api/shelters.js
import api from './apiClient';
import { fetchAnimals } from './animals';

/**
 * 보호소(care_nm) 이름 목록
 * 우선순위:
 *  1) GET /api/shelters/care-names  (권장)
 *  2) GET /api/animals/care-names   (백엔드 보조)
 *  3) /api/animals 페이지에서 careNm 추출 (폴백)
 *
 * 옵션:
 *  - force: true 면 캐시 무시하고 재호출
 *  - 모든 호출은 { __noAuth: true } 로 공개 호출 시도
 */

let _cache = null;
let _inflight = null;

const normalizeList = (arr) =>
  (arr || [])
    .filter(Boolean)
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0);

const sortKo = (arr) =>
  arr.slice().sort((a, b) => a.localeCompare(b, 'ko', { sensitivity: 'base' }));

const extractNamesFromData = (data) => {
  if (Array.isArray(data)) return normalizeList(data);
  if (Array.isArray(data?.names)) return normalizeList(data.names);
  return [];
};

export async function fetchCareNames(force = false) {
  if (!force && _cache) return _cache;
  if (!force && _inflight) return _inflight;

  _inflight = (async () => {
    // 1) /shelters/care-names
    try {
      const { data } = await api.get('/shelters/care-names', { __noAuth: true });
      const list = extractNamesFromData(data);
      if (list.length) return (_cache = sortKo(list));
    } catch (_) {
      /* ignore */
    }

    // 2) /animals/care-names
    try {
      const { data } = await api.get('/animals/care-names', { __noAuth: true });
      const list = extractNamesFromData(data);
      if (list.length) return (_cache = sortKo(list));
    } catch (_) {
      /* ignore */
    }

    // 3) 폴백: /animals에서 careNm 추출 (0-based 페이지!)
    try {
      // 가능한 한 많이 한 번에 긁기
      const { content = [] } =
        (await fetchAnimals({ page: 0, size: 1000 }, { __noAuth: true })) || {};

      const set = new Set(
        content
          .map((a) =>
            String(
              a?.careNm ?? a?.care_nm ?? a?.careName ?? a?.care_nm_name ?? ''
            ).trim()
          )
          .filter(Boolean)
      );

      const list = Array.from(set);
      return (_cache = sortKo(list));
    } catch (e) {
      console.error('fallback fetchCareNames failed:', e);
      return (_cache = []);
    }
  })()
    .finally(() => {
      _inflight = null;
    });

  return _inflight;
}
