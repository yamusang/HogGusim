import React, { useEffect, useRef, useState } from 'react';
import { fetchFeaturedDogs } from '../api/animals';
import './featured-dogs.css';

export default function FeaturedDogsSlider({ title = '보호 중인 강아지', take = 20 }) {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const scrollerRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true); setErr('');
        const list = await fetchFeaturedDogs({ take });
        if (!ignore) setDogs(list);
      } catch (e) {
        if (!ignore) setErr('데이터를 불러오지 못했습니다.');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [take]);

  const scrollByCards = (dir = 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('.dog-card');
    const step = card ? (card.offsetWidth + 16) * 2 : 400; // 2장씩 이동
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section className="dogs-slider" aria-label={title}>
      <div className="dogs-slider__head">
        <h2>{title}</h2>
        <div className="dogs-slider__actions">
          <button className="nav-btn" onClick={() => scrollByCards(-1)} aria-label="이전">‹</button>
          <button className="nav-btn" onClick={() => scrollByCards(1)} aria-label="다음">›</button>
        </div>
      </div>

      {err && <div className="dogs-error">{err}</div>}

      <div className="dogs-track" ref={scrollerRef}>
        {loading
          ? Array.from({length:6}).map((_,i)=>(
              <div className="dog-card skeleton" key={`s${i}`} />
            ))
          : dogs.map(d => (
              <article className="dog-card" key={d.id || `${d.name}-${i}`}>
                {d.photoUrl
                  ? <img className="dog-photo" src={d.photoUrl} alt={`${d.name ?? '강아지'} 사진`} />
                  : <div className="dog-photo dog-photo--ph">사진 없음</div>
                }
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
