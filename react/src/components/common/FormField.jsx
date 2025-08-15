// src/components/common/FormField.jsx
import React from 'react';
import '../../styles/components/form-field.css'

export default function FormField({
  id,
  label,
  type = 'text',
  value = '',
  onChange,
  placeholder = '',
  required = false,
  error = '',
  hint = '',
  as,              // 'textarea' | 'select'
  options = [],    // select용 [{value,label}]
  rightSlot,
  className = '',
  ...rest
}) {
  const InputTag = as === 'textarea' ? 'textarea' : as === 'select' ? 'select' : 'input'

  const control =
    InputTag === 'select' ? (
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className="form-field__input"
        {...rest}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ) : (
      <InputTag
        id={id}
        type={InputTag === 'input' ? type : undefined}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="form-field__input"
        {...rest}
      />
    )

  return (
    <div className={`form-field ${error ? 'form-field--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="form-field__label">
          {label} {required && <span className="form-field__req">*</span>}
        </label>
      )}

      <div className="form-field__control">
        {control}
        {rightSlot && <div className="form-field__right">{rightSlot}</div>}
      </div>

      {hint && !error && <div className="form-field__hint">{hint}</div>}
      {error && <div className="form-field__error">{error}</div>}
    </div>
  );
}
// .