import React, { useEffect, useMemo, useRef, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { fetchMyApplications, cancelApplication } from '../../api/applications';
import Button from '../../components/ui/Button';
import './senior.css';

const fmt = (iso) => { try { return new Date(iso).toLocaleString('ko-KR'); } catch { return iso ?? '-'; } };
const StatusChip = ({ s }) => {
  const map = { PENDING:'대기', FORWARDED:'보호소 검토중', APPROVED:'승인', REJECTED:'거절' };
  const label = map[s] || s || '대기';
  const cls = s === 'APPROVED' ? 'chip chip--approved'
           : s === 'REJECTED' ? 'chip chip--rejected'
           : 'chip chip--pending';
  return <span className={cls}>{label}</span>;
};

export default function ConnectPage() {
  const { user } = useAuth();
  const seniorId = useMemo(() => user?.seniorId || user?.id, [user]);

  const [page, setPage] = useState({ number: 0, size: 10, totalElements: 0, content: [] });
  const [loading, setLoading] = useState(false);
  const [autoOn, setAutoOn] = useState(true); // 자동 새로고침 on/off
  const [tick, setTick] = useState(0);        // 실시간 라벨 깜빡임용
  const [toast, setToast] = useState({ show:false, kind:'success', text:'' });

  const timerRef = useRef(null);
  const blinkRef = useRef(null);
  const approvedRef = useRef(new Set()); // 이전에 승인된 app id 추적
  const rejectedRef = useRef(new Set()); // 이전에 거절된 app id 추적

  const load = ({ number = 0, size = page.size } = {}) => {
    if (!seniorId) return;
    setLoading(true);
    fetchMyApplications({ seniorId, page: number, size })
      .then((res) => {
        // 상태 변화 감지 → 토스트
        const nextApproved = new Set();
        const nextRejected = new Set();
        (res.content || []).forEach(it => {
          if (it.status === 'APPROVED') nextApproved.add(it.id);
          if (it.status === 'REJECTED') nextRejected.add(it.id);
        });

        // 새로 승인된 항목 (기존에 없던 승인 id)
        for (const id of nextApproved) {
          if (!approvedRef.current.has(id)) {
            showToast('success', '매칭 승인 완료! 보호소와 일정을 조율해 주세요.');
            break;
          }
        }
        // 새로 거절된 항목
        for (const id of nextRejected) {
          if (!rejectedRef.current.has(id)) {
            showToast('error', '아쉽지만 이번 매칭은 거절되었어요. 다른 친구들에게도 신청해보세요.');
            break;
          }
        }

        approvedRef.current = nextApproved;
        rejectedRef.current = nextRejected;
        setPage(res);
      })
      .finally(()=>setLoading(false));
  };

  const showToast = (kind, text) => {
    setToast({ show:true, kind, text });
    // 4.5초 후 자동 숨김
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(t => ({ ...t, show:false })), 4500);
  };

  // 최초 로드
  useEffect(()=>{ load({ number: 0 }); }, [seniorId]);

  // 3초 폴링 + 탭 비활성화 시 일시정지
  useEffect(() => {
    const start = () => {
      if (timerRef.current || !autoOn) return;
      timerRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') load({ number: page.number });
      }, 3000);
    };
    const stop = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

    if (autoOn) start();
    const onVis = () => { if (document.visibilityState === 'visible') start(); else stop(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, [autoOn, page.number, seniorId]);

  // 실시간 라벨 깜빡임(점 애니메이션)
  useEffect(() => {
    if (!autoOn) { setTick(0); window.clearInterval(blinkRef.current); return; }
    blinkRef.current = window.setInterval(() => setTick(t => (t+1)%4), 600);
    return () => window.clearInterval(blinkRef.current);
  }, [autoOn]);

  return (
    <div className="senior connect">
      {/* 토스트 배너 */}
      {toast.show && (
        <div className={`toast ${toast.kind === 'success' ? 'toast--green' : 'toast--red'}`}>
          {toast.text}
        </div>
      )}

      <div className="senior__header">
        <h1>매칭 현황</h1>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <Button onClick={()=>load({ number: page.number })}>
            {loading ? '새로고침 중…' : '새로고침'}
          </Button>

          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, color:'#667085' }}>
            <input type="checkbox" checked={autoOn} onChange={e=>setAutoOn(e.target.checked)} />
            {autoOn ? `실시간 업데이트 중${'.'.repeat(tick)}` : '자동 새로고침 꺼짐'}
          </label>
        </div>
      </div>

      {loading && <p>불러오는 중…</p>}

      <ul className="connect__list">
        {(page.content || []).map(it => (
          <li key={it.id} className="connect__item">
            <div className="left">
              <img src={it.pet?.photoUrl || it.pet?.popfile || '/placeholder-dog.png'} alt="" />
              <div>
                <div className="title">{it.pet?.name || '(이름없음)'}</div>
                <div className="sub">
                  {(it.pet?.breed || it.pet?.species || '-')}&nbsp;·&nbsp;
                  {(it.pet?.gender || it.pet?.sex || '-').toString()}&nbsp;·&nbsp;
                  {(String(it.pet?.neuter||'').toUpperCase()==='Y') ? '중성화':'미중성화'}
                </div>
                <div className="time">신청일 {fmt(it.createdAt)}</div>
              </div>
            </div>
            <div className="right">
              <StatusChip s={it.status} />
              {it.status === 'PENDING' && (
                <Button variant="ghost" onClick={()=>cancelApplication(it.id).then(()=>load({ number: page.number }))}>
                  취소
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {(!loading && (page.content||[]).length === 0) && (
        <div className="empty">아직 신청한 매칭이 없어요. 시니어 페이지에서 동물을 선택해 신청해보세요!</div>
      )}
    </div>
  );
}
