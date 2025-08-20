import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import {
  fetchManagerQueue,
  takeApplication,
  releaseApplication,
  forwardToShelter,
} from '../../api/manager';
import { updateApplication } from '../../api/applications'; // 예약/메모 patch 재사용
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

export default function ManagerQueuePage() {
  const [status, setStatus] = useState('PENDING'); // ALL|PENDING|IN_PROGRESS|FORWARDED
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

  const load = async () => {
    setLoading(true); setErr('');
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      const res = await fetchManagerQueue({ status, page, size, signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      setData(res || { content: [], number: page, size, totalElements:0, totalPages:0, first:true, last:true, empty:true });
    } catch (e) {
      if (!ctrl.signal.aborted) setErr(e?.message || '목록을 불러오지 못했습니다.');
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  };

  useEffect(()=>{ load(); return ()=>abortRef.current?.abort(); /* eslint-disable-next-line */}, [status, page, size]);

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
      await forwardToShelter(id, {}); // 필요 시 memo 포함 가능
      await load();
    } catch (e) {
      alert(e?.message || '전달 실패');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="manager">
      <header className="manager__header">
        <div>
          <h1 className="manager__title">매니저 작업 큐</h1>
          <p className="manager__subtitle">대기 → 처리중 → 보호소 전달</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Link to="/logout">
            <Button presetName="ghost">로그아웃</Button>
          </Link>
        </div>
      </header>

      <section className="card">
        <div className="card__head">
          <h2 className="card__title">신청 목록</h2>
          <div style={{display:'flex', gap:8, marginLeft:'auto', alignItems:'center'}}>
            <select value={status} onChange={e=>{ setPage(0); setStatus(e.target.value); }}>
              <option value="PENDING">대기</option>
              <option value="IN_PROGRESS">처리중</option>
              <option value="FORWARDED">전달 완료</option>
              <option value="ALL">전체</option>
            </select>
            <select value={size} onChange={e=>{ setPage(0); setSize(Number(e.target.value)); }}>
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
          <div className="pet__list">
            {rows.map((it) => {
              const seniorName = it.senior?.name || it.seniorName || `Senior#${it.seniorId}`;
              const petName    = it.animal?.name || it.petName || `Animal#${it.animalId}`;
              const ownerName  = it.ownerManager?.name || it.managerName; // 현재 담당자
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

                    {/* 상태에 따른 액션 */}
                    {it.status === 'PENDING' && (
                      <Button disabled={actingId===it.id} onClick={()=>onTake(it.id)}>
                        {actingId===it.id ? '처리중…' : '내가 맡기'}
                      </Button>
                    )}
                    {it.status === 'IN_PROGRESS' && (
                      <>
                        <Button presetName="ghost" disabled={actingId===it.id} onClick={()=>onRelease(it.id)}>
                          {actingId===it.id ? '반납중…' : '반납'}
                        </Button>
                        <Button disabled={actingId===it.id} onClick={()=>onForward(it.id)}>
                          {actingId===it.id ? '전달중…' : '보호소로 전달'}
                        </Button>
                      </>
                    )}
                    {it.status === 'FORWARDED' && (
                      <Button presetName="ghost" disabled>전달 완료</Button>
                    )}
                  </div>
                </div>
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
    </div>
  );
}
