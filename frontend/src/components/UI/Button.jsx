import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // 'primary', 'secondary', 'danger', 'outline'
  size = 'md', // 'sm', 'md', 'lg'
  disabled = false,
  onClick,
  className = '',
  icon,
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white border border-brand-600 shadow-sm shadow-brand-500/10',
    secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-850 dark:text-slate-150 border border-slate-200 dark:border-zinc-700/80',
    danger: 'bg-red-600 hover:bg-red-700 text-white border border-red-600 shadow-sm shadow-red-500/10',
    outline: 'bg-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-slate-300 border border-slate-350 dark:border-zinc-700',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-md',
    md: 'text-sm px-4 py-2.5 rounded-lg',
    lg: 'text-base px-5 py-3 rounded-lg',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon && <span className="flex-shrink-0 text-base">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
