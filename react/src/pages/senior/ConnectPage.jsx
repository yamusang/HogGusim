import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { fetchMyApplications } from '../../api/applications';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/ui/Button';
import './senior.css';

export default function ConnectPage() {
  const { user } = useAuth();
  const seniorId = user?.id || user?.seniorId;

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    if (!seniorId) return;
    setLoading(true);
    setErr('');
    try {
      const res = await fetchMyApplications(seniorId);
      setApps(res.content || res); // API 응답 구조에 맞게 수정
    } catch (e) {
      setErr(e.message || '매칭 현황을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [seniorId]);

  return (
    <div className="senior">
      <h1>매칭 현황</h1>
      {err && <div className="auth__error">{err}</div>}
      {loading ? <p>불러오는 중…</p> : (
        <div className="senior__grid">
          {apps.map((app) => (
            <Card
              key={app.id}
              media={<img src={app.petPhotoUrl} alt={app.petName} />}
              title={app.petName}
              subtitle={`${app.petBreed} · ${app.petAge}살`}
              actions={
                <Badge variant={
                  app.status === 'PENDING' ? 'pending' :
                  app.status === 'MATCHED' ? 'matched' : 'adopted'
                }>
                  {app.status === 'PENDING' && '대기 중'}
                  {app.status === 'MATCHED' && '매칭 완료'}
                  {app.status === 'ADOPTED' && '입양 완료'}
                </Badge>
              }
              footer={
                app.status === 'MATCHED' && (
                  <Button presetName="connect" to={`/pet/${app.petId}`}>상세 보기</Button>
                )
              }
            >
              신청일: {new Date(app.createdAt).toLocaleDateString()}<br />
              보호소: {app.shelterName}
            </Card>
          ))}
          {apps.length === 0 && <p>신청 내역이 없습니다.</p>}
        </div>
      )}
    </div>
  );
}
