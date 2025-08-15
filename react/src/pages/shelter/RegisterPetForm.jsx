import React, { useState, useRef } from 'react'
import FormField from '../../components/common/FormField'
import Button from '../../components/ui/Button'
import { createAnimal, uploadAnimalImage } from '../../api/animals'

export default function RegisterPetForm({ onSuccess }) {
  const [form, setForm] = useState({
    name:'', breed:'', age:'', sex:'U', neutered:false,
    weightKg:'', temperament:'', health:'', diseases:'', status:'AVAILABLE'
  })
  const set = (k) => (e) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState('')
  const [err, setErr] = useState('')
  const fileInputRef = useRef(null)

  const onFile = (f) => {
    if (!f) { setFile(null); setPreview(''); return }
    if (!/^image\//.test(f.type)) { setErr('이미지 파일만 업로드 가능합니다.'); return }
    if (f.size > 5 * 1024 * 1024) { setErr('이미지는 최대 5MB까지 업로드 가능해요.'); return }
    setErr('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const validate = () => {
    if (!form.name.trim()) return '이름은 필수입니다.'
    if (form.age && Number.isNaN(Number(form.age))) return '나이는 숫자로 입력하세요.'
    if (form.weightKg && Number.isNaN(Number(form.weightKg))) return '몸무게는 숫자로 입력하세요.'
    if (Number(form.age) < 0) return '나이는 0 이상이어야 합니다.'
    if (Number(form.weightKg) < 0) return '몸무게는 0 이상이어야 합니다.'
    return ''
  }

  const reset = () => {
    setForm({ name:'', breed:'', age:'', sex:'U', neutered:false, weightKg:'', temperament:'', health:'', diseases:'', status:'AVAILABLE' })
    setFile(null); setPreview(''); fileInputRef.current && (fileInputRef.current.value = '')
  }

  const submit = async (e) => {
    e.preventDefault()
    setOk(''); setErr('')
    const v = validate()
    if (v) { setErr(v); return }

    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        breed: form.breed || null,
        age: form.age ? Number(form.age) : 0,
        sex: form.sex,                         // 'M' | 'F' | 'U'
        neutered: !!form.neutered,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        temperament: form.temperament || null,
        health: form.health || null,
        diseases: form.diseases || null,
        status: form.status || 'AVAILABLE',
      }

      const newPet = await createAnimal(payload)
      if (file) await uploadAnimalImage(newPet.id, file)

      setOk('등록되었습니다.')
      reset()
      typeof onSuccess === 'function' && onSuccess()
    } catch (e2) {
      setErr(e2?.message || '등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="shelter__form">
      <div className="grid-2">
        <FormField id="name" label="이름" value={form.name} onChange={set('name')} required />
        <FormField id="breed" label="품종" value={form.breed} onChange={set('breed')} />
      </div>

      <div className="grid-3">
        <FormField id="age" label="나이(살)" type="number" min="0" value={form.age} onChange={set('age')} />
        <FormField id="weightKg" label="몸무게(kg)" type="number" step="0.1" min="0" value={form.weightKg} onChange={set('weightKg')} />
        <div className="field">
          <label htmlFor="sex">성별</label>
          <select id="sex" value={form.sex} onChange={set('sex')}>
            <option value="U">미상</option>
            <option value="M">수컷</option>
            <option value="F">암컷</option>
          </select>
        </div>
      </div>

      <label className="checkbox">
        <input type="checkbox" checked={form.neutered} onChange={set('neutered')} /> 중성화
      </label>

      <FormField
        id="temperament"
        label="성격 / 특이사항"
        value={form.temperament}
        onChange={set('temperament')}
        placeholder="온순/조용/활발, 산책 좋아함 등"
        textarea
      />

      <div className="grid-2">
        <FormField id="health" label="건강 상태" value={form.health} onChange={set('health')} />
        <FormField id="diseases" label="질병" value={form.diseases} onChange={set('diseases')} />
      </div>

      <div className="field">
        <label htmlFor="status">상태</label>
        <select id="status" value={form.status} onChange={set('status')}>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="PENDING">PENDING</option>
          <option value="MATCHED">MATCHED</option>
          <option value="ADOPTED">ADOPTED</option>
        </select>
      </div>

      <div className="shelter__upload"
           onDragOver={(e)=>e.preventDefault()}
           onDrop={(e)=>{e.preventDefault(); onFile(e.dataTransfer.files?.[0])}}>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={(e)=>onFile(e.target.files?.[0])} />
        {preview ? (
          <div className="shelter__preview">
            <img src={preview} alt="미리보기" />
            <Button type="button" variant="ghost" onClick={()=>onFile(null)}>이미지 제거</Button>
          </div>
        ) : (
          <small>이미지를 선택하거나, 여기로 드래그앤드롭</small>
        )}
      </div>

      {err && <div className="auth__error">{err}</div>}
      {ok && <div className="auth__ok">{ok}</div>}

      <div className="row-end">
        <Button type="button" variant="ghost" onClick={reset} disabled={loading}>초기화</Button>
        <Button presetName="shelter" type="submit" loading={loading} disabled={loading}>등록하기</Button>
      </div>
    </form>
  )
}
// 