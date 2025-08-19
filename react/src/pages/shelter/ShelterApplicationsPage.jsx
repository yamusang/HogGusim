import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listByPet, approveApplication, rejectApplication } from '../../api/applications';
import Button from '../../components/ui/Button';
import './shelter.css';

export default function ShelterApplicationsPage() {
  const { animalId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [actingId, setActingId] = useState(null);

  const load = async () => {
    if (!animalId) return;
    setLoading(true); setErr('');
    try {
      const res = await listByPet(Number(animalId));
      const rows = Array.isArray(res?.content) ? res.content : (Array.isArray(res) ? res : []);
      setItems(rows);
    } catch (e) {
      setErr(e.message || '신청자 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [animalId]);

  const onApprove = async (id) => {
    if (!window.confirm('이 신청을 승인할까요?')) return;
    try {
      setActingId(id);
      await approveApplication(id);
      await load();
    } catch (e) {
      alert(e.message || '승인에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const onReject = async (id) => {
    if (!window.confirm('이 신청을 거절할까요?')) return;
    try {
      setActingId(id);
      await rejectApplication(id);
      await load();
    } catch (e) {
      alert(e.message || '거절에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="p-4">
      <h2>동물 #{animalId} 신청자 관리</h2>
      {err && <div className="auth__error">{err}</div>}
      {loading ? <p>불러오는 중…</p> : (
        <div className="shelter__apps">
          {items.map((it) => (
            <div key={it.id} className="shelter__app-row">
              <div className="shelter__app-main">
                <div className="title">
                  신청자: {it.senior?.name || `Senior#${it.seniorId}`} · 매니저: {it.manager?.name || `Manager#${it.managerId}`}
                </div>
                <div className="sub">
                  상태: <b>{it.status}</b>
                  {it.createdAt && <> · 신청일: {new Date(it.createdAt).toLocaleString()}</>}
                  {it.phone && <> · 연락처: {it.phone}</>}
                </div>
              </div>
              <div className="shelter__app-actions">
                <Button disabled={actingId === it.id} onClick={() => onApprove(it.id)}>
                  {actingId === it.id ? '승인 중…' : '승인'}
                </Button>
                <Button presetName="ghost" disabled={actingId === it.id} onClick={() => onReject(it.id)}>
                  {actingId === it.id ? '거절 중…' : '거절'}
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="muted">신청자가 없습니다.</div>}
        </div>
      )}
    </div>
  );
}
