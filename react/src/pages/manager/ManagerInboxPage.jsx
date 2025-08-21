// src/pages/manager/ManagerInbox.jsx
import React, { useEffect, useState } from 'react';
import { listApplications, managerApprove, managerReject, forwardToShelter } from '../../api/applications';
import Button from '../../components/ui/Button';

function StatusBadge({ status }) {
  const color = {
    PENDING: '#f59e0b',
    MANAGER_APPROVED: '#10b981',
    MANAGER_REJECTED: '#ef4444',
    FORWARDED: '#3b82f6',
    APPROVED: '#22c55e',
    REJECTED: '#ef4444',
  }[status] || '#9ca3af';
  return (
    <span style={{ background:'#f3f4f6', color, padding:'2px 8px', borderRadius: 999, fontSize: 12 }}>
      {status}
    </span>
  );
}

export default function ManagerInbox({ currentUser }) {
  const me = currentUser; // { id, role, name ... }
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const data = await listApplications({ status, page, size });
      setRows(data?.content || []);
      setTotalPages(data?.totalPages || 1);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || '목록 로드 실패');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, page, size]);

  const onApprove = async (id) => {
    try { await managerApprove(id, me?.id); await load(); }
    catch (e) { alert(e?.response?.data?.message || '승인 실패'); }
  };
  const onReject = async (id) => {
    try { await managerReject(id); await load(); }
    catch (e) { alert(e?.response?.data?.message || '거절 실패'); }
  };
  const onForward = async (id) => {
    try { await forwardToShelter(id); await load(); }
    catch (e) { alert(e?.response?.data?.message || '보호소 전달 실패'); }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>매니저 인박스</h1>
      <p style={{ color:'#6b7280', marginBottom: 16 }}>심사대기 → 승인/거절, 승인 건은 보호소로 전달하세요.</p>

      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
        <select value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(0); }}>
          <option value="PENDING">심사대기</option>
          <option value="MANAGER_APPROVED">승인됨</option>
          <option value="MANAGER_REJECTED">거절됨</option>
          <option value="FORWARDED">보호소 전달됨</option>
        </select>
        <Button presetName="secondary" onClick={load} disabled={loading}>새로고침</Button>
        <div style={{ marginLeft:'auto', color:'#6b7280', fontSize:12 }}>
          {page+1} / {totalPages}
        </div>
      </div>

      {error && <div style={{ color:'#b91c1c', marginBottom: 12 }}>{error}</div>}

      <div style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f9fafb' }}>
              <th style={th}>ID</th>
              <th style={th}>상태</th>
              <th style={th}>동물</th>
              <th style={th}>신청자</th>
              <th style={th}>메모</th>
              <th style={th}>액션</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ borderTop:'1px solid #f1f5f9' }}>
                <td style={td}>{r.id}</td>
                <td style={td}><StatusBadge status={r.status} /></td>
                <td style={td}>
                  {r.animalName || r.desertionNo || r.animalId}
                  {r.animal?.careNm ? <div style={{ color:'#6b7280', fontSize:12 }}>{r.animal.careNm}</div>:null}
                </td>
                <td style={td}>{r.seniorName || r.seniorId}</td>
                <td style={td}>{r.note?.slice(0,80)}</td>
                <td style={td}>
                  {r.status === 'PENDING' && (
                    <>
                      <Button presetName="primary" size="sm" onClick={()=>onApprove(r.id)} style={{ marginRight:6 }}>승인</Button>
                      <Button presetName="danger" size="sm" onClick={()=>onReject(r.id)} style={{ marginRight:6 }}>거절</Button>
                    </>
                  )}
                  {r.status === 'MANAGER_APPROVED' && (
                    <Button presetName="secondary" size="sm" onClick={()=>onForward(r.id)}>보호소 전달</Button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ padding:20, textAlign:'center', color:'#6b7280' }}>데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:12 }}>
        <Button presetName="secondary" disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>이전</Button>
        <Button presetName="secondary" disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}>다음</Button>
      </div>
    </div>
  );
}

const th = { textAlign:'left', padding:'10px 12px', fontSize:12, color:'#374151', borderBottom:'1px solid #e5e7eb' };
const td = { padding:'10px 12px', fontSize:14, color:'#111827' };
