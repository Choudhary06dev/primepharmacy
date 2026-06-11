/**
 * PageHeader - Reusable page header with title, subtitle, and action buttons.
 */
const PageHeader = ({ title, subtitle, children }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>{title}</h1>
        {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
};

export default PageHeader;
