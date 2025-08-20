// src/pages/shelter/ShelterApplicationsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import {
  listByPet,
  approveApplication,
  rejectApplication,
  updateApplication,
} from '../../api/applications';
import { buildICS, downloadText } from '../../utils/ics';
import './shelter.css';

const fmtDT = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('ko-KR'); } catch { return iso; }
};

// YYYY-MM-DDTHH:mm → ISO(UTC) 문자열
const localToIso = (local) => {
  if (!local) return null;
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
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// 간단 CSV 만들기
const toCSV = (rows=[]) => {
  const header = ['id','status','seniorName','managerName','phone','createdAt','reservedAt','memo'];
  const esc = (v='') => {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [header.join(',')];
  rows.forEach((it) => {
    const seniorName = it.senior?.name || it.seniorName || `Senior#${it.seniorId}`;
    const mgrName = it.manager?.name || it.managerName || (it.managerId ? `Manager#${it.managerId}` : '');
    lines.push([
      it.id,
      it.status || 'PENDING',
      seniorName,
      mgrName,
      it.phone || '',
      it.createdAt || '',
      it.reservedAt || '',
      it.memo || '',
    ].map(esc).join(','));
  });
  return lines.join('\n');
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

  // 편집 상태
  const [editingId, setEditingId] = useState(null);
  const [editReservedAt, setEditReservedAt] = useState(''); // datetime-local
  const [editNote, setEditNote] = useState(''); // 화면 변수명은 note, 서버는 memo

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
    setEditNote(item.memo || '');
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
        memo: editNote ?? '',
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

  // ✅ CSV 다운로드
  const downloadCSV = () => {
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const statusPart = statusFilter === 'ALL' ? 'ALL' : statusFilter;
    a.download = `applications_animal-${animalId}_${statusPart}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ✅ ICS 다운로드(개별)
  const downloadICS = (item) => {
    if (!item?.reservedAt) {
      alert('예약일이 없습니다. 먼저 예약일을 저장해 주세요.');
      return;
    }
    const seniorName = item.senior?.name || item.seniorName || `Senior#${item.seniorId}`;
    const mgrName =
      item.manager?.name || item.managerName || (item.managerId ? `Manager#${item.managerId}` : '미배정');

    const title = `입양/체험 예약 - 신청#${item.id}`;
    const descLines = [
      `신청자: ${seniorName}`,
      `매니저: ${mgrName}`,
      item.memo ? `메모: ${item.memo}` : null,
      item.phone ? `연락처: ${item.phone}` : null,
    ].filter(Boolean).join('\n');

    const ics = buildICS({
      uid: `application-${item.id}@matchpet`,
      startISO: item.reservedAt,
      // endISO는 기본 1시간 (buildICS에서 기본값 처리)
      title,
      description: descLines,
      location: '', // 필요 시 보호소 주소/명 추가
    });

    downloadText(`application-${item.id}.ics`, ics);
  };

  return (
    <div className="shelter">
      <header className="shelter__header">
        <div>
          <h1 className="shelter__title">동물 #{animalId} · 신청자 관리</h1>
          <p className="shelter__subtitle">총 {rows.length}건 (페이지 {page + 1}/{totalPages})</p>
        </div>
        <div className="shelter__actions" style={{ display:'flex', gap:8 }}>
          <Button presetName="ghost" onClick={downloadCSV}>CSV 다운로드</Button>
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

                    {/* 인라인 편집 폼 */}
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

                  <div className="shelter__app-actions" style={{ display:'flex', gap:8, alignItems:'center' }}>
                    {/* ICS 버튼 */}
                    <Button
                      presetName="ghost"
                      disabled={!it.reservedAt}
                      onClick={() => downloadICS(it)}
                      title={it.reservedAt ? '캘린더(.ics) 다운로드' : '예약일이 있어야 생성됩니다'}
                    >
                      일정(.ics)
                    </Button>

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
