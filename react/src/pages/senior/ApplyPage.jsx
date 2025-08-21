import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { createApplication } from '../../api/applications';
import './senior.css';

function Toggle({ checked, onChange, label }) {
  const id = React.useMemo(()=>`tgl-${Math.random().toString(36).slice(2,8)}`,[]);
  return (
    <label htmlFor={id} className="tgl">
      <input id={id} type="checkbox" checked={!!checked} onChange={e=>onChange?.(e.target.checked)} />
      <span className="tgl__track" aria-hidden />
      <span className="tgl__label">{label}</span>
    </label>
  );
}
function Accordion({ title, children, defaultOpen=false }) {
  const [open,setOpen] = useState(!!defaultOpen);
  return (
    <div className={`acc ${open?'acc--open':''}`}>
      <button type="button" className="acc__head" onClick={()=>setOpen(o=>!o)} aria-expanded={open}>
        <span>{title}</span><svg width="16" height="16" viewBox="0 0 24 24" className="acc__chev"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
      </button>
      {open && <div className="acc__body">{children}</div>}
    </div>
  );
}

const DAYS = ['월','화','수','목','금','토','일'];

export default function ApplyPage() {
  const nav = useNavigate();
  const { petId: petIdParam } = useParams();

  const pet = useMemo(() => {
    if (petIdParam) return { id: Number(petIdParam) };
    try { return JSON.parse(localStorage.getItem('selectedPet') || 'null') || {}; }
    catch { return {}; }
  }, [petIdParam]);

  const [form, setForm] = useState({
    note: '',
    phone: '',
    emergency: '',
    timeRange: '오전',
    days: [],
    agreeTerms: false,
    agreeBodycam: false,
  });

  const toggleDay = (d) =>
    setForm(f => ({ ...f, days: f.days.includes(d) ? f.days.filter(x=>x!==d) : [...f.days, d] }));

  const disabled = !(form.agreeTerms && form.agreeBodycam && pet?.id);

  const submit = async (e) => {
    e.preventDefault();
    const pretty = [
      form.note && `메모: ${form.note}`,
      `연락처: ${form.phone || '-'}`,
      `비상연락망: ${form.emergency || '-'}`,
      `희망 요일: ${(form.days.length ? form.days.join(', ') : '-')}`,
      `희망 시간대: ${form.timeRange || '-'}`,
    ].filter(Boolean).join('\n');

    await createApplication({
      petId: Number(pet.id),
      note: pretty,
      agreeTerms: !!form.agreeTerms,
      agreeBodycam: !!form.agreeBodycam,
    });

    alert('신청이 완료되었습니다!');
    nav('/', { replace: true }); // ← 메인으로 이동
  };

  return (
    <div className="senior apply">
      <h1>신청서</h1>

      <div className="apply__pet">
        <img src={pet?.photoUrl || pet?._raw?.popfile || '/placeholder-dog.png'} alt={pet?.name || '유기동물'} />
        <div>
          <div className="title">{pet?.name || '(이름없음)'}</div>
          <div className="sub">{pet?.breed || pet?.species || '-'} · {(pet?.gender || pet?.sex || '-').toString()}</div>
        </div>
      </div>

      <form onSubmit={submit} className="apply__form">
        <label>메모(선택)
          <textarea
            placeholder="예: 주 3회 방문 가능, 알레르기 없음"
            value={form.note}
            onChange={e=>setForm(f=>({ ...f, note: e.target.value }))}
          />
        </label>

        <div className="grid-2">
          <label>연락처
            <input type="tel" placeholder="예) 010-1234-5678"
              value={form.phone}
              onChange={e=>setForm(f=>({ ...f, phone: e.target.value }))} />
          </label>
          <label>비상연락망
            <input type="tel" placeholder="가족/지인 연락처"
              value={form.emergency}
              onChange={e=>setForm(f=>({ ...f, emergency: e.target.value }))} />
          </label>
        </div>

        <div className="grid-2">
          <fieldset className="fieldset">
            <legend>희망 요일</legend>
            <div className="days">
              {DAYS.map(d => (
                <label key={d} className={`chip ${form.days.includes(d)?'chip--on':''}`}>
                  <input type="checkbox" checked={form.days.includes(d)} onChange={()=>toggleDay(d)} />
                  {d}
                </label>
              ))}
            </div>
          </fieldset>

          <label>희망 시간대
            <select
              value={form.timeRange}
              onChange={e=>setForm(f=>({ ...f, timeRange: e.target.value }))}
            >
              <option value="오전">오전</option>
              <option value="오후">오후</option>
              <option value="저녁">저녁</option>
              <option value="주말 위주">주말 위주</option>
            </select>
          </label>
        </div>

        <div className="agreements">
          <div className="agree__item">
            <div className="agree__row">
              <Toggle
                label="이용 약관에 동의합니다"
                checked={form.agreeTerms}
                onChange={(v)=>setForm(f=>({ ...f, agreeTerms:v }))}
              />
              <button type="button" className="linkbtn" onClick={(e)=>e.currentTarget.closest('.agree__item')?.querySelector('.acc__head')?.click()}>자세히</button>
            </div>
            <Accordion title="이용 약관 요약" defaultOpen={false}>
              <ol className="terms">
                <li><strong>목적</strong>: 고령자-보호소 체험/입양 연계 지원.</li>
                <li><strong>책임</strong>: 돌봄 중 사고·파손 등은 보호소 지침/관련 법령에 따름.</li>
                <li><strong>개인정보</strong>: 매칭/안전관리 목적 범위에서만 사용, 법정 보관 후 파기.</li>
                <li><strong>금지</strong>: 학대·무단양도·허위정보 등은 제한/법적 조치 가능.</li>
                <li><strong>위급시</strong>: 즉시 보호소/복지사 연락망으로 보고.</li>
              </ol>
            </Accordion>
          </div>

          <div className="agree__item">
            <div className="agree__row">
              <Toggle
                label="돌봄 안전을 위한 바디캠 운영에 동의합니다"
                checked={form.agreeBodycam}
                onChange={(v)=>setForm(f=>({ ...f, agreeBodycam:v }))}
              />
              <button type="button" className="linkbtn" onClick={(e)=>e.currentTarget.closest('.agree__item')?.querySelectorAll('.acc__head')[0]?.click()}>자세히</button>
            </div>
            <Accordion title="바디캠 운영 안내(요약)" defaultOpen={false}>
              <ul className="terms">
                <li><strong>목적</strong>: 안전사고 분쟁 예방 및 응급 대응 품질 향상.</li>
                <li><strong>촬영</strong>: 인수/반납 순간, 산책 시작·종료, 응급/돌발 상황.</li>
                <li><strong>보관</strong>: 원칙 30일 후 자동 파기(분쟁 시 연장 가능).</li>
                <li><strong>권한</strong>: 본인/보호소/복지사 최소 권한, 법령 요청 시 외부 제공.</li>
                <li><strong>거부</strong>: 미동의 시 일부 체험/매칭 제한 가능.</li>
              </ul>
            </Accordion>
          </div>
        </div>

        <Button type="submit" className="applibtn" disabled={disabled}>신청하기</Button>
      </form>
    </div>
  );
}
