// src/components/FeaturedDogsSlider.jsx
import React, { useEffect, useRef, useState } from 'react';
import { fetchAnimals } from '../api/animals';
import './featured-dogs.css';

export default function FeaturedDogsSlider({ title = '보호 중인 강아지', take = 20, intervalMs = 4000 }) {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const scrollerRef = useRef(null);

  // 자동슬라이드 일시정지 관리
  const [isPaused, setPaused] = useState(false);
  const pauseRef = useRef(false);
  const pauseTimerRef = useRef(null);
  useEffect(() => { pauseRef.current = isPaused; }, [isPaused]);

  // 데이터 로드 (animals.js 그대로 사용)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const { content } = await fetchAnimals({ page: 0, size: 120, sort: 'id,DESC' });
        const items = Array.isArray(content) ? content : [];
        // 사진 있는 카드 먼저, 그 다음 나머지
        const withPhoto = items.filter(x => !!x.photoUrl);
        const noPhoto   = items.filter(x => !x.photoUrl);
        const ranked    = [...withPhoto, ...noPhoto].slice(0, take);
        if (!ignore) setDogs(ranked);
      } catch (e) {
        if (!ignore) setErr('데이터를 불러오지 못했습니다.');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [take]);

  const canScroll = () => {
    const el = scrollerRef.current;
    return el && el.scrollWidth > el.clientWidth + 8;
  };

  const scrollByCards = (dir = 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('.dog-card');
    const step = card ? (card.offsetWidth + 16) * 2 : Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  // 자동 슬라이드 (끝까지 가면 처음으로 점프)
  useEffect(() => {
    if (loading || err || !canScroll()) return;

    // 사용자 설정: 모션 최소화 시 자동 슬라이드 비활성화
    const prefersReduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) return;

    const tick = () => {
      const el = scrollerRef.current;
      if (!el || pauseRef.current) return;
      const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      if (nearEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollByCards(1);
      }
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [loading, err, intervalMs, dogs]); // dogs가 바뀌면 다시 계산

  // 수동 조작 시 일정 시간 자동슬라이드 일시 정지
  const nudgePause = (ms = 5000) => {
    setPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => setPaused(false), ms);
  };

  return (
    <section
      className="dogs-slider"
      aria-label={title}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="dogs-slider__head">
        <h2>{title}</h2>
        <div className="dogs-slider__actions">
          <button
            className="nav-btn"
            onClick={() => { scrollByCards(-1); nudgePause(); }}
            aria-label="이전"
            disabled={!canScroll() || loading}
          >‹</button>
          <button
            className="nav-btn"
            onClick={() => { scrollByCards(1); nudgePause(); }}
            aria-label="다음"
            disabled={!canScroll() || loading}
          >›</button>
        </div>
      </div>

      {err && <div className="dogs-error">{err}</div>}
      {!loading && !err && dogs.length === 0 && <div className="dogs-error">표시할 강아지가 없어요.</div>}

      <div className="dogs-track" ref={scrollerRef}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div className="dog-card skeleton" key={`s${i}`} />
            ))
          : dogs.map((d, i) => (
              <article className="dog-card" key={d.id ?? `${d.name ?? 'dog'}-${i}`}>
                {d.photoUrl ? (
                  <img
                    className="dog-photo"
                    src={d.photoUrl}
                    alt={`${d.name ?? '강아지'} 사진`}
                    onError={(e) => {
                      // 실패 시 플레이스홀더로 교체
                      e.currentTarget.replaceWith(
                        Object.assign(document.createElement('div'), {
                          className: 'dog-photo dog-photo--ph',
                          innerText: '사진 없음',
                        })
                      );
                    }}
                  />
                ) : (
                  <div className="dog-photo dog-photo--ph">사진 없음</div>
                )}
                <div className="dog-meta">
                  <div className="dog-row">
                    <strong className="dog-name">{d.name ?? '이름없음'}</strong>
                    <span className="dog-badge">
                      {d.gender}{d.age ? ` · ${d.age}` : ''}
                    </span>
                  </div>
                  {d.careNm && <div className="dog-sub">{d.careNm}</div>}
                </div>
              </article>
            ))
        }
      </div>
    </section>
  );
}
