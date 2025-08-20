import React, { useEffect, useMemo, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { loadMyProfile, saveMyProfile } from '../../api/manager';
import './manager.css';

const DAY_OPTS = [
  { value: 'MON', label: '월' }, { value: 'TUE', label: '화' }, { value: 'WED', label: '수' },
  { value: 'THU', label: '목' }, { value: 'FRI', label: '금' }, { value: 'SAT', label: '토' },
  { value: 'SUN', label: '일' },
];
const ZONES = ['중구','서구','동구','영도구','부산진구','동래구','남구','북구','해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군'];

export default function ManagerProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const [days, setDays] = useState([]);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('18:00');
  const [zones, setZones] = useState([]);
  const [memo, setMemo] = useState('');

  const isManager = useMemo(() => String(user?.role || '').toUpperCase() === 'MANAGER', [user]);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr('');
      try {
        const p = await loadMyProfile();
        setDays(Array.isArray(p?.days) ? p.days : []);
        setStart(p?.timeRange?.start || '09:00');
        setEnd(p?.timeRange?.end || '18:00');
        setZones(Array.isArray(p?.zones) ? p.zones : []);
        setMemo(p?.memo || '');
      } catch (e) {
        setErr(e?.message || '불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (list, setter, v) =>
    setter(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const onSave = async () => {
    setSaving(true); setErr('');
    try {
      await saveMyProfile({ days, timeRange: { start, end }, zones, memo });
      alert('저장되었습니다.');
    } catch (e) {
      setErr(e?.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  if (!isManager) return <div className="manager" style={{padding:24}}>매니저만 접근 가능합니다.</div>;

  return (
    <section className="card">
      <div className="card__head">
        <h2 className="card__title">프로필 설정</h2>
      </div>

      {loading && <div className="card__body">불러오는 중…</div>}
      {err && !loading && <div className="card__error" style={{color:'crimson'}}>{err}</div>}

      {!loading && !err && (
        <div className="mgr__profile">
          <div className="mgr__section">
            <div className="mgr__label">가능 요일</div>
            <div className="chips">
              {DAY_OPTS.map(d => {
                const on = days.includes(d.value);
                return (
                  <span key={d.value}
                        className={`chip ${on ? 'chip--on' : ''}`}
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => toggle(days, setDays, d.value)}>
                    {d.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mgr__section">
            <div className="mgr__label">가능 시간</div>
            <div className="mgr__time">
              <input type="time" value={start} onChange={(e)=>setStart(e.target.value)} />
              <span>~</span>
              <input type="time" value={end} onChange={(e)=>setEnd(e.target.value)} />
            </div>
          </div>

          <div className="mgr__section">
            <div className="mgr__label">활동 구역</div>
            <div className="chips">
              {ZONES.map(z => {
                const on = zones.includes(z);
                return (
                  <span key={z}
                        className={`chip ${on ? 'chip--on' : ''}`}
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => toggle(zones, setZones, z)}>
                    {z}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mgr__section">
            <div className="mgr__label">메모</div>
            <input
              className="mgr__memo"
              placeholder="선호 활동/알레르기/교통수단 등"
              value={memo}
              onChange={(e)=>setMemo(e.target.value)}
            />
          </div>

          <div className="mgr__actions" style={{justifyContent:'flex-end'}}>
            <Button disabled={saving} onClick={onSave}>{saving ? '저장 중…' : '저장'}</Button>
          </div>
        </div>
      )}
    </section>
  );
}
