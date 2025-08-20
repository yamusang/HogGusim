import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '../../components/ui/Button';
import {
  fetchManagerQueue,
  takeApplication,
  releaseApplication,
  forwardToShelter,
} from '../../api/manager';
import { updateApplication } from '../../api/applications';
import './manager.css';

const fmt = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('ko-KR'); } catch { return iso; }
};
const isoToLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return '';
  const p = (n)=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const localToIso = (local) => {
  if (!local) return null;
  const d = new Date(local); if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

export default function ManagerInboxPage() {
  // 탭: 내 담당, 미배정(가져오기), 전달완료
  const [tab, setTab] = useState('MINE'); // MINE | UNASSIGNED | FORWARDED
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const [data, setData] = useState({
    content: [], number:0, size, totalElements:0, totalPages:0, first:true, last:true, empty:true
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [actingId, setActingId] = useState(null);

  // inline edit
  const [editingId, setEditingId] = useState(null);
  const [editReservedAt, setEditReservedAt] = useState('');
  const [editMemo, setEditMemo] = useState('');

  const abortRef = useRef(null);

  // 탭별 서버 파라미터 매핑
  const queryForTab = () => {
    switch (tab) {
      case 'MINE':       return { status: 'IN_PROGRESS' };     // 내가 맡은 것
      case 'UNASSIGNED': return { status: 'PENDING' };         // 미배정 (서버가 미배정만 주도록 구현돼 있거나, 필요 시 unassigned=true 추가)
      case 'FORWARDED':  return { status: 'FORWARDED' };       // 보호소로 전달된 것
      default:           return { status: 'ALL' };
    }
  };

  const load = async () => {
    setLoading(true); setErr('');
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      const q = queryForTab();
      const res = await fetchManagerQueue({ ...q, page, size, signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      setData(res || { content: [], number: page, size, totalElements:0, totalPages:0, first:true, last:true, empty:true });
    } catch (e) {
      if (!ctrl.signal.aborted) setErr(e?.message || '목록을 불러오지 못했습니다.');
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  };

  useEffect(()=>{ load(); return ()=>abortRef.current?.abort(); /* eslint-disable-next-line */}, [tab, page, size]);

  const rows = useMemo(()=>Array.isArray(data?.content) ? data.content : [], [data]);
  const totalPages = data?.totalPages || Math.max(1, Math.ceil((data?.totalElements || 0)/(data?.size || 20)));

  const openEdit = (item) => {
    setEditingId(item.id);
    setEditReservedAt(isoToLocal(item.reservedAt));
    setEditMemo(item.memo || '');
  };
  const closeEdit = () => {
    setEditingId(null); setEditReservedAt(''); setEditMemo('');
  };

  const onSaveEdit = async () => {
    if (!editingId) return;
    try {
      setActingId(editingId);
      await updateApplication(editingId, {
        reservedAt: editReservedAt ? localToIso(editReservedAt) : null,
        memo: editMemo ?? '',
      });
      closeEdit();
      await load();
    } catch (e) {
      alert(e?.message || '저장 실패');
    } finally {
      setActingId(null);
    }
  };

  const onTake = async (id) => {
    try {
      setActingId(id);
      await takeApplication(id);
      await load();
    } catch (e) {
      alert(e?.message || '가져오기 실패');
    } finally {
      setActingId(null);
    }
  };

  const onRelease = async (id) => {
    try {
      setActingId(id);
      await releaseApplication(id);
      await load();
    } catch (e) {
      alert(e?.message || '반납 실패');
    } finally {
      setActingId(null);
    }
  };

  const onForward = async (id) => {
    if (!window.confirm('보호소로 전달하시겠어요?')) return;
    try {
      setActingId(id);
      await forwardToShelter(id, {}); // 필요 시 memo 동봉
      await load();
    } catch (e) {
      alert(e?.message || '전달 실패');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="manager-inbox">
      {/* 상단 탭 */}
      <div className="seg" style={{ marginBottom: 12 }}>
        <button
          className={`seg__btn ${tab==='MINE' ? 'is-active' : ''}`}
          onClick={() => { setTab('MINE'); setPage(0); }}
          aria-pressed={tab==='MINE'}
        >
          내 담당
        </button>
        <button
          className={`seg__btn ${tab==='UNASSIGNED' ? 'is-active' : ''}`}
          onClick={() => { setTab('UNASSIGNED'); setPage(0); }}
          aria-pressed={tab==='UNASSIGNED'}
        >
          미배정
        </button>
        <button
          className={`seg__btn ${tab==='FORWARDED' ? 'is-active' : ''}`}
          onClick={() => { setTab('FORWARDED'); setPage(0); }}
          aria-pressed={tab==='FORWARDED'}
        >
          전달완료
        </button>
      </div>

      {/* 필터/페이지 사이즈 */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card__head">
          <h2 className="card__title">신청 목록</h2>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginLeft:'auto' }}>
            <select value={size} onChange={(e)=>{ setPage(0); setSize(Number(e.target.value)); }}>
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
            </select>
          </div>
        </div>
        {loading && <div className="card__body">불러오는 중…</div>}
        {err && !loading && <div className="card__error" style={{ color:'crimson' }}>{err}</div>}
      </div>

      {/* 목록 */}
      {!loading && !err && rows.length === 0 && (
        <div className="list__empty">데이터가 없습니다.</div>
      )}

      {!loading && !err && rows.length > 0 && (
        <div className="pet__list">
          {rows.map((it) => {
            const seniorName = it.senior?.name || it.seniorName || `Senior#${it.seniorId}`;
            const petName    = it.animal?.name || it.petName || `Animal#${it.animalId}`;
            const ownerName  = it.ownerManager?.name || it.managerName;
            const editing = editingId === it.id;

            return (
              <div key={it.id} className="pet__row">
                <div className="pet__row-main">
                  <div className="pet__row-top">
                    <div className="title">
                      <b>{petName}</b> · 신청자: {seniorName}
                    </div>
                    <div className="sub">
                      신청일: {fmt(it.createdAt)}
                      {it.reservedAt && <> · 예약일: <b>{fmt(it.reservedAt)}</b></>}
                      {ownerName && <> · 담당: {ownerName}</>}
                      {it.status && <> · 상태: {it.status}</>}
                      {it.memo && <> · 메모: {it.memo}</>}
                    </div>
                  </div>

                  {editing && (
                    <div className="editbox">
                      <div className="editbox__grid">
                        <label className="editbox__field">
                          <span className="editbox__label">예약일시</span>
                          <input
                            type="datetime-local"
                            value={editReservedAt}
                            onChange={(e)=>setEditReservedAt(e.target.value)}
                          />
                        </label>
                        <label className="editbox__field editbox__field--wide">
                          <span className="editbox__label">메모</span>
                          <input
                            type="text"
                            placeholder="비고/준비물/특이사항 등"
                            value={editMemo}
                            onChange={(e)=>setEditMemo(e.target.value)}
                          />
                        </label>
                      </div>
                      <div className="editbox__actions">
                        <Button disabled={actingId===it.id} onClick={onSaveEdit}>
                          {actingId===it.id ? '저장 중…' : '저장'}
                        </Button>
                        <Button presetName="ghost" onClick={closeEdit}>취소</Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="manager__row-actions">
                  {!editing && (
                    <Button presetName="ghost" onClick={()=>openEdit(it)}>예약/메모</Button>
                  )}

                  {/* 상태별 액션 */}
                  {tab === 'UNASSIGNED' && (
                    <Button disabled={actingId===it.id} onClick={()=>onTake(it.id)}>
                      {actingId===it.id ? '처리중…' : '내가 맡기'}
                    </Button>
                  )}

                  {tab === 'MINE' && (
                    <>
                      <Button presetName="ghost" disabled={actingId===it.id} onClick={()=>onRelease(it.id)}>
                        {actingId===it.id ? '반납중…' : '반납'}
                      </Button>
                      <Button disabled={actingId===it.id} onClick={()=>onForward(it.id)}>
                        {actingId===it.id ? '전달중…' : '보호소로 전달'}
                      </Button>
                    </>
                  )}

                  {tab === 'FORWARDED' && (
                    <Button presetName="ghost" disabled>전달 완료</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="shelter__pagination">
          <Button presetName="ghost" disabled={page<=0} onClick={()=>setPage(p=>Math.max(0,p-1))}>이전</Button>
          <span>{page+1} / {totalPages}</span>
          <Button presetName="ghost" disabled={page+1>=totalPages} onClick={()=>setPage(p=>p+1)}>다음</Button>
        </div>
      )}
    </div>
  );
}
