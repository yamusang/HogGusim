// src/api/shelters.js
import api from './apiClient';
import { fetchAnimals } from './animals';

/**
 * 보호소(care_nm) 이름 목록을 가져온다.
 * 우선 전용 엔드포인트를 시도하고, 없으면 동물 목록에서 추출해서 unique 정렬.
 */
export const fetchCareNames = async () => {
  // 1) 전용 엔드포인트 시도 (있으면 사용)
  try {
    const { data } = await api.get('/shelters/care-names');
    if (Array.isArray(data) && data.length) {
      return data.filter(Boolean).map(s => String(s).trim());
    }
  } catch (_) {}

  try {
    const { data } = await api.get('/animals/care-names');
    if (Array.isArray(data) && data.length) {
      return data.filter(Boolean).map(s => String(s).trim());
    }
  } catch (_) {}

  // 2) 폴백: 동물 목록 크게 가져와서 careNm만 뽑기
  const { content } = await fetchAnimals({ page: 1, size: 1000, sort: 'happenDt,DESC' });
  const set = new Set(
    (content || [])
      .map(a => (a.careNm || '').trim())
      .filter(Boolean)
  );
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
};
