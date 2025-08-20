// src/pages/pet/AnimalsPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { fetchAnimals } from '../../api/animals';
import Button from '../../components/ui/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import '../senior/senior.css'; // 그리드/카드 스타일 재사용

const neuterLabel = (v) => (v === 'Y' ? '예' : v === 'N' ? '아니오' : '미상');

export default function AnimalsPage() {
  const [q, setQ] = useState('');         // careNm 부분검색
  const [page1, setPage1] = useState(1);  // 1-based
  const [data, setData] = useState({
    content: [], number: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true, empty: true,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const abortRef = useRef(null);

  const load = async () => {
    setLoading(true); setErr('');
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetchAnimals(
        { careNm: q || undefined, page: Math.max(0, page1 - 1), size: data.size || 20 },
        { signal: ctrl.signal }
      );
      if (ctrl.signal.aborted) return;
      setData(res);
    } catch (e) {
      if (!ctrl.signal.aborted) setErr(e?.message || '목록을 불러오지 못했어요.');
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page1]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage1(1);
    load();
  };

  const items = data.content || [];
  const noPages = !data.totalPages || data.totalPages <= 0;

  return (
    <div className="senior">
      <header className="senior__header">
        <h1>보호소 동물 탐색</h1>
        <form onSubmit={onSearch} style={{ display:'flex', gap:8 }}>
          <input
            placeholder="보호소명으로 검색 (예: 부산동물보호센터)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ minWidth: 280 }}
          />
          <Button type="submit">검색</Button>
        </form>
      </header>

      {loading && <div className="card">불러오는 중…</div>}
      {err && !loading && <div className="card" style={{ color:'crimson' }}>{err}</div>}

      {!loading && !err && (
        <div className="senior__grid">
          {items.map((it, idx) => {
            const img = it.photoUrl || '';
            const title = it.species || it.breed || it.name || '품종 미상';
            const sexText = it.gender || '미상';                // '수컷' | '암컷' | '미상'
            const neuterText = neuterLabel(it.neuter || 'U');   // '예' | '아니오' | '미상'
            const state = it.status || '보호중';
            const careName = it.careNm || it.careName || '-';
            const careTel  = it.careTel || '-';
            const careAddr = it.careAddr || '';
            const mark     = (it.specialMark || '').trim();

            return (
              <Card
                key={it.id || it.desertionNo || idx}
                variant="elevated"
                media={
                  img ? (
                    <img
                      src={img}
                      alt={title}
                      loading="lazy"
                      onError={(e)=>{ e.currentTarget.src=''; e.currentTarget.style.opacity = 0.25; }}
                    />
                  ) : null
                }
                title={title}
                subtitle={[sexText, neuterText, it.color || null].filter(Boolean).join(' · ')}
                actions={<Badge tone="neutral">{state}</Badge>}
              >
                <div className="muted" title={mark}>
                  {mark || '특이사항 정보 없음'}
                </div>
                <div className="muted" style={{ marginTop:6 }}>
                  {careName} · {careTel}
                </div>
                <div className="muted">{careAddr}</div>
              </Card>
            );
          })}

          {!items.length && (
            <div className="card" style={{ maxWidth: 680 }}>
              <p>표시할 결과가 없습니다.</p>
              <p className="muted">보호소명을 바꿔 검색해 보세요. (예: “부산”, “동물보호”)</p>
            </div>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      <div className="senior__pagination">
        <Button
          presetName="ghost"
          disabled={noPages || page1 <= 1 || data.first}
          onClick={() => setPage1((p) => Math.max(1, p - 1))}
        >
          이전
        </Button>
        <span>{noPages ? 0 : page1}</span>
        <Button
          presetName="ghost"
          disabled={noPages || data.last || (page1 >= data.totalPages)}
          onClick={() => setPage1((p) => p + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
