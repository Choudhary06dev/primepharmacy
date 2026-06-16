import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import { getReportsSummary } from '../../../services/reportsService';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interactive graph tooltip state
  const [hoveredPoint, setHoveredPoint] = useState(null);

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
  }, [filterRange]);

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

  // Render Line Graph coordinates dynamically
  const lineGraphPoints = React.useMemo(() => {
    if (!reportData || !reportData.monthly_trend || reportData.monthly_trend.length === 0) return [];
    
    const trend = reportData.monthly_trend;
    const maxVal = Math.max(...trend.map((t) => t.sales), 1000);
    
    const svgWidth = 500;
    const svgHeight = 160;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 10;
    const paddingBottom = 25;
    
    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;
    
    return trend.map((t, idx) => {
      const x = paddingLeft + (idx * (chartWidth / (trend.length - 1)));
      const y = paddingTop + chartHeight - ((t.sales / maxVal) * chartHeight);
      return {
        x,
        y,
        label: t.label,
        value: t.sales,
      };
    });
  }, [reportData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400 text-sm">
        Generating business intelligence reports...
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-655 dark:text-red-400">
        ⚠️ {error || 'Failed to load report analytics.'}
      </div>
    );
  }

  const { summary, monthly_trend, expense_breakdown, top_medicines, inventory_valuation } = reportData;

  const cards = [
    { title: 'Gross Revenue', value: summary.total_sales, color: 'text-emerald-600 dark:text-emerald-450 border-emerald-500/25', icon: '📈' },
    { title: 'Cost of Goods Sold', value: summary.total_cogs, color: 'text-indigo-600 dark:text-indigo-400 border-indigo-500/25', icon: '🏷️' },
    { title: 'Operating Expenses', value: summary.total_expenses, color: 'text-red-600 dark:text-red-400 border-red-500/25', icon: '💸' },
    { title: 'Net Profit', value: summary.net_profit, color: 'text-brand-700 dark:text-brand-400 border-brand-500/25', icon: '💰' },
  ];

  // Calculate percentage of expenses
  const totalExp = summary.total_expenses || 1;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Financial reports & Analytics"
        subtitle="Analyze business revenue, cost of goods sold, monthly expenditure, and inventory valuations."
      />

      {/* Date Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 backdrop-blur-md shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Date Range Filter</span>
          <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl">
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
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  filterRange === opt.id
                    ? 'bg-white dark:bg-zinc-800 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-350'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {filterRange === 'custom' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCustomRange}
              className="bg-brand-600 hover:bg-brand-550 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* KPI summaries row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <div
            key={c.title}
            className={`ui-card rounded-2xl border border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-6 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.title}</span>
              <span className="text-xl p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">{c.icon}</span>
            </div>
            <p className={`text-2xl font-bold font-display ${c.color}`}>
              PKR {Number(c.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-slate-400 block mt-1">Pharmacy scope consolidated</span>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart */}
        <div className="lg:col-span-2 ui-card rounded-3xl border border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 font-display">
              Monthly Revenue Trend (Last 6 Months)
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500">Gross sales performance history</p>
          </div>

          <div className="relative pt-2">
            <svg viewBox="0 0 500 160" className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand-500, #3b82f6)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--color-brand-500, #3b82f6)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="chart-line-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="50" y1="10" x2="480" y2="10" stroke="var(--color-border-primary, #e2e8f0)" strokeWidth="0.5" strokeDasharray="3" />
              <line x1="50" y1="72" x2="480" y2="72" stroke="var(--color-border-primary, #e2e8f0)" strokeWidth="0.5" strokeDasharray="3" />
              <line x1="50" y1="135" x2="480" y2="135" stroke="var(--color-border-primary, #e2e8f0)" strokeWidth="0.5" strokeDasharray="3" />

              {/* Chart Line Path */}
              {lineGraphPoints.length > 0 && (
                <>
                  {/* Area fill */}
                  <path
                    d={`M ${lineGraphPoints[0].x} 135 L ${lineGraphPoints.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${lineGraphPoints[lineGraphPoints.length - 1].x} 135 Z`}
                    fill="url(#chart-area-grad)"
                  />
                  {/* Stroke path */}
                  <path
                    d={lineGraphPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                    fill="none"
                    stroke="url(#chart-line-grad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Interactive Tooltips & Circles */}
              {lineGraphPoints.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint === idx ? '6' : '4'}
                    className="cursor-pointer transition-all duration-200 fill-white dark:fill-zinc-950 stroke-brand-500"
                    strokeWidth="2.5"
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Month Label */}
                  <text
                    x={p.x}
                    y="150"
                    textAnchor="middle"
                    className="text-[9px] fill-slate-500 font-mono font-bold uppercase"
                  >
                    {p.label.split(' ')[0]}
                  </text>
                </g>
              ))}

              {/* Y Axis Grid Label */}
              <text x="15" y="15" className="text-[8px] fill-slate-450 font-bold font-mono">MAX</text>
              <text x="15" y="76" className="text-[8px] fill-slate-450 font-bold font-mono">50%</text>
              <text x="15" y="138" className="text-[8px] fill-slate-450 font-bold font-mono">0.00</text>
            </svg>

            {/* Tooltip Overlay */}
            {hoveredPoint !== null && lineGraphPoints[hoveredPoint] && (
              <div
                className="absolute z-10 bg-slate-900 text-white dark:bg-zinc-800 text-[10px] p-2.5 rounded-lg border border-slate-850 shadow-xl flex flex-col font-mono"
                style={{
                  left: `${(lineGraphPoints[hoveredPoint].x / 500) * 100}%`,
                  top: `${(lineGraphPoints[hoveredPoint].y / 160) * 100 - 35}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <span className="font-bold text-slate-400">{lineGraphPoints[hoveredPoint].label}</span>
                <span className="font-bold text-emerald-400 mt-0.5">PKR {Number(lineGraphPoints[hoveredPoint].value).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="ui-card rounded-3xl border border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 font-display">
              Expense Distribution
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 mb-6">Percentage share of running costs</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {expense_breakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-450 p-8">
                No expense logs recorded.
              </div>
            ) : (
              expense_breakdown.map((exp, idx) => {
                const colors = ['bg-red-500', 'bg-amber-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-purple-500'];
                const color = colors[idx % colors.length];
                const percent = ((exp.value / totalExp) * 100).toFixed(1);

                return (
                  <div key={exp.name} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-650 dark:text-slate-350">
                      <span className="font-semibold">{exp.name}</span>
                      <span className="font-mono font-bold">
                        PKR {Number(exp.value).toFixed(2)} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Product performance & Inventory Value */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Top Products */}
        <div className="lg:col-span-2 ui-card rounded-3xl border border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 font-display">
              Top 5 Selling Medicines
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500">Popular items ranked by unit quantities sold</p>
          </div>

          <div className="border border-slate-100 dark:border-zinc-850 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-zinc-950 text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-150 dark:border-zinc-850 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  <th className="px-4 py-3">Medicine</th>
                  <th className="px-4 py-3 text-right">Units Sold</th>
                  <th className="px-4 py-3 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-zinc-900 font-medium text-slate-700 dark:text-slate-300">
                {top_medicines.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-6 text-center text-slate-450">
                      No sales checkout logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  top_medicines.map((med) => (
                    <tr key={med.name}>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{med.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{med.generic_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-800 dark:text-slate-200">
                        {med.quantity_sold.toLocaleString()} units
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-450">
                        PKR {Number(med.revenue).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Valuation Card */}
        <div className="ui-card rounded-3xl border border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 font-display">
              Inventory Asset Valuation
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 mb-6">Financial appraisal of active warehouse stock</p>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900/60 p-4 border border-slate-150 dark:border-zinc-850 rounded-2xl space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Total Cost Value</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-250">
                PKR {Number(inventory_valuation.cost_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Projected Retail Value</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-450">
                PKR {Number(inventory_valuation.retail_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="border-t border-slate-200 dark:border-zinc-800 my-2 pt-3 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-550 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">Estimated Profit Margin</span>
              <span className="font-mono text-brand-650 dark:text-brand-450 text-sm">
                PKR {Number(inventory_valuation.margin).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-450 leading-relaxed bg-brand-500/5 border border-brand-500/10 rounded-xl p-3 mt-4">
            💡 <strong>Pro Tip:</strong> Maintaining a balanced inventory margin ensures optimal cash flow. Run sales promotions on low-stock-alert items to free up capital.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
