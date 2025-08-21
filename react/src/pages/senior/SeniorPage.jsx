// src/pages/senior/SeniorPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { getPetsRecommended, RecoMode } from '../../api/recommendations';
import './senior.css';

const MODES = [
  { key: RecoMode.CONSERVATIVE, label: '보수' },
  { key: RecoMode.BALANCED,     label: '균형' },
  { key: RecoMode.MANAGER,      label: '매니저' },
];

export default function SeniorPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const seniorId = user?.seniorId || user?.id;

  // URL 쿼리 동기화
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = useMemo(
    () => (searchParams.get('mode') || RecoMode.BALANCED),
    [] // 최초 1회
  );
  const initialPage = useMemo(
    () => Math.max(0, Number(searchParams.get('page') || 0)),
    [] // 최초 1회
  );

  // UI 상태
  const [mode, setMode] = useState(initialMode);
  const [page, setPage] = useState(initialPage);
  const [size] = useState(12);

  // 데이터 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [pageMeta, setPageMeta] = useState({ totalElements: 0, totalPages: 1, number: 0, size });

  // URL 동기화 (mode/page 변경 시)
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set('mode', mode);
    next.set('page', String(page));
    // 동일 값이면 replaceState만 일어나도록 체크
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
    let alive = true;
    (async () => {
      await load();
      // 페이지 바뀔 때 스크롤 상단
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seniorId, mode, page, size]);

  const onApply = (pet) => {
    // 동의 모달/신청 API는 다음 단계에서 붙이고, 지금은 신청 페이지로 이동만
    nav(`/pet/${pet.id}/apply`);
  };

  return (
    <div className="senior container" style={{ padding: 16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>추천 유기동물</h1>
        <div style={{ display:'flex', gap: 8 }}>
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

      {/* 로딩 스켈레톤 */}
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
                    onClick={() => onApply(it)}
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
    </div>
  );
}
