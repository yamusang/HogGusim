// src/config/constants.js

// ───── 공통 상수 ─────
export const ROLES = {
  SENIOR: 'SENIOR',
  MANAGER: 'MANAGER',
  SHELTER: 'SHELTER',
};

export const PET_STATUS = {
  AVAILABLE: 'AVAILABLE',
  PENDING: 'PENDING',
  MATCHED: 'MATCHED',
  RETURNED: 'RETURNED',
};

// ───── Senior 선택지: 한글 라벨 + 영문 코드 저장 ─────
// 요일
export const DAY_OPTS = [
  { value: 'MON', label: '월' },
  { value: 'TUE', label: '화' },
  { value: 'WED', label: '수' },
  { value: 'THU', label: '목' },
  { value: 'FRI', label: '금' },
  { value: 'SAT', label: '토' },
  { value: 'SUN', label: '일' },
];
// 기존 values 배열 유지(호환)
export const DAYS = DAY_OPTS.map(o => o.value);

// 종
export const SPECIES_OPTS = [
  { value: 'dog', label: '강아지' },
  { value: 'cat', label: '고양이' },
  { value: 'any', label: '상관없음' },
];
export const SPECIES = SPECIES_OPTS.map(o => o.value);

// 크기
export const SIZE_OPTS = [
  { value: 'small', label: '소형' },
  { value: 'medium', label: '중형' },
  { value: 'large', label: '대형' },
  { value: 'any', label: '상관없음' },
];
export const SIZE = SIZE_OPTS.map(o => o.value);

// ⛔️ 연령 선호(AGE_PREF) 삭제했습니다.

// 성별 선호
export const GENDER_PREF_OPTS = [
  { value: 'M', label: '수컷' },
  { value: 'F', label: '암컷' },
  { value: 'any', label: '상관없음' },
];
export const GENDER_PREF = GENDER_PREF_OPTS.map(o => o.value);

// 성격 선호
export const TEMPERAMENT_OPTS = [
  { value: 'calm', label: '차분한' },
  { value: 'gentle', label: '온순한' },
  { value: 'lowEnergy', label: '저활력' },
  { value: 'any', label: '상관없음' },
];
export const TEMPERAMENT = TEMPERAMENT_OPTS.map(o => o.value);

// 건강 허용 범위
export const HEALTH_TOL_OPTS = [
  { value: 'healthyOnly', label: '건강 개체만' },
  { value: 'manageableOnly', label: '관리 가능 질환 허용' },
  { value: 'any', label: '상관없음' },
];
export const HEALTH_TOL = HEALTH_TOL_OPTS.map(o => o.value);

// 🔹 돌봄 방식(집/외부)
export const VISIT_STYLE_OPTS = [
  { value: 'HOME_VISIT', label: '집 방문 돌봄' },
  { value: 'OUTDOOR_WALK', label: '외부 산책 중심' },
  { value: 'EITHER', label: '상황에 따라' },
];
export const VISIT_STYLE = VISIT_STYLE_OPTS.map(o => o.value);
