import React from 'react';

const toneMap = {
  neutral: { bg:'#eef2f7', fg:'#354256' },
  warning: { bg:'#fff7e6', fg:'#8f5b00' },
  success: { bg:'#e8f7ee', fg:'#176b3a' },
  danger:  { bg:'#feeaea', fg:'#b42318' },
};

export default function Badge({ text, tone='neutral', children, style }) {
  const t = toneMap[tone] || toneMap.neutral;
  return (
    <span
      style={{
        display:'inline-flex', alignItems:'center', gap:6,
        padding:'4px 8px', borderRadius:10, fontSize:12,
        background:t.bg, color:t.fg, fontWeight:700, ...style
      }}
    >
      {children || text}
    </span>
  );
}
