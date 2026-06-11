import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md', // 'sm', 'md', 'lg', 'xl'
}) => {
  // Listen for Escape key to close the modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${sizes[size]} rounded-xl border-2 border-[var(--color-border-secondary)] bg-[var(--color-surface-card)] p-6 shadow-[var(--shadow-modal)] transition-all max-h-[90vh] flex flex-col`}
        style={{ animation: 'scaleUp 0.15s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/80 mb-4">
          <h3 className="text-lg font-bold font-display text-black dark:text-slate-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-black hover:bg-slate-100 dark:hover:bg-zinc-800/80 dark:text-slate-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto pr-1 text-black dark:text-slate-350 text-sm leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800/80 mt-6">
            {footer}
          </div>
        )}
      </div>

      {/* Add Animation Keyframes inline inside portal style */}
      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;
