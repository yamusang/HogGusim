import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { fetchAnimals, createAnimal, uploadPetPhoto/*, deleteAnimal*/ } from '../../api/animals'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/ui/Button'
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

      <div className="shelter__section">
        <h2>동물 등록</h2>
        <RegisterPetForm shelterId={shelterId} onSuccess={load} />
      </div>
    </div>
  )
}

/* ===================== 등록 폼 (파일 내 포함) ===================== */
function RegisterPetForm({ shelterId, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    breed: '',
    age: '',
    neutered: false,
    temperament: '',
    weightKg: '',
    status: 'AVAILABLE',
    photoUrl: ''
  })
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const reset = () => {
    setForm({
      name: '',
      breed: '',
      age: '',
      neutered: false,
      temperament: '',
      weightKg: '',
      status: 'AVAILABLE',
      photoUrl: ''
    })
    setFile(null)
    setError('')
    setOk('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true); setError(''); setOk('')

    try {
      // 최소 필수값 체크
      if (!form.name.trim()) throw new Error('이름을 입력하세요.')
      if (!shelterId) throw new Error('shelterId가 없습니다.')

      // 백엔드 스키마에 맞게 payload 구성
      const payload = {
        shelterId,
        name: form.name.trim(),
        breed: form.breed.trim() || null,
        age: form.age !== '' ? Number(form.age) : null,
        neutered: !!form.neutered,
        temperament: form.temperament.trim() || null,
        weightKg: form.weightKg !== '' ? Number(form.weightKg) : null,
        status: form.status || 'AVAILABLE',
        // photoUrl은 업로드 대신 링크 직접 저장하고 싶을 때만 전달
        photoUrl: form.photoUrl.trim() || undefined
      }

      // 1) 등록
      const created = await createAnimal(payload)    // { id, ... }
      const petId = created?.id

      // 2) 파일 업로드(선택)
      if (petId && file) {
        await uploadPetPhoto(petId, file)
      }

      setOk('등록되었습니다.')
      onSuccess && onSuccess()
      reset()
    } catch (e) {
      setError(e.message || '등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="pet-form" onSubmit={handleSubmit}>
      {error && <div className="auth__error" style={{ marginBottom: 8 }}>{error}</div>}
      {ok && <div className="auth__ok" style={{ marginBottom: 8 }}>{ok}</div>}

      <div className="form-row">
        <label>이름<span className="req">*</span></label>
        <input name="name" value={form.name} onChange={onChange} placeholder="예: 해피" required />
      </div>

      <div className="form-row two">
        <div>
          <label>품종</label>
          <input name="breed" value={form.breed} onChange={onChange} placeholder="예: 말티즈" />
        </div>
        <div>
          <label>나이</label>
          <input name="age" type="number" min="0" step="1" value={form.age} onChange={onChange} placeholder="숫자" />
        </div>
      </div>

      <div className="form-row two">
        <div>
          <label>몸무게(kg)</label>
          <input name="weightKg" type="number" min="0" step="0.1" value={form.weightKg} onChange={onChange} placeholder="예: 4.2" />
        </div>
        <div className="check-wrap">
          <label>
            <input type="checkbox" name="neutered" checked={form.neutered} onChange={onChange} />
            중성화
          </label>
        </div>
      </div>

      <div className="form-row">
        <label>성격/특이사항</label>
        <textarea name="temperament" value={form.temperament} onChange={onChange} placeholder="예: 사람 친화적, 분리불안 없음" rows={3} />
      </div>

      <div className="form-row two">
        <div>
          <label>상태</label>
          <select name="status" value={form.status} onChange={onChange}>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="PENDING">PENDING</option>
            <option value="MATCHED">MATCHED</option>
            <option value="ADOPTED">ADOPTED</option>
          </select>
        </div>
        <div>
          <label>사진 URL(선택)</label>
          <input name="photoUrl" value={form.photoUrl} onChange={onChange} placeholder="https://..." />
        </div>
      </div>

      <div className="form-row">
        <label>사진 파일 업로드(선택)</label>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>

      <div className="form-actions">
        <Button type="submit" disabled={submitting} presetName="primary">
          {submitting ? '등록 중…' : '등록하기'}
        </Button>
        <Button type="button" presetName="ghost" onClick={reset} disabled={submitting}>
          초기화
        </Button>
      </div>
    </form>
  )
}

/* ===================== 카드 & 유틸 ===================== */
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
