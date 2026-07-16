import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../../components/PageHeader';
import { getReportsSummary } from '../../../services/reportsService';
import { useBranchFilter } from '../../../context/BranchFilterContext';

const Reports = () => {
  const { selectedBranchId } = useBranchFilter();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interactive graph tooltip state
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  // Filter state
  const [filterRange, setFilterRange] = useState('30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getDateRange = (rangeType) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (rangeType) {
      case 'today':
        start = today;
        end = today;
        break;
      case '7days':
        start = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
        end = today;
        break;
      case '30days':
        start = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
        end = today;
        break;
      case 'thismonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      default:
        return { start: null, end: null };
    }

    const format = (date) => date.toISOString().split('T')[0];
    return { start: format(start), end: format(end) };
  };

  useEffect(() => {
    if (filterRange !== 'custom') {
      const { start, end } = getDateRange(filterRange);
      fetchData({ start_date: start, end_date: end });
    } else {
      // Set default values for custom filters if blank
      if (!customStartDate && !customEndDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        setCustomStartDate(todayStr);
        setCustomEndDate(todayStr);
        fetchData({ start_date: todayStr, end_date: todayStr });
      }
    }
  }, [filterRange, selectedBranchId]);

  const fetchData = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReportsSummary(filters);
      setReportData(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (range) => {
    setFilterRange(range);
  };

  const handleApplyCustomRange = () => {
    if (!customStartDate || !customEndDate) {
      alert('Please select both start and end dates.');
      return;
    }
    if (customStartDate > customEndDate) {
      alert('Start date cannot be after end date.');
      return;
    }
    fetchData({ start_date: customStartDate, end_date: customEndDate });
  };

  const formatCurrency = (v) =>
    `PKR ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Render Line Graph coordinates dynamically
  const lineGraphPoints = useMemo(() => {
    if (!reportData || !reportData.monthly_trend || reportData.monthly_trend.length === 0) return [];

    const trend = reportData.monthly_trend;
    const maxVal = Math.max(...trend.map((t) => t.sales), 1000);

    const svgWidth = 500;
    const svgHeight = 180;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 15;
    const paddingBottom = 30;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    return trend.map((t, idx) => {
      const x = paddingLeft + (idx * (chartWidth / Math.max(trend.length - 1, 1)));
      const y = paddingTop + chartHeight - ((t.sales / maxVal) * chartHeight);
      return {
        x,
        y,
        label: t.label,
        value: t.sales,
      };
    });
  }, [reportData]);

  /* ─── Skeleton ─── */
  const Skeleton = ({ w = '100%', h = '20px', r = '8px' }) => (
    <div className="rpt-skeleton" style={{ width: w, height: h, borderRadius: r }} />
  );

  /* ═════════════════════════════ RENDER ═════════════════════════════ */
  return (
    <>
      <style>{`
        /* ── Report Animations ── */
        @keyframes rptFadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rptSlideIn {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes rptShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes rptBarGrow {
          from { width: 0; }
        }
        @keyframes rptCountPop {
          0%   { opacity: 0; transform: scale(0.6); }
          70%  { transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes rptPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.3); }
          50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        @keyframes rptLineDrawIn {
          from { stroke-dashoffset: 1200; }
          to   { stroke-dashoffset: 0; }
        }

        .rpt-skeleton {
          background: linear-gradient(90deg, var(--color-surface-tertiary) 25%, var(--color-surface-hover) 50%, var(--color-surface-tertiary) 75%);
          background-size: 400% 100%;
          animation: rptShimmer 1.5s ease infinite;
        }

        /* ── KPI Cards ── */
        .rpt-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1024px) { .rpt-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px)  { .rpt-kpi-grid { grid-template-columns: 1fr; } }

        .rpt-kpi-card {
          border-radius: 12px;
          padding: 20px;
          border: 1px solid var(--color-border-primary);
          background: var(--color-surface-card);
          position: relative;
          overflow: hidden;
          opacity: 0;
          animation: rptFadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .rpt-kpi-card:hover {
          transform: translateY(-4px) scale(1.02);
          border-color: var(--rpt-accent, var(--color-border-primary));
          box-shadow: 0 10px 28px var(--rpt-glow, rgba(0,0,0,0.06));
        }
        .dark .rpt-kpi-card:hover {
          box-shadow: 0 10px 28px rgba(0,0,0,0.4);
        }
        .rpt-kpi-card .rpt-kpi-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
          flex-shrink: 0;
        }
        .rpt-kpi-card .rpt-kpi-label {
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-text-tertiary);
          margin-bottom: 6px;
        }
        .rpt-kpi-card .rpt-kpi-value {
          font-size: 1.35rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          color: var(--color-text-primary);
          margin-bottom: 4px;
        }
        .rpt-kpi-card .rpt-kpi-sub {
          font-size: 0.62rem;
          color: var(--color-text-tertiary);
        }
        /* Gross Profit indicator bar */
        .rpt-kpi-card .rpt-profit-bar {
          height: 4px;
          border-radius: 4px;
          margin-top: 12px;
          overflow: hidden;
          background: var(--color-surface-hover);
        }
        .rpt-kpi-card .rpt-profit-bar-fill {
          height: 100%;
          border-radius: 4px;
          animation: rptBarGrow 1.2s ease forwards;
        }

        /* ── Section Panels ── */
        .rpt-section {
          border-radius: 12px;
          padding: 24px;
          border: 1px solid var(--color-border-primary);
          background: var(--color-surface-card);
          opacity: 0;
          animation: rptFadeInUp 0.5s ease forwards;
        }
        .rpt-section-title {
          font-size: 0.9rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          color: var(--color-text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 4px;
        }
        .rpt-section-subtitle {
          font-size: 0.68rem;
          color: var(--color-text-tertiary);
          margin: 0 0 18px;
        }

        /* ── Filter Bar ── */
        .rpt-filter-bar {
          border-radius: 12px;
          padding: 16px 20px;
          border: 1px solid var(--color-border-primary);
          background: var(--color-surface-card);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          opacity: 0;
          animation: rptFadeInUp 0.4s ease forwards;
        }
        .rpt-filter-pills {
          display: flex;
          background: var(--color-surface-tertiary);
          padding: 3px;
          border-radius: 10px;
          gap: 2px;
        }
        .rpt-filter-pill {
          padding: 6px 14px;
          font-size: 0.7rem;
          font-weight: 600;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          background: transparent;
          color: var(--color-text-tertiary);
        }
        .rpt-filter-pill:hover {
          color: var(--color-text-primary);
          background: var(--color-surface-hover);
        }
        .rpt-filter-pill.active {
          background: var(--color-surface-primary);
          color: var(--color-text-brand);
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          font-weight: 700;
        }
        .rpt-filter-custom {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }
        .rpt-filter-custom label {
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-text-tertiary);
        }
        .rpt-filter-custom input[type="date"] {
          padding: 5px 10px;
          border-radius: 8px;
          border: 1px solid var(--color-border-primary);
          background: var(--color-surface-input);
          color: var(--color-text-primary);
          font-size: 0.72rem;
          outline: none;
        }
        .rpt-filter-custom input[type="date"]:focus {
          border-color: var(--color-border-focus);
        }
        .rpt-apply-btn {
          padding: 6px 16px;
          border-radius: 8px;
          border: none;
          background: var(--color-status-success);
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .rpt-apply-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        /* ── Chart SVG ── */
        .rpt-chart-line {
          stroke-dasharray: 1200;
          stroke-dashoffset: 0;
          animation: rptLineDrawIn 1.5s ease forwards;
        }
        .rpt-chart-dot {
          transition: r 0.2s ease, stroke-width 0.2s ease;
          cursor: pointer;
        }
        .rpt-chart-dot:hover {
          r: 6;
          stroke-width: 3;
        }

        /* ── Data Table ── */
        .rpt-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .rpt-table thead th {
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-text-tertiary);
          text-align: left;
          padding: 10px 16px;
          background: var(--color-surface-tertiary);
          border-bottom: 1px solid var(--color-border-primary);
        }
        .rpt-table thead th:first-child { border-radius: 10px 0 0 0; }
        .rpt-table thead th:last-child  { border-radius: 0 10px 0 0; }
        .rpt-table tbody td {
          font-size: 0.78rem;
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-border-primary);
          color: var(--color-text-primary);
          vertical-align: middle;
        }
        .rpt-table tbody tr {
          opacity: 0;
          animation: rptSlideIn 0.4s ease forwards;
          transition: background 0.2s ease;
        }
        .rpt-table tbody tr:hover {
          background: var(--color-surface-hover);
        }
        .rpt-table tbody tr:last-child td {
          border-bottom: none;
        }
        .rpt-medal {
          font-size: 1rem;
          margin-right: 6px;
          vertical-align: middle;
        }
        .rpt-rank-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: var(--color-surface-tertiary);
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--color-text-tertiary);
        }

        /* ── Expense Breakdown ── */
        .rpt-expense-item {
          padding: 14px 16px;
          border-radius: 10px;
          background: var(--color-surface-tertiary);
          border: 1px solid var(--color-border-primary);
          margin-bottom: 10px;
          opacity: 0;
          animation: rptFadeInUp 0.4s ease forwards;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .rpt-expense-item:hover {
          transform: translateX(4px);
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .rpt-expense-bar-track {
          height: 6px;
          border-radius: 6px;
          background: var(--color-surface-hover);
          overflow: hidden;
          margin-top: 8px;
        }
        .rpt-expense-bar-fill {
          height: 100%;
          border-radius: 6px;
          animation: rptBarGrow 1s ease forwards;
          transition: width 0.6s ease;
        }

        /* ── Inventory Valuation ── */
        .rpt-inv-item {
          padding: 14px 16px;
          border-radius: 10px;
          background: var(--color-surface-tertiary);
          border: 1px solid var(--color-border-primary);
        }
        .rpt-inv-label {
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-text-tertiary);
          margin-bottom: 4px;
        }
        .rpt-inv-value {
          font-size: 1.1rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
        }

        /* ── Tooltip ── */
        .rpt-tooltip {
          position: absolute;
          z-index: 20;
          padding: 8px 14px;
          border-radius: 10px;
          background: var(--color-surface-primary);
          border: 1px solid var(--color-border-primary);
          box-shadow: 0 6px 20px rgba(0,0,0,0.12);
          font-size: 0.68rem;
          pointer-events: none;
          transform: translateX(-50%);
          white-space: nowrap;
        }

        /* ── Pro Tip ── */
        .rpt-tip {
          padding: 14px 18px;
          border-radius: 10px;
          border: 1px solid var(--color-border-primary);
          background: var(--color-surface-tertiary);
          font-size: 0.72rem;
          color: var(--color-text-tertiary);
          line-height: 1.6;
        }

        /* ── Grids ── */
        .rpt-main-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 16px;
        }
        @media (max-width: 1024px) { .rpt-main-grid { grid-template-columns: 1fr; } }
        .rpt-bottom-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 1024px) { .rpt-bottom-grid { grid-template-columns: 1fr; } }
        .rpt-inv-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 640px) { .rpt-inv-grid { grid-template-columns: 1fr; } }

        .rpt-empty {
          text-align: center;
          padding: 24px;
          color: var(--color-text-tertiary);
          font-size: 0.78rem;
          opacity: 0.6;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <PageHeader
          title="Financial Reports & Analytics"
          subtitle="Comprehensive business intelligence — revenue, costs, profitability, and inventory valuation."
        />

        {/* ═══════ FILTER BAR ═══════ */}
        <div className="rpt-filter-bar" style={{ animationDelay: '0s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-tertiary)' }}>
              📅 Date Range
            </span>
            <div className="rpt-filter-pills">
              {[
                { id: 'today', label: 'Today' },
                { id: '7days', label: '7 Days' },
                { id: '30days', label: '30 Days' },
                { id: 'thismonth', label: 'This Month' },
                { id: 'custom', label: 'Custom' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleRangeChange(opt.id)}
                  className={`rpt-filter-pill ${filterRange === opt.id ? 'active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {filterRange === 'custom' && (
            <div className="rpt-filter-custom">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label>Start</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label>End</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
              <button type="button" onClick={handleApplyCustomRange} className="rpt-apply-btn">
                Apply Filter
              </button>
            </div>
          )}
        </div>

        {/* ═══════ LOADING STATE ═══════ */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="rpt-kpi-grid">
              {[1,2,3,4].map(k => <Skeleton key={k} h="110px" r="12px" />)}
            </div>
            <div className="rpt-main-grid">
              <Skeleton h="260px" r="12px" />
              <Skeleton h="260px" r="12px" />
            </div>
          </div>
        ) : error || !reportData ? (
          <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--color-status-danger)', background: 'rgba(239,68,68,0.06)', color: 'var(--color-status-danger)', fontSize: '0.8rem', fontWeight: 600 }}>
            ⚠️ {error || 'Failed to load report analytics.'}
          </div>
        ) : (
          <>
            {/* ═══════ KPI SUMMARY CARDS ═══════ */}
            {(() => {
              const { summary } = reportData;
              const grossMargin = summary.total_sales > 0
                ? ((summary.gross_profit / summary.total_sales) * 100).toFixed(1)
                : '0.0';
              const netMargin = summary.total_sales > 0
                ? ((summary.net_profit / summary.total_sales) * 100).toFixed(1)
                : '0.0';

              const cards = [
                {
                  label: 'Gross Revenue',
                  value: formatCurrency(summary.total_sales),
                  sub: 'Total sales income',
                  icon: '📈',
                  gradient: 'linear-gradient(135deg, #059669, #10b981)',
                  accent: '#059669',
                  barPct: 100,
                  barColor: '#10b981',
                },
                {
                  label: 'Cost of Goods Sold',
                  value: formatCurrency(summary.total_cogs),
                  sub: 'Production & purchase cost',
                  icon: '🏷️',
                  gradient: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                  accent: '#6366f1',
                  barPct: summary.total_sales > 0 ? Math.min((summary.total_cogs / summary.total_sales) * 100, 100) : 0,
                  barColor: '#818cf8',
                },
                {
                  label: 'Operating Expenses',
                  value: formatCurrency(summary.total_expenses),
                  sub: 'Operational overhead',
                  icon: '💸',
                  gradient: 'linear-gradient(135deg, #dc2626, #f87171)',
                  accent: '#dc2626',
                  barPct: summary.total_sales > 0 ? Math.min((summary.total_expenses / summary.total_sales) * 100, 100) : 0,
                  barColor: '#f87171',
                },
                {
                  label: 'Net Profit',
                  value: formatCurrency(Math.abs(summary.net_profit)),
                  sub: `${summary.net_profit >= 0 ? '▲' : '▼'} ${netMargin}% margin · Gross: ${grossMargin}%`,
                  icon: '💰',
                  gradient: summary.net_profit >= 0 ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #dc2626, #f87171)',
                  accent: summary.net_profit >= 0 ? '#059669' : '#dc2626',
                  barPct: Math.min(Math.abs(Number(netMargin)), 100),
                  barColor: summary.net_profit >= 0 ? '#10b981' : '#f87171',
                  isProfit: true,
                  profitPositive: summary.net_profit >= 0,
                },
              ];

              return (
                <div className="rpt-kpi-grid">
                  {cards.map((c, i) => (
                    <div
                      key={c.label}
                      className="rpt-kpi-card"
                      style={{
                        animationDelay: `${0.05 + i * 0.1}s`,
                        '--rpt-accent': c.accent,
                        '--rpt-glow': `${c.accent}18`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div className="rpt-kpi-label">{c.label}</div>
                        <div className="rpt-kpi-icon" style={{ background: c.gradient, color: '#fff' }}>{c.icon}</div>
                      </div>
                      <div className="rpt-kpi-value" style={c.isProfit ? { color: c.profitPositive ? '#059669' : '#dc2626' } : {}}>
                        {c.isProfit && (c.profitPositive ? '▲ ' : '▼ ')}{c.value}
                      </div>
                      <div className="rpt-kpi-sub">{c.sub}</div>
                      <div className="rpt-profit-bar">
                        <div className="rpt-profit-bar-fill" style={{ width: `${c.barPct}%`, background: c.barColor, animationDelay: `${0.3 + i * 0.15}s` }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ═══════ CHART + EXPENSES GRID ═══════ */}
            <div className="rpt-main-grid">
              {/* Revenue Trend Chart */}
              <div className="rpt-section" style={{ animationDelay: '0.5s' }}>
                <div className="rpt-section-title">
                  <span>📈</span> Monthly Revenue Trend
                </div>
                <div className="rpt-section-subtitle">6-month gross sales performance history</div>

                <div style={{ position: 'relative' }}>
                  <svg viewBox="0 0 500 180" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="rpt-area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="rpt-line-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[15, 52, 89, 126].map((y) => (
                      <line key={y} x1="50" y1={y} x2="480" y2={y}
                        stroke="var(--color-border-primary)" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.5" />
                    ))}

                    {lineGraphPoints.length > 0 && (
                      <>
                        {/* Area fill */}
                        <path
                          d={`M ${lineGraphPoints[0].x} 135 L ${lineGraphPoints.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${lineGraphPoints[lineGraphPoints.length - 1].x} 135 Z`}
                          fill="url(#rpt-area-grad)"
                        />
                        {/* Animated line */}
                        <path
                          className="rpt-chart-line"
                          d={lineGraphPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                          fill="none"
                          stroke="url(#rpt-line-grad)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </>
                    )}

                    {/* Data points & labels */}
                    {lineGraphPoints.map((p, idx) => (
                      <g key={idx}>
                        <circle
                          className="rpt-chart-dot"
                          cx={p.x}
                          cy={p.y}
                          r={hoveredPoint === idx ? '6' : '4'}
                          fill="var(--color-surface-primary)"
                          stroke="#059669"
                          strokeWidth={hoveredPoint === idx ? '3' : '2.5'}
                          onMouseEnter={() => setHoveredPoint(idx)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                        <text
                          x={p.x}
                          y="165"
                          textAnchor="middle"
                          style={{ fontSize: '9px', fill: 'var(--color-text-tertiary)', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
                        >
                          {p.label.split(' ')[0]}
                        </text>
                      </g>
                    ))}

                    {/* Y axis labels */}
                    <text x="18" y="19" style={{ fontSize: '8px', fill: 'var(--color-text-tertiary)', fontWeight: 600 }}>MAX</text>
                    <text x="18" y="93" style={{ fontSize: '8px', fill: 'var(--color-text-tertiary)', fontWeight: 600 }}>50%</text>
                    <text x="18" y="139" style={{ fontSize: '8px', fill: 'var(--color-text-tertiary)', fontWeight: 600 }}>0</text>
                  </svg>

                  {/* Tooltip */}
                  {hoveredPoint !== null && lineGraphPoints[hoveredPoint] && (
                    <div
                      className="rpt-tooltip"
                      style={{
                        left: `${(lineGraphPoints[hoveredPoint].x / 500) * 100}%`,
                        top: `${(lineGraphPoints[hoveredPoint].y / 180) * 100 - 30}%`,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--color-text-tertiary)', fontSize: '0.6rem', marginBottom: '2px' }}>
                        {lineGraphPoints[hoveredPoint].label}
                      </div>
                      <div style={{ fontWeight: 700, color: '#059669', fontFamily: "'Outfit', sans-serif" }}>
                        {formatCurrency(lineGraphPoints[hoveredPoint].value)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Expense Breakdown */}
              <div className="rpt-section" style={{ animationDelay: '0.6s', display: 'flex', flexDirection: 'column' }}>
                <div className="rpt-section-title">
                  <span>💸</span> Expense Distribution
                </div>
                <div className="rpt-section-subtitle">Percentage share of running costs</div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {reportData.expense_breakdown.length === 0 ? (
                    <div className="rpt-empty">No expense logs recorded.</div>
                  ) : (
                    (() => {
                      const totalExp = reportData.summary.total_expenses || 1;
                      const barColors = [
                        'linear-gradient(90deg, #dc2626, #f87171)',
                        'linear-gradient(90deg, #d97706, #fbbf24)',
                        'linear-gradient(90deg, #6366f1, #a78bfa)',
                        'linear-gradient(90deg, #059669, #34d399)',
                        'linear-gradient(90deg, #be185d, #f472b6)',
                        'linear-gradient(90deg, #0891b2, #22d3ee)',
                      ];

                      return reportData.expense_breakdown.map((exp, idx) => {
                        const pct = ((exp.value / totalExp) * 100).toFixed(1);
                        return (
                          <div key={exp.name} className="rpt-expense-item" style={{ animationDelay: `${0.1 + idx * 0.08}s` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{exp.name}</span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-primary)' }}>
                                {formatCurrency(exp.value)}
                              </span>
                            </div>
                            <div className="rpt-expense-bar-track">
                              <div className="rpt-expense-bar-fill" style={{
                                width: `${pct}%`,
                                background: barColors[idx % barColors.length],
                                animationDelay: `${0.3 + idx * 0.1}s`,
                              }} />
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', marginTop: '4px', textAlign: 'right' }}>
                              {pct}% of total
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              </div>
            </div>

            {/* ═══════ TOP MEDICINES + INVENTORY VALUATION ═══════ */}
            <div className="rpt-bottom-grid">
              {/* Top 5 Medicines */}
              <div className="rpt-section" style={{ animationDelay: '0.7s' }}>
                <div className="rpt-section-title">
                  <span>🏆</span> Top 5 Selling Medicines
                </div>
                <div className="rpt-section-subtitle">Popular items ranked by unit quantities sold</div>

                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--color-border-primary)' }}>
                  <table className="rpt-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Medicine</th>
                        <th style={{ textAlign: 'right' }}>Qty Sold</th>
                        <th style={{ textAlign: 'right' }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.top_medicines.length === 0 ? (
                        <tr style={{ opacity: 1, animation: 'none' }}>
                          <td colSpan="4" className="rpt-empty">No sales checkout logs recorded yet.</td>
                        </tr>
                      ) : (
                        reportData.top_medicines.map((med, i) => {
                          const medals = ['🥇', '🥈', '🥉'];
                          return (
                            <tr key={med.name + i} style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                              <td>
                                {i < 3
                                  ? <span className="rpt-medal">{medals[i]}</span>
                                  : <span className="rpt-rank-num">{i + 1}</span>
                                }
                              </td>
                              <td>
                                <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{med.name}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>{med.generic_name}</div>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                                {med.quantity_sold.toLocaleString()}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#059669' }}>
                                {formatCurrency(med.revenue)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inventory Valuation */}
              <div className="rpt-section" style={{ animationDelay: '0.8s' }}>
                <div className="rpt-section-title">
                  <span>📦</span> Inventory Asset Valuation
                </div>
                <div className="rpt-section-subtitle">Financial appraisal of active warehouse stock</div>

                <div className="rpt-inv-grid">
                  <div className="rpt-inv-item">
                    <div className="rpt-inv-label">Cost Value</div>
                    <div className="rpt-inv-value" style={{ color: 'var(--color-text-primary)' }}>
                      {formatCurrency(reportData.inventory_valuation.cost_value)}
                    </div>
                  </div>
                  <div className="rpt-inv-item">
                    <div className="rpt-inv-label">Retail Value</div>
                    <div className="rpt-inv-value" style={{ color: '#059669' }}>
                      {formatCurrency(reportData.inventory_valuation.retail_value)}
                    </div>
                  </div>
                  <div className="rpt-inv-item">
                    <div className="rpt-inv-label">Profit Margin</div>
                    <div className="rpt-inv-value" style={{ color: '#2563eb' }}>
                      {formatCurrency(reportData.inventory_valuation.margin)}
                    </div>
                  </div>
                </div>

                {/* Margin percentage visual */}
                {(() => {
                  const marginPct = reportData.inventory_valuation.retail_value > 0
                    ? ((reportData.inventory_valuation.margin / reportData.inventory_valuation.retail_value) * 100).toFixed(1)
                    : '0.0';
                  return (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-tertiary)' }}>Margin Percentage</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#2563eb' }}>{marginPct}%</span>
                      </div>
                      <div className="rpt-expense-bar-track">
                        <div className="rpt-expense-bar-fill" style={{
                          width: `${Math.min(Math.abs(Number(marginPct)), 100)}%`,
                          background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
                        }} />
                      </div>
                    </div>
                  );
                })()}

                <div className="rpt-tip" style={{ marginTop: '16px' }}>
                  💡 <strong>Pro Tip:</strong> Maintaining a balanced inventory margin ensures optimal cash flow. Run sales promotions on low-stock-alert items to free up capital.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Reports;
