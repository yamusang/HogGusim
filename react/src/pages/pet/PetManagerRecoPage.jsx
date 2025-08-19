// src/pages/pet/PetManagerRecoPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getManagersRecommended } from '../../api/recommendations';
import { createApplication } from '../../api/applications'; // ✅ 신청 생성 API
import Button from '../../components/ui/Button';
import './pet.css';

export default function PetManagerRecoPage() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const seniorId = user?.id || user?.seniorId || Number(localStorage.getItem('userId'));

  const [page, setPage] = useState(1); // UI 1-base, API 0-base
  const [data, setData] = useState({ content: [], total: 0, size: 10, number: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [submittingId, setSubmittingId] = useState(null); // ✅ 개별 버튼 로딩

  const selectedPet = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('selectedPet') || 'null'); }
    catch { return null; }
  }, []);

  useEffect(() => {
    if (!seniorId || !petId) return;
    (async () => {
      setLoading(true); setErr('');
      try {
        let res = await getManagersRecommended(seniorId, Number(petId), Math.max(0, page - 1), 10);
        if (Array.isArray(res)) res = { content: res, total: res.length, size: 10, number: page - 1 };
        setData(res || { content: [], total: 0, size: 10, number: 0 });
      } catch (e) {
        setErr(e.message || '추천 매니저를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [seniorId, petId, page]);

  // ✅ 연결 요청(신청 생성)
  const onRequestConnect = async (manager) => {
    if (!selectedPet) {
      alert('선택된 동물이 없습니다. 다시 선택해주세요.');
      navigate('/senior');
      return;
    }
    if (!seniorId) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      setSubmittingId(manager.id);
      // 백엔드 신청 스키마에 맞춰 최소 필드 전송
      await createApplication({
        petId: Number(selectedPet.id || petId),
        managerId: Number(manager.id),
        seniorId: Number(seniorId),
        // 약관 동의(필수) – 간단 플래그
        agreeTerms: true,
        agreeBodycam: true,
      });
      alert('신청이 생성되었습니다.');
      navigate('/senior/connect'); // 매칭 현황으로 이동
    } catch (e) {
      alert(e.message || '신청 생성에 실패했습니다.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="p-4">
      <div className="pet__header">
        <h2>이 동물과 맞는 펫매니저 추천</h2>
        <div className="pet__sub">
          {selectedPet ? (
            <>
              <span>선택한 동물: <b>{selectedPet.name || `#${selectedPet.id}`}</b></span>{' · '}
              <Button presetName="ghost" onClick={() => navigate(-1)}>뒤로</Button>
            </>
          ) : (
            <Button presetName="ghost" onClick={() => navigate('/senior')}>동물 다시 선택</Button>
          )}
        </div>
      </div>

      {err && <div className="auth__error">{err}</div>}
      {loading ? (
        <p>불러오는 중…</p>
      ) : (
        <>
          <div className="pet__list">
            {(data.content || []).map((m) => (
              <div key={m.id} className="pet__row">
                <div className="pet__row-main">
                  <div className="pet__mgr-name"><b>{m.name || `매니저#${m.id}`}</b></div>
                  <div className="pet__mgr-sub">
                    경험: {m.elderlyExpLevel || '-'} · 신뢰: {m.reliability ?? '-'}
                  </div>
                </div>
                <div className="pet__score">
                  {(m.matchScoreManager ?? m.score ?? 0).toFixed(1)} 점
                </div>
                <Button
                  onClick={() => onRequestConnect(m)}
                  disabled={!!submittingId}
                >
                  {submittingId === m.id ? '요청 중…' : '연결 요청'}
                </Button>
              </div>
            ))}
          </div>

          <div className="senior__pagination">
            <Button presetName="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>이전</Button>
            <span>{page}</span>
            <Button
              presetName="ghost"
              disabled={page * (data.size || 10) >= (data.total || 0)}
              onClick={() => setPage(p => p + 1)}
            >
              다음
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
