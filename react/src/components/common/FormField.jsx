import React from 'react';
import '../../styles/components/form-field.css';

/**
 * 지원 형태
 * - <FormField label="..." type="text" value onChange />
 * - <FormField label="...">{custom input}</FormField>
 * props: id, label, help, hint, error, type, value, onChange, required, placeholder
 */
export default function FormField(props){
  const {
    id,
    label,
    help,
    hint,
    error,
    type = 'text',
    value,
    onChange,
    required,
    placeholder,
    children,
    ...rest
  } = props;

  const helpText = hint ?? help;

  return (
    <div className="field">
      {label && (
        <label htmlFor={id} className="field__label">
          {label}{required && <span aria-hidden="true" style={{marginLeft:4,color:'#b42318'}}>*</span>}
        </label>
      )}

      {children ? (
        children
      ) : (
        <input
          id={id}
          className={`input${error ? ' input--error' : ''}`}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          {...rest}
        />
      )}

      {helpText && !error && <div className="help">{helpText}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
