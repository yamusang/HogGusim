// src/pages/senior/ApplyPage.jsx
import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { createApplication } from '../../api/applications';
import {
  DAY_OPTS, SPECIES_OPTS, SIZE_OPTS,
  GENDER_PREF_OPTS, TEMPERAMENT_OPTS, HEALTH_TOL_OPTS,
  VISIT_STYLE_OPTS,
} from '../../config/constants';
import './senior.css';

const ymd  = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const hhmm = (s) => /^\d{2}:\d{2}$/.test(s);
const isArr = (v) => Array.isArray(v) && v.length > 0;

const DAY_OPTS_LOCAL = isArr(DAY_OPTS) ? DAY_OPTS : [
  { value: 'MON', label: '월' }, { value: 'TUE', label: '화' }, { value: 'WED', label: '수' },
  { value: 'THU', label: '목' }, { value: 'FRI', label: '금' }, { value: 'SAT', label: '토' },
  { value: 'SUN', label: '일' },
];
const SPECIES_OPTS_LOCAL      = isArr(SPECIES_OPTS)      ? SPECIES_OPTS      : [{ value:'dog', label:'강아지' }, { value:'cat', label:'고양이' }, { value:'any', label:'상관없음' }];
const SIZE_OPTS_LOCAL         = isArr(SIZE_OPTS)         ? SIZE_OPTS         : [{ value:'small', label:'소형' }, { value:'medium', label:'중형' }, { value:'large', label:'대형' }, { value:'any', label:'상관없음' }];
const GENDER_PREF_OPTS_LOCAL  = isArr(GENDER_PREF_OPTS)  ? GENDER_PREF_OPTS  : [{ value:'M', label:'수컷' }, { value:'F', label:'암컷' }, { value:'any', label:'상관없음' }];
const TEMPERAMENT_OPTS_LOCAL  = isArr(TEMPERAMENT_OPTS)  ? TEMPERAMENT_OPTS  : [{ value:'calm', label:'차분한' }, { value:'gentle', label:'온순한' }, { value:'any', label:'상관없음' }];
const HEALTH_TOL_OPTS_LOCAL   = isArr(HEALTH_TOL_OPTS)   ? HEALTH_TOL_OPTS   : [{ value:'healthyOnly', label:'건강 개체만' }, { value:'manageableOnly', label:'관리 가능' }, { value:'any', label:'상관없음' }];
const VISIT_STYLE_OPTS_LOCAL  = isArr(VISIT_STYLE_OPTS)  ? VISIT_STYLE_OPTS  : [
  { value: 'HOME_VISIT', label: '집 방문 돌봄' },
  { value: 'OUTDOOR_WALK', label: '외부 산책 중심' },
  { value: 'EITHER', label: '상황에 따라' },
];

