// src/pages/senior/SeniorPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { fetchAnimals } from '../../api/animals';
import { getPetsRecommended } from '../../api/recommendations';
import { getMySeniorProfile, upsertMySeniorProfile } from '../../api/seniors';
import {
  DAY_OPTS, SPECIES_OPTS, SIZE_OPTS, AGE_PREF_OPTS,
  GENDER_PREF_OPTS, TEMPERAMENT_OPTS, HEALTH_TOL_OPTS,
} from '../../config/constants';
import './senior.css';

export default function SeniorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  // mode: 'browse' | 'recommend'
  const [mode, setMode] = useState('browse');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // 목록 데이터
  const [page, setPage] = useState(1); // 1-base
  const [data, setData] = useState({ content: [], total: 0, size: 12 });

  // 프로필
  const [profile, setProfile] = useState(null);
  const [openProfile, setOpenProfile] = useState(false);

  // 최초: 프로필 조회 → 있으면 추천 모드로
  useEffect(() => {
    (async () => {
      if (!userId) return;
      const p = await getMySeniorProfile(userId);
      if (p) {
        setProfile(p);
        setMode('recommend');
      } else {
        setMode('browse');
      }
    })();
  }, [userId]);

  const loadBrowse = async () => {
    setLoading(true); setErr('');
    try {
      const res = await fetchAnimals({
        available: true,
        page, size: 12, sort: 'createdAt,DESC',
      });
      setData(res || { content: [], total: 0, size: 12 });
    } catch (e) {
      setErr(e?.message || '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommend = async () => {
    setLoading(true); setErr('');
    try {
      let res = await getPetsRecommended?.(userId, Math.max(0, page - 1), 12);
      if (Array.isArray(res)) res = { content: res, total: res.length, size: 12 };
      if (!res?.content?.length) {
        await loadBrowse();
        return;
      }
      const mapped = {
        ...res,
        content: (res.content || []).map((it) => ({
          id: it.id || it.animalId,
          name: it.name || `#${it.desertionNo || it.id}`,
          breed: it.breed || '-',
          age: it.age ?? '-',
          temperament: it.temperament || '-',
          neutered: it.neutered ?? null,
          photoUrl: it.photoUrl || it.thumbnail || null,
          _score: it.matchScore,
        })),
      };
      setData(mapped);
    } catch (e) {
      await loadBrowse();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'browse') loadBrowse();
    else loadRecommend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, page]);

  const onClickApply = (pet) => {
    localStorage.setItem('selectedPet', JSON.stringify(pet));
    navigate(`/pet/${pet.id}/apply`);
  };

  const onSaveProfile = async (form) => {
    if (!userId) return;
    const payload = {
      // A
      userId,
      name: form.name,
      phoneNumber: form.phoneNumber,
      address: form.address,
      birthDate: form.birthDate,
      emergencyContact: form.emergencyContact,
      welfareOfficerId: form.welfareOfficerId || null,
      // B
      hasPetExperience: !!form.hasPetExperience,
      preferredPetInfo: { ...form.preferredPetInfo },
      careAvailability: { ...form.careAvailability },
    };
    await upsertMySeniorProfile(userId, payload);
    setProfile(payload);
    setOpenProfile(false);
    setMode('recommend');
    setPage(1);
  };

  return (
    <div className="senior">
      <div className="senior__header">
        <h1>{mode === 'browse' ? '입양 가능 동물' : '맞춤 추천 동물'}</h1>
        <div style={{ display:'flex', gap:8 }}>
          {mode === 'browse' ? (
            <Button presetName="secondary" onClick={() => setOpenProfile(true)}>맞춤 추천 받기</Button>
          ) : (
            <>
              <Button presetName="ghost" onClick={() => setMode('browse')}>전체 보기</Button>
              <Button presetName="secondary" onClick={() => setOpenProfile(true)}>프로필 수정</Button>
            </>
          )}
          <Button onClick={() => navigate('/senior/connect')} presetName="connectbtn">내 신청 현황</Button>
          <Button presetName="ghost" onClick={() => navigate('/logout')}>로그아웃</Button>
        </div>
      </div>

      {loading && <p>불러오는 중…</p>}
      {err && !loading && <div className="auth__error">{err}</div>}

      {!loading && !err && (
        <div className="senior__grid">
          {(data.content || []).map((pet) => (
            <Card
              key={pet.id}
              variant="elevated"
              media={pet.photoUrl ? <img src={pet.photoUrl} alt={pet.name} /> : null}
              title={pet.name || `#${pet.id}`}
              subtitle={`${pet.breed || '-'} · ${pet.age ?? '-' }살`}
              actions={mode === 'recommend' && pet._score ? <Badge>매칭점수 {Math.round(pet._score)}</Badge> : null}
              footer={<Button presetName="apply" onClick={() => onClickApply(pet)}>신청하기</Button>}
            >
              성격: {pet.temperament ?? '-'} · 중성화: {pet.neutered == null ? '-' : pet.neutered ? '예' : '아니오'}
            </Card>
          ))}
          {(!data.content || data.content.length === 0) && <p>표시할 결과가 없습니다.</p>}
        </div>
      )}

      {/* 페이지네이션 */}
      <div className="senior__pagination">
        <Button presetName="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
        <span>{page}</span>
        <Button presetName="ghost" disabled={(page * (data.size || 12)) >= (data.total || 0)} onClick={() => setPage((p) => p + 1)}>다음</Button>
      </div>

      {/* 프로필 모달 */}
      {openProfile && (
        <ProfileModal
          onClose={() => setOpenProfile(false)}
          onSave={onSaveProfile}
          defaultValues={profile}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────
   인라인 프로필 모달 (A,B만)
   약관/바디캠은 ApplyPage에서 처리
────────────────────────────── */
function ProfileModal({ onClose, onSave, defaultValues }) {
  const [form, setForm] = useState(() => ({
    // A
    name: defaultValues?.name || '',
    phoneNumber: defaultValues?.phoneNumber || '',
    address: defaultValues?.address || '',
    birthDate: defaultValues?.birthDate || '',
    emergencyContact: defaultValues?.emergencyContact || '',
    welfareOfficerId: defaultValues?.welfareOfficerId || null,
    // B
    hasPetExperience: !!defaultValues?.hasPetExperience,
    preferredPetInfo: {
      species: defaultValues?.preferredPetInfo?.species || 'dog',
      size: defaultValues?.preferredPetInfo?.size || 'small',
      agePref: defaultValues?.preferredPetInfo?.agePref || 'any',
      genderPref: defaultValues?.preferredPetInfo?.genderPref || 'any',
      temperamentPref: defaultValues?.preferredPetInfo?.temperamentPref || 'any',
      healthTolerance: defaultValues?.preferredPetInfo?.healthTolerance || 'any',
    },
    careAvailability: {
      days: defaultValues?.careAvailability?.days || [],
      timeRange: defaultValues?.careAvailability?.timeRange || { start:'', end:'' },
      visitFreqPerWeek: defaultValues?.careAvailability?.visitFreqPerWeek || 1,
    },
  }));
  const [err, setErr] = useState('');
  const set = (k,v)=>setForm(f=>({...f,[k]:v}));
  const setNested=(g,k,v)=>setForm(f=>({...f,[g]:{...f[g],[k]:v}}));
  const toggleDay=(d)=>setForm(f=>{
    const s=new Set(f.careAvailability.days);
    s.has(d)?s.delete(d):s.add(d);
    return {...f, careAvailability:{...f.careAvailability, days:[...s]}};
  });

  const ymd=(s)=>/^\d{4}-\d{2}-\d{2}$/.test(s);
  const hhmm=(s)=>/^\d{2}:\d{2}$/.test(s);
  const validate=()=>{
    if(!form.name||!form.address||!form.birthDate||!form.emergencyContact) return '필수값을 확인해 주세요.';
    if(!ymd(form.birthDate)) return '생년월일은 YYYY-MM-DD 형식이어야 해요.';
    const ca=form.careAvailability;
    if(!Array.isArray(ca.days)||ca.days.length===0) return '가능 요일을 한 개 이상 선택해 주세요.';
    if(!hhmm(ca.timeRange.start)||!hhmm(ca.timeRange.end)) return '시간대는 HH:MM 형식이어야 합니다.';
    if(ca.visitFreqPerWeek<1||ca.visitFreqPerWeek>7) return '주 방문 횟수는 1~7 사이여야 합니다.';
    return '';
  };

  const submit=()=>{
    const v=validate();
    if(v){ setErr(v); return; }
    onSave(form);
  };

  return (
    <div className="modal">
      <div className="modal__content card" style={{maxWidth:720}}>
        <h3>맞춤 추천을 위한 기본 정보</h3>

        <h4 className="h6">A. 기본 신원/연락</h4>
        <div className="form-grid">
          <label>이름<input value={form.name} onChange={e=>set('name', e.target.value)} /></label>
          <label>연락처<input value={form.phoneNumber} onChange={e=>set('phoneNumber', e.target.value)} /></label>
          <label>주소<input value={form.address} onChange={e=>set('address', e.target.value)} /></label>
          <label>생년월일<input type="date" value={form.birthDate} onChange={e=>set('birthDate', e.target.value)} /></label>
          <label>비상 연락처<input value={form.emergencyContact} onChange={e=>set('emergencyContact', e.target.value)} /></label>
          <label>담당 복지사 ID(선택)<input type="number" value={form.welfareOfficerId ?? ''} onChange={e=>set('welfareOfficerId', e.target.value?Number(e.target.value):null)} /></label>
        </div>

        <h4 className="h6">B. 반려/돌봄</h4>
        <label className="row">
          <input type="checkbox" checked={form.hasPetExperience} onChange={e=>set('hasPetExperience', e.target.checked)} />
          반려/돌봄 경험이 있어요
        </label>

        <div className="form-grid">
          <label>선호 종
            <select value={form.preferredPetInfo.species}
              onChange={e=>setNested('preferredPetInfo','species', e.target.value)}>
              {SPECIES_OPTS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label>선호 크기
            <select value={form.preferredPetInfo.size}
              onChange={e=>setNested('preferredPetInfo','size', e.target.value)}>
              {SIZE_OPTS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label>선호 연령
            <select value={form.preferredPetInfo.agePref}
              onChange={e=>setNested('preferredPetInfo','agePref', e.target.value)}>
              {AGE_PREF_OPTS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label>선호 성별
            <select value={form.preferredPetInfo.genderPref}
              onChange={e=>setNested('preferredPetInfo','genderPref', e.target.value)}>
              {GENDER_PREF_OPTS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label>선호 성격
            <select value={form.preferredPetInfo.temperamentPref}
              onChange={e=>setNested('preferredPetInfo','temperamentPref', e.target.value)}>
              {TEMPERAMENT_OPTS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label>건강 상태 허용 범위
            <select value={form.preferredPetInfo.healthTolerance}
              onChange={e=>setNested('preferredPetInfo','healthTolerance', e.target.value)}>
              {HEALTH_TOL_OPTS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-grid">
          <label>가능 요일
            <div className="chips">
              {DAY_OPTS.map(d => (
                <label key={d.value}
                  className={`chip ${form.careAvailability.days.includes(d.value) ? 'chip--on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.careAvailability.days.includes(d.value)}
                    onChange={() => {
                      const set = new Set(form.careAvailability.days);
                      set.has(d.value) ? set.delete(d.value) : set.add(d.value);
                      setForm(f => ({
                        ...f,
                        careAvailability: { ...f.careAvailability, days: [...set] },
                      }));
                    }}
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </label>

          <label>시간대(시작)
            <input
              type="time"
              value={form.careAvailability.timeRange.start}
              onChange={e => setNested('careAvailability', 'timeRange', {
                ...form.careAvailability.timeRange, start: e.target.value,
              })}
            />
          </label>

          <label>시간대(종료)
            <input
              type="time"
              value={form.careAvailability.timeRange.end}
              onChange={e => setNested('careAvailability', 'timeRange', {
                ...form.careAvailability.timeRange, end: e.target.value,
              })}
            />
          </label>

          <label>주 방문 횟수
            <input
              type="number" min={1} max={7}
              value={form.careAvailability.visitFreqPerWeek}
              onChange={e => setNested('careAvailability', 'visitFreqPerWeek', Number(e.target.value || 1))}
            />
          </label>
        </div>

        {err && <div className="auth__error">{err}</div>}

        <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:12}}>
          <Button presetName="ghost" onClick={onClose}>취소</Button>
          <Button presetName="primary" onClick={submit}>저장하고 추천 보기</Button>
        </div>
      </div>
      <div className="modal__scrim" onClick={onClose} />
    </div>
  );
}
