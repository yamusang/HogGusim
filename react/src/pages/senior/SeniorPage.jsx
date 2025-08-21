// src/pages/senior/SeniorPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { getPetsRecommended, RecoMode } from '../../api/recommendations';
import api from '../../api/apiClient';
import { createApplication } from '../../api/applications';
import './senior.css';

const MODES = [
  { key: RecoMode.CONSERVATIVE, label: '보수' },
  { key: RecoMode.BALANCED,     label: '균형' },
  { key: RecoMode.MANAGER,      label: '매니저' },
];

export default function SeniorPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();
  const seniorId = user?.seniorId || user?.id;

  // URL 쿼리 동기화
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = useMemo(() => (searchParams.get('mode') || RecoMode.BALANCED), []);
  const initialPage = useMemo(() => Math.max(0, Number(searchParams.get('page') || 0)), []);

  // UI 상태
  const [mode, setMode] = useState(initialMode);
  const [page, setPage] = useState(initialPage);
  const [size] = useState(12);

  // 데이터 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [pageMeta, setPageMeta] = useState({ totalElements: 0, totalPages: 1, number: 0, size });

  // 신청 모달 상태
  const [consentOpen, setConsentOpen] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeBodycam, setAgreeBodycam] = useState(false);
  const [pendingPet, setPendingPet] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // URL 동기화
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set('mode', mode);
    next.set('page', String(page));
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [mode, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // 데이터 로드
  const load = async () => {
    if (!seniorId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getPetsRecommended(seniorId, { mode, page, size });
      setItems(data.content || []);
      setPageMeta({
        totalElements: data.totalElements ?? (data.content?.length || 0),
        totalPages: data.totalPages ?? 1,
        number: data.number ?? page,
        size: data.size ?? size,
      });
    } catch (e) {
      setError(e?.response?.data?.message || e.message || '추천 불러오기 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seniorId, mode, page, size]);

  // 로그아웃
  const onLogout = () => {
    nav(`/logout?from=${encodeURIComponent(loc.pathname)}`, { replace: true });
  };

  // 신청 버튼 → 동의 모달
  const onApplyClick = (pet) => {
    setPendingPet(pet);
    setAgreeTerms(false);
    setAgreeBodycam(false);
    setConsentOpen(true);
  };

  // 동의 확인
  const onConfirmConsent = async () => {
    if (!pendingPet) return;
    setSubmitting(true);
    try {
      const app = await createApplication({
        petId: null,
        note: user?.address || '',
        agreeTerms,
        agreeBodycam,
      });
      await api.post(`/applications/${app.id}/select-pet`, null, {
        params: { petId: pendingPet.id },
      });
      setConsentOpen(false);
      setPendingPet(null);
      nav('/senior/connect');
    } catch (e) {
       const msg =
    e?.response?.data?.message ||
    e?.response?.data?.error ||
     `${e?.response?.status || ''} ${e?.response?.statusText || ''}`.trim() ||
   e.message ||
   '신청 처리 실패';
  alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="senior container" style={{ padding: 16 }}>
      {/* 상단 바 */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        <h1 style={{ margin: 0, flex: '0 0 auto' }}>추천 유기동물</h1>

        <div style={{ display:'flex', gap: 8, flex: '0 0 auto' }}>
          {MODES.map(m => (
            <Button
              key={m.key}
              presetName={mode === m.key ? 'primary' : 'secondary'}
              onClick={() => { setMode(m.key); setPage(0); }}
            >
              {m.label}
            </Button>
          ))}
        </div>

        <div style={{ marginLeft:'auto' }}>
          <Button presetName="secondary" onClick={onLogout}>로그아웃</Button>
        </div>
      </div>

      <p style={{ color:'#6b7280', marginTop: 0, marginBottom: 16 }}>
        주소 근접도/안전도/중성화 등 기본 지표로 추천합니다. (모드는 가중치만 다르게 적용)
      </p>

      {error && (
        <div style={{ color:'#b91c1c', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
          <span>{error}</span>
          <Button presetName="secondary" onClick={load}>재시도</Button>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="reco-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="reco-card" style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow:'hidden', background:'#fff' }}>
              <div style={{ width:'100%', aspectRatio:'4 / 3', background:'#f3f4f6' }} />
              <div style={{ padding: '10px 12px' }}>
                <div style={{ height: 14, background:'#f3f4f6', borderRadius:6, marginBottom:8, width:'60%' }} />
                <div style={{ height: 12, background:'#f3f4f6', borderRadius:6, width:'40%' }} />
              </div>
              <div style={{ height:36, margin:'10px 12px 12px', background:'#f3f4f6', borderRadius:8 }} />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <>
          {items.length === 0 ? (
            <div style={{ color:'#6b7280' }}>
              조건에 맞는 동물이 없습니다.&nbsp;
              <Button presetName="secondary" onClick={() => { setMode(RecoMode.CONSERVATIVE); setPage(0); }}>
                보수 모드로 보기
              </Button>
            </div>
          ) : (
            <div className="reco-grid">
              {items.map((it) => (
                <Card key={it.id}>
                  <div className="reco-card__img">
                    {it.photoUrl ? (
                      <img
                        src={it.photoUrl}
                        alt={it.breed || `#${it.id}`}
                        onError={(e)=>{ e.currentTarget.src='/img/placeholder-dog.jpg'; }}
                      />
                    ) : (
                      <div className="noimg">NO IMAGE</div>
                    )}
                  </div>

                  <div className="reco-card__meta" style={{ padding: '10px 12px' }}>
                    <div className="reco-card__title" style={{ fontWeight: 600 }}>
                      {it.name || it.breed || `#${it.id}`}
                    </div>
                    <div className="reco-card__sub" style={{ color:'#6b7280', fontSize:12 }}>
                      {it.careName || '-'}
                    </div>

                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
                      {it.sex && <Badge>{it.sex}</Badge>}
                      {it.neuter && <Badge>중성화: {it.neuter}</Badge>}
                      {it.age && <Badge>{it.age}</Badge>}
                      {Number.isFinite(it.matchScore) && (
                        <Badge variant="info">추천 {Math.round(it.matchScore)}</Badge>
                      )}
                    </div>

                    {!!(it.reasonChips?.length) && (
                      <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                        {it.reasonChips.slice(0, 3).map((chip, i) => (
                          <Badge key={i} variant="secondary">
                            {chip.label}{chip.delta != null ? ` ${chip.delta > 0 ? '+' : ''}${chip.delta}` : ''}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    className="reco-card__btn"
                    onClick={() => onApplyClick(it)}
                    style={{
                      margin: '10px 12px 12px',
                      padding: 10,
                      border: 'none',
                      borderRadius: 8,
                      background: '#2563eb',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    신청하기
                  </button>
                </Card>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:16 }}>
            <Button
              presetName="secondary"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              이전
            </Button>
            <span style={{ fontSize:12, color:'#6b7280' }}>
              {pageMeta.number + 1} / {pageMeta.totalPages || 1}
            </span>
            <Button
              presetName="secondary"
              disabled={pageMeta.number + 1 >= (pageMeta.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </Button>
          </div>
        </>
      )}

      {/* 동의 모달 */}
      {consentOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>신청 동의</h2>
            <label style={{ display:'block', marginBottom:8 }}>
              <input type="checkbox" checked={agreeTerms} onChange={(e)=>setAgreeTerms(e.target.checked)} /> 이용약관에 동의합니다.
            </label>
            <label style={{ display:'block', marginBottom:8 }}>
              <input type="checkbox" checked={agreeBodycam} onChange={(e)=>setAgreeBodycam(e.target.checked)} /> 보디캠 촬영에 동의합니다.
            </label>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <Button presetName="secondary" onClick={()=>setConsentOpen(false)}>취소</Button>
              <Button
                presetName="primary"
                disabled={!agreeTerms || !agreeBodycam || submitting}
                onClick={onConfirmConsent}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
