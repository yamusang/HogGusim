// src/pages/pet/PetConnectPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import Button from '../../components/ui/Button';
import './pet.css';

export default function PetConnectPage() {
  const { appId } = useParams(); // /pet/connect/:appId 로 라우팅 가정
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [app, setApp] = useState(null); // 신청서 데이터

  const load = async () => {
    if (!appId) return;
    setLoading(true); setErr('');
    try {
      const { data } = await api.get(`/applications/${appId}`);
      setApp(data);
    } catch (e) {
      console.error(e);
      setErr('신청서를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [appId]);

  const doApprove = async () => {
    try {
      setLoading(true);
      await api.post(`/applications/${appId}/approve`);
      alert('승인 완료!');
      navigate('/shelter'); // 목록으로
    } catch (e) {
      console.error(e);
      alert('승인 실패');
    } finally {
      setLoading(false);
    }
  };

  const doReject = async () => {
    try {
      setLoading(true);
      await api.post(`/applications/${appId}/reject`);
      alert('거절 완료');
      navigate('/shelter');
    } catch (e) {
      console.error(e);
      alert('거절 실패');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !app) return <div className="page-loading">불러오는 중…</div>;

  return (
    <div className="connect__page">
      <header className="connect__header">
        <h2>강아지 매칭 확인</h2>
        <div className="connect__actions">
          <Button variant="secondary" onClick={() => navigate(-1)}>뒤로</Button>
        </div>
      </header>

      {err && <div className="alert alert--error">{err}</div>}

      {app && (
        <section className="connect__card">
          <div className="connect__pet">
            <img
              src={app.pet?.photoUrl || '/placeholder-dog.png'}
              alt="pet"
              onError={(e)=>{ e.currentTarget.src='/placeholder-dog.png'; }}
            />
            <div className="connect__pet-info">
              <div className="title">{app.pet?.name || '이름 없음'}</div>
              <div className="meta">
                <span>{app.pet?.breed || '품종 미상'}</span>
                <span>· {app.pet?.age != null ? `${app.pet.age}살` : '나이 미상'}</span>
                <span>· {app.pet?.neutered ? '중성화' : '미중성화'}</span>
              </div>
            </div>
          </div>

          <div className="connect__form">
            <h3>신청자 정보</h3>
            <div className="grid">
              <Field label="이름" value={app.name} />
              <Field label="성별" value={app.gender} />
              <Field label="나이" value={app.age ? `${app.age}세` : '-'} />
              <Field label="경험" value={app.experience || '-'} />
              <Field label="주소" value={app.address || '-'} wide />
              <Field label="이용시간" value={app.timeRange || '-'} />
              <Field label="요일" value={Array.isArray(app.days) ? app.days.join(', ') : (app.days || '-')} />
              <Field label="날짜" value={app.date || '-'} />
              <Field label="전화번호" value={app.phone || '-'} />
              <Field label="긴급연락망" value={app.emergency || '-'} wide />
              <Field label="약관 동의" value={app.agreeTerms ? '동의' : '미동의'} />
              <Field label="바디캠 동의" value={app.agreeBodycam ? '동의(필수)' : '미동의'} />
            </div>

            <div className="connect__approve">
              <Button onClick={doApprove} disabled={loading || !app.agreeBodycam}>승인</Button>
              <Button variant="danger" onClick={doReject} disabled={loading}>거절</Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, value, wide }) {
  return (
    <div className={`field ${wide ? 'field--wide' : ''}`}>
      <div className="field__label">{label}</div>
      <div className="field__value">{value ?? '-'}</div>
    </div>
  );
}
