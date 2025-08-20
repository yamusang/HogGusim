// src/pages/shelter/ShelterAnimalsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { fetchAnimals } from '../../api/animals';
import './shelter.css';

const fmtDate = (d) => (!d ? '' : String(d).slice(0,10).replaceAll('-', '.'));

export default function ShelterAnimalsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();

  const careNm = useMemo(() =>
    (user?.affiliation ||
     sessionStorage.getItem('affiliation') ||
     localStorage.getItem('selectedCareNm') || '').trim()
  , [user]);

  // 쿼리 파라미터 (페이지/상태)
  const pageFromUrl  = Number(sp.get('page') || 0);
  const sizeFromUrl  = Number(sp.get('size') || 20);
  const statusFilter = sp.get('status') || 'ALL'; // ALL | AVAILABLE | ENDED

  const [page, setPage] = useState(pageFromUrl);
  const [size, setSize] = useState(sizeFromUrl);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // 상태 변환(백엔드가 ENDED를 따로 안 쓰면 ADOPTED/RETURNED를 종료로 묶어서 표시)
  const toEndedKey = (s) => {
    const v = String(s || '').toUpperCase();
    return ['ADOPTED','RETURNED','ENDED','입양완료','복귀'].includes(v) ? 'ENDED'
         : v === 'AVAILABLE' || v === '보호중' ? 'AVAILABLE'
         : v;
  };

  const reload = async () => {
    if (!careNm) { setErr('보호소 정보가 없습니다.'); setLoading(false); return; }
    setLoading(true); setErr('');
    try {
      // 백엔드가 status 파라미터를 지원하면 넘겨서 서버에서 필터:
      const serverStatus = statusFilter === 'ALL' ? undefined
                         : statusFilter === 'ENDED' ? 'ENDED' // 지원하면 ENDED, 아니면 프론트에서 거름
                         : 'AVAILABLE';

      const res = await fetchAnimals({
        page, size, sort: 'id,DESC',
        careNm,
        status: serverStatus, // 없으면 서버는 무시함
      });

      let list = res.content || [];
      // 서버 필터 미지원 대비 프론트 필터
      if (statusFilter !== 'ALL') {
        list = list.filter(row => toEndedKey(row.status) === statusFilter);
      }

      setRows(list);
      setTotal(res.total ?? list.length);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [careNm, page, size, statusFilter]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / size));

  // URL 동기화
  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set('page', String(page));
    next.set('size', String(size));
    next.set('status', statusFilter);
    setSp(next, { replace: true });
    // eslint-disable-next-line
  }, [page, size, statusFilter]);

  const onChangeStatus = (e) => {
    setPage(0);
    setSp(prev => { const n = new URLSearchParams(prev); n.set('status', e.target.value); return n; });
  };

  return (
    <div className="shelter">
      <header className="shelter__header">
        <div>
          <h1 className="shelter__title">{careNm || '보호소'} · 전체 동물</h1>
          <p className="shelter__subtitle">총 {total}마리</p>
        </div>
        <div className="shelter__actions">
          <Button onClick={() => navigate('/shelter')}>대시보드</Button>
          <Button presetName="primary" onClick={() => navigate('/shelter/animals/new')}>동물 등록</Button>
        </div>
      </header>

      {/* 필터/컨트롤 */}
      <section className="card">
        <div className="card__head" style={{gap:12}}>
          <h2 className="card__title">목록</h2>
          <div style={{display:'flex', gap:8, alignItems:'center', marginLeft:'auto'}}>
            <select value={statusFilter} onChange={onChangeStatus}>
              <option value="ALL">전체</option>
              <option value="AVAILABLE">보호중</option>
              <option value="ENDED">종료</option>
            </select>
            <select value={size} onChange={e => { setPage(0); setSize(Number(e.target.value)); }}>
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
            </select>
          </div>
        </div>

        {loading && <div className="card__body">불러오는 중…</div>}
        {err && !loading && <div className="card__error" style={{color:'crimson'}}>{err}</div>}

        {!loading && !err && rows.length === 0 && (
          <div className="list__empty">데이터가 없습니다.</div>
        )}

        {!loading && !err && rows.length > 0 && (
          <ul className="list" style={{marginTop:8}}>
            {rows.map((a, i) => {
              const title = a.name || a.species || a.breed || a.color || '이름/품종 미상';
              const meta = [a.gender || a.sex, a.age, a.weight].filter(Boolean).join(' · ');
              const date = fmtDate(a.happenDt || a.createdAt);
              const statusKey = toEndedKey(a.status);
              const statusLabel = statusKey === 'AVAILABLE' ? '보호중'
                                : statusKey === 'ENDED' ? '종료' : (a.status || '상태 미상');

              return (
                <li key={a.id ?? `${careNm}-${i}`} className="list__item"
                    style={{display:'grid', gridTemplateColumns:'64px 1fr auto', gap:12, alignItems:'center'}}>
                  <div style={{
                    width:64, height:64, borderRadius:10, overflow:'hidden', background:'#f3f4f6',
                    display:'flex', alignItems:'center', justifyContent:'center'
                  }}>
                    {a.photoUrl ? (
                      <img src={a.photoUrl} alt={title} loading="lazy"
                           style={{width:'100%', height:'100%', objectFit:'cover'}}
                           onError={(e)=>{ e.currentTarget.style.display='none'; }} />
                    ) : <span style={{fontSize:12, color:'#9ca3af'}}>no image</span>}
                  </div>

                  <div style={{minWidth:0}}>
                    <div className="list__name" style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{title}</div>
                    <div className="list__meta" style={{marginTop:2}}>{meta || a.color || '-'}</div>
                    <div className="list__date" style={{marginTop:2}}>
                      {a.careNm || careNm}{date ? ` · 입소: ${date}` : ''}
                    </div>
                  </div>

                  <div className="list__sub">
                    <span style={{fontSize:12, padding:'2px 8px', borderRadius:999,
                                  background: statusKey==='AVAILABLE' ? '#eef2ff' : '#f1f5f9',
                                  color: statusKey==='AVAILABLE' ? '#4338ca' : '#334155'}}>
                      {statusLabel}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* 페이지네이션 */}
        {!loading && totalPages > 1 && (
          <div style={{display:'flex', justifyContent:'center', gap:8, marginTop:12}}>
            <Button presetName="ghost" disabled={page<=0} onClick={()=>setPage(p=>Math.max(0,p-1))}>이전</Button>
            <span style={{alignSelf:'center'}}>{page+1} / {totalPages}</span>
            <Button presetName="ghost" disabled={page+1>=totalPages} onClick={()=>setPage(p=>p+1)}>다음</Button>
          </div>
        )}
      </section>
    </div>
  );
}
