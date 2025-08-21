// src/utils/reco.js

/** ---------- 특성 분류(특이사항 텍스트) ---------- */
const KW = {
  BLOCK: ["교상", "공격", "사납", "사나움", "무는", "입질 심함", "입질", "광견", "심각한 공격성", "개물림"],
  HOLD_MEDICAL: ["파보", "전염", "격리", "치료 중", "치료중", "수술 예정", "감염", "폐렴", "입원"],
  LIMIT_BEHAVIOR: ["분리불안", "지속 짖음", "짖음 심함", "배변 훈련 안됨", "활동량 많음", "견인 강함", "경계 심함", "산책 교육 필요"],
  BEGINNER: ["온순", "순함", "사람 좋아함", "착함", "순둥", "적응 빠름", "기본 훈련", "소형"],
  HIGH_ACTIVITY: ["활발", "에너지", "산책 많이", "대형", "하이퍼", "견인"],
};

export function classifySpecialMark(specialMark = "") {
  const txt = (specialMark || "").replace(/\s+/g, " ").trim();
  const hit = (arr) => arr.some(k => txt.includes(k));
  if (hit(KW.BLOCK)) return { risk: "BLOCK", beginner: false, highActivity: true };
  if (hit(KW.HOLD_MEDICAL)) return { risk: "HOLD_MEDICAL", beginner: false, highActivity: false };
  if (hit(KW.LIMIT_BEHAVIOR)) return { risk: "LIMIT_BEHAVIOR", beginner: false, highActivity: hit(KW.HIGH_ACTIVITY) };
  return { risk: "GREEN", beginner: hit(KW.BEGINNER), highActivity: hit(KW.HIGH_ACTIVITY) };
}

/** ---------- 지역 근접 점수(광역시/구 단위) ---------- */
function cityGu(s = "") {
  const m = s.match(/(부산광역시)\s+([가-힣]{2,10}(구|군))/);
  if (m) return `${m[1]} ${m[2]}`;
  const t = s.trim().split(/\s+/);
  return t.length >= 2 ? `${t[0]} ${t[1]}` : s;
}
export function distanceLikeScore(userAddress = "", careAddr = "") {
  if (!userAddress || !careAddr) return 0;
  const u = cityGu(userAddress);
  const c = cityGu(careAddr);
  if (u === c) return 1.0;
  if ((userAddress.split(" ")[0] || "") === (careAddr.split(" ")[0] || "")) return 0.6;
  return 0.2;
}

/** ---------- 보조 파서 ---------- */
function parseAgeStr(ageStr = "") {
  const m = ageStr.match(/(\d{1,4})/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n > 1900) {
    const year = n, now = new Date().getFullYear();
    return Math.max(0, now - year);
  }
  return n;
}
function sizeHint(kindCd = "") {
  if (/(대형)/.test(kindCd)) return "L";
  if (/(중형)/.test(kindCd)) return "M";
  if (/(소형)/.test(kindCd)) return "S";
  return null;
}

/** ---------- 메인 스코어러 ---------- */
export function scoreAnimal(animal, seniorPref = {}) {
  const {
    popfile,                     // 이미지 URL(공공데이터)
    careAddr = "", careNm = "",
    kindCd = "", neuterYn, processState,
    age = "", specialMark = "",
  } = animal || {};

  // 1) 가용성
  const available = processState ? /보호\s*중|공고\s*중|가능/i.test(processState) : true;
  let score = available ? 40 : 10;

  // 2) 특성
  const cls = classifySpecialMark(specialMark);
  if (cls.risk === "BLOCK") score -= 60;
  else if (cls.risk === "HOLD_MEDICAL") score -= 30;
  else if (cls.risk === "LIMIT_BEHAVIOR") score -= 15;
  if (cls.beginner) score += 10;
  if (cls.highActivity && seniorPref.lowActivity) score -= 10;

  // 3) 중성화
  if ((neuterYn || "").toUpperCase() === "Y") score += 6;

  // 4) 지역 근접
  score += 20 * distanceLikeScore(seniorPref.address, careAddr);

  // 5) 체격/나이 힌트
  const size = sizeHint(kindCd);
  if (seniorPref.prefersSmall && size === "S") score += 5;
  const years = parseAgeStr(age);
  if (years != null) {
    if (years <= 1 && seniorPref.lowActivity) score -= 6;
    if (years >= 7) score += 4;
  }

  // 6) 사진 유무
  if (popfile) score += 3;

  return { score, available, risk: cls.risk, beginner: cls.beginner, careNm, popfile };
}

/** ---------- 백엔드 응답 → 표준화 ---------- */
export function normalizeAnimal(raw) {
  // 백엔드가 RecoPetDto(추천) or Animal(그대로)를 내려줘도 대응
  const a = raw || {};
  const core = a.animal || a; // RecoPetDto.animal 형태 고려
  return {
    // 원본 먼저 펼쳐두고(추가 필드 보존), 아래에서 표준키로 덮어써서 일관성 보장
    ...(core || {}),
    id:
      core?.id ??
      core?.animalId ??
      core?.petId ??
      core?.seq ??
      core?.desertionNo ??
      null,
    kindCd: core?.kindCd ?? core?.kind ?? null,
    processState: core?.processState ?? core?.process_state ?? core?.process ?? null,
    careNm: core?.careNm ?? core?.careName ?? core?.shelterName ?? null,
    careAddr: core?.careAddr ?? core?.careAddress ?? null,
    neuterYn: core?.neuterYn ?? core?.neuter ?? core?.neutered ?? null,
    age: core?.age ?? null,
    weight: core?.weight ?? null,
    sexCd: core?.sexCd ?? core?.sex ?? core?.gender ?? null,
    popfile: core?.popfile || core?.photoUrl || core?.filename || core?.image || null,
    specialMark: core?.specialMark ?? core?.special ?? null,
  };
}

/** ---------- 정렬 ---------- */
export function rankAnimals(animals = [], seniorPref = {}) {
  return animals
    .map(raw => {
      const a = normalizeAnimal(raw);
      const s = scoreAnimal(a, seniorPref);
      return { ...a, __score: s.score, __meta: s };
    })
    .sort((x, y) => y.__score - x.__score);
}
