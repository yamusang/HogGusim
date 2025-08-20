// src/pages/shelter/ShelterAnimalsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { fetchAnimals } from '../../api/animals';
import './shelter.css';

const fmtDate = (d) => (!d ? '' : String(d).slice(0,10).replaceAll('-', '.'));

export default function ShelterAnimalsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const location = useLocation();

  const careNm = useMemo(
    () =>
      (user?.affiliation ||
        sessionStorage.getItem('affiliation') ||
        localStorage.getItem('selectedCareNm') ||
        '').trim(),
    [user]
  );

  const pageFromUrl = Number(sp.get('page') || 0);
  const sizeFromUrl = Number(sp.get('size') || 20);
  const statusFilter = sp.get('status') || 'ALL'; // ALL | AVAILABLE | ENDED

  const [page, setPage] = useState(pageFromUrl);
  const [size, setSize] = useState(sizeFromUrl);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [detail, setDetail] = useState(null);

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
      // ⛔ 서버 정렬/상태 필터 확실치 않으므로 파라미터 최소화
      const res = await fetchAnimals({ page, size, careNm });

      let list = res.content || [];
      if (statusFilter !== 'ALL') {
        list = list.filter(row => toEndedKey(row.status) === statusFilter);
      }

      setRows(list);
      const totalCount =
        statusFilter === 'ALL'
          ? Number.isFinite(res.totalElements) ? res.totalElements : list.length
          : list.length;
      setTotal(totalCount);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [careNm, page, size, statusFilter]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / size));

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

      <section className="card">
        <div className="card__head" style={{gap:12}}>
          <h2 className="card__title">목록</h2>
          <div style={{display:'flex', gap:8, alignItems:'center', marginLeft:'auto'}}>
            <select value={statusFilter} onChange={onChangeStatus}>
              <option value="ALL">전체</option>
              <option value="AVAILABLE">보호중</option>
              {/* <option value="ENDED">종료</option> */}
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
          <div className="petgrid">
            {rows.map((a) => {
              const title = a.name || a.species || a.breed || '이름/품종 미상';
              const meta = [a.gender || a.sex, a.age, a.weight].filter(Boolean).join(' · ');
              const date = fmtDate(a.happenDt || a.createdAt);
              const statusKey = toEndedKey(a.status);
              const statusLabel = statusKey === 'AVAILABLE' ? '보호중' : '종료';

              return (
                <article key={a.id} className="petcard" onClick={() => setDetail(a)} role="button">
                  <div className="petcard__media">
                    {a.photoUrl
                      ? <img src={a.photoUrl} alt={title} loading="lazy"
                             onError={(e)=>{ e.currentTarget.style.display='none'; }} />
                      : <div className="petcard__placeholder">NO IMAGE</div>}
                    <span className={`chip ${statusKey==='AVAILABLE' ? 'chip--blue' : 'chip--gray'}`}>{statusLabel}</span>
                  </div>
                  <div className="petcard__body">
                    <h3 className="petcard__title">{title}</h3>
                    <p className="petcard__meta">{meta || a.color || '-'}</p>
                    <p className="petcard__sub">{careNm}{date ? ` · 입소 ${date}` : ''}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="shelter__pagination">
            <Button presetName="ghost" disabled={page<=0} onClick={()=>setPage(p=>Math.max(0,p-1))}>이전</Button>
            <span>{page+1} / {totalPages}</span>
            <Button presetName="ghost" disabled={page+1>=totalPages} onClick={()=>setPage(p=>p+1)}>다음</Button>
          </div>
        )}
      </section>

      {detail && <DetailModal data={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="detail__row">
      <div className="detail__label">{label}</div>
      <div className="detail__value">{value}</div>
    </div>
  );
}

function DetailModal({ data, onClose }) {
  const navigate = useNavigate();

  const closeOnBg = (e) => { if (e.target === e.currentTarget) onClose?.(); };
  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const neuterLabel = data.neuter === 'Y' ? '중성화 O'
                    : data.neuter === 'N' ? '중성화 X' : '중성화 미상';

  const animalId = data.id ?? data.animalId ?? data.desertionNo ?? data.noticeNo ?? null;

  return (
    <div className="modal" onMouseDown={closeOnBg}>
      <div className="modal__panel">
        <button className="modal__close" onClick={onClose} aria-label="닫기">×</button>

        <div className="detail">
          <div className="detail__media">
            {data.photoUrl
              ? <img src={data.photoUrl} alt={data.name || data.breed || ''} />
              : <div className="petcard__placeholder">NO IMAGE</div>}
          </div>

          <div className="detail__content">
            <h3 className="detail__title">{data.name || data.species || data.breed || '동물 정보'}</h3>
            <div className="detail__chips">
              {data.gender && <span className="chip chip--gray">{data.gender}</span>}
              {neuterLabel && <span className="chip chip--gray">{neuterLabel}</span>}
              {data.breed && <span className="chip chip--gray">{data.breed}</span>}
            </div>

            <div className="detail__rows">
              <Row label="나이" value={data.age} />
              <Row label="체중" value={data.weight} />
              <Row label="모색" value={data.color} />
              <Row label="특이사항" value={data.specialMark} />
              <Row label="공고기간" value={
                data.noticeSdt || data.noticeEdt
                  ? `${fmtDate(data.noticeSdt)} ~ ${fmtDate(data.noticeEdt)}`
                  : null
              } />
              <Row label="보호소" value={data.careNm} />
              <Row label="연락처" value={data.careTel} />
              <Row label="주소" value={data.careAddr} />
            </div>

            <div className="detail__actions">
              <Button onClick={onClose}>닫기</Button>
              <Button
                disabled={!animalId}
                onClick={() => { if (animalId) navigate(`/shelter/animals/${animalId}/applications`); }}
              >
                신청자 관리
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
