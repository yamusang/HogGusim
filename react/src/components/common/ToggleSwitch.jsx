import React from 'react';

export default function ToggleSwitch({ checked, onChange, label, id }) {
  const _id = id || `tgl-${Math.random().toString(36).slice(2,8)}`;
  return (
    <label htmlFor={_id} className="tgl">
      <input id={_id} type="checkbox" checked={!!checked} onChange={e=>onChange?.(e.target.checked)} />
      <span className="tgl__track" aria-hidden />
      <span className="tgl__label">{label}</span>
    </label>
  );
}
