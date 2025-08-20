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

const ZONES = [
  '중구','서구','동구','영도구','부산진구','동래구','남구','북구','해운대구','사하구',
  '금정구','강서구','연제구','수영구','사상구','기장군'
];

function Chip({ label, on, onToggle }) {
  return (
    <button
      type="button"
      className={`mgr-chip ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      onClick={onToggle}
    >
      {label}
    </button>
  );
}

export default function ManagerProfilePage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  const [days, setDays]   = useState([]);
  const [start, setStart] = useState('09:00');
  const [end, setEnd]     = useState('18:00');
  const [zones, setZones] = useState([]);
  const [memo, setMemo]   = useState('');

  const isManager = useMemo(
    () => String(user?.role || '').toUpperCase() === 'MANAGER',
    [user]
  );

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

  const toggle = (list, setter, v) => {
    const next = list.includes(v) ? list.filter(x => x !== v) : [...list, v];
    setter(next);
  };

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

  if (!isManager) {
    return <div className="manager" style={{ padding: 24 }}>매니저만 접근 가능합니다.</div>;
  }

  return (
    <section className="card">
      <div className="card__head">
        <h2 className="card__title">프로필 설정</h2>
      </div>

      {loading && <div className="card__body">불러오는 중…</div>}
      {err && !loading && <div className="card__error" style={{ color: 'crimson' }}>{err}</div>}

      {!loading && !err && (
        <form className="mgr-prof">
          {/* 가능 요일 */}
          <fieldset className="mgr-prof__section">
            <legend className="mgr-prof__label">가능 요일</legend>
            <div className="mgr-chipset">
              {DAY_OPTS.map(d => (
                <Chip
                  key={d.value}
                  label={d.label}
                  on={days.includes(d.value)}
                  onToggle={() => toggle(days, setDays, d.value)}
                />
              ))}
            </div>
          </fieldset>

          {/* 가능 시간 */}
          <fieldset className="mgr-prof__section">
            <legend className="mgr-prof__label">가능 시간</legend>
            <div className="mgr-time">
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              <span>~</span>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </fieldset>

          {/* 활동 구역 */}
          <fieldset className="mgr-prof__section">
            <legend className="mgr-prof__label">활동 구역</legend>
            <div className="mgr-chipset">
              {ZONES.map(z => (
                <Chip
                  key={z}
                  label={z}
                  on={zones.includes(z)}
                  onToggle={() => toggle(zones, setZones, z)}
                />
              ))}
            </div>
          </fieldset>

          {/* 메모 */}
          <fieldset className="mgr-prof__section">
            <legend className="mgr-prof__label">메모</legend>
            <input
              className="mgr-memo"
              placeholder="선호 활동/알레르기/교통수단 등"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </fieldset>

          <div className="mgr-prof__actions">
            <Button disabled={saving} onClick={onSave}>
              {saving ? '저장 중…' : '저장'}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
