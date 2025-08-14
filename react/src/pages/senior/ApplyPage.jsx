import React, { useMemo, useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import FormField from '../../components/common/FormField'
import { createApplication } from '../../api/applications'
import { fetchAnimals } from '../../api/animals'
import './senior.css'

export default function ApplyPage() {
  const [sp] = useSearchParams()
  const petId = useMemo(() => Number(sp.get('petId')), [sp])
  const navigate = useNavigate()

  const [selected, setSelected] = useState(null)

  const [form, setForm] = useState({
    name: '',
    gender: '',
    age: '',
    experience: '',
    address: '',
    timeRange: '',
    days: '',
    date: '',
    phone: '',
    emergency: '',
    agreeTerms: false,
    agreeBodycam: false,
  });
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  useEffect(() => {
    try {
      const s = localStorage.getItem('selectedPet')
      if (s) {
        const parsed = JSON.parse(s)
        if (parsed?.id === petId) {
          setSelected(parsed)
          return
        }
      }
    } catch {}

    if (petId) {
      fetchAnimals({ page: 1, size: 1, id: petId })
        .then((res) => {
          if (res?.content?.length) setSelected(res.content[0])
        })
        .catch(() => {})
    }
  }, [petId]);

  const submit = async (e) => {
    e.preventDefault()
    setErr('')

    if (!form.agreeTerms || !form.agreeBodycam) {
      setErr('이용약관 및 바디캠 필수 동의가 필요합니다.')
      return;
    }

    setLoading(true);
    try {
      await createApplication({
        petId,
        name: form.name,
        gender: form.gender,
        age: Number(form.age),
        experience: form.experience,
        address: form.address,
        timeRange: form.timeRange,
        days: form.days,
        date: form.date,
        phone: form.phone,
        emergency: form.emergency,
        agreeTerms: form.agreeTerms,
        agreeBodycam: form.agreeBodycam,
      });
      navigate('/senior/connect')
    } catch (e) {
      setErr(e?.response?.data?.error?.message || '신청에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="senior">
      <h1>신청서</h1>
      {selected && (
        <div className="apply__pet-preview">
          <img src={selected.photoUrl} alt={selected.name} />
          <div>
            <strong>{selected.name}</strong>
            <div>
              {selected.breed} · {selected.age}살
            </div>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="senior__form">
        <FormField id="name" label="이름" value={form.name} onChange={set('name')} required />
        <FormField
          id="gender"
          label="성별"
          as="select"
          value={form.gender}
          onChange={set('gender')}
          options={[
            { value: '', label: '선택' },
            { value: 'F', label: '여성' },
            { value: 'M', label: '남성' },
          ]}
          required
        />
        <FormField id="age" label="나이" type="number" value={form.age} onChange={set('age')} required />
        <FormField id="exp" label="반려 경험" as="textarea" rows={3} value={form.experience} onChange={set('experience')} />
        <FormField id="addr" label="주소" value={form.address} onChange={set('address')} required />
        <FormField id="time" label="이용 시간" value={form.timeRange} onChange={set('timeRange')} />
        <FormField id="days" label="요일" value={form.days} onChange={set('days')} />
        <FormField id="date" label="희망 날짜" type="date" value={form.date} onChange={set('date')} />
        <FormField id="phone" label="전화번호" value={form.phone} onChange={set('phone')} required />
        <FormField id="emg" label="긴급 연락망" value={form.emergency} onChange={set('emergency')} />

        <label className="checkbox">
          <input type="checkbox" checked={form.agreeTerms} onChange={set('agreeTerms')} /> 이용 약관 동의
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={form.agreeBodycam} onChange={set('agreeBodycam')} /> 바디캠 촬영/사용 필수 동의
        </label>

        {err && <div className="auth__error">{err}</div>}
        <Button presetName="apply" sizeName="lg" type="submit" loading={loading}>
          신청하기
        </Button>
      </form>
    </div>
  );
}
