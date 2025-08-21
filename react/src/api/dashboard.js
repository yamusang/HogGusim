import api from './apiClient';

export const fetchShelterOverview = async ({ from, to } = {}) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await api.get('/shelters/me/overview', { params });
  return data; 
};


export const computeOverviewFromPets = (pets = []) => {
  const counts = pets.reduce((acc, p) => {
    const k = (p.status || 'UNKNOWN').toUpperCase();
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const recent = [...pets]
    .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
    .slice(0, 10);
  return { counts, recent };
};
