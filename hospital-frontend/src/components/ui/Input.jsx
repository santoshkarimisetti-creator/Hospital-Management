import React from 'react';

export const Input = ({
  label,
  error,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label">
          {label} {required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="form-input"
        {...props}
      />
      {error && <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{error}</span>}
    </div>
  );
};

export default Input;
