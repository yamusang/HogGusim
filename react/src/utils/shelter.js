// src/api/shelters.js
import api from './apiClient';

/** 백 응답을 표준화 */
export const normalizeShelter = (raw) => ({
  id: raw.id ?? raw.shelterId ?? raw.careRegNo ?? null,
  name: raw.name ?? raw.careNm ?? raw.affiliation ?? '이름 없음',
  addr: raw.addr ?? raw.address ?? raw.careAddr ?? '',
  tel: raw.tel ?? raw.phone ?? raw.careTel ?? '',
});

/** 보호소 목록 조회
 * - 백이 /shelters 또는 /care-centers 같이 다를 수 있어 1차/2차 폴백
 */
export const fetchShelters = async (params = {}) => {
  try {
    const { data } = await api.get('/shelters', { params });
    const rows = data?.content || data?.items || data?.data || data || [];
    return rows.map(normalizeShelter);
  } catch (e) {
    if (e?.response?.status === 404) {
      const { data } = await api.get('/care-centers', { params });
      const rows = data?.content || data?.items || data?.data || data || [];
      return rows.map(normalizeShelter);
    }
    throw e;
  }
};
