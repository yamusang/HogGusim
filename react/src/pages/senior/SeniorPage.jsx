import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { fetchRecommendedPets, fetchAnimals } from '../../api/animals'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/ui/Button'
import './senior.css'

export default function SeniorPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const seniorId = user?.id || user?.seniorId

  const [page, setPage] = useState(1)
  const [data, setData] = useState({ content: [], total: 0, size: 10 })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('');
  const [isFallback, setIsFallback] = useState(false)

  const load = async () => {
    if (!seniorId) return;
    setLoading(true);
    setErr('');
    setIsFallback(false);
    try {
      let res = await fetchRecommendedPets({ seniorId, page, size: 10 });
      if (!res?.content?.length) {
        const fallback = await fetchAnimals({
          available: true,        
          page,
          size: 10,
          sort: 'createdAt,DESC',
        });
        res = fallback;
        setIsFallback(true);
      }

      setData(res);
    } catch (e) {
      setErr(e.message || '추천을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, seniorId]);

  const selectPet = (pet) => {
    localStorage.setItem('selectedPet', JSON.stringify(pet));
    navigate(`/senior/apply?petId=${pet.id}`);
  };

  return (
      <div className="senior">
    <div className="senior__header">
      <h1>추천 유기동물</h1>
      <Button onClick={() => navigate('/logout')}>
        로그아웃
      </Button>
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
              subtitle={`${pet.breed || '-'} · ${pet.age ?? '-'}살`}
              actions={<Badge variant="available">입양가능</Badge>}
              footer={
                <Button presetName="apply" onClick={() => selectPet(pet)}>
                  선택하기
                </Button>
              }
            >
              성격: {pet.temperament ?? '-'} · 중성화: {pet.neutered ? '예' : '아니오'}
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

      {/* 필요 시: 직접 탐색 섹션은 나중에 아래에 추가 (주소/중성화/질병 필터) */}
    </div>
  );
}
