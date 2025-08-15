import React from 'react';
export default function Card({ className='', style, children }) {
  return (
    <div
      className={className}
      style={{
        background:'#fff',
        border:'1px solid #f1e2d8',
        borderRadius:16,
        boxShadow:'0 12px 30px rgba(0,0,0,.06)',
        padding:20,
        ...style
      }}
    >
      {children}
    </div>
  );
}
