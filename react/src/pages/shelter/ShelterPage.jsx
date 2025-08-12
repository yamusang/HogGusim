import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { fetchAnimals } from '../../api/animals'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/ui/Button'
import RegisterPetForm from './RegisterPetForm'
import './shelter.css'

export default function ShelterPage() {
  const navigate = useNavigate();
  const { user } = useAuth()
  const shelterId = user?.id || user?.shelterId

  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const load = async () => {
    if (!shelterId) return
    setLoading(true)
    setErr('')
    try {
      const res = await fetchAnimals({ shelterId, page: 1, size: 20, sort: 'createdAt,DESC' })
      setAnimals(res.content || [])
    } catch (e) {
      setErr(e.message || '목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [shelterId])

  const getBadgeVariant = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'available'
      case 'PENDING':   return 'pending'
      case 'MATCHED':   return 'matched'
      case 'ADOPTED':   return 'adopted'
      default:          return 'info'
    }
  }

  return (
    <div className="shelter">
      <h1>보호소 관리</h1>

      <div className="shelter__section">
        <h2>동물 등록</h2>
        <RegisterPetForm onSuccess={load} />
      </div>

  
      <div className="shelter__section">
        <h2>내 보호소 동물 목록</h2>
        {err && <div className="auth__error">{err}</div>}

        {loading ? (
          <p>불러오는 중…</p>
        ) : (
          <div className="shelter__grid">
            {animals.map((pet) => (
              <Card
                key={pet.id}
                variant="outline"  // 'outlined' -> 'outline' 로 수정 (우리 Card.jsx 매핑과 일치)
                media={pet.photoUrl ? <img src={pet.photoUrl} alt={pet.name} /> : null}
                title={pet.name}
                subtitle={`${pet.breed || '-'} · ${pet.age ?? '-'}살`}
                actions={<Badge variant={getBadgeVariant(pet.status)}>{pet.status}</Badge>}
                footer={
                  <div className="card__footer-actions" style={{ display:'flex', gap:8 }}>
                    <Button
                      presetName="connect"
                      onClick={() => navigate(`/pet/${pet.id}`)} // 신청/매칭 상세로 이동
                    >
                      신청 보기
                    </Button>
                    <Button
                      presetName="danger"
                      onClick={() => console.log('삭제 TODO')}
                    >
                      삭제
                    </Button>
                  </div>
                }
              >
                성격: {pet.temperament ?? '-'} · 중성화: {pet.neutered ? '예' : '아니오'}
              </Card>
            ))}
            {animals.length === 0 && <p>등록된 동물이 없습니다.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
