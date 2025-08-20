// src/pages/senior/SeniorPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { getPetsRecommended } from '../../api/recommendations';
import './senior.css';

const MODES = [
  { key: 'conservative', label: '보수' },
  { key: 'balanced',     label: '균형' },
  { key: 'manager',      label: '매니저' },
];

export default function SeniorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // seniorId 계산 (user.seniorId → user.id → localStorage.seniorId)
  const seniorId =
    user?.seniorId ??
    user?.id ??
    (localStorage.getItem('seniorId') ? Number(localStorage.getItem('seniorId')) : null);

  // 신청 직후 or ?mode=recommend이면 추천부터
  const initialRecommend = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    if ((qs.get('mode') || '').toLowerCase() === 'recommend') return true;
    return localStorage.getItem('afterApply') === '1';
  }, [location.search]);

  // URL로 추천 모드 지정 가능: ?recoMode=balanced
  const initialRecoMode = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    const m = (qs.get('recoMode') || '').toLowerCase();
    return ['conservative', 'balanced', 'manager'].includes(m) ? m : 'balanced';
  }, [location.search]);

  // 매니저 모드는 권한 있을 때만 노출
  const canSeeManager = ['MANAGER', 'SHELTER', 'ADMIN'].includes((user?.role || '').toUpperCase());

  const [isReco, setIsReco] = useState(initialRecommend);
  const [recoMode, setRecoMode] = useState(initialRecoMode);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [errStatus, setErrStatus] = useState(0); // ⭐ 추가
  const [page1, setPage1] = useState(1); // UI 1-based
  const [data, setData] = useState({
    content: [], number: 0, size: 12, totalElements: 0, totalPages: 0, first: true, last: true, empty: true,
  });

  // 진행 중 요청 취소용
  const abortRef = useRef(null);

  // afterApply 1회성 제거
  useEffect(() => {
    if (localStorage.getItem('afterApply') === '1') localStorage.removeItem('afterApply');
  }, []);

  // URL이 바뀌면 추천/모드 동기화
  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const wantReco = (qs.get('mode') || '').toLowerCase() === 'recommend';
    const m = (qs.get('recoMode') || '').toLowerCase();
    setIsReco(wantReco);
    if (['conservative', 'balanced', 'manager'].includes(m)) setRecoMode(m);
    if (wantReco) setPage1(1);
  }, [location.search]);

  // 추천 로드 (요청 경합 방지 + 재시도 버튼 지원)
  const loadRecommended = async () => {
    if (!seniorId) return;
    setLoading(true); setErr(''); setErrStatus(0);

    // 이전 요청 취소
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await getPetsRecommended(
        seniorId,
        { mode: recoMode, page: Math.max(0, page1 - 1), size: data.size || 12 },
        { signal: ctrl.signal } // getPetsRecommended가 signal 지원하는 버전이면 전달됨
      );
      if (ctrl.signal.aborted) return;

      setData({
        content: Array.isArray(res?.content) ? res.content : [],
        number: res?.number ?? 0,
        size: res?.size ?? (data.size || 12),
        totalElements: res?.totalElements ?? 0,
        totalPages: res?.totalPages ?? 0,
        first: !!res?.first,
        last: !!res?.last,
        empty: !!res?.empty,
      });
    } catch (e) {
      if (!ctrl.signal.aborted) {
        const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
        setErr(offline ? '오프라인 상태예요. 네트워크를 확인해 주세요.' : (e?.message || '추천을 불러오지 못했습니다.'));
        setErrStatus(e?.status || 0); // ⭐ 추가
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    if (isReco) loadRecommended();
    return () => { abortRef.current?.abort(); };
  }, [isReco, page1, recoMode, seniorId]); // 의존성 OK

  // 모드 전환 시 URL 동기화
  const setModeAndSync = (m) => {
    setRecoMode(m);
    const qs = new URLSearchParams(location.search);
    qs.set('mode', 'recommend');
    qs.set('recoMode', m);
    navigate({ pathname: location.pathname, search: qs.toString() }, { replace: true });
    setPage1(1);
  };

  const onClickApply = (pet) => {
    localStorage.setItem('selectedPet', JSON.stringify({
      id: pet.id, breed: pet.breed ?? '', photoUrl: pet.photoUrl ?? pet.thumbnail ?? '', desertionNo: pet.desertionNo ?? null,
    }));
    navigate(`/pet/${pet.id}/apply`);
  };

  const noPages = !data.totalPages || data.totalPages <= 0;

  return (
    <div className="senior">
      <div className="senior__header">
        <h1>{isReco ? '맞춤 추천 동물' : '입양/체험 신청'}</h1>
        <div style={{ display:'flex', gap:8 }}>
          {isReco ? (
            <Button presetName="ghost" onClick={() => { setIsReco(false); setPage1(1);
              const qs = new URLSearchParams(location.search);
              qs.delete('mode'); qs.delete('recoMode');
              navigate({ pathname: location.pathname, search: qs.toString() }, { replace: true });
            }}>
              신청 화면으로
            </Button>
          ) : null}
          <Button presetName="connectbtn" onClick={() => navigate('/senior/connect')}>내 신청 현황</Button>
          <Button presetName="ghost" onClick={() => navigate('/logout')}>로그아웃</Button>
        </div>
      </div>

      {/* 모드 스위치 (추천일 때만) */}
      {isReco && (
        <div className="seg" style={{ marginBottom: 8 }}>
          {MODES.filter(m => m.key !== 'manager' || canSeeManager).map(m => (
            <button
              key={m.key}
              className={`seg__btn ${recoMode === m.key ? 'is-active' : ''}`}
              onClick={() => setModeAndSync(m.key)}
              aria-pressed={recoMode === m.key}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* 추천 모드 */}
      {isReco ? (
        <>
          {loading && <p>불러오는 중…</p>}
          {err && !loading && (
            <div className="auth__error" role="alert" style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span>{err}</span>
              <Button presetName="ghost" onClick={loadRecommended}>재시도</Button>
              {errStatus === 500 && (
                <Button onClick={() => navigate('/animals')}>보호소 동물 보러가기</Button>
              )}
            </div>
          )}

          {!loading && !err && (
            <div className="senior__grid">
              {(data.content || []).map((it) => (
                <Card
                  key={it.id}
                  variant="elevated"
                  media={
                    (it.photoUrl || it.thumbnail) ? (
                      <img
                        src={it.photoUrl || it.thumbnail}
                        alt={it.breed || it.name || `#${it.id}`}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src=''; e.currentTarget.style.opacity = 0.25; }}
                      />
                    ) : null
                  }
                  title={it.breed || '품종 미상'}
                  subtitle={[it.sex || '-', it.neuter || '-', (it.age || '').trim() || null]
                    .filter(Boolean).join(' · ')}
                  actions={typeof it.matchScore === 'number'
                    ? <Badge>매칭점수 {Math.round(it.matchScore)}</Badge>
                    : null}
                  footer={<Button type="button" presetName="apply" onClick={() => onClickApply(it)}>신청하기</Button>}
                >
                  {it.reason
                    ? <span title={it.reason}>{it.reason}</span>
                    : <span className="muted">추천 이유 정보 없음</span>}
                </Card>
              ))}

              {(!data.content || data.content.length === 0) && (
                <div className="card" style={{ maxWidth: 680 }}>
                  <p>조건에 맞는 추천이 없어요.</p>
                  <ul className="muted" style={{ marginTop: 6 }}>
                    <li>부산 내 주소인지 확인해 주세요.</li>
                    <li>약관/바디캠 동의가 완료되었는지 확인해 주세요.</li>
                    <li>모드를 <em>보수 → 균형 → (권한 시) 매니저</em>로 바꿔 보세요.</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 페이지네이션 */}
          <div className="senior__pagination">
            <Button
              presetName="ghost"
              disabled={noPages || page1 <= 1 || data.first}
              onClick={() => setPage1((p) => Math.max(1, p - 1))}
            >
              이전
            </Button>
            <span>{noPages ? 0 : page1}</span>
            <Button
              presetName="ghost"
              disabled={noPages || data.last || (page1 >= data.totalPages)}
              onClick={() => setPage1((p) => p + 1)}
            >
              다음
            </Button>
          </div>
        </>
      ) : (
        // 신청 유도 화면
        <div className="card" style={{ maxWidth: 680 }}>
          <h2 className="h6">입양/체험을 신청하시면 맞춤 추천을 보여드려요</h2>
          <p className="muted">간단한 정보 입력 후, 알고리즘이 어르신께 맞는 동물을 추천해드립니다.</p>
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <Button presetName="applibtn" onClick={() => navigate('/senior/apply')}>신청하러 가기</Button>
            <Button presetName="ghost" onClick={() => {
              setIsReco(true); setPage1(1);
              const qs = new URLSearchParams(location.search);
              qs.set('mode', 'recommend'); qs.set('recoMode', recoMode);
              navigate({ pathname: location.pathname, search: qs.toString() }, { replace: true });
            }}>
              (데모) 추천 먼저 보기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
