import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/ui/Button'
import './manager.css'

export default function ManagerPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const managerId = user?.id || user?.managerId;

  const [page, setPage] = useState(1)
  const [data, setData] = useState({ content: [], total: 0, size: 10 })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const load = async () => {
    if (!managerId) return
    setLoading(true)
    setErr('')
    try {
      const res = await fetchRecommendedSeniors({ managerId, page, size: 10 });
      setData(res)
    } catch (e) {
      setErr(e.message || '추천을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, managerId]);

  const selectSenior = (senior) => {
    localStorage.setItem('selectedSenior', JSON.stringify(senior))
    navigate(`/manager/connect?seniorId=${senior.id}`)
  };

  return (
    <div className="manager">
       <Button onClick={() => navigate('/logout')}>
      로그아웃
    </Button>
      <h1>추천 고령자</h1>
      {err && <div className="auth__error">{err}</div>}
      {loading ? <p>불러오는 중…</p> : (
        <div className="manager__grid">
          {data.content.map((senior) => (
            <Card
              key={senior.id}
              variant="elevated"
              title={senior.name}
              subtitle={`${senior.age}세 · ${senior.address}`}
              actions={<Badge variant="available">{senior.hasPet ? '반려 중' : '미보유'}</Badge>}
              footer={
                <Button presetName="connect" onClick={() => selectSenior(senior)}>
                  선택하기
                </Button>
              }
            >
              활동 가능 요일: {senior.availableDays?.join(', ') || '-'}<br />
              시간대: {senior.availableTime || '-'}
            </Card>
          ))}
          {data.content.length === 0 && <p>추천 결과가 없습니다.</p>}
        </div>
      )}

      <div className="manager__pagination">
        <Button presetName="ghost" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>이전</Button>
        <span>{page}</span>
        <Button presetName="ghost" disabled={(page*data.size)>=data.total} onClick={()=>setPage(p=>p+1)}>다음</Button>
      </div>
    </div>
  );
}
