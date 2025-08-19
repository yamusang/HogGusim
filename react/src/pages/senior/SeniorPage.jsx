// src/pages/senior/SeniorPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { fetchAnimals } from '../../api/animals';
import { getPetsRecommended } from '../../api/recommendations'; // ✅ 변경
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/ui/Button';
import './senior.css';

export default function SeniorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const seniorId = user?.id || user?.seniorId;

  const [page, setPage] = useState(1); // UI는 1-base, API는 0-base
  const [data, setData] = useState({ content: [], total: 0, size: 10 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [isFallback, setIsFallback] = useState(false);

  const load = async () => {
    if (!seniorId) return;
    setLoading(true);
    setErr('');
    setIsFallback(false);
    try {
      // ✅ 알고리즘 추천 호출 (0-based page)
      let res = await getPetsRecommended(seniorId, Math.max(0, page - 1), 10);

      // Page 아닌 배열 형태일 수도 있으니 방어
      if (Array.isArray(res)) res = { content: res, total: res.length, size: 10 };

      // 추천 없으면 AVAILABLE 전체에서 폴백
      if (!res?.content?.length) {
        const fallback = await fetchAnimals({
          available: true,
          page,               // 기존 animals API가 1-base면 유지
          size: 10,
          sort: 'createdAt,DESC',
        });
        setIsFallback(true);
        setData(fallback || { content: [], total: 0, size: 10 });
        return;
      }

      // ✅ 추천 응답은 (id, desertionNo, photoUrl, matchScore)만 있으니
      // 카드가 기대하는 필드로 가볍게 매핑
      const mapped = {
        ...res,
        content: (res.content || []).map((it) => ({
          id: it.id,
          name: `#${it.desertionNo || it.id}`,
          breed: '-',                 // 정보 없음 → placeholder
          age: '-',                   // 정보 없음 → placeholder
          temperament: '-',           // 정보 없음 → placeholder
          neutered: null,             // 정보 없음 → null
          photoUrl: it.photoUrl || null,
          _score: it.matchScore,      // 필요 시 표시 가능
        })),
      };

      setData(mapped);
    } catch (e) {
      setErr(e.message || '추천을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, seniorId]);

  // ✅ 카드 선택 시 매니저 추천 화면으로 이동
  const selectPet = (pet) => {
    localStorage.setItem('selectedPet', JSON.stringify(pet));
    navigate(`/pet/${pet.id}/managers`);
  };

  return (
    <div className="senior">
      <div className="senior__header">
        <h1>추천 유기동물</h1>
        <Button onClick={() => navigate('/logout')}>로그아웃</Button>
      </div>

      {isFallback && (
        <div className="senior__notice">
          추천 결과가 없어 전체 목록(입양 가능)에서 보여드려요.
        </div>
      )}

      {err && <div className="auth__error">{err}</div>}

      {loading ? (
        <p>불러오는 중…</p>
      ) : (
        <div className="senior__grid">
          {data.content.map((pet) => (
            <Card
              key={pet.id}
              variant="elevated"
              media={pet.photoUrl ? <img src={pet.photoUrl} alt={pet.name} /> : null}
              title={pet.name}
              subtitle={`${pet.breed || '-'} · ${pet.age ?? '-' }살`}
              actions={<Badge variant="available">입양가능</Badge>}
              footer={
                <Button presetName="apply" onClick={() => selectPet(pet)}>
                  선택하기
                </Button>
              }
            >
              성격: {pet.temperament ?? '-'} · 중성화: {pet.neutered == null ? '-' : pet.neutered ? '예' : '아니오'}
              {/* 점수 노출 원하면:  적합도 {pet._score?.toFixed?.(1)} */}
            </Card>
          ))}
          {data.content.length === 0 && <p>표시할 결과가 없습니다.</p>}
        </div>
      )}

      <div className="senior__pagination">
        <Button presetName="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          이전
        </Button>
        <span>{page}</span>
        <Button
          presetName="ghost"
          disabled={page * data.size >= data.total}
          onClick={() => setPage((p) => p + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
