// src/pages/shelter/ShelterPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { fetchAnimals } from '../../api/animals';
import { listApplicationsByShelter, approveApplication, rejectApplication } from '../../api/applications';

const fmtDate = (d) => (!d ? '' : String(d).slice(0, 16).replace('T', ' ').replaceAll('-', '.'));

async function loadAllAnimals(params) {
  const pageSize = 100;
  let page = 0, all = [];
  while (true) {
    const { content, totalPages } = await fetchAnimals({ ...params, page, size: pageSize, sort: 'id,DESC' });
    all = all.concat(content || []);
    page += 1;
    if (page >= (totalPages || 1)) break;
  }
  return all;
}

export default function ShelterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [shelterName, setShelterName] = useState('');
  const [metaLoading, setMetaLoading] = useState(true);

  const [animals, setAnimals] = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [animalsError, setAnimalsError] = useState('');

  const [apps, setApps] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsError, setAppsError] = useState('');
  const [appsFilter, setAppsFilter] = useState('ALL'); // ALL | PENDING | APPROVED | REJECTED
  const [appsActingId, setAppsActingId] = useState(null);

  const displayEmail = user?.email || '';
  const careNm = useMemo(() => (
    (user?.affiliation ||
     sessionStorage.getItem('affiliation') ||
     localStorage.getItem('selectedCareNm') || '')
  ).trim(), [user]);

  useEffect(() => {
    setMetaLoading(true);
    setShelterName(careNm || '보호소');
    setMetaLoading(false);
  }, [careNm]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!careNm) {
        setAnimals([]); setAnimalsLoading(false); setAnimalsError('로그인 정보에 보호소명이 없습니다.'); return;
      }
      setAnimalsLoading(true); setAnimalsError('');
      try {
        let list = await loadAllAnimals({ careNm });
        if (list.length === 0) { try { list = await loadAllAnimals({ carenm: careNm }); } catch {} }
        if (!ignore) setAnimals(list);
      } catch (e) {
        if (ignore) return;
        const status = e?.response?.status || e?.status;
        if (status === 401 || status === 403) setAnimalsError('권한이 없습니다. 다시 로그인해주세요.');
        else setAnimalsError(e?.response?.data?.message || e?.message || '보호 중인 동물을 불러오지 못했어요.');
      } finally {
        if (!ignore) setAnimalsLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [careNm, navigate]);

  const reloadApps = async () => {
    if (!careNm) { setApps([]); setAppsLoading(false); setAppsError('보호소 정보가 없습니다.'); return; }
    setAppsLoading(true); setAppsError('');
    try {
      const apiStatus = appsFilter === 'ALL' ? undefined : appsFilter;
      const res = await listApplicationsByShelter({ careNm, status: apiStatus, page: 0, size: 20 });
      setApps(res.content || []);
    } catch (e) {
      setAppsError(e?.response?.data?.message || e.message || '신청 현황을 불러오지 못했습니다.');
    } finally {
      setAppsLoading(false);
    }
  };
  useEffect(() => { reloadApps(); /* eslint-disable-next-line */ }, [careNm, appsFilter]);

  const onApprove = async (id) => {
    if (!window.confirm('이 신청을 승인할까요?')) return;
    try { setAppsActingId(id); await approveApplication(id); await reloadApps(); }
    catch (e) { alert(e?.response?.data?.message || e.message || '승인 실패'); }
    finally { setAppsActingId(null); }
  };
  const onReject = async (id) => {
    if (!window.confirm('이 신청을 거절할까요?')) return;
    try { setAppsActingId(id); await rejectApplication(id); await reloadApps(); }
    catch (e) { alert(e?.response?.data?.message || e.message || '거절 실패'); }
    finally { setAppsActingId(null); }
  };

  const goNewPet  = () => navigate('/shelter/animals/new');
  const goAllPets = () => navigate('/shelter/animals');
  const goLogout  = () => navigate('/logout');

  const count = animals?.length || 0;

  return (
    <div className="shelter">
      <header className="shelter__header">
        <div className="shelter__titlebox">
          <h1 className="shelter__title">{metaLoading ? '보호소 불러오는 중…' : (shelterName || '보호소')}</h1>
          <p className="shelter__subtitle">관리자: {displayEmail || '이메일 확인 불가'}</p>
        </div>
        <div className="shelter__actions">
          <Button presetName="primary" onClick={goNewPet}>보호 동물 등록</Button>
          <Button presetName="ghost" onClick={goAllPets}>전체 목록 보기</Button>
          <Button presetName="danger" onClick={goLogout}>로그아웃</Button>
        </div>
      </header>

      <section className="card">
        <div className="card__head">
          <h2 className="card__title">신청 현황</h2>
          <div style={{display:'flex', gap:8, alignItems:'center', marginLeft:'auto'}}>
            <select value={appsFilter} onChange={(e)=>setAppsFilter(e.target.value)}>
              <option value="ALL">전체</option>
              <option value="PENDING">대기</option>
              <option value="APPROVED">승인</option>
              <option value="REJECTED">거절</option>
            </select>
          </div>
        </div>

        {appsLoading && <div className="card__body">불러오는 중…</div>}
        {appsError && !appsLoading && <div className="card__error" style={{color:'crimson'}}>{appsError}</div>}
        {!appsLoading && !appsError && apps.length === 0 && (
          <div className="list__empty">신청 내역이 없습니다.</div>
        )}

        {!appsLoading && !appsError && apps.length > 0 && (
          <div className="shelter__apps">
            {apps.map((it) => (
              <div key={it.id} className="shelter__app-row">
                <div className="shelter__app-main">
                  <div className="title">
                    신청자: {it.seniorName || `Senior#${it.seniorId}`}
                    {' · '}
                    동물: {it.animalName || `Animal#${it.animalId}`}
                  </div>
                  <div className="sub">
                    상태: <b>{it.status}</b>
                    {it.createdAt && <> · 신청일: {fmtDate(it.createdAt)}</>}
                    {it.managerName && <> · 매니저: {it.managerName}</>}
                  </div>
                </div>
                <div className="shelter__app-actions">
                  <Button disabled={appsActingId === it.id} onClick={() => onApprove(it.id)}>
                    {appsActingId === it.id ? '승인 중…' : '승인'}
                  </Button>
                  <Button presetName="ghost" disabled={appsActingId === it.id} onClick={() => onReject(it.id)}>
                    {appsActingId === it.id ? '거절 중…' : '거절'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <main className="shelter__content">
        <section className="card">
          <div className="card__head">
            <h2 className="card__title">보호 중인 동물</h2>
            <span className="card__meta" style={{fontSize:12, color:'#6b7280'}}>총 {count}마리</span>
            <Link to="/shelter/animals" className="card__link">더 보기</Link>
          </div>

          {animalsLoading && <div className="card__body">목록을 불러오는 중…</div>}
          {animalsError && !animalsLoading && <div className="card__error">{animalsError}</div>}
          {!animalsLoading && !animalsError && count === 0 && (
            <div className="card__body">등록된 보호 동물이 없습니다. 먼저 등록해 보세요.</div>
          )}

          {!animalsLoading && !animalsError && count > 0 && (
            <ul className="list">
              {animals.map((a, i) => {
                const title = a.name || a.species || a.breed || a.color || '이름/품종 미상';
                const metaParts = [a.gender || a.sex, a.age, a.weight].filter(Boolean);
                if (metaParts.length === 0 && a.color) metaParts.push(a.color);
                const neuterLabel = a.neuter === 'Y' ? '중성화 O' : a.neuter === 'N' ? '중성화 X' : '중성화 미상';
                const statusUpper = String(a.status || '').toUpperCase();
                const statusLabel =
                    statusUpper === 'AVAILABLE' || a.status === '보호중' ? '보호중'
                  : statusUpper === 'ADOPTED'   || a.status === '입양완료' ? '입양완료'
                  : a.status || '상태 미상';

                return (
                  <li key={a.id ?? `${a.careNm}-${i}`} className="list__item" style={{
                    display:'flex', gap:12, alignItems:'center',
                    padding:'12px 14px', border:'1px solid #e5e7eb',
                    borderRadius:12, marginBottom:10, background:'#fff'
                  }}>
                    <div style={{
                      width:64, height:64, borderRadius:10, overflow:'hidden',
                      background:'#f3f4f6', flex:'0 0 auto', display:'flex', alignItems:'center', justifyContent:'center'
                    }}>
                      {a.photoUrl
                        ? <img src={a.photoUrl} alt={title} loading="lazy"
                               style={{width:'100%', height:'100%', objectFit:'cover'}}
                               onError={(e)=>{e.currentTarget.style.display='none';}}/>
                        : <span style={{fontSize:12, color:'#9ca3af'}}>no image</span>}
                    </div>
                    <div style={{flex:'1 1 auto', minWidth:0}}>
                      <div style={{fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{title}</div>
                      <div style={{fontSize:13, color:'#6b7280', marginTop:2}}>{metaParts.join(' · ')}</div>
                      <div style={{fontSize:12, color:'#9ca3af', marginTop:4, display:'flex', gap:8, flexWrap:'wrap'}}>
                        <span>{a.careNm || shelterName}</span>
                      </div>
                    </div>
                    <div style={{display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end'}}>
                      <span style={{fontSize:12, padding:'2px 8px', borderRadius:999, background:'#eef2ff', color:'#4338ca'}}>{statusLabel}</span>
                      <span style={{fontSize:12, padding:'2px 8px', borderRadius:999, background:'#f1f5f9', color:'#334155'}}>{neuterLabel}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card__head"><h2 className="card__title">빠른 작업</h2></div>
          <div className="quickgrid">
            <button className="quick" onClick={goNewPet}>신규 보호 동물 등록</button>
            <button className="quick" onClick={goAllPets}>전체 목록 보기</button>
            <button className="quick" onClick={() => navigate('/shelter')}>대시보드 새로고침</button>
          </div>
        </section>
      </main>
    </div>
  );
}
