import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getInvoices, getCustomers } from '../../services/salesService';
import { getReportsSummary } from '../../services/reportsService';
import { getSuppliers } from '../../services/suppliersService';

/* ───────────────────────── Animated Counter Hook ───────────────────────── */
const useCountUp = (target, duration = 1400, enabled = true) => {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!enabled || target === 0) { setValue(target); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [target, duration, enabled]);

  return value;
};

/* ─────────────────────────── Greeting Helper ───────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const formatCurrency = (v) =>
  `PKR ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatYAxisVal = (val) => {
  if (val >= 1000000) return `PKR ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `PKR ${(val / 1000).toFixed(1)}K`;
  return `PKR ${val.toFixed(0)}`;
};

/* ═══════════════════════════ DASHBOARD COMPONENT ═══════════════════════ */
const Dashboard = () => {
  const { user, pharmacy } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.pharmacy_id === null || user?.roles?.[0]?.toLowerCase() === 'super admin';

  const [statsData, setStatsData] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [expiringBatches, setExpiringBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const [activeFilter, setActiveFilter] = useState('all');
  const [finLoading, setFinLoading] = useState(false);

  const getDateRangeForFilter = (filterType) => {
    const now = new Date();
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const end_date = formatDate(now);
    let start_date = '';

    if (filterType === 'today') {
      start_date = formatDate(now);
    } else if (filterType === '7days') {
      const past = new Date();
      past.setDate(now.getDate() - 6);
      start_date = formatDate(past);
    } else if (filterType === '30days') {
      const past = new Date();
      past.setDate(now.getDate() - 29);
      start_date = formatDate(past);
    } else {
      return {};
    }

    return { start_date, end_date };
  };

  const handleFilterChange = async (filterType) => {
    setActiveFilter(filterType);
    setFinLoading(true);
    try {
      const range = getDateRangeForFilter(filterType);
      const res = await getReportsSummary(range);
      setReportsData(res);
    } catch (err) {
      console.error('Failed to refetch reports summary:', err);
    } finally {
      setFinLoading(false);
    }
  };

  /* ── Fetch all data in parallel ── */
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [stats, reports, invoices, customers, suppliers] = await Promise.allSettled([
          getDashboardStats(),
          getReportsSummary(),
          getInvoices(),
          getCustomers(),
          getSuppliers(),
        ]);

        if (!active) return;

        if (stats.status === 'fulfilled') setStatsData(stats.value);
        if (reports.status === 'fulfilled') setReportsData(reports.value);
        if (invoices.status === 'fulfilled') setRecentSales((invoices.value || []).slice(0, 2));
        if (customers.status === 'fulfilled') setCustomerCount((customers.value || []).length);
        if (suppliers.status === 'fulfilled') setSupplierCount((suppliers.value || []).length);

        // Expiring batches (within 30 days)
        try {
          const batches = JSON.parse(localStorage.getItem('primepharm_mock_batches') || '[]');
          const medicines = JSON.parse(localStorage.getItem('primepharm_mock_medicines_custom') || '[]');
          const now = new Date();
          const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          const expiring = batches
            .filter(b => {
              if (b.status !== 'ACTIVE' || Number(b.remaining_quantity) <= 0) return false;
              const exp = new Date(b.expiry_date);
              return exp <= thirtyDays && exp >= now;
            })
            .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
            .slice(0, 5)
            .map(b => ({
              ...b,
              daysLeft: Math.ceil((new Date(b.expiry_date) - now) / (1000 * 60 * 60 * 24)),
            }));
          setExpiringBatches(expiring);
        } catch (e) { /* ignore */ }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  /* ── Animated counter values ── */
  const animatedTodaySales = useCountUp(Math.round(Number(statsData?.today_sales ?? 0)), 1600, !loading);
  const animatedMonthSales = useCountUp(Math.round(Number(statsData?.this_month_sales ?? 0)), 1600, !loading);
  const animatedPurchases = useCountUp(statsData?.purchase_orders ?? 0, 1200, !loading);
  const animatedBatches = useCountUp(statsData?.active_batches ?? 0, 1200, !loading);
  const animatedLowStock = useCountUp(statsData?.low_stock_alerts ?? 0, 1000, !loading);
  const animatedExpired = useCountUp(statsData?.expired_batches ?? 0, 1000, !loading);
  const animatedCustomers = useCountUp(customerCount, 1200, !loading);
  const animatedSuppliers = useCountUp(supplierCount, 1200, !loading);

  /* ── Derived financial data ── */
  const summary = reportsData?.summary || {};
  const monthlyTrend = reportsData?.monthly_trend || [];
  const topMedicines = reportsData?.top_medicines || [];
  const inventoryVal = reportsData?.inventory_valuation || {};

  const maxMonthly = Math.max(...monthlyTrend.map(m => m.sales), 1);

  const chartPoints = React.useMemo(() => {
    if (!monthlyTrend || monthlyTrend.length === 0) return [];
    const maxVal = Math.max(...monthlyTrend.map((t) => t.sales), 10);
    const svgWidth = 500;
    const svgHeight = 150;
    const paddingLeft = 40;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;
    const segmentWidth = chartWidth / (monthlyTrend.length || 1);

    return monthlyTrend.map((t, idx) => {
      const x_center = paddingLeft + idx * segmentWidth + segmentWidth / 2;
      const barWidth = 32;
      const x = x_center - barWidth / 2;

      const pct = t.sales / maxVal;
      const barHeight = pct * chartHeight;
      const displayHeight = Math.max(barHeight, 4);
      const y = paddingTop + chartHeight - displayHeight;

      return {
        x,
        x_center,
        y,
        barWidth,
        displayHeight,
        label: t.label,
        value: t.sales,
      };
    });
  }, [monthlyTrend]);

  const totalSalesInTrend = React.useMemo(() => {
    return monthlyTrend.reduce((acc, curr) => acc + curr.sales, 0);
  }, [monthlyTrend]);

  const averageSalesInTrend = React.useMemo(() => {
    return totalSalesInTrend / (monthlyTrend.length || 1);
  }, [totalSalesInTrend, monthlyTrend]);

  const peakMonthObj = React.useMemo(() => {
    if (!monthlyTrend || monthlyTrend.length === 0) return null;
    return monthlyTrend.reduce((max, curr) => curr.sales > (max?.sales || 0) ? curr : max, monthlyTrend[0]);
  }, [monthlyTrend]);

  /* ── Current date/time ── */
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }).toUpperCase();

  /* ── KPI Cards Data ── */
  const kpiCards = [
    {
      title: "Today's Sales",
      value: loading ? '...' : formatCurrency(animatedTodaySales),
      sub: statsData?.today_sales_change || '0% from yesterday',
      icon: '💰',
      gradient: 'linear-gradient(135deg, #059669, #10b981)',
      bgLight: 'rgba(16, 185, 129, 0.08)',
      bgDark: 'rgba(16, 185, 129, 0.12)',
    },
    {
      title: "Month's Sales",
      value: loading ? '...' : formatCurrency(animatedMonthSales),
      sub: 'Month to date sales',
      icon: '📈',
      gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)',
      bgLight: 'rgba(2, 132, 199, 0.08)',
      bgDark: 'rgba(2, 132, 199, 0.12)',
    },
    {
      title: 'Purchase Orders',
      value: loading ? '...' : String(animatedPurchases),
      sub: `${statsData?.purchase_orders_this_month ?? 0} this month`,
      icon: '📋',
      gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
      bgLight: 'rgba(124, 58, 237, 0.08)',
      bgDark: 'rgba(124, 58, 237, 0.12)',
    },
    {
      title: 'Active Batches',
      value: loading ? '...' : String(animatedBatches),
      sub: 'FEFO Tracking Active',
      icon: '🧪',
      gradient: 'linear-gradient(135deg, #2563eb, #60a5fa)',
      bgLight: 'rgba(37, 99, 235, 0.08)',
      bgDark: 'rgba(37, 99, 235, 0.12)',
    },
    {
      title: 'Low Stock Alerts',
      value: loading ? '...' : String(animatedLowStock),
      sub: `${statsData?.critical_warnings ?? 0} critical warnings`,
      icon: '⚠️',
      gradient: 'linear-gradient(135deg, #d97706, #fbbf24)',
      bgLight: 'rgba(217, 119, 6, 0.08)',
      bgDark: 'rgba(217, 119, 6, 0.12)',
      pulse: (statsData?.critical_warnings ?? 0) > 0,
    },
    {
      title: 'Expired Batches',
      value: loading ? '...' : String(animatedExpired),
      sub: `${statsData?.expired_batches ?? 0} batches expired`,
      icon: '☠️',
      gradient: 'linear-gradient(135deg, #e11d48, #fb7185)',
      bgLight: 'rgba(225, 29, 72, 0.08)',
      bgDark: 'rgba(225, 29, 72, 0.12)',
      pulse: (statsData?.expired_batches ?? 0) > 0,
    },
    {
      title: 'Customers',
      value: loading ? '...' : String(animatedCustomers),
      sub: 'Registered customers',
      icon: '👥',
      gradient: 'linear-gradient(135deg, #0891b2, #22d3ee)',
      bgLight: 'rgba(8, 145, 178, 0.08)',
      bgDark: 'rgba(8, 145, 178, 0.12)',
    },
    {
      title: 'Suppliers',
      value: loading ? '...' : String(animatedSuppliers),
      sub: 'Active suppliers',
      icon: '🏢',
      gradient: 'linear-gradient(135deg, #be185d, #f472b6)',
      bgLight: 'rgba(190, 24, 93, 0.08)',
      bgDark: 'rgba(190, 24, 93, 0.12)',
    },
  ];

  const quickActions = [
    { label: 'New Sale', icon: '🛒', path: '/sales/pos', color: '#059669' },
    { label: 'Add Purchase', icon: '📦', path: '/purchases', color: '#7c3aed' },
    { label: 'View Reports', icon: '📊', path: '/financials/reports', color: '#2563eb' },
    { label: 'Inventory', icon: '💊', path: '/inventory/medicines', color: '#d97706' },
    { label: 'Customers', icon: '👥', path: '/partners/customers', color: '#0891b2' },
    { label: 'Suppliers', icon: '🏢', path: '/partners/suppliers', color: '#be185d' },
  ];

  const paymentStatusColor = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID') return { bg: 'rgba(16,185,129,0.12)', color: '#059669', darkColor: '#34d399' };
    if (s === 'PARTIAL') return { bg: 'rgba(217,119,6,0.12)', color: '#d97706', darkColor: '#fbbf24' };
    return { bg: 'rgba(239,68,68,0.12)', color: '#dc2626', darkColor: '#f87171' };
  };

  const getSaleItemsSummary = (sale) => {
    if (!sale.items || sale.items.length === 0) return null;
    const names = sale.items.map(item => item.medicine?.name || item.name).filter(Boolean);
    if (names.length === 0) return null;
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} (+${names.length - 2} more)`;
  };

  /* ═════════════════════════════ SKELETON ═════════════════════════════ */
  const Skeleton = ({ w = '100%', h = '20px', r = '6px' }) => (
    <div className="dash-skeleton" style={{ width: w, height: h, borderRadius: r }} />
  );

  /* ═════════════════════════════ RENDER ═════════════════════════════ */
  return (
    <>
      <style>{`
        /* ── Dashboard Animations ────────────────────────────── */
        @keyframes dashFadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dashSlideInLeft {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes dashGradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes dashPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: .6; transform: scale(1.25); }
        }
        @keyframes dashBarGrow {
          from { height: 0; }
        }
        @keyframes dashShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes dashGlow {
          0%, 100% { box-shadow: 0 0 4px rgba(34,197,94,.15); }
          50%      { box-shadow: 0 0 16px rgba(34,197,94,.35); }
        }
        @keyframes dashFloatBadge {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }

        /* ── KPI Card Special Animations ── */
        @keyframes dashCardEntrance {
          0%   { opacity: 0; transform: translateY(40px) scale(0.92); }
          60%  { opacity: 1; transform: translateY(-6px) scale(1.02); }
          80%  { transform: translateY(2px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dashSweepShine {
          0%   { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes dashIconBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          40%  { transform: translateY(-6px) scale(1.12); }
          60%  { transform: translateY(2px) scale(0.95); }
        }
        @keyframes dashBorderGlow {
          0%, 100% { border-color: var(--color-border-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
          50%      { border-color: var(--dash-card-accent, var(--color-border-primary)); box-shadow: 0 4px 20px var(--dash-card-glow, rgba(0,0,0,0.06)); }
        }
        @keyframes dashValuePop {
          0%   { opacity: 0; transform: scale(0.5); }
          70%  { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes dashTopGradientSlide {
          0%   { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }

        /* ── Skeleton ── */
        .dash-skeleton {
          background: linear-gradient(90deg, var(--color-surface-tertiary) 25%, var(--color-surface-hover) 50%, var(--color-surface-tertiary) 75%);
          background-size: 400% 100%;
          animation: dashShimmer 1.5s ease infinite;
        }

        .dash-welcome {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          padding: 16px 24px;
          background: linear-gradient(135deg, #0284c7, #1e40af);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .dash-welcome::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .dash-welcome h1 {
          font-size: 1.35rem;
          font-weight: 700;
          margin: 0 0 4px;
          position: relative;
          z-index: 1;
        }
        .dash-welcome .dash-subtitle {
          font-size: 0.78rem;
          opacity: 0.88;
          position: relative;
          z-index: 1;
          max-width: 600px;
          line-height: 1.4;
        }
        .dash-welcome .dash-datetime {
          position: absolute;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          text-align: right;
          z-index: 1;
        }
        .dash-welcome .dash-datetime .dash-time {
          font-size: 1.45rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          letter-spacing: 0.5px;
        }
        .dash-welcome .dash-datetime .dash-date {
          font-size: 0.7rem;
          opacity: 0.8;
          margin-top: 1px;
        }
        .dash-welcome .dash-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          padding: 2px 10px;
          border-radius: 20px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(6px);
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.0px;
          position: relative;
          z-index: 1;
          animation: dashFloatBadge 3s ease infinite;
        }

        @media (max-width: 768px) {
          .dash-welcome { padding: 16px 16px; }
          .dash-welcome h1 { font-size: 1.2rem; }
          .dash-welcome .dash-datetime {
            position: static;
            transform: none;
            text-align: left;
            margin-top: 10px;
          }
          .dash-welcome .dash-datetime .dash-time { font-size: 1.25rem; }
        }

        /* ── KPI Cards ── */
        .dash-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 1200px) { .dash-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px) { .dash-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .dash-kpi-grid { grid-template-columns: 1fr; } }

        .dash-kpi-card {
          border-radius: 10px;
          padding: 12px 14px;
          border: 1px solid var(--color-border-primary);
          background: var(--color-surface-card);
          cursor: default;
          opacity: 0;
          animation: dashCardEntrance 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease, border-color 0.35s ease;
          position: relative;
          overflow: hidden;
        }
        /* Shimmer sweep overlay on load */
        .dash-kpi-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          animation: dashSweepShine 1.8s ease forwards;
          pointer-events: none;
        }
        .dark .dash-kpi-card::after {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
        }
        .dash-kpi-card:hover {
          transform: translateY(-4px) scale(1.02);
          border-color: var(--dash-card-accent, var(--color-border-primary));
          box-shadow: 0 8px 24px var(--dash-card-glow, rgba(0,0,0,0.06));
        }
        .dark .dash-kpi-card:hover {
          box-shadow: 0 8px 24px var(--dash-card-glow-dark, rgba(0,0,0,0.4));
        }
        /* Icon bounces on card hover */
        .dash-kpi-card:hover .dash-kpi-icon {
          animation: dashIconBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        /* Value pops on card hover */
        .dash-kpi-card:hover .dash-kpi-value {
          animation: dashValuePop 0.4s ease;
        }
        .dash-kpi-card .dash-kpi-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.05rem;
          flex-shrink: 0;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
        }
        .dash-kpi-card .dash-kpi-title {
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-text-tertiary);
          margin-bottom: 4px;
        }
        .dash-kpi-card .dash-kpi-value {
          font-size: 1.25rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          color: var(--color-text-primary);
          margin-bottom: 2px;
          transition: color 0.3s ease;
        }
        .dash-kpi-card .dash-kpi-sub {
          font-size: 0.65rem;
          color: var(--color-text-tertiary);
          opacity: 0.85;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .dash-kpi-card .dash-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
          animation: dashPulse 1.5s infinite;
          display: inline-block;
          margin-right: 4px;
          vertical-align: middle;
        }

        /* ── Section Container ── */
        .dash-section {
          border-radius: 8px;
          padding: 16px;
          border: 1px solid var(--color-border-primary);
          background: var(--color-surface-card);
          opacity: 0;
          animation: dashFadeInUp 0.6s ease forwards;
          display: flex;
          flex-direction: column;
        }
        .dash-section-title {
          font-size: 0.9rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          color: var(--color-text-primary);
          margin: 0 0 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dash-section-title .dash-title-icon {
          font-size: 1.0rem;
        }

        /* ── Financial Overview ── */
        .dash-fin-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (max-width: 640px) { .dash-fin-grid { grid-template-columns: 1fr; } }
        .dash-fin-item {
          padding: 10px 12px;
          border-radius: 6px;
          background: var(--color-surface-tertiary);
          border: 1px solid var(--color-border-primary);
        }
        .dash-fin-item .dash-fin-label {
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--color-text-tertiary);
          margin-bottom: 2px;
        }
        .dash-fin-item .dash-fin-value {
          font-size: 1.05rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          color: var(--color-text-primary);
        }
        .dash-fin-item .dash-fin-bar {
          height: 3px;
          border-radius: 3px;
          margin-top: 8px;
          overflow: hidden;
          background: var(--color-surface-hover);
        }
        .dash-fin-item .dash-fin-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 1.2s ease;
        }

        /* ── Chart ── */
        .dash-chart-container {
          position: relative;
          width: 100%;
          height: 185px;
          padding-top: 4px;
        }
        .dash-chart-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        .dash-chart-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: dashLineDraw 2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes dashLineDraw {
          to { stroke-dashoffset: 0; }
        }
        .dash-chart-dot {
          transition: r 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), stroke-width 0.2s ease, fill 0.2s ease;
          cursor: pointer;
        }
        .dash-chart-dot:hover {
          r: 7;
          stroke-width: 3.5;
        }
        .dash-chart-tooltip-v2 {
          position: absolute;
          z-index: 20;
          padding: 8px 12px;
          border-radius: 8px;
          background: var(--color-surface-primary);
          border: 1px solid var(--color-border-primary);
          box-shadow: 0 6px 20px rgba(0,0,0,0.12);
          font-size: 0.7rem;
          pointer-events: none;
          transform: translate(-50%, -100%);
          margin-top: -10px;
          transition: left 0.15s cubic-bezier(0.25, 1, 0.5, 1), top 0.15s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .dash-chart-label {
          font-size: 0.62rem;
          font-weight: 600;
          color: var(--color-text-tertiary);
          text-align: center;
        }

        /* ── Top Medicines Table ── */
        .dash-table {
          width: 100%;
          border-collapse: collapse;
        }
        .dash-table th {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-text-tertiary);
          text-align: left;
          padding: 6px 8px;
          border-bottom: 1px solid var(--color-border-primary);
        }
        .dash-table td {
          font-size: 0.75rem;
          padding: 8px 8px;
          border-bottom: 1px solid var(--color-border-primary);
          color: var(--color-text-primary);
          vertical-align: middle;
        }
        .dash-table tr {
          opacity: 0;
          animation: dashFadeInUp 0.4s ease forwards;
        }
        .dash-table tbody tr:hover {
          background: var(--color-surface-hover);
        }
        .dash-medal {
          font-size: 1.0rem;
          margin-right: 4px;
          vertical-align: middle;
        }

        /* ── Expiring Batches ── */
        .dash-expiry-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 6px;
          background: var(--color-surface-tertiary);
          border: 1px solid var(--color-border-primary);
          margin-bottom: 8px;
          opacity: 0;
          animation: dashFadeInUp 0.4s ease forwards;
        }
        .dash-expiry-days {
          min-width: 36px;
          height: 36px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          flex-shrink: 0;
        }
        .dash-expiry-days span {
          font-size: 0.5rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ── Recent Sales ── */
        .dash-sale-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          border-radius: 6px;
          background: var(--color-surface-tertiary);
          border: 1px solid var(--color-border-primary);
          margin-bottom: 8px;
          opacity: 0;
          animation: dashSlideInLeft 0.4s ease forwards;
        }
        .dash-sale-inv {
          font-size: 0.75rem;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
          color: var(--color-text-primary);
        }
        .dash-sale-date {
          font-size: 0.62rem;
          color: var(--color-text-tertiary);
          margin-top: 1px;
        }
        .dash-sale-cust {
          font-size: 0.68rem;
          font-weight: 500;
          color: var(--color-text-brand);
          margin-top: 1px;
        }
        .dash-sale-amount {
          font-size: 0.8rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          color: var(--color-text-primary);
          text-align: right;
        }
        .dash-status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.58rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        /* ── Quick Actions ── */
        .dash-actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (max-width: 768px) { .dash-actions-grid { grid-template-columns: repeat(2, 1fr); } }
        .dash-action-btn {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--color-border-primary);
          background: var(--color-surface-tertiary);
          cursor: pointer;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--color-text-primary);
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          opacity: 0;
          animation: dashFadeInUp 0.5s ease forwards;
        }
        .dash-action-btn:hover {
          transform: translateY(-2px);
          background: var(--color-surface-hover);
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .dark .dash-action-btn:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .dash-action-btn .dash-action-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        /* ── System Health Footer ── */
        .dash-health-bar {
          border-radius: 10px;
          padding: 18px 24px;
          border: 1px solid var(--color-border-primary);
          background: var(--color-surface-card);
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          align-items: center;
          opacity: 0;
          animation: dashFadeInUp 0.6s ease forwards;
        }
        .dash-health-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.72rem;
          color: var(--color-text-tertiary);
        }
        .dash-health-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: dashGlow 2s ease infinite;
        }
        .dash-health-label {
          font-weight: 600;
          color: var(--color-text-primary);
          margin-right: 2px;
        }

        /* ── Layout Helpers ── */
        .dash-main-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 16px;
        }
        @media (max-width: 1024px) { .dash-main-grid { grid-template-columns: 1fr; } }
        .dash-double-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 768px) { .dash-double-grid { grid-template-columns: 1fr; } }
        .dash-empty-state {
          flex-grow: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px;
          color: var(--color-text-tertiary);
          font-size: 0.78rem;
          opacity: 0.7;
          min-height: 100px;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* ═══════ 1. WELCOME BANNER ═══════ */}
        <div className="dash-welcome" style={{ animationDelay: '0s' }}>
          <h1>{getGreeting()}, {user?.name} 👋</h1>
          <p className="dash-subtitle">
            Welcome to <strong>{pharmacy?.name}</strong> — your pharmacy management command center.
            Monitor sales, track inventory, and manage operations all in one place.
          </p>
          <div className="dash-role-badge">
            <span>●</span>
            {user?.roles?.[0] || 'Member'}
          </div>
          <div className="dash-datetime">
            <div className="dash-time">{timeStr}</div>
            <div className="dash-date">{dateStr}</div>
          </div>
        </div>

        {/* ═══════ 2. KPI STATS GRID ═══════ */}
        <div className="dash-kpi-grid">
          {kpiCards.map((card, i) => {
            // Extract accent color from gradient for per-card effects
            const accentMatch = card.gradient.match(/#[0-9a-fA-F]{6}/);
            const accent = accentMatch ? accentMatch[0] : '#059669';
            return (
              <div
                key={card.title}
                className="dash-kpi-card"
                style={{
                  animationDelay: `${0.08 + i * 0.12}s`,
                  '--dash-card-gradient': card.gradient.replace('135deg', '90deg'),
                  '--dash-card-accent': accent,
                  '--dash-card-glow': `${accent}22`,
                  '--dash-card-glow-dark': `${accent}33`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div className="dash-kpi-title">{card.title}</div>
                  <div className="dash-kpi-icon" style={{ background: card.gradient, color: '#fff' }}>
                    {card.icon}
                  </div>
                </div>
                <div className="dash-kpi-value">
                  {loading ? <Skeleton w="120px" h="28px" /> : card.value}
                </div>
                <div className="dash-kpi-sub">
                  {card.pulse && <span className="dash-pulse-dot" />}
                  {card.sub}
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══════ 3 & 4. FINANCIAL OVERVIEW + CHART ═══════ */}
        <div className="dash-main-grid">
          <div className="dash-section" style={{ animationDelay: '0.55s', position: 'relative' }}>
            <div className="dash-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="dash-title-icon">📊</span>
                Financial Overview
              </div>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface-tertiary)', padding: '2px', borderRadius: '6px', border: '1px solid var(--color-border-primary)' }}>
                {['today', '7days', '30days', 'all'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleFilterChange(filter)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: 'none',
                      background: activeFilter === filter ? 'var(--color-surface-primary)' : 'transparent',
                      color: activeFilter === filter ? 'var(--color-text-brand)' : 'var(--color-text-tertiary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: activeFilter === filter ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    }}
                  >
                    {filter === 'today' ? 'Today' : filter === '7days' ? '7 Days' : filter === '30days' ? '30 Days' : 'All'}
                  </button>
                ))}
              </div>
            </div>
            {loading || finLoading ? (
              <div className="dash-fin-grid">
                {[1, 2, 3, 4].map(k => <Skeleton key={k} h="80px" r="8px" />)}
              </div>
            ) : (
              <div className="dash-fin-grid">
                <div className="dash-fin-item">
                  <div className="dash-fin-label">Total Revenue</div>
                  <div className="dash-fin-value" style={{ color: '#059669' }}>{formatCurrency(summary.total_sales)}</div>
                  <div className="dash-fin-bar">
                    <div className="dash-fin-bar-fill" style={{ width: '100%', background: 'linear-gradient(90deg, #059669, #10b981)' }} />
                  </div>
                </div>
                <div className="dash-fin-item">
                  <div className="dash-fin-label">Total Expenses</div>
                  <div className="dash-fin-value" style={{ color: '#dc2626' }}>{formatCurrency(summary.total_expenses)}</div>
                  <div className="dash-fin-bar">
                    <div className="dash-fin-bar-fill" style={{ width: summary.total_sales > 0 ? `${Math.min((summary.total_expenses / summary.total_sales) * 100, 100)}%` : '0%', background: 'linear-gradient(90deg, #dc2626, #f87171)' }} />
                  </div>
                </div>
                <div className="dash-fin-item">
                  <div className="dash-fin-label">Gross Profit</div>
                  <div className="dash-fin-value" style={{ color: summary.gross_profit >= 0 ? '#059669' : '#dc2626' }}>
                    {formatCurrency(summary.gross_profit)}
                  </div>
                  <div className="dash-fin-bar">
                    <div className="dash-fin-bar-fill" style={{ width: summary.total_sales > 0 ? `${Math.min((Math.abs(summary.gross_profit) / summary.total_sales) * 100, 100)}%` : '0%', background: summary.gross_profit >= 0 ? 'linear-gradient(90deg, #059669, #34d399)' : 'linear-gradient(90deg, #dc2626, #f87171)' }} />
                  </div>
                </div>
                <div className="dash-fin-item">
                  <div className="dash-fin-label">Net Profit</div>
                  <div className="dash-fin-value" style={{ color: summary.net_profit >= 0 ? '#059669' : '#dc2626' }}>
                    {summary.net_profit >= 0 ? '▲ ' : '▼ '}{formatCurrency(Math.abs(summary.net_profit))}
                  </div>
                  <div className="dash-fin-bar">
                    <div className="dash-fin-bar-fill" style={{ width: summary.total_sales > 0 ? `${Math.min((Math.abs(summary.net_profit) / summary.total_sales) * 100, 100)}%` : '0%', background: summary.net_profit >= 0 ? 'linear-gradient(90deg, #0891b2, #22d3ee)' : 'linear-gradient(90deg, #dc2626, #f87171)' }} />
                  </div>
                </div>
              </div>
            )}
            {/* Inventory Valuation Sub-section */}
            {!loading && (
              <div style={{ marginTop: '18px', padding: '16px', borderRadius: '8px', background: 'var(--color-surface-tertiary)', border: '1px solid var(--color-border-primary)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-tertiary)', marginBottom: '10px' }}>
                  📦 Inventory Valuation
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>Cost Value</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-primary)' }}>
                      {formatCurrency(inventoryVal.cost_value)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>Retail Value</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#059669' }}>
                      {formatCurrency(inventoryVal.retail_value)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>Margin</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#2563eb' }}>
                      {formatCurrency(inventoryVal.margin)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Sales Trend Chart */}
          <div className="dash-section" style={{ animationDelay: '0.65s' }}>
            <div className="dash-section-title">
              <span className="dash-title-icon">📈</span>
              Monthly Sales Trend
            </div>
            {loading ? (
              <Skeleton h="180px" r="8px" />
            ) : monthlyTrend.length > 0 ? (
              <>
                <div className="dash-chart-container">
                  <svg className="dash-chart-svg" viewBox="0 0 500 150">
                    <defs>
                      <linearGradient id="dash-bar-grad-normal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                      <linearGradient id="dash-bar-grad-current" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#60a5fa" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[15, 70, 125].map((y) => (
                      <line
                        key={y}
                        x1="40"
                        y1={y}
                        x2="490"
                        y2={y}
                        stroke="var(--color-border-primary)"
                        strokeWidth="0.5"
                        strokeDasharray="4,4"
                        opacity="0.5"
                      />
                    ))}

                    {/* Bars */}
                    {chartPoints.map((p, idx) => {
                      const r = Math.min(6, p.displayHeight);
                      const pathD = `
                        M ${p.x} 125
                        L ${p.x} ${p.y + r}
                        A ${r} ${r} 0 0 1 ${p.x + r} ${p.y}
                        L ${p.x + p.barWidth - r} ${p.y}
                        A ${r} ${r} 0 0 1 ${p.x + p.barWidth} ${p.y + r}
                        L ${p.x + p.barWidth} 125
                        Z
                      `;

                      const isCurrentMonth = idx === chartPoints.length - 1;
                      const fillGrad = isCurrentMonth ? 'url(#dash-bar-grad-current)' : 'url(#dash-bar-grad-normal)';

                      return (
                        <g key={idx}>
                          {/* Hover helper background line (makes it easier to trigger hover) */}
                          <rect
                            x={p.x_center - 25}
                            y="15"
                            width="50"
                            height="110"
                            fill="transparent"
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredPoint(idx)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                          {/* SVG Bar */}
                          <path
                            d={pathD}
                            fill={fillGrad}
                            style={{
                              transition: 'filter 0.25s ease, opacity 0.25s ease',
                              filter: hoveredPoint === idx ? 'brightness(1.15) drop-shadow(0 4px 12px rgba(37,99,235,0.15))' : 'none',
                              opacity: hoveredPoint !== null && hoveredPoint !== idx ? 0.75 : 1,
                              pointerEvents: 'none'
                            }}
                          />
                          {/* Month text label */}
                          <text
                            x={p.x_center}
                            y="140"
                            textAnchor="middle"
                            style={{
                              fontSize: '9px',
                              fill: 'var(--color-text-tertiary)',
                              fontFamily: "'Outfit', sans-serif",
                              fontWeight: 600,
                            }}
                          >
                            {p.label.split(' ')[0]}
                          </text>
                        </g>
                      );
                    })}

                    {/* Y axis labels */}
                    {(() => {
                      const maxVal = Math.max(...monthlyTrend.map((t) => t.sales), 10);
                      return (
                        <>
                          <text
                            x="32"
                            y="18"
                            textAnchor="end"
                            style={{
                              fontSize: '8px',
                              fill: 'var(--color-text-tertiary)',
                              fontFamily: "'Outfit', sans-serif",
                              fontWeight: 600,
                            }}
                          >
                            {formatYAxisVal(maxVal)}
                          </text>
                          <text
                            x="32"
                            y="74"
                            textAnchor="end"
                            style={{
                              fontSize: '8px',
                              fill: 'var(--color-text-tertiary)',
                              fontFamily: "'Outfit', sans-serif",
                              fontWeight: 600,
                            }}
                          >
                            {formatYAxisVal(maxVal / 2)}
                          </text>
                          <text
                            x="32"
                            y="129"
                            textAnchor="end"
                            style={{
                              fontSize: '8px',
                              fill: 'var(--color-text-tertiary)',
                              fontFamily: "'Outfit', sans-serif",
                              fontWeight: 600,
                            }}
                          >
                            PKR 0
                          </text>
                        </>
                      );
                    })()}
                  </svg>

                  {/* Floating Tooltip */}
                  {hoveredPoint !== null && chartPoints[hoveredPoint] && (
                    <div
                      className="dash-chart-tooltip-v2"
                      style={{
                        left: `${(chartPoints[hoveredPoint].x_center / 500) * 100}%`,
                        top: `${(chartPoints[hoveredPoint].y / 150) * 100}%`,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--color-text-tertiary)', fontSize: '0.62rem', marginBottom: '2px' }}>
                        {chartPoints[hoveredPoint].label}
                      </div>
                      <div style={{ fontWeight: 700, color: '#2563eb', fontFamily: "'Outfit', sans-serif" }}>
                        {formatCurrency(chartPoints[hoveredPoint].value)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary statistics row below the chart to fill space elegantly */}
                <div style={{
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px dashed var(--color-border-primary)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Peak Sales</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: "'Outfit', sans-serif" }}>
                      {peakMonthObj ? formatCurrency(peakMonthObj.sales).replace('PKR ', '') : '0.00'}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)' }}>{peakMonthObj ? peakMonthObj.label.split(' ')[0] : 'N/A'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Average</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2563eb', fontFamily: "'Outfit', sans-serif" }}>
                      {formatCurrency(averageSalesInTrend).replace('PKR ', '')}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)' }}>Per Month</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Period</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669', fontFamily: "'Outfit', sans-serif" }}>
                      {formatCurrency(totalSalesInTrend).replace('PKR ', '')}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)' }}>6-Month Sum</div>
                  </div>
                </div>
              </>) : (
              <div className="dash-empty-state">No sales data available yet</div>
            )}
          </div>
        </div>

        {/* ═══════ 5 & 6. TOP MEDICINES + EXPIRING BATCHES ═══════ */}
        <div className="dash-main-grid">
          {/* Top Selling Medicines */}
          <div className="dash-section" style={{ animationDelay: '0.75s' }}>
            <div className="dash-section-title">
              <span className="dash-title-icon">🏆</span>
              Top Selling Medicines
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map(k => <Skeleton key={k} h="36px" r="6px" />)}
              </div>
            ) : topMedicines.length > 0 ? (
              <table className="dash-table">
                <thead>
                  <tr style={{ opacity: 1, animation: 'none' }}>
                    <th>#</th>
                    <th>Medicine</th>
                    <th style={{ textAlign: 'right' }}>Qty Sold</th>
                    <th style={{ textAlign: 'right' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topMedicines.map((med, i) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <tr key={i} style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                        <td>
                          {i < 3 ? <span className="dash-medal">{medals[i]}</span> : <span style={{ paddingLeft: '6px', fontWeight: 600 }}>{i + 1}</span>}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{med.name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>{med.generic_name}</div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{med.quantity_sold}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: '#059669' }}>{formatCurrency(med.revenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="dash-empty-state">No sales data recorded yet — complete your first sale!</div>
            )}
          </div>

          {/* Expiring Batches */}
          <div className="dash-section" style={{ animationDelay: '0.85s' }}>
            <div className="dash-section-title">
              <span className="dash-title-icon">⏰</span>
              Expiring Soon (30 Days)
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map(k => <Skeleton key={k} h="56px" r="8px" />)}
              </div>
            ) : expiringBatches.length > 0 ? (
              expiringBatches.map((b, i) => {
                const urgent = b.daysLeft <= 7;
                return (
                  <div key={b.id || i} className="dash-expiry-item" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                    <div className="dash-expiry-days" style={{
                      background: urgent ? 'rgba(239,68,68,0.12)' : 'rgba(217,119,6,0.12)',
                      color: urgent ? '#dc2626' : '#d97706',
                    }}>
                      {b.daysLeft}
                      <span>days</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Batch: {b.batch_no}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>
                        Expires: {new Date(b.expiry_date).toLocaleDateString()} • Qty: {b.remaining_quantity}
                      </div>
                    </div>
                    {urgent && <span className="dash-pulse-dot" style={{ flexShrink: 0 }} />}
                  </div>
                );
              })
            ) : (
              <div className="dash-empty-state">✅ No batches expiring within 30 days</div>
            )}
          </div>
        </div>

        {/* ═══════ 7 & 8. RECENT SALES + QUICK ACTIONS ═══════ */}
        <div className="dash-main-grid">
          {/* Recent Sales */}
          <div className="dash-section" style={{ animationDelay: '0.95s' }}>
            <div className="dash-section-title">
              <span className="dash-title-icon">🧾</span>
              Recent Sales
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map(k => <Skeleton key={k} h="56px" r="8px" />)}
              </div>
            ) : recentSales.length > 0 ? (
              recentSales.map((sale, i) => {
                const sc = paymentStatusColor(sale.payment_status);
                return (
                  <div key={sale.id || i} className="dash-sale-item" style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
                    <div>
                      <div className="dash-sale-inv">{sale.invoice_no}</div>
                      <div className="dash-sale-cust">{sale.customer?.name || 'Walk-in Customer'}</div>
                      {getSaleItemsSummary(sale) && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-tertiary)', marginTop: '2px', fontWeight: '500' }}>
                          📦 {getSaleItemsSummary(sale)}
                        </div>
                      )}
                      <div className="dash-sale-date">{sale.sale_date || 'N/A'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="dash-sale-amount">{formatCurrency(sale.grand_total)}</div>
                      <div className="dash-status-pill" style={{ background: sc.bg, color: sc.color }}>
                        {sale.payment_status || 'N/A'}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="dash-empty-state">No sales recorded yet — go to POS to start!</div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="dash-section" style={{ animationDelay: '1.05s' }}>
            <div className="dash-section-title">
              <span className="dash-title-icon">⚡</span>
              Quick Actions
            </div>
            <div className="dash-actions-grid">
              {quickActions.map((action, i) => (
                <div
                  key={action.label}
                  className="dash-action-btn"
                  style={{
                    animationDelay: `${0.2 + i * 0.07}s`,
                    borderLeft: `3px solid ${action.color}`
                  }}
                  onClick={() => navigate(action.path)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(action.path)}
                >
                  <span className="dash-action-icon">{action.icon}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>{action.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ 9. SYSTEM HEALTH FOOTER ═══════ */}
        <div className="dash-health-bar" style={{ animationDelay: '1.15s' }}>
          {isSuperAdmin ? (
            <>
              <div className="dash-health-item">
                <div className="dash-health-dot" style={{ background: '#22c55e' }} />
                <span className="dash-health-label">API</span> Online
              </div>
              <div className="dash-health-item">
                <div className="dash-health-dot" style={{ background: '#22c55e' }} />
                <span className="dash-health-label">Database</span> PostgreSQL
              </div>
              <div className="dash-health-item">
                <div className="dash-health-dot" style={{ background: '#22c55e' }} />
                <span className="dash-health-label">Auth</span> Sanctum Token Secured
              </div>
            </>
          ) : (
            <>
              <div className="dash-health-item">
                <div className="dash-health-dot" style={{ background: '#22c55e' }} />
                <span className="dash-health-label">POS Status</span> Terminal Active
              </div>
              <div className="dash-health-item">
                <span className="dash-health-label">Branch:</span> {user?.branch?.name || 'Main Branch'}
              </div>
              <div className="dash-health-item">
                <span className="dash-health-label">Subscription:</span> {pharmacy?.status === 'trial' ? 'Free Trial' : 'Active'}
              </div>
            </>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div className="dash-health-item">
              <span className="dash-health-label">Pharmacy:</span> {pharmacy?.name}
            </div>
            <div className="dash-health-item">
              <span className="dash-health-label">Role:</span>
              <span style={{ color: 'var(--color-text-brand)', textTransform: 'capitalize' }}>{user?.roles?.[0] || 'Member'}</span>
            </div>
            <div className="dash-health-item">
              <span className="dash-health-label">System:</span> v1.2.0
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Dashboard;
