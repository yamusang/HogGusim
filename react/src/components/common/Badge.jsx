import React from 'react';

// variant: available | pending | matched | adopted | info | warn | danger
// size: sm | md
export default function Badge({
  children,
  variant = 'info',
  size = 'sm',
  className = '',
  ...rest
}) {
  const classes = ['badge', `badge--${variant}`, `badge--${size}`, className]
    .filter(Boolean)
    .join(' ')
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
