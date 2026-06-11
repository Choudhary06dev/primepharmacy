import React from 'react';

const Select = ({
  label,
  name,
  value,
  onChange,
  options = [], // Array of { value, label }
  required = false,
  error,
  helpText,
  disabled = false,
  className = '',
  emptyOption = 'Select option...',
}) => {
  const hasValue = String(value ?? '').length > 0;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-black dark:text-slate-400 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full text-sm outline-none px-4 py-2.5 rounded-lg border-2 text-black dark:text-slate-100 transition-all focus:ring-2 focus:ring-brand-500/30 ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : hasValue
              ? 'border-brand-500/70 bg-brand-50/60 dark:border-brand-500/60 dark:bg-brand-950/25 focus:border-brand-500'
              : 'border-slate-400 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900/60 focus:border-brand-500'
        }`}
      >
        {emptyOption && <option value="">{emptyOption}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs font-medium text-red-500 mt-0.5">
          {error}
        </span>
      )}
      {helpText && !error && (
        <span className="text-[11px] text-black dark:text-slate-400 mt-0.5">
          {helpText}
        </span>
      )}
    </div>
  );
};

export default Select;