export default function ApplyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { petId: petIdParam } = useParams();

  const petId = useMemo(() => {
    if (petIdParam) return Number(petIdParam);
    try {
      const sel = JSON.parse(localStorage.getItem('selectedPet') || 'null');
      return sel?.id ? Number(sel.id) : null;
    } catch {
      return null;
    }
  }, [petIdParam]);

  // seniorId: user.seniorId > user.id > localStorage.seniorId
  const seniorId = useMemo(() => {
    const ls = localStorage.getItem('seniorId');
    return user?.seniorId ?? user?.id ?? (ls ? Number(ls) : null);
  }, [user]);

  const [type, setType] = useState('ADOPTION'); // ADOPTION | EXPERIENCE
  const [memo, setMemo] = useState('');

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
      genderPref: 'any',
      temperamentPref: 'any',
      healthTolerance: 'any',
    },
    careAvailability: {
      days: [],
      timeRange: { start: '', end: '' },
      visitFreqPerWeek: 1,
      visitStyle: 'EITHER',
    },

    needManager: false,
    termsAgree: false,
    bodycamAgree: false,
  });

  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // refs for focusing invalid fields
  const refs = {
    name: useRef(null),
    phoneNumber: useRef(null),
    address: useRef(null),
    birthDate: useRef(null),
    emergencyContact: useRef(null),
    days: useRef(null),
    startTime: useRef(null),
    endTime: useRef(null),
    visitFreqPerWeek: useRef(null),
    termsAgree: useRef(null),
    bodycamAgree: useRef(null),
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setNested = (group, k, v) =>
    setForm((f) => ({ ...f, [group]: { ...f[group], [k]: v } }));

  const toggleDay = (dayValue) =>
    setForm((f) => {
      const setD = new Set(f.careAvailability.days);
      setD.has(dayValue) ? setD.delete(dayValue) : setD.add(dayValue);
      return {
        ...f,
        careAvailability: { ...f.careAvailability, days: [...setD] },
      };
    });

  const focusKey = (key) => {
    const el = refs[key]?.current;
    if (el && typeof el.focus === 'function') {
      el.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  };

  const validate = () => {
    if (!seniorId) return { msg: '로그인이 필요하거나 시니어 식별자가 없습니다.', key: 'name' };
    if (!form.name) return { msg: '필수값을 확인해 주세요. (이름)', key: 'name' };
    if (!form.address) return { msg: '필수값을 확인해 주세요. (주소)', key: 'address' };
    if (!form.birthDate) return { msg: '생년월일을 입력해 주세요.', key: 'birthDate' };
    if (!ymd(form.birthDate)) return { msg: '생년월일은 YYYY-MM-DD 형식이어야 해요.', key: 'birthDate' };
    if (!form.emergencyContact) return { msg: '비상연락망을 입력해 주세요.', key: 'emergencyContact' };

    if (!form.termsAgree) return { msg: '이용 약관 동의가 필요합니다.', key: 'termsAgree' };
    if (!form.bodycamAgree) return { msg: '바디캠 필수 동의에 체크해야 신청 가능합니다.', key: 'bodycamAgree' };

    const ca = form.careAvailability;
    if (!Array.isArray(ca.days) || ca.days.length === 0)
      return { msg: '가능 요일을 한 개 이상 선택해 주세요.', key: 'days' };
    if (!hhmm(ca.timeRange.start))
      return { msg: '시간대(시작)는 HH:MM 형식이어야 합니다.', key: 'startTime' };
    if (!hhmm(ca.timeRange.end))
      return { msg: '시간대(종료)는 HH:MM 형식이어야 합니다.', key: 'endTime' };
    if (ca.visitFreqPerWeek < 1 || ca.visitFreqPerWeek > 7)
      return { msg: '주 방문 횟수는 1~7 사이여야 합니다.', key: 'visitFreqPerWeek' };

    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setErr(v.msg);
      focusKey(v.key);
      return;
    }
    setErr('');
    setSubmitting(true);

    try {
      // ✅ 백 계약 필수 필드만 본문에, 나머지는 meta로 전달(서버가 무시해도 OK)
      const payload = {
        seniorId: Number(seniorId),
        animalId: petId ? Number(petId) : null,
        type,               // "ADOPTION" | "EXPERIENCE"
        memo: (memo || '').trim(),
        meta: {
          applicant: {
            userId: Number(form.userId) || null,
            name: form.name.trim(),
            phoneNumber: (form.phoneNumber || '').trim(),
            address: form.address.trim(),
            birthDate: form.birthDate,
            emergencyContact: form.emergencyContact.trim(),
            welfareOfficerId: form.welfareOfficerId ? Number(form.welfareOfficerId) : null,
          },
          preferences: { ...form.preferredPetInfo },
          availability: {
            ...form.careAvailability,
            visitFreqPerWeek: Number(form.careAvailability.visitFreqPerWeek),
          },
          hasPetExperience: !!form.hasPetExperience,
          needManager: !!form.needManager,
          agreements: { termsAgree: !!form.termsAgree, bodycamAgree: !!form.bodycamAgree },
        },
      };

      await createApplication(payload);

      localStorage.removeItem('selectedPet');
      localStorage.setItem('afterApply', '1');

      alert('신청 완료! 보호소 검토 후 안내 드릴게요.');
      // 맞춤 추천으로 이동
      navigate('/senior?mode=recommend', { replace: true });
    } catch (e2) {
      setErr(e2?.message || '신청에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  const onChipKeyDown = (e, value) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleDay(value);
    }
  };

  return (
    <div className="senior">
      <header className="senior__header">
        <h1>입양/체험 신청</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button presetName="ghost" onClick={() => navigate(-1)}>뒤로</Button>
          <Button presetName="connectbtn" onClick={() => navigate('/senior/connect')}>내 신청 현황</Button>
        </div>
      </header>

      <div className="card" style={{ marginBottom: 12 }}>
        {petId ? (
          <p className="muted">선택한 동물(ID: {petId})로 신청합니다.</p>
        ) : (
          <p className="muted">선택한 동물 없이 신청합니다. 제출 후 맞춤 추천을 보여드릴게요.</p>
        )}
      </div>

      <form className="card" onSubmit={onSubmit} style={{ display: 'grid', gap: 14 }}>
        <h2 className="h6">A. 기본 신원/연락</h2>
        <div className="form-grid">
          <label>
            이름
            <input ref={refs.name} value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </label>
          <label>
            연락처
            <input ref={refs.phoneNumber} value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} required />
          </label>
          <label>
            주소
            <input ref={refs.address} value={form.address} onChange={(e) => set('address', e.target.value)} required />
          </label>
          <label>
            생년월일
            <input ref={refs.birthDate} type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} required />
          </label>
          <label>
            비상연락망
            <input ref={refs.emergencyContact} value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} required />
          </label>
          <label>
            담당 복지사 ID(선택)
            <input
              type="number"
              value={form.welfareOfficerId ?? ''}
              onChange={(e) => set('welfareOfficerId', e.target.value ? Number(e.target.value) : null)}
            />
          </label>
        </div>

        <h2 className="h6">B. 반려/돌봄</h2>
        <label className="row">
          <input type="checkbox" checked={form.hasPetExperience} onChange={(e) => set('hasPetExperience', e.target.checked)} />
          반려/돌봄 경험이 있어요
        </label>

        <div className="form-grid">
          <label>
            선호 종
            <select value={form.preferredPetInfo.species} onChange={(e) => setNested('preferredPetInfo', 'species', e.target.value)}>
              {SPECIES_OPTS_LOCAL.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </label>
          <label>
            선호 크기
            <select value={form.preferredPetInfo.size} onChange={(e) => setNested('preferredPetInfo', 'size', e.target.value)}>
              {SIZE_OPTS_LOCAL.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </label>
          <label>
            선호 성별
            <select value={form.preferredPetInfo.genderPref} onChange={(e) => setNested('preferredPetInfo', 'genderPref', e.target.value)}>
              {GENDER_PREF_OPTS_LOCAL.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </label>
          <label>
            선호 성격
            <select value={form.preferredPetInfo.temperamentPref} onChange={(e) => setNested('preferredPetInfo', 'temperamentPref', e.target.value)}>
              {TEMPERAMENT_OPTS_LOCAL.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </label>
          <label>
            건강 상태 허용 범위
            <select value={form.preferredPetInfo.healthTolerance} onChange={(e) => setNested('preferredPetInfo', 'healthTolerance', e.target.value)}>
              {HEALTH_TOL_OPTS_LOCAL.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </label>
        </div>

        <div className="form-grid">
          {/* 가능 요일 */}
          <div className="form-field">
            <label className="form-label">가능 요일</label>
            <div className="chips" ref={refs.days}>
              {DAY_OPTS_LOCAL.map((d) => {
                const on = form.careAvailability.days.includes(d.value);
                return (
                  <span
                    key={d.value}
                    className={`chip ${on ? 'chip--on' : ''}`}
                    role="checkbox"
                    aria-checked={on}
                    tabIndex={0}
                    onKeyDown={(e) => onChipKeyDown(e, d.value)}
                    onClick={() => toggleDay(d.value)}
                  >
                    {d.label}
                  </span>
                );
              })}
            </div>
          </div>

          <label>
            시간대(시작)
            <input
              ref={refs.startTime}
              type="time"
              value={form.careAvailability.timeRange.start}
              onChange={(e) => setNested('careAvailability', 'timeRange', { ...form.careAvailability.timeRange, start: e.target.value })}
            />
          </label>
          <label>
            시간대(종료)
            <input
              ref={refs.endTime}
              type="time"
              value={form.careAvailability.timeRange.end}
              onChange={(e) => setNested('careAvailability', 'timeRange', { ...form.careAvailability.timeRange, end: e.target.value })}
            />
          </label>

          <label>
            돌봄 방식
            <select value={form.careAvailability.visitStyle} onChange={(e) => setNested('careAvailability', 'visitStyle', e.target.value)}>
              {VISIT_STYLE_OPTS_LOCAL.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </label>

          <label>
            주 방문 횟수
            <input
              ref={refs.visitFreqPerWeek}
              type="number"
              min={1}
              max={7}
              value={form.careAvailability.visitFreqPerWeek}
              onChange={(e) => setNested('careAvailability', 'visitFreqPerWeek', Number(e.target.value || 1))}
            />
          </label>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <label className="row">
            <input type="checkbox" checked={form.needManager} onChange={(e) => set('needManager', e.target.checked)} />
            청년 돌봄 지원(산책/돌봄 방문)을 요청합니다
          </label>
          <p className="muted" style={{ marginTop: 6 }}>
            요청 시, 가능한 청년 펫매니저가 자동 배정됩니다. (집 방문/외부 산책은 ‘돌봄 방식’에 맞춰 조정)
          </p>
        </div>

        <h2 className="h6">D. 동의/약관</h2>
        <label className="row">
          <input ref={refs.termsAgree} type="checkbox" checked={form.termsAgree} onChange={(e) => set('termsAgree', e.target.checked)} />
          이용 약관에 동의합니다.
        </label>
        <label className="row">
          <input ref={refs.bodycamAgree} type="checkbox" checked={form.bodycamAgree} onChange={(e) => set('bodycamAgree', e.target.checked)} />
          방문 시 바디캠 촬영에 동의합니다.
        </label>

        {/* 유형/메모 (백 계약에 맞춤) */}
        <div className="form-grid">
          <label>
            신청 유형
            <select value={type} onChange={(e)=>setType(e.target.value)}>
              <option value="ADOPTION">입양</option>
              <option value="EXPERIENCE">체험</option>
            </select>
          </label>
          <label>
            메모
            <input
              placeholder="특이사항/요청사항"
              value={memo}
              onChange={(e)=>setMemo(e.target.value)}
            />
          </label>
        </div>

        {err && <div className="auth__error">{err}</div>}

        <Button type="submit" presetName="applibtn" disabled={submitting || !form.termsAgree || !form.bodycamAgree}>
          {submitting ? '신청 중…' : '신청하기'}
        </Button>
      </form>
    </div>
  );
}
