import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { fetchAnimals/*, deleteAnimal*/ } from '../../api/animals'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/ui/Button'
import RegisterPetForm from './RegisterPetForm'
import './shelter.css'

export default function ShelterPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const shelterId = user?.id || user?.shelterId

  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const load = async () => {
    if (!shelterId) return
    setLoading(true); setErr('')
    try {
      const res = await fetchAnimals({ shelterId, page: 1, size: 20, sort: 'createdAt,DESC' })
      const list = (res.content || []).map(normalizePet)
      setAnimals(list)
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
      <Button onClick={() => navigate('/logout')}>로그아웃</Button>
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
              <PetProfileCard
                key={pet.id}
                pet={pet}
                onOpen={() => navigate(`/pet/${pet.id}`)}
                getBadgeVariant={getBadgeVariant}
              />
            ))}
            {animals.length === 0 && <p>등록된 동물이 없습니다.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

/* ===== 프론트 정규화 ===== */
function normalizePet(raw) {
  return {
    id: raw.id,
    photoUrl: raw.photoUrl || raw.popfile || '',
    name: raw.name || raw.petName || '이름 미정',
    breed: raw.breed || stripBrackets(raw.kindCd),
    age: raw.age ?? raw.ageNum ?? null,
    status: toLocalStatus(raw.status || raw.processState),
    temperament: raw.temperament || raw.character || raw.specialMark || '',
    neutered: typeof raw.neutered === 'boolean' ? raw.neutered : raw.neuterYn === 'Y',
    weightKg: raw.weightKg ?? toNumberOrNull(raw.weight),
  }
}
function stripBrackets(v) { return (v || '').replace(/\[|\]/g, '').trim() }
function toNumberOrNull(v) {
  if (!v) return null
  const n = parseFloat(String(v).replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : null
}
function toLocalStatus(v) {
  const s = (v || '').toUpperCase()
  if (['AVAILABLE','등록','공고중','보호중'].some(x => s.includes(x))) return 'AVAILABLE'
  if (['PENDING','대기','검토중'].some(x => s.includes(x))) return 'PENDING'
  if (['MATCH','MATCHED','매칭'].some(x => s.includes(x))) return 'MATCHED'
  if (['ADOPT','COMPLETE','완료'].some(x => s.includes(x))) return 'ADOPTED'
  return 'INFO'
}

/* ===== 카드 컴포넌트 ===== */
function PetProfileCard({ pet, onOpen, getBadgeVariant }) {
  const { photoUrl, name, breed, age, status, temperament, neutered, weightKg } = pet
  const ageText = age != null && age !== '' ? `${age}살` : '-'
  const weightText = weightKg != null && weightKg !== '' ? `${weightKg}kg` : '-'

  return (
    <Card
      variant="outline"
      media={
        photoUrl
          ? <img className="pet__thumb" src={photoUrl} alt={name} />
          : <div className="pet__thumb pet__thumb--placeholder">No Image</div>
      }
      title={name}
      subtitle={`${breed || '-'} · ${ageText}`}
      actions={<Badge variant={getBadgeVariant(status)}>{status || '정보없음'}</Badge>}
      footer={
        <div className="card__footer-actions">
          <Button presetName="connect" onClick={onOpen}>신청 보기</Button>
          {/* <Button presetName="danger" onClick={async () => { await deleteAnimal(pet.id); onOpen && load(); }}>삭제</Button> */}
        </div>
      }
    >
      <ul className="pet__meta">
        <li><span className="k">품종</span><span className="v">{breed || '-'}</span></li>
        <li><span className="k">나이</span><span className="v">{ageText}</span></li>
        <li><span className="k">상태</span><span className="v">{status || '-'}</span></li>
        <li><span className="k">성격</span><span className="v">{temperament || '-'}</span></li>
        <li><span className="k">중성화</span><span className="v">{neutered ? '예' : '아니오'}</span></li>
        <li><span className="k">몸무게</span><span className="v">{weightText}</span></li>
      </ul>
    </Card>
  )
}
