import React, { useState } from 'react'
import FormField from '../../components/common/FormField'
import Button from '../../components/ui/Button'
import { createAnimal, uploadAnimalImage } from '../../api/animals'

export default function RegisterPetForm({ onSuccess }) {
  const [form, setForm] = useState({
    name: '', breed: '', age: '', neutered: false, health: '', diseases: ''
  })
  const set = (k) => (e) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState('')
  const [err, setErr] = useState('')

  const onFile = (f) => {
    setFile(f || null)
    setPreview(f ? URL.createObjectURL(f) : '')
  };

  const validate = () => {
    if (!form.name.trim()) return '이름은 필수입니다.'
    if (form.age && Number.isNaN(Number(form.age))) return '나이는 숫자로 입력하세요.'
    return ''
  };

  const submit = async (e) => {
    e.preventDefault()
    setOk(''); setErr('')
    const v = validate()
    if (v) { setErr(v); return }

    setLoading(true)
    try {
      const newPet = await createAnimal({
        name: form.name.trim(),
        breed: form.breed || null,
        age: form.age ? Number(form.age) : 0,
        neutered: !!form.neutered,
        health: form.health || null,
        diseases: form.diseases || null,
        status: 'AVAILABLE',
      });
      if (file) await uploadAnimalImage(newPet.id, file)

      setOk('등록되었습니다.');
      setForm({ name:'', breed:'', age:'', neutered:false, health:'', diseases:'' })
      onFile(null)

      if (typeof onSuccess === 'function') onSuccess()
    } catch (e2) {
      setErr(e2?.message || '등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  };

  return (
    <form onSubmit={submit} className="shelter__form">
      <FormField id="name" label="이름" value={form.name} onChange={set('name')} required />
      <FormField id="breed" label="품종" value={form.breed} onChange={set('breed')} />
      <FormField id="age" label="나이" type="number" value={form.age} onChange={set('age')} />
      <label className="checkbox"><input type="checkbox" checked={form.neutered} onChange={set('neutered')} /> 중성화</label>
      <FormField id="health" label="건강 상태" value={form.health} onChange={set('health')} />
      <FormField id="diseases" label="질병" value={form.diseases} onChange={set('diseases')} />

      <div className="shelter__upload">
        <input type="file" accept="image/*" onChange={(e)=>onFile(e.target.files?.[0])} />
        {preview && (
          <div className="shelter__preview">
            <img src={preview} alt="미리보기" />
          </div>
        )}
      </div>

      {err && <div className="auth__error">{err}</div>}
      {ok && <div className="auth__ok">{ok}</div>}

      <Button presetName="shelter" type="submit" loading={loading}>등록하기</Button>
    </form>
  );
}
