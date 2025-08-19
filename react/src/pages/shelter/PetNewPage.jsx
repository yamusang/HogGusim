// src/pages/pet/PetNewPage.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { createAnimal, uploadAnimalPhoto } from '../../api/animals';
import '../pet/pet.css';

// (config/constants.js에 있으면 그걸 import 해도 됨)
const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: '대기중' },
  { value: 'MATCHING',  label: '매칭중' },
  { value: 'CONNECTED', label: '매칭완료' },
  { value: 'RETURNED',  label: '복귀' },
];

export default function PetNewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ✅ A안: affiliation → careNm로 사용
  const careNm = useMemo(() =>
    (user?.affiliation ||
     sessionStorage.getItem('affiliation') ||
     localStorage.getItem('selectedCareNm') ||
     '').trim()
  , [user]);

  // (있으면 같이 보내되, 필터는 careNm로 할 거라 필수 아님)
  const shelterId = user?.shelterId || user?.id || null;

  const [form, setForm] = useState({
    name: '', breed: '', sex: 'M', age: '',
    neutered: false, weight: '', size: 'SMALL',
    temperament: '', health: '', diseases: '',
    vaccinated: '', // 예: "DHPPL, 광견병"
    features: '',   // 특징/성격 요약
    description: '', // 상세설명
    status: 'AVAILABLE',
  });
  const [files, setFiles] = useState([]); // FileList
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const onFileChange = (e) => setFiles(Array.from(e.target.files || []));

  const validate = () => {
    if (!careNm) return '보호소(소속)가 비어 있어요. 관리자 계정으로 다시 로그인해 주세요.';
    if (!form.name.trim()) return '이름을 입력해 주세요.';
    if (!form.breed.trim()) return '품종을 입력해 주세요.';
    const ageNum = Number(form.age);
    if (Number.isNaN(ageNum) || ageNum < 0 || ageNum > 40) return '나이는 0~40 사이 숫자여야 합니다.';
    const weightNum = form.weight ? Number(form.weight) : 0;
    if (form.weight && (Number.isNaN(weightNum) || weightNum < 0 || weightNum > 200)) return '체중은 0~200kg 사이여야 합니다.';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }
    setErr(''); setLoading(true);

    try {
      const payload = {
        // ✅ 핵심: careNm로 소속 지정 (A안)
        careNm,

        // 호환성 위해 함께 전송(서버가 무시해도 됨)
        ...(shelterId ? { shelterId } : {}),

        name: form.name.trim(),
        breed: form.breed.trim(),
        gender: form.sex,          // 백엔드가 sex/gender 중 무엇을 쓰든 서버에서 매핑
        sex: form.sex,             // 둘 다 전달(안전)
        age: Number(form.age),
        neutered: !!form.neutered,
        weight: form.weight ? Number(form.weight) : null,
        size: form.size,           // SMALL/MEDIUM/LARGE
        temperament: form.temperament || null,
        health: form.health || null,
        diseases: form.diseases || null,
        vaccinated: form.vaccinated || null,
        features: form.features || null,
        description: form.description || null,
        status: form.status,
      };

      const created = await createAnimal(payload);          // { id: ..., ... }
      const petId = created?.id ?? created?.petId;

      // 사진 업로드(선택)
      if (petId && files.length > 0) {
        for (const f of files) {
          await uploadAnimalPhoto(petId, f);
        }
      }

      alert('등록 완료!');
      navigate('/shelter', { replace: true });
    } catch (e2) {
      console.error(e2);
      setErr(
        e2?.response?.data?.message ||
        e2?.message ||
        '등록에 실패했습니다. 입력값을 확인하거나 잠시 후 다시 시도해 주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="connect__page">
      <div className="connect__header">
        <h2>동물 등록</h2>
        <div className="connect__actions">
          <Button variant="secondary" onClick={() => navigate(-1)}>뒤로</Button>
        </div>
      </div>

      {err && <div className="alert alert--error">{err}</div>}

      <div className="auth__card">
        <form className="form" onSubmit={onSubmit}>
          {/* 기본 정보 */}
          <div className="grid">
            <Field label="이름" required>
              <input name="name" value={form.name} onChange={onChange} placeholder="예: 뭉치" />
            </Field>
            <Field label="품종" required>
              <input name="breed" value={form.breed} onChange={onChange} placeholder="예: 믹스" />
            </Field>

            <Field label="성별">
              <select name="sex" value={form.sex} onChange={onChange}>
                <option value="M">수컷</option>
                <option value="F">암컷</option>
                <option value="U">미상</option>
              </select>
            </Field>
            <Field label="나이" required>
              <input name="age" value={form.age} onChange={onChange} inputMode="numeric" placeholder="예: 3" />
            </Field>

            <Field label="중성화">
              <label className="inline">
                <input type="checkbox" name="neutered" checked={form.neutered} onChange={onChange} /> 완료
              </label>
            </Field>
            <Field label="체중(kg)">
              <input name="weight" value={form.weight} onChange={onChange} inputMode="decimal" placeholder="예: 6.2" />
            </Field>

            <Field label="크기">
              <select name="size" value={form.size} onChange={onChange}>
                <option value="SMALL">소형</option>
                <option value="MEDIUM">중형</option>
                <option value="LARGE">대형</option>
              </select>
            </Field>
            <Field label="상태">
              <select name="status" value={form.status} onChange={onChange}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="접종">
              <input name="vaccinated" value={form.vaccinated} onChange={onChange} placeholder="예: DHPPL, 광견병" />
            </Field>
            <Field label="질병/특이사항">
              <input name="diseases" value={form.diseases} onChange={onChange} placeholder="예: 슬개골 1기" />
            </Field>

            <Field label="성격">
              <input name="temperament" value={form.temperament} onChange={onChange} placeholder="예: 사람친화, 분리불안" />
            </Field>
            <Field label="특징">
              <input name="features" value={form.features} onChange={onChange} placeholder="예: 흰 점 무늬, 산책 좋아함" />
            </Field>

            <Field label="상세 설명" wide>
              <textarea name="description" rows={4} value={form.description} onChange={onChange} placeholder="자세한 설명을 입력해 주세요." />
            </Field>

            <Field label="사진 업로드" wide>
              <input type="file" multiple accept="image/*" onChange={onFileChange} />
              {files?.length > 0 && (
                <div className="help">{files.length}개 선택됨</div>
              )}
            </Field>
          </div>

          <div className="auth__actions">
            <Button variant="secondary" onClick={() => navigate('/shelter')}>취소</Button>
            <Button type="submit" disabled={loading}>{loading ? '등록 중…' : '등록'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, wide, required }) {
  return (
    <div className={`field ${wide ? 'field--wide' : ''}`}>
      <div className="field__label">
        {label}{required && <span style={{ color:'#ef4444', marginLeft:4 }}>*</span>}
      </div>
      <div className="field__value">{children}</div>
    </div>
  );
}
