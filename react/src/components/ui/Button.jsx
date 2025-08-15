import React from 'react';
import '../../styles/components/button.css';

// presetName과 variant 둘 다 지원 (variant가 들어오면 우선)
const presetMap = {
  primary: 'btn--primary',
  login: 'btn--primary',
  ghost: 'btn--ghost',
  senior: 'btn--senior',
  manager: 'btn--manager',
  shelter: 'btn--shelter',
  secondary: 'btn--secondary', // ✅ 추가
  danger: 'btn--danger',       // ✅ 추가
};
const sizeMap = { sm:'btn--sm', md:'btn--md', lg:'btn--lg' };

export default function Button({
  presetName = 'login',
  variant,                // ✅ alias
  sizeName = 'md',
  loading = false,
  full = false,
  className = '',
  children,
  disabled,
  ...rest
}){
  const key = (variant || presetName || 'login');
  const cls = [
    'btn',
    presetMap[key] || presetMap.login,
    sizeMap[sizeName] || sizeMap.md,
    full ? 'btn--full' : '',
    loading ? 'is-loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      <span className="btn__inner">
        {children}
        {loading && <span className="btn__spinner" aria-hidden="true" />}
      </span>
    </button>
  );
}
