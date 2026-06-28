/**
 * DataTable - Reusable table with search, pagination, and theme-aware styling.
 */
import { useState } from 'react';

const DataTable = ({ columns, data, searchPlaceholder = 'Search...', emptyMessage = 'No records found.' }) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = data.filter((row) =>
    columns.some((col) => {
      const val = row[col.key];
      // Support searching nested objects (e.g. category.name, company.name)
      if (val && typeof val === 'object' && val.name) {
        return String(val.name).toLowerCase().includes(search.toLowerCase());
      }
      return val && String(val).toLowerCase().includes(search.toLowerCase());
    })
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border-primary)', boxShadow: 'var(--shadow-card)' }}>
      {/* Search Bar */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--color-border-primary)' }}>
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          className="w-full sm:w-80 rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
          style={{
            backgroundColor: 'var(--color-surface-input)',
            borderColor: 'var(--color-border-primary)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-tertiary)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-sm"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="border-t"
                  style={{ borderColor: 'var(--color-border-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-2" style={{ color: 'var(--color-text-primary)' }}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination Controls */}
      <div className="px-5 py-3 border-t text-xs flex flex-col sm:flex-row gap-3 justify-between items-center" style={{ borderColor: 'var(--color-border-primary)', color: 'var(--color-text-tertiary)', backgroundColor: 'var(--color-surface-secondary)' }}>
        <div className="flex items-center gap-4">
          <span>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(filtered.length, currentPage * pageSize)} of {filtered.length} entries
            {data.length !== filtered.length && ` (filtered from ${data.length} total)`}
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded border px-2 py-1 outline-none text-xs"
            style={{
              backgroundColor: 'var(--color-surface-input)',
              borderColor: 'var(--color-border-primary)',
              color: 'var(--color-text-primary)'
            }}
          >
            {[10, 25, 50, 100, 250].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border font-medium transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-zinc-800"
              style={{
                borderColor: 'var(--color-border-primary)',
                color: 'var(--color-text-primary)',
              }}
            >
              Previous
            </button>
            <span className="font-semibold px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border font-medium transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-zinc-800"
              style={{
                borderColor: 'var(--color-border-primary)',
                color: 'var(--color-text-primary)',
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
