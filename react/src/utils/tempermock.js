// 성격 태그 후보
const TAGS = [
  '온순함','사람친화','사회성 좋음','산책좋아함','겸손함','겁많음',
  '활발함','낯가림','고양이 OK','강아지 OK','초보자도 O','분리불안 없음',
  '배변훈련 O','조용함','애교많음','호기심많음'
];

const seedFrom = (str='') => {
  let h = 0; for (let i=0;i<str.length;i++) h = ((h<<5)-h) + str.charCodeAt(i);
  return Math.abs(h);
};
const pickN = (arr, n, seed) => {
  const a = [...arr];
  for (let i=a.length-1;i>0;i--) { const r = (seed = (seed*1664525+1013904223)>>>0) % (i+1); [a[i], a[r]] = [a[r], a[i]]; }
  return a.slice(0, n);
};

export function mockTemperament(pet) {
  const key = `${pet?.id ?? ''}${pet?.name ?? ''}${pet?.breed ?? ''}`;
  const seed = seedFrom(key);
  return pickN(TAGS, 3 + (seed % 2), seed); // 3~4개 태그
}

// 가짜 매칭 점수(지역/중성화/소형 우대)
export function fakeMatchScore({ senior, pet }) {
  let s = 50;
  const sAddr = String(senior?.address || senior?.city || '부산');
  const pAddr = String(pet?.careAddr || '');
  if (pAddr.includes(sAddr.split(' ')[0])) s += 25;        // 같은 시/구 가점
  const ne = String(pet?.neuter ?? '').toUpperCase();
  if (ne === 'Y' || ne === 'YES' || ne === 'TRUE') s += 5;  // 중성화 가점
  const sizeSmall = /소형|small|포메|말티|푸들|치와와|슈나|시츄/i.test(`${pet?.breed || ''}${pet?.species || ''}`);
  if (sizeSmall) s += 8;                                     // 소형 우대
  return Math.max(0, Math.min(100, Math.round(s)));
}
