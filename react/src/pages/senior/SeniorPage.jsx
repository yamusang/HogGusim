// src/pages/senior/SeniorPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { getPetsRecommended } from '../../api/recommendations';
import './senior.css';

export default function SeniorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userId = user?.id;

  // 신청 직후 or ?mode=recommend이면 추천부터 보여주기
  const initialRecommend = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    if ((qs.get('mode') || '').toLowerCase() === 'recommend') return true;
    return localStorage.getItem('afterApply') === '1';
  }, [location.search]);

  const [isReco, setIsReco] = useState(initialRecommend);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [page, setPage] = useState(1); // 1-based
  const [data, setData] = useState({ content: [], total: 0, size: 12 });

  // afterApply 플래그는 1회성 (마운트 시)
  useEffect(() => {
    if (localStorage.getItem('afterApply') === '1') {
      localStorage.removeItem('afterApply');
    }
  }, []);

  // 쿼리스트링이 바뀌어도 모드 즉시 동기화
  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const wantReco = (qs.get('mode') || '').toLowerCase() === 'recommend';
    setIsReco(wantReco);
    if (wantReco) setPage(1);
  }, [location.search]);

  // 추천 로드 (백엔드 알고리즘 결과 그대로 표시)
  const loadRecommended = async () => {
    if (!userId) return;
    setLoading(true); setErr('');
    try {
      const res = await getPetsRecommended(userId, Math.max(0, page - 1), 12);
      const mapped = {
        ...res,
        content: (res.content || []).map(it => ({
          id: it.id || it.animalId || it.petId,
          name: it.name || it.petName || `#${it.desertionNo || it.id}`,
          breed: it.breed || it.kind || '-',
          age: it.age ?? it.petAge ?? '-',
          temperament: it.temperament || it.character || '-',
          neutered: typeof it.neutered === 'boolean'
            ? it.neutered
            : (String(it.neutered ?? '').toUpperCase() === 'Y'),
          photoUrl: it.photoUrl || it.thumbnail || it.imageUrl || null,
          careNm: it.careNm || it.shelterName || '',
          _score: it.matchScore ?? it.score,
        })),
      };
      setData(mapped);
    } catch (e) {
      setErr(e?.message || '추천을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReco) loadRecommended();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReco, page, userId]);

  const onClickApply = (pet) => {
    localStorage.setItem('selectedPet', JSON.stringify(pet));
    navigate(`/pet/${pet.id}/apply`);
  };

  return (
    <div className="senior">
      <div className="senior__header">
        <h1>{isReco ? '맞춤 추천 동물' : '입양/체험 신청'}</h1>
        <div style={{ display:'flex', gap:8 }}>
          {isReco ? (
            <Button presetName="ghost" onClick={() => { setIsReco(false); setPage(1); }}>
              신청 화면으로
            </Button>
          ) : null}
          <Button onClick={() => navigate('/senior/connect')} presetName="connectbtn">
            내 신청 현황
          </Button>
          <Button presetName="ghost" onClick={() => navigate('/logout')}>
            로그아웃
          </Button>
        </div>
      </div>

      {/* 추천 모드 */}
      {isReco ? (
        <>
          {loading && <p>불러오는 중…</p>}
          {err && !loading && <div className="auth__error">{err}</div>}

          {!loading && !err && (
            <div className="senior__grid">
              {(data.content || []).map((pet) => (
                <Card
                  key={pet.id}
                  variant="elevated"
                  media={pet.photoUrl ? <img src={pet.photoUrl} alt={pet.name || `#${pet.id}`} /> : null}
                  title={pet.name || `#${pet.id}`}
                  subtitle={`${pet.breed || '-'} · ${pet.age ?? '-' }살`}
                  actions={pet._score ? <Badge>매칭점수 {Math.round(pet._score)}</Badge> : null}
                  footer={
                    <Button
                      type="button"
                      presetName="apply"
                      onClick={() => onClickApply(pet)}
                    >
                      신청하기
                    </Button>
                  }
                >
                  성격: {pet.temperament ?? '-'} · 중성화: {pet.neutered == null ? '-' : pet.neutered ? '예' : '아니오'}{pet.careNm ? ` · ${pet.careNm}` : ''}
                </Card>
              ))}
              {(!data.content || data.content.length === 0) && (
                <div className="card" style={{ maxWidth: 680 }}>
                  <p>표시할 결과가 없습니다.</p>
                  <div style={{ display:'flex', gap:8, marginTop:12 }}>
                    <Button presetName="applibtn" onClick={() => navigate('/senior/apply')}>
                      신청하러 가기
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 페이지네이션 */}
          <div className="senior__pagination">
            <Button presetName="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
            <span>{page}</span>
            <Button
              presetName="ghost"
              disabled={(page * (data.size || 12)) >= (data.total || 0)}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </Button>
          </div>
        </>
      ) : (
        // 신청 유도 화면 (간단 CTA)
        <div className="card" style={{ maxWidth: 680 }}>
          <h2 className="h6">입양/체험을 신청하시면 맞춤 추천을 보여드려요</h2>
          <p className="muted">간단한 정보 입력 후, 알고리즘이 어르신께 맞는 동물을 추천해드립니다.</p>
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <Button presetName="applibtn" onClick={() => navigate('/senior/apply')}>
              신청하러 가기
            </Button>
            {/* 데모용 버튼은 필요 없으면 삭제 */}
            <Button presetName="ghost" onClick={() => { setIsReco(true); setPage(1); }}>
              (데모) 추천 먼저 보기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
