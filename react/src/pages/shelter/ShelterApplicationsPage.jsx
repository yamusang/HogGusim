// src/pages/shelter/ShelterApplicationsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import {
  listByPet,
  approveApplication,
  rejectApplication,
  updateApplication,   // ✅ 추가
} from '../../api/applications';
import './shelter.css';

const fmtDT = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('ko-KR'); } catch { return iso; }
};

// YYYY-MM-DDTHH:mm 값 → ISO 문자열로 변환
const localToIso = (local) => {
  if (!local) return null;
  // local like "2025-08-23T14:30"
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

// ISO → input[type=datetime-local] 값
const isoToLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function ShelterApplicationsPage() {
  const navigate = useNavigate();
  const { animalId } = useParams();
  const [sp, setSp] = useSearchParams();

  const pageFromUrl = Number(sp.get('page') || 0); // 0-based
  const sizeFromUrl = Number(sp.get('size') || 10);
  const statusFilter = (sp.get('status') || 'ALL').toUpperCase(); // ALL | PENDING | APPROVED | REJECTED

  const [page, setPage] = useState(pageFromUrl);
  const [size, setSize] = useState(sizeFromUrl);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [actingId, setActingId] = useState(null);

  // 편집중(열린) 항목 ID
  const [editingId, setEditingId] = useState(null);
  const [editReservedAt, setEditReservedAt] = useState(''); // datetime-local
  const [editNote, setEditNote] = useState('');

  // 서버 페이지 응답
  const [data, setData] = useState({
    content: [],
    number: 0,
    size: sizeFromUrl,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    empty: true,
  });

  const rows = useMemo(() => {
    const raw = Array.isArray(data?.content) ? data.content : [];
    if (statusFilter === 'ALL') return raw;
    return raw.filter((r) => (r.status || 'PENDING').toUpperCase() === statusFilter);
  }, [data, statusFilter]);

  const totalPages = Math.max(1, data.totalPages || 1);

  const reload = async () => {
    if (!animalId) return;
    setLoading(true);
    setErr('');
    try {
      const res = await listByPet(Number(animalId), { page, size });
      setData(res);
    } catch (e) {
      setErr(e?.message || '신청자 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [animalId, page, size]);

  // URL 동기화
  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set('page', String(page));
    next.set('size', String(size));
    next.set('status', statusFilter);
    setSp(next, { replace: true });
    // eslint-disable-next-line
  }, [page, size, statusFilter]);

  const onApprove = async (id) => {
    if (!window.confirm('이 신청을 승인할까요?')) return;
    try {
      setActingId(id);
      await approveApplication(id);
      await reload();
    } catch (e) {
      alert(e?.message || '승인에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const onReject = async (id) => {
    if (!window.confirm('이 신청을 거절할까요?')) return;
    try {
      setActingId(id);
      await rejectApplication(id);
      await reload();
    } catch (e) {
      alert(e?.message || '거절에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setEditReservedAt(isoToLocal(item.reservedAt));
    setEditNote(item.note || '');
  };
  const closeEdit = () => {
    setEditingId(null);
    setEditReservedAt('');
    setEditNote('');
  };

  const onSaveEdit = async () => {
    if (!editingId) return;
    try {
      setActingId(editingId);
      const payload = {
        reservedAt: editReservedAt ? localToIso(editReservedAt) : null,
        note: editNote ?? '',
      };
      await updateApplication(editingId, payload);
      closeEdit();
      await reload();
    } catch (e) {
      alert(e?.message || '저장에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const badgeTone = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    return s === 'APPROVED' ? 'badge--ok' : s === 'REJECTED' ? 'badge--no' : 'badge--wait';
  };

  return (
    <div className="shelter">
      <header className="shelter__header">
        <div>
          <h1 className="shelter__title">동물 #{animalId} · 신청자 관리</h1>
          <p className="shelter__subtitle">총 {rows.length}건 (페이지 {page + 1}/{totalPages})</p>
        </div>
        <div className="shelter__actions">
          <Button onClick={() => navigate(-1)}>목록으로</Button>
        </div>
      </header>

      <section className="card">
        <div className="card__head" style={{ gap: 12 }}>
          <h2 className="card__title">신청 목록</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                const v = e.target.value;
                const next = new URLSearchParams(sp);
                next.set('status', v);
                next.set('page', '0');
                setSp(next, { replace: true });
                setPage(0);
              }}
            >
              <option value="ALL">전체</option>
              <option value="PENDING">대기</option>
              <option value="APPROVED">승인</option>
              <option value="REJECTED">거절</option>
            </select>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
            >
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
            </select>
          </div>
        </div>

        {loading && <div className="card__body">불러오는 중…</div>}
        {err && !loading && <div className="card__error" style={{ color: 'crimson' }}>{err}</div>}

        {!loading && !err && rows.length === 0 && (
          <div className="list__empty">신청자가 없습니다.</div>
        )}

        {!loading && !err && rows.length > 0 && (
          <div className="pet__list">
            {rows.map((it) => {
              const seniorName = it.senior?.name || it.seniorName || `Senior#${it.seniorId}`;
              const mgrName =
                it.manager?.name || it.managerName || (it.managerId ? `Manager#${it.managerId}` : '배정 없음');
              const status = it.status || 'PENDING';
              const editing = editingId === it.id;

              return (
                <div key={it.id} className="pet__row">
                  <div className="pet__row-main">
                    <div className="title">
                      <span className={`badge ${badgeTone(status)}`}>{status}</span>{' '}
                      신청자: {seniorName} &nbsp;·&nbsp; 매니저: {mgrName}
                    </div>
                    <div className="sub">
                      {it.createdAt && <>신청일: {fmtDT(it.createdAt)} · </>}
                      {it.reservedAt && <>예약일: <b>{fmtDT(it.reservedAt)}</b> · </>}
                      {it.phone && <>연락처: {it.phone} · </>}
                      신청ID: {it.id}
                    </div>

                    {/* ✅ 인라인 편집 폼 */}
                    {editing && (
                      <div className="editbox">
                        <div className="editbox__grid">
                          <label className="editbox__field">
                            <span className="editbox__label">예약일시</span>
                            <input
                              type="datetime-local"
                              value={editReservedAt}
                              onChange={(e) => setEditReservedAt(e.target.value)}
                            />
                          </label>
                          <label className="editbox__field editbox__field--wide">
                            <span className="editbox__label">메모</span>
                            <input
                              type="text"
                              placeholder="비고/준비물/특이사항 등"
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                            />
                          </label>
                        </div>
                        <div className="editbox__actions">
                          <Button
                            disabled={actingId === it.id}
                            onClick={onSaveEdit}
                          >
                            {actingId === it.id ? '저장 중…' : '저장'}
                          </Button>
                          <Button presetName="ghost" onClick={closeEdit}>취소</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="shelter__app-actions">
                    {!editing && (
                      <Button presetName="ghost" onClick={() => openEdit(it)}>
                        예약/메모
                      </Button>
                    )}
                    <Button
                      disabled={actingId === it.id || status === 'APPROVED'}
                      onClick={() => onApprove(it.id)}
                    >
                      {actingId === it.id ? '승인 중…' : '승인'}
                    </Button>
                    <Button
                      presetName="ghost"
                      disabled={actingId === it.id || status === 'REJECTED'}
                      onClick={() => onReject(it.id)}
                    >
                      {actingId === it.id ? '거절 중…' : '거절'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 페이지네이션 */}
        {!loading && totalPages > 1 && (
          <div className="shelter__pagination">
            <Button
              presetName="ghost"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              이전
            </Button>
            <span>
              {page + 1} / {totalPages}
            </span>
            <Button
              presetName="ghost"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
