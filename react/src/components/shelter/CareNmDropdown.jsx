import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchCareNames } from '../../api/shelters';

const KEY = { UP:'ArrowUp', DOWN:'ArrowDown', ENTER:'Enter', ESC:'Escape', TAB:'Tab' };

export default function CareNmDropdown({
  value,
  onChange,
  placeholder = '보호소명 검색 (예: 부산광역시 동물보호관리센터)',
  required = false,
  allowFreeInput = true,
  disabled = false,
  maxItems = 200,
}) {
  const [all, setAll] = useState([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // 최초 1회 보호소명 로드
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchCareNames()
      .then((names) => { if (alive) setAll((names || []).filter(Boolean)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // 필터링된 옵션
  const options = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const arr = !qq ? all : all.filter(nm => nm.toLowerCase().includes(qq));
    return arr.slice(0, maxItems).sort((a,b) => a.localeCompare(b, 'ko'));
  }, [all, q, maxItems]);

  // 키보드 네비
  const onKeyDown = (e) => {
    if (!open && (e.key === KEY.DOWN || e.key === KEY.UP)) {
      setOpen(true); setHoverIdx(0); e.preventDefault(); return;
    }
    if (!open) return;

    if (e.key === KEY.DOWN) { setHoverIdx(i => Math.min((i < 0 ? -1 : i) + 1, options.length - 1)); e.preventDefault(); }
    else if (e.key === KEY.UP) { setHoverIdx(i => Math.max((i < 0 ? 0 : i) - 1, 0)); e.preventDefault(); }
    else if (e.key === KEY.ENTER) {
      if (hoverIdx >= 0 && options[hoverIdx]) {
        onSelect(options[hoverIdx]); e.preventDefault();
      } else if (allowFreeInput && q.trim()) {
        onSelect(q.trim()); e.preventDefault();
      }
    } else if (e.key === KEY.ESC || e.key === KEY.TAB) setOpen(false);
  };

  const onSelect = (nm) => {
    onChange?.(nm);
    setQ(nm);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapRef} className={`caredd ${disabled ? 'is-disabled' : ''}`}>
      <label className="caredd__label">보호소 소속</label>
      <div className="caredd__control">
        <input
          ref={inputRef}
          className="caredd__input"
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          value={open ? q : (value || '')}
          onChange={(e)=>{ setQ(e.target.value); if (!open) setOpen(true); }}
          onFocus={()=> setOpen(true)}
          onKeyDown={onKeyDown}
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
        />
        {loading ? (
          <span className="caredd__suffix">불러오는중…</span>
        ) : (
          value && (
            <button
              type="button"
              className="caredd__clear"
              onClick={()=>{ onChange?.(''); setQ(''); inputRef.current?.focus(); }}
              aria-label="선택 지우기"
            >×</button>
          )
        )}
        <button
          type="button"
          className="caredd__chev"
          onClick={()=> setOpen(o=>!o)}
          aria-label="목록 열기/닫기"
        >▾</button>
      </div>

      {open && (
        <div className="caredd__menu" role="listbox">
          {options.length === 0 ? (
            <div className="caredd__empty">
              검색 결과 없음
              {allowFreeInput && q.trim() && (
                <button
                  type="button"
                  className="caredd__free"
                  onClick={()=> onSelect(q.trim())}
                >
                  “{q.trim()}” 직접 입력
                </button>
              )}
            </div>
          ) : (
            options.map((nm, i) => (
              <div
                role="option"
                aria-selected={value === nm}
                key={`${nm}-${i}`}
                className={`caredd__opt ${i===hoverIdx ? 'is-hover' : ''} ${value===nm ? 'is-active' : ''}`}
                onMouseEnter={()=> setHoverIdx(i)}
                onMouseDown={(e)=> e.preventDefault()}  // blur 방지
                onClick={()=> onSelect(nm)}
              >
                {nm}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
