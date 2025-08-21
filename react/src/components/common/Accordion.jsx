import React, { useState } from 'react';

export function Accordion({ title, defaultOpen=false, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={`acc ${open ? 'acc--open' : ''}`}>
      <button type="button" className="acc__head" onClick={()=>setOpen(o=>!o)} aria-expanded={open}>
        <span>{title}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" className="acc__chev"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && <div className="acc__body">{children}</div>}
    </div>
  );
}
