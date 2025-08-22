// src/utils/storage.js

// ───────── applications (신청 목록)
export const getApps = () => {
  try { return JSON.parse(localStorage.getItem('applications') || '[]'); }
  catch { return []; }
};
export const setApps = (next) => {
  try { localStorage.setItem('applications', JSON.stringify(next)); } catch {}
};
export const updateApp = (appId, updater) => {
  const cur = getApps();
  const next = cur.map(a => a.id === appId ? (typeof updater === 'function' ? updater(a) : { ...a, ...updater }) : a);
  setApps(next);
  return next.find(a => a.id === appId);
};

// ───────── 매니저 프로필
const MGR_PROFILE_KEY = 'manager_profile';
export const getManagerProfile = () => {
  try { return JSON.parse(localStorage.getItem(MGR_PROFILE_KEY) || '{}'); } catch { return {}; }
};
export const setManagerProfile = (p) => {
  try { localStorage.setItem(MGR_PROFILE_KEY, JSON.stringify(p || {})); } catch {}
};

// ───────── 신청별 매니저 연결 (manager_by_app)
const MBA_KEY = 'manager_by_app';
export const getManagerMap = () => {
  try { return JSON.parse(localStorage.getItem(MBA_KEY) || '{}'); } catch { return {}; }
};
export const setManagerMap = (obj) => {
  try { localStorage.setItem(MBA_KEY, JSON.stringify(obj || {})); } catch {}
};
export const setManagerByApp = (appId, mgr) => {
  const all = getManagerMap();
  all[appId] = mgr;
  setManagerMap(all);
};
export const getManagerByApp = (appId) => getManagerMap()[appId] || null;

// ───────── 일정 확정 (시니어가 최종 확정)
export const confirmSchedule = (appId) => {
  const app = updateApp(appId, (a) => ({
    ...a,
    schedule: {
      date: a.date,        // 신청서에서 선택한 날짜
      slot: a.slot,        // 신청서에서 선택한 시간대(길이 포함)
      confirmed: true,
      confirmedAt: Date.now()
    }
  }));
  return app;
};
