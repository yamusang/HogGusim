// src/pages/senior/ConnectPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import useAuth from '../../hooks/useAuth';
import { fetchMyApplications, cancelApplication } from '../../api/applications';
import Button from '../../components/ui/Button';
import Badge from '../../components/common/Badge';
import './senior.css';

const fmtDateTime = (iso) => {
  try {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('ko-KR');
  } catch {
    return iso ?? '-';
  }
};

const statusMeta = {
  PENDING:   { label: '대기',    tone: 'warning'  },
  APPROVED:  { label: '수락',    tone: 'success'  },
  REJECTED:  { label: '거절',    tone: 'danger'   },
  CANCELED:  { label: '취소됨',  tone: 'neutral'  },
};

export default function ConnectPage() {
  const { user } = useAuth();

  // seniorId fallback: user.seniorId > user.id > localStorage
  const seniorId = useMemo(() => {
    const fromLS = localStorage.getItem('seniorId');
    return user?.seniorId ?? user?.id ?? (fromLS ? Number(fromLS) : null);
  }, [user]);

  const [page, setPage] = useState(1); // 1-based
  const [data, setData] = useState({ content: [], total: 0, size: 10, number: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [actingId, setActingId] = useState(null);

  // lightweight toast
  const [toast, setToast] = useState({ show: false, text: '', tone: 'neutral' });
  const showToast = (text, tone = 'neutral') => {
    setToast({ show: true, text, tone });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ show: false, text: '', tone: 'neutral' }), 2200);
  };

  const load = async () => {
    if (!seniorId) return;
    setLoading(true); setErr('');
    try {
      const res = await fetchMyApplications({ seniorId, page: Math.max(0, page - 1), size: 10 });
      setData(res || { content: [], total: 0, size: 10, number: page - 1, totalPages: 1 });
    } catch (e) {
      setErr(e?.message || '신청 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, seniorId]);

  const onCancel = async (id) => {
    if (!window.confirm('이 신청을 취소할까요?')) return;
    try {
      setActingId(id);
      await cancelApplication(id);
      await load();
      showToast('신청을 취소했어요.', 'neutral');
    } catch (e) {
      showToast(e?.message || '취소 실패', 'danger');
    } finally {
      setActingId(null);
    }
  };

  const list = data.content || [];
  const totalPages = data.totalPages || Math.max(1, Math.ceil((data.total || 0) / (data.size || 10)));

  return (
    <div className="senior">
      <header className="senior__header">
        <h1>내 신청 현황</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button presetName="ghost" onClick={() => (window.location.href = '/senior?mode=recommend')}>
            추천 보러가기
          </Button>
        </div>
      </header>

      {/* toast */}
      {toast.show && (
        <div
          className="card"
          role="status"
          style={{
            position: 'fixed', right: 16, bottom: 16, zIndex: 50,
            borderColor: toast.tone === 'danger' ? '#fecaca' : '#e5e7eb',
            color: toast.tone === 'danger' ? '#b91c1c' : '#111827',
          }}
        >
          {toast.text}
        </div>
      )}

      {loading && <div className="card">불러오는 중…</div>}
      {err && !loading && <div className="card" style={{ color: 'crimson' }}>{err}</div>}

      {!loading && !err && list.length === 0 && (
        <div className="card">신청 내역이 없습니다.</div>
      )}

      {!loading && !err && list.length > 0 && (
        <section className="card">
          <ul className="list">
            {list.map((app) => {
              const st = (app.status || 'PENDING').toUpperCase();
              const meta = statusMeta[st] || { label: st, tone: 'neutral' };
              return (
                <li
                  key={app.id}
                  className="list__item"
                  style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}
                >
                  <div>
                    <div className="list__name" style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span>{app.animalName || `Animal#${app.animalId}`}</span>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    <div className="list__meta" style={{ fontSize: 12, color: '#6b7280' }}>
                      신청일: {fmtDateTime(app.createdAt)}
                      {app.reservedAt ? ` / 예약일: ${fmtDateTime(app.reservedAt)}` : ''}
                      {app.updatedAt ? ` / 처리: ${fmtDateTime(app.updatedAt)}` : ''}
                    </div>
                  </div>
                  <div>
                    <Button
                      presetName="danger"
                      disabled={
                        actingId === app.id ||
                        (app.status && String(app.status).toUpperCase() !== 'PENDING')
                      }
                      onClick={() => onCancel(app.id)}
                    >
                      {actingId === app.id ? '취소 중…' : '신청 취소'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <Button
                presetName="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                이전
              </Button>
              <span style={{ alignSelf: 'center' }}>
                {page} / {totalPages}
              </span>
              <Button
                presetName="ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
