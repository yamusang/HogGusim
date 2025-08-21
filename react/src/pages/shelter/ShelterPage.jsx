import React, { useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import useAuth from '../../hooks/useAuth';
import {
  fetchAnimals,
  createAnimal,
  uploadAnimalPhoto,
} from '../../api/animals';
import {
  listApplicationsByShelter,
  approveApplication,
  rejectApplication,
} from '../../api/applications';
import './shelter.css';

const statusLabel = (s) => {
  const t = String(s || '').toUpperCase();
  if (t.includes('ADOPT')) return '매칭완료';
  if (t.includes('PENDING') || t.includes('REVIEW')) return '대기중';
  if (t.includes('MATCH') || t.includes('RESERVED')) return '매칭중';
  if (t.includes('RETURN')) return '복귀';
  if (t.includes('AVAIL') || t.includes('PROTECT')) return '보호중';
  return s || '보호중';
};

export default function ShelterPage() {
  const { user } = useAuth();
  const careNm = useMemo(
    () => user?.careNm || user?.affiliation || sessionStorage.getItem('affiliation') || localStorage.getItem('selectedCareNm') || '',
    [user]
  );

  const [tab, setTab] = useState('ANIMALS'); // ANIMALS | APPS
  const [animals, setAnimals] = useState([]);
  const [appsPage, setAppsPage] = useState({ content: [], number: 0, size: 20, totalElements: 0 });
  const [appsStatusFilter, setAppsStatusFilter] = useState('PENDING'); // PENDING/APPROVED/REJECTED/ALL
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    breed: '',
    sex: 'M',
    neuter: 'N',
    status: 'AVAILABLE',
    photo: null,
  });

  const loadAnimals = async () => {
    setLoading(true);
    try {
      const page = await fetchAnimals({ page: 0, size: 60, careNm });
      setAnimals((page?.content || []).map(a => ({ ...a, _labelStatus: statusLabel(a.status) })));
    } finally {
      setLoading(false);
    }
  };

  const loadApps = async ({ number = 0, size = 20 } = {}) => {
    setLoading(true);
    try {
      const status = appsStatusFilter === 'ALL' ? undefined : appsStatusFilter;
      const page = await listApplicationsByShelter({ careNm, status, page: number, size });
      setAppsPage(page);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAnimals(); }, [careNm]);
  useEffect(() => { if (tab === 'APPS') loadApps({ number: 0 }); }, [tab, appsStatusFilter, careNm]);

  const submitCreate = async (e) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      // 1) 동물 등록
      const payload = {
        name: form.name,
        breed: form.breed,
        sex: form.sex,            // 'M'|'F'
        neuter: form.neuter,      // 'Y'|'N'
        status: form.status,      // 'AVAILABLE' 등
        careNm,                   // 백에서 필요 없으면 지워도 됨
      };
      const created = await createAnimal(payload);

      // 2) 사진 업로드(선택)
      if (form.photo) {
        await uploadAnimalPhoto(created?.id || created?.animalId || created, form.photo);
      }

      setCreateOpen(false);
      setForm({ name:'', breed:'', sex:'M', neuter:'N', status:'AVAILABLE', photo:null });
      await loadAnimals();
    } finally {
      setCreating(false);
    }
  };

  const onApprove = async (id) => { await approveApplication(id); await loadApps({ number: appsPage.number }); };
  const onReject  = async (id) => { await rejectApplication(id);  await loadApps({ number: appsPage.number }); };

  return (
    <div className="shelter">
      <div className="shelter__header">
        <div>
          <h1>보호소 대시보드</h1>
          <div className="shelter__sub">소속: <strong>{careNm || '미지정'}</strong></div>
        </div>
        <div className="shelter__tabs">
          <button className={tab==='ANIMALS'?'on':''} onClick={()=>setTab('ANIMALS')}>등록 동물</button>
          <button className={tab==='APPS'?'on':''} onClick={()=>setTab('APPS')}>신청 처리</button>
        </div>
      </div>

      {tab === 'ANIMALS' && (
        <>
          <div className="bar">
            <Button onClick={loadAnimals} disabled={loading}>{loading ? '불러오는 중…' : '새로고침'}</Button>
            <Button onClick={()=>setCreateOpen(true)}>동물 등록</Button>
          </div>

          {createOpen && (
            <form className="create" onSubmit={submitCreate}>
              <div className="grid-3">
                <label>이름<input value={form.name} onChange={e=>setForm(f=>({ ...f, name:e.target.value }))} required/></label>
                <label>품종<input value={form.breed} onChange={e=>setForm(f=>({ ...f, breed:e.target.value }))} required/></label>
                <label>성별
                  <select value={form.sex} onChange={e=>setForm(f=>({ ...f, sex:e.target.value }))}>
                    <option value="M">수컷</option><option value="F">암컷</option>
                  </select>
                </label>
                <label>중성화
                  <select value={form.neuter} onChange={e=>setForm(f=>({ ...f, neuter:e.target.value }))}>
                    <option value="Y">예</option><option value="N">아니오</option>
                  </select>
                </label>
                <label>상태
                  <select value={form.status} onChange={e=>setForm(f=>({ ...f, status:e.target.value }))}>
                    <option value="AVAILABLE">보호중</option>
                    <option value="MATCHING">매칭중</option>
                    <option value="ADOPTED">매칭완료</option>
                    <option value="RETURNED">복귀</option>
                  </select>
                </label>
                <label>사진
                  <input type="file" accept="image/*"
                    onChange={e=>setForm(f=>({ ...f, photo:e.target.files?.[0] || null }))}/>
                </label>
              </div>
              <div className="create__actions">
                <Button type="button" variant="ghost" onClick={()=>setCreateOpen(false)}>취소</Button>
                <Button type="submit" disabled={creating}>{creating ? '등록 중…' : '등록하기'}</Button>
              </div>
            </form>
          )}

          <div className="shelter__grid">
            {animals.map(a => (
              <Card key={a.id}>
                <div className="pet-card">
                  <img src={a.photoUrl || a._raw?.popfile || '/placeholder-dog.png'} alt={a.name || '유기동물'} />
                  <div className="pet-card__body">
                    <div className="pet-card__head">
                      <strong>{a.name || '(이름없음)'}</strong>
                      <Badge>{a._labelStatus}</Badge>
                    </div>
                    <div className="pet-card__meta" style={{flexWrap:'wrap'}}>
                      <span>{a.breed || a.species || '-'}</span>
                      <span>{(a.gender || a.sex || '-').toString()}</span>
                      <span>{String(a.neuter||a.neuterYn).toUpperCase()==='Y' ? '중성화' : '미중성화'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'APPS' && (
        <>
          <div className="bar">
            <div className="filters">
              <select value={appsStatusFilter} onChange={e=>setAppsStatusFilter(e.target.value)}>
                <option value="PENDING">대기중</option>
                <option value="APPROVED">승인</option>
                <option value="REJECTED">거절</option>
                <option value="ALL">전체</option>
              </select>
            </div>
            <Button onClick={()=>loadApps({ number: appsPage.number })} disabled={loading}>
              {loading ? '불러오는 중…' : '새로고침'}
            </Button>
          </div>

          <ul className="apps">
            {(appsPage.content || []).map(it => (
              <li key={it.id} className="app-item">
                <div className="left">
                  <img src={it.pet?.photoUrl || it.pet?.popfile || '/placeholder-dog.png'} alt="" />
                  <div>
                    <div className="title">{it.pet?.name || '(이름없음)'}</div>
                    <div className="sub">
                      {(it.pet?.breed || it.pet?.species || '-')}&nbsp;·&nbsp;
                      {(it.pet?.gender || it.pet?.sex || '-').toString()}&nbsp;·&nbsp;
                      {(String(it.pet?.neuter||'').toUpperCase()==='Y') ? '중성화':'미중성화'}
                    </div>
                    <div className="note">{it.note || '-'}</div>
                  </div>
                </div>
                <div className="right">
                  <Badge>{statusLabel(it.status)}</Badge>
                  {it.status === 'PENDING' && (
                    <div className="row">
                      <Button onClick={()=>onApprove(it.id)}>승인</Button>
                      <Button variant="ghost" onClick={()=>onReject(it.id)}>거절</Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {(!loading && (appsPage.content||[]).length === 0) && (
            <div className="empty">현재 조건의 신청이 없습니다.</div>
          )}
        </>
      )}
    </div>
  );
}
