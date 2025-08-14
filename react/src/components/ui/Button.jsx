import React, { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import './button.css'


const preset = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  login: 'btn--login',
  signup: 'btn--signup',
  signin: 'btn--signin',
  senior: 'btn--senior',
  manager: 'btn--manager',
  shelter: 'btn--shelter',
  apply: 'btn--apply',
  connect: 'btn--connect',
  danger: 'btn--danger',
  ghost: 'btn--ghost',
};

const size = { sm: 'btn--sm', md: 'btn--md', lg: 'btn--lg', xl: 'btn--xl' };

const Button = forwardRef(function Button(
  {
    children,
    presetName = 'primary',
    sizeName = 'md',
    to,                
    as,                
    type = 'button',
    loading = false,
    disabled = false,
    className = '',
    ...rest
  },
  ref
) {
  const classes = [
    'btn',
    preset[presetName] || preset.primary,
    size[sizeName] || size.md,
    loading ? 'is-loading' : '',
    disabled ? 'is-disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span className="btn__label">{children}</span>
    </>
  );

  if (to) return (
    <Link
    to={to}
    className={classes}
    aria-disabled={disabled || loading || undefined}
    tabIndex={disabled || loading ? -1 : undefined}
    ref={ref}
    {...rest}
    >
        {content}
    </Link>
  )
  const Comp = as || 'button'
  return (
    <Comp
      type={Comp === 'button' ? type : undefined}
      className={classes}
      disabled={disabled || loading}
      ref={ref}
      {...rest}
    >
      {content}
    </Comp>
  );
});

export default Button
