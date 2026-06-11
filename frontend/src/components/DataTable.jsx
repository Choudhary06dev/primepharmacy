/**
 * DataTable - Reusable table with search, theme-aware styling.
 */
import { useState } from 'react';

const DataTable = ({ columns, data, searchPlaceholder = 'Search...', emptyMessage = 'No records found.' }) => {
  const [search, setSearch] = useState('');

  const filtered = data.filter((row) =>
    columns.some((col) => {
      const val = row[col.key];
      return val && String(val).toLowerCase().includes(search.toLowerCase());
    })
  );

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border-primary)', boxShadow: 'var(--shadow-card)' }}>
      {/* Search Bar */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--color-border-primary)' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
                  className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
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
              filtered.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="border-t"
                  style={{ borderColor: 'var(--color-border-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5" style={{ color: 'var(--color-text-primary)' }}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t text-xs" style={{ borderColor: 'var(--color-border-primary)', color: 'var(--color-text-tertiary)' }}>
        Showing {filtered.length} of {data.length} records
      </div>
    </div>
  );
};

export default DataTable;
