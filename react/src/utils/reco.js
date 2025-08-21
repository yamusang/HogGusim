/** senior + pet 속성으로 가짜 점수(0~100) */
export function computeScore({ senior, pet }) {
  let score = 50;

  // 지역 매칭: 같은 시/구면 가점
  const sAddr = String(senior?.address || senior?.city || '');
  const pAddr = String(pet?.address || pet?.careAddr || pet?.shelterAddr || '');
  if (sAddr && pAddr && pAddr.includes(sAddr.split(' ')[0])) score += 25;

  // 성별 선호
  const gPref = senior?.prefs?.genderPref;
  const sex = (pet?.sex || pet?.sexCd || '').toString().toUpperCase(); // 'M'/'F'
  if (gPref && sex && gPref.toUpperCase().startsWith(sex[0])) score += 10;

  // 크기 선호
  const sizePref = senior?.prefs?.size;
  const size = pet?.size || pet?.weightClass || ''; // small/medium/large
  if (sizePref && size && sizePref === size) score += 8;

  // 중성화
  const neut = pet?.neutered ?? pet?.neuterYn ?? pet?.neuter ?? null;
  if (neut === true || neut === 'Y') score += 5;

  // 질병 허용도
  const diseaseCnt = Array.isArray(pet?.diseases) ? pet.diseases.length : (pet?.diseases ? 1 : 0);
  if (senior?.prefs?.healthTol === 'low' && diseaseCnt > 0) score -= 10;
  if (senior?.prefs?.healthTol === 'high' && diseaseCnt > 0) score += 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/** 백에 점수 없으면 프론트에서 계산 후 내림차순 정렬 */
export function rankPets({ pets = [], senior }) {
  const enriched = pets.map(p => ({
    ...p,
    matchScore: p.matchScore ?? computeScore({ senior, pet: p }),
  }));
  enriched.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  return enriched;
}
