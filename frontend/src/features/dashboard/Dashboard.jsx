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

/* ═══════════════════════════ DASHBOARD COMPONENT ═══════════════════════ */
const Dashboard = () => {
  const { user, pharmacy } = useAuth();
  const navigate = useNavigate();

  const [statsData, setStatsData] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [expiringBatches, setExpiringBatches] = useState([]);
  const [loading, setLoading] = useState(true);

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
        if (invoices.status === 'fulfilled') setRecentSales((invoices.value || []).slice(0, 5));
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
  const animatedPurchases = useCountUp(statsData?.purchase_orders ?? 0, 1200, !loading);
  const animatedBatches = useCountUp(statsData?.active_batches ?? 0, 1200, !loading);
  const animatedLowStock = useCountUp(statsData?.low_stock_alerts ?? 0, 1000, !loading);
  const animatedCustomers = useCountUp(customerCount, 1200, !loading);
  const animatedSuppliers = useCountUp(supplierCount, 1200, !loading);

  /* ── Derived financial data ── */
  const summary = reportsData?.summary || {};
  const monthlyTrend = reportsData?.monthly_trend || [];
  const topMedicines = reportsData?.top_medicines || [];
  const inventoryVal = reportsData?.inventory_valuation || {};

  const maxMonthly = Math.max(...monthlyTrend.map(m => m.sales), 1);

  /* ── Current date/time ── */
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

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

        /* ── Welcome Banner ── */
        .dash-welcome {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          padding: 32px 36px;
          background: linear-gradient(135deg, #059669, #10b981, #0891b2, #2563eb);
          background-size: 300% 300%;
          animation: dashGradientShift 8s ease infinite;
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
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0 0 6px;
          position: relative;
          z-index: 1;
        }
        .dash-welcome .dash-subtitle {
          font-size: 0.85rem;
          opacity: 0.88;
          position: relative;
          z-index: 1;
          max-width: 600px;
          line-height: 1.5;
        }
        .dash-welcome .dash-datetime {
          position: absolute;
          right: 36px;
          top: 50%;
          transform: translateY(-50%);
          text-align: right;
          z-index: 1;
        }
        .dash-welcome .dash-datetime .dash-time {
          font-size: 2rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          letter-spacing: 1px;
        }
        .dash-welcome .dash-datetime .dash-date {
          font-size: 0.78rem;
          opacity: 0.8;
          margin-top: 2px;
        }
        .dash-welcome .dash-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          padding: 4px 14px;
          border-radius: 20px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(6px);
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          position: relative;
          z-index: 1;
          animation: dashFloatBadge 3s ease infinite;
        }

        @media (max-width: 768px) {
          .dash-welcome { padding: 24px 20px; }
          .dash-welcome h1 { font-size: 1.35rem; }
          .dash-welcome .dash-datetime {
            position: static;
            transform: none;
            text-align: left;
            margin-top: 12px;
          }
          .dash-welcome .dash-datetime .dash-time { font-size: 1.5rem; }
        }

        /* ── KPI Cards ── */
        .dash-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 1024px) { .dash-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px)  { .dash-kpi-grid { grid-template-columns: 1fr; } }

        .dash-kpi-card {
          border-radius: 12px;
          padding: 22px 20px;
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
          transform: translateY(-6px) scale(1.03);
          border-color: var(--dash-card-accent, var(--color-border-primary));
          box-shadow: 0 12px 32px var(--dash-card-glow, rgba(0,0,0,0.08));
        }
        .dark .dash-kpi-card:hover {
          box-shadow: 0 12px 32px var(--dash-card-glow-dark, rgba(0,0,0,0.5));
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
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .dash-kpi-card .dash-kpi-title {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--color-text-tertiary);
          margin-bottom: 8px;
        }
        .dash-kpi-card .dash-kpi-value {
          font-size: 1.55rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          color: var(--color-text-primary);
          margin-bottom: 6px;
          transition: color 0.3s ease;
        }
        .dash-kpi-card .dash-kpi-sub {
          font-size: 0.68rem;
          color: var(--color-text-tertiary);
          opacity: 0.85;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .dash-kpi-card .dash-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation: dashPulse 1.5s infinite;
          display: inline-block;
          margin-right: 4px;
          vertical-align: middle;
        }

        /* ── Section Container ── */
        .dash-section {
          border-radius: 10px;
          padding: 24px;
          border: 1px solid var(--color-border-primary);
          background: var(--color-surface-card);
          opacity: 0;
          animation: dashFadeInUp 0.6s ease forwards;
        }
        .dash-section-title {
          font-size: 1rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          color: var(--color-text-primary);
          margin: 0 0 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dash-section-title .dash-title-icon {
          font-size: 1.1rem;
        }

        /* ── Financial Overview ── */
        .dash-fin-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        @media (max-width: 640px) { .dash-fin-grid { grid-template-columns: 1fr; } }
        .dash-fin-item {
          padding: 16px;
          border-radius: 8px;
          background: var(--color-surface-tertiary);
          border: 1px solid var(--color-border-primary);
        }
        .dash-fin-item .dash-fin-label {
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-text-tertiary);
          margin-bottom: 4px;
        }
        .dash-fin-item .dash-fin-value {
          font-size: 1.15rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          color: var(--color-text-primary);
        }
        .dash-fin-item .dash-fin-bar {
          height: 4px;
          border-radius: 4px;
          margin-top: 10px;
          overflow: hidden;
          background: var(--color-surface-hover);
        }
        .dash-fin-item .dash-fin-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 1.2s ease;
        }

        /* ── Chart ── */
        .dash-chart-container {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          height: 180px;
          padding-top: 8px;
        }
        .dash-chart-bar-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          gap: 8px;
        }
        .dash-chart-bar {
          width: 100%;
          max-width: 52px;
          border-radius: 6px 6px 3px 3px;
          background: linear-gradient(180deg, #059669, #10b981);
          animation: dashBarGrow 1s ease forwards;
          position: relative;
          cursor: default;
          transition: filter 0.2s ease;
          min-height: 4px;
        }
        .dash-chart-bar:hover { filter: brightness(1.15); }
        .dash-chart-bar .dash-chart-tooltip {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          padding: 4px 10px;
          border-radius: 6px;
          background: var(--color-surface-primary);
          border: 1px solid var(--color-border-primary);
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--color-text-primary);
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          z-index: 10;
        }
        .dash-chart-bar:hover .dash-chart-tooltip { opacity: 1; }
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
          padding: 8px 12px;
          border-bottom: 1px solid var(--color-border-primary);
        }
        .dash-table td {
          font-size: 0.78rem;
          padding: 10px 12px;
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
          font-size: 1.1rem;
          margin-right: 6px;
          vertical-align: middle;
        }

        /* ── Expiring Batches ── */
        .dash-expiry-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 8px;
          background: var(--color-surface-tertiary);
          border: 1px solid var(--color-border-primary);
          margin-bottom: 10px;
          opacity: 0;
          animation: dashFadeInUp 0.4s ease forwards;
        }
        .dash-expiry-days {
          min-width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .dash-expiry-days span {
          font-size: 0.55rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ── Recent Sales ── */
        .dash-sale-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 8px;
          background: var(--color-surface-tertiary);
          border: 1px solid var(--color-border-primary);
          margin-bottom: 10px;
          opacity: 0;
          animation: dashSlideInLeft 0.4s ease forwards;
        }
        .dash-sale-inv {
          font-size: 0.8rem;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
          color: var(--color-text-primary);
        }
        .dash-sale-date {
          font-size: 0.65rem;
          color: var(--color-text-tertiary);
          margin-top: 2px;
        }
        .dash-sale-amount {
          font-size: 0.85rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          color: var(--color-text-primary);
          text-align: right;
        }
        .dash-status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-top: 3px;
        }

        /* ── Quick Actions ── */
        .dash-actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 768px) { .dash-actions-grid { grid-template-columns: repeat(2, 1fr); } }
        .dash-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px 12px;
          border-radius: 10px;
          border: 1px solid var(--color-border-primary);
          background: var(--color-surface-tertiary);
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-primary);
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          opacity: 0;
          animation: dashFadeInUp 0.5s ease forwards;
        }
        .dash-action-btn:hover {
          transform: translateY(-3px);
          background: var(--color-surface-hover);
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }
        .dark .dash-action-btn:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.4); }
        .dash-action-btn .dash-action-icon {
          font-size: 1.6rem;
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
          text-align: center;
          padding: 24px;
          color: var(--color-text-tertiary);
          font-size: 0.78rem;
          opacity: 0.7;
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
          {/* Financial Overview */}
          <div className="dash-section" style={{ animationDelay: '0.55s' }}>
            <div className="dash-section-title">
              <span className="dash-title-icon">📊</span>
              Financial Overview
            </div>
            {loading ? (
              <div className="dash-fin-grid">
                {[1,2,3,4].map(k => <Skeleton key={k} h="80px" r="8px" />)}
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
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>Cost Value</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-primary)' }}>
                      {formatCurrency(inventoryVal.cost_value)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>Retail Value</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#059669' }}>
                      {formatCurrency(inventoryVal.retail_value)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>Margin</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#2563eb' }}>
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
              <div className="dash-chart-container">
                {monthlyTrend.map((m, i) => {
                  const pct = maxMonthly > 0 ? (m.sales / maxMonthly) * 100 : 0;
                  return (
                    <div key={m.label} className="dash-chart-bar-wrap">
                      <div
                        className="dash-chart-bar"
                        style={{
                          height: `${Math.max(pct, 3)}%`,
                          animationDelay: `${0.2 + i * 0.12}s`,
                          background: i === monthlyTrend.length - 1
                            ? 'linear-gradient(180deg, #2563eb, #60a5fa)'
                            : 'linear-gradient(180deg, #059669, #10b981)',
                        }}
                      >
                        <div className="dash-chart-tooltip">{formatCurrency(m.sales)}</div>
                      </div>
                      <div className="dash-chart-label">{m.label.split(' ')[0]}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dash-empty-state">No sales data available yet</div>
            )}
          </div>
        </div>

        {/* ═══════ 5 & 6. TOP MEDICINES + EXPIRING BATCHES ═══════ */}
        <div className="dash-double-grid">
          {/* Top Selling Medicines */}
          <div className="dash-section" style={{ animationDelay: '0.75s' }}>
            <div className="dash-section-title">
              <span className="dash-title-icon">🏆</span>
              Top Selling Medicines
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1,2,3].map(k => <Skeleton key={k} h="36px" r="6px" />)}
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
                {[1,2,3].map(k => <Skeleton key={k} h="56px" r="8px" />)}
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
                {[1,2,3].map(k => <Skeleton key={k} h="56px" r="8px" />)}
              </div>
            ) : recentSales.length > 0 ? (
              recentSales.map((sale, i) => {
                const sc = paymentStatusColor(sale.payment_status);
                return (
                  <div key={sale.id || i} className="dash-sale-item" style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
                    <div>
                      <div className="dash-sale-inv">{sale.invoice_no}</div>
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
                  style={{ animationDelay: `${0.2 + i * 0.07}s` }}
                  onClick={() => navigate(action.path)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(action.path)}
                >
                  <span className="dash-action-icon">{action.icon}</span>
                  {action.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ 9. SYSTEM HEALTH FOOTER ═══════ */}
        <div className="dash-health-bar" style={{ animationDelay: '1.15s' }}>
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
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div className="dash-health-item">
              <span className="dash-health-label">Pharmacy:</span> {pharmacy?.name}
            </div>
            <div className="dash-health-item">
              <span className="dash-health-label">Slug:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--color-text-brand)' }}>/{pharmacy?.slug}</span>
            </div>
            <div className="dash-health-item">
              <span className="dash-health-label">Trial Ends:</span>
              {pharmacy?.trial_ends_at ? new Date(pharmacy.trial_ends_at).toLocaleDateString() : 'N/A'}
            </div>
            <div className="dash-health-item">
              <span className="dash-health-label">Role:</span>
              <span style={{ color: 'var(--color-text-brand)', textTransform: 'capitalize' }}>{user?.roles?.[0] || 'Member'}</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Dashboard;
