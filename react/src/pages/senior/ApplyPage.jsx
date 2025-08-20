// src/pages/senior/ApplyPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { createApplication } from '../../api/applications';
import { DAYS, SPECIES, SIZE, AGE_PREF, GENDER_PREF, TEMPERAMENT, HEALTH_TOL } from '../../config/constants';
import './senior.css';

const ymd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const hhmm = (s) => /^\d{2}:\d{2}$/.test(s);

export default function ApplyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { petId: petIdParam } = useParams();

  const petId = useMemo(() => {
    if (petIdParam) return Number(petIdParam);
    try {
      const sel = JSON.parse(localStorage.getItem('selectedPet') || 'null');
      return sel?.id ? Number(sel.id) : null;
    } catch { return null; }
  }, [petIdParam]);

  const [form, setForm] = useState({
    userId: user?.id ?? null,
    name: user?.displayName || '',
    phoneNumber: user?.phone || '',
    address: user?.address || '',
    birthDate: '',
    emergencyContact: '',
    welfareOfficerId: null,

    hasPetExperience: false,
    preferredPetInfo: {
      species: 'dog',
      size: 'small',
      agePref: 'any',
      genderPref: 'any',
      temperamentPref: 'any',
      healthTolerance: 'any',
    },
    careAvailability: {
      days: [],
      timeRange: { start: '', end: '' },
      visitFreqPerWeek: 1,
    },

    termsAgree: false,
    bodycamAgree: false,
  });

  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!petId) {
      alert('신청할 동물이 선택되지 않았어요.');
      navigate('/senior');
    }
  }, [petId, navigate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setNested = (group, k, v) =>
    setForm(f => ({ ...f, [group]: { ...f[group], [k]: v } }));

  const toggleDay = (d) => setForm(f => {
    const setD = new Set(f.careAvailability.days);
    setD.has(d) ? setD.delete(d) : setD.add(d);
    return { ...f, careAvailability: { ...f.careAvailability, days: [...setD] } };
  });

  const validate = () => {
    if (!form.name || !form.address || !form.birthDate || !form.emergencyContact) return '필수값을 확인해 주세요.';
    if (!ymd(form.birthDate)) return '생년월일은 YYYY-MM-DD 형식이어야 해요.';
    if (!form.termsAgree) return '이용 약관 동의가 필요합니다.';
    if (!form.bodycamAgree) return '바디캠 필수 동의에 체크해야 신청 가능합니다.';
    const ca = form.careAvailability;
    if (!Array.isArray(ca.days) || ca.days.length === 0) return '가능 요일을 한 개 이상 선택해 주세요.';
    if (!hhmm(ca.timeRange.start) || !hhmm(ca.timeRange.end)) return '시간대는 HH:MM 형식이어야 합니다.';
    if (ca.visitFreqPerWeek < 1 || ca.visitFreqPerWeek > 7) return '주 방문 횟수는 1~7 사이여야 합니다.';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }
    setErr('');
    setSubmitting(true);

    try {
      const payload = {
        userId: Number(form.userId),
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim(),
        birthDate: form.birthDate,
        emergencyContact: form.emergencyContact.trim(),
        welfareOfficerId: form.welfareOfficerId ? Number(form.welfareOfficerId) : null,

        hasPetExperience: !!form.hasPetExperience,
        preferredPetInfo: { ...form.preferredPetInfo },
        careAvailability: {
          days: form.careAvailability.days,
          timeRange: { ...form.careAvailability.timeRange },
          visitFreqPerWeek: Number(form.careAvailability.visitFreqPerWeek),
        },

        termsAgree: !!form.termsAgree,
        bodycamAgree: !!form.bodycamAgree,
        petId: Number(petId),
      };

      await createApplication(payload);
      alert('신청 완료! 보호소 검토 후 안내 드릴게요.');
      navigate('/senior/connect');
    } catch (e2) {
      setErr(e2?.message || '신청에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="senior">
      <header className="senior__header">
        <h1>입양/체험 신청</h1>
        <Button presetName="ghost" onClick={() => navigate(-1)}>뒤로</Button>
      </header>

      <form className="card" onSubmit={onSubmit} style={{ display:'grid', gap:14 }}>
        <h2 className="h6">A. 기본 신원/연락</h2>
        <div className="form-grid">
          <label>이름<input value={form.name} onChange={e=>set('name', e.target.value)} required /></label>
          <label>연락처<input value={form.phoneNumber} onChange={e=>set('phoneNumber', e.target.value)} required /></label>
          <label>주소<input value={form.address} onChange={e=>set('address', e.target.value)} required /></label>
          <label>생년월일<input type="date" value={form.birthDate} onChange={e=>set('birthDate', e.target.value)} required /></label>
          <label>비상연락망<input value={form.emergencyContact} onChange={e=>set('emergencyContact', e.target.value)} required /></label>
          <label>담당 복지사 ID(선택)<input type="number" value={form.welfareOfficerId ?? ''} onChange={e=>set('welfareOfficerId', e.target.value ? Number(e.target.value) : null)} /></label>
        </div>

        <h2 className="h6">B. 반려/돌봄</h2>
        <label className="row">
          <input type="checkbox" checked={form.hasPetExperience} onChange={e=>set('hasPetExperience', e.target.checked)} />
          반려/돌봄 경험이 있어요
        </label>

        <div className="form-grid">
          <label>종<select value={form.preferredPetInfo.species} onChange={e=>setNested('preferredPetInfo','species', e.target.value)}>{SPECIES.map(v => <option key={v}>{v}</option>)}</select></label>
          <label>크기<select value={form.preferredPetInfo.size} onChange={e=>setNested('preferredPetInfo','size', e.target.value)}>{SIZE.map(v => <option key={v}>{v}</option>)}</select></label>
          <label>연령<select value={form.preferredPetInfo.agePref} onChange={e=>setNested('preferredPetInfo','agePref', e.target.value)}>{AGE_PREF.map(v => <option key={v}>{v}</option>)}</select></label>
          <label>성별<select value={form.preferredPetInfo.genderPref} onChange={e=>setNested('preferredPetInfo','genderPref', e.target.value)}>{GENDER_PREF.map(v => <option key={v}>{v}</option>)}</select></label>
          <label>성격<select value={form.preferredPetInfo.temperamentPref} onChange={e=>setNested('preferredPetInfo','temperamentPref', e.target.value)}>{TEMPERAMENT.map(v => <option key={v}>{v}</option>)}</select></label>
          <label>건강<select value={form.preferredPetInfo.healthTolerance} onChange={e=>setNested('preferredPetInfo','healthTolerance', e.target.value)}>{HEALTH_TOL.map(v => <option key={v}>{v}</option>)}</select></label>
        </div>

        <div className="form-grid">
          <label>가능 요일
            <div className="chips">
              {DAYS.map(d => (
                <label key={d} className={`chip ${form.careAvailability.days.includes(d) ? 'chip--on':''}`}>
                  <input type="checkbox" checked={form.careAvailability.days.includes(d)} onChange={() => toggleDay(d)} />
                  {d}
                </label>
              ))}
            </div>
          </label>
          <label>시간대(시작)<input type="time" value={form.careAvailability.timeRange.start} onChange={e=>setNested('careAvailability','timeRange',{...form.careAvailability.timeRange, start: e.target.value})} /></label>
          <label>시간대(종료)<input type="time" value={form.careAvailability.timeRange.end} onChange={e=>setNested('careAvailability','timeRange',{...form.careAvailability.timeRange, end: e.target.value})} /></label>
          <label>주 방문 횟수<input type="number" min={1} max={7} value={form.careAvailability.visitFreqPerWeek} onChange={e=>setNested('careAvailability','visitFreqPerWeek', Number(e.target.value || 1))} /></label>
        </div>

        <h2 className="h6">D. 동의/약관</h2>
        <label className="row"><input type="checkbox" checked={form.termsAgree} onChange={e=>set('termsAgree', e.target.checked)} /> 약관 동의</label>
        <label className="row"><input type="checkbox" checked={form.bodycamAgree} onChange={e=>set('bodycamAgree', e.target.checked)} /> 바디캠 동의</label>

        {err && <div className="auth__error">{err}</div>}

        <Button type="submit" presetName="applibtn" disabled={submitting || !form.termsAgree || !form.bodycamAgree}>
          {submitting ? '신청 중…' : '신청하기'}
        </Button>
      </form>
    </div>
  );
}
