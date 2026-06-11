import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAllowedSidebarPaths, getUserSoftwareRole } from '../../services/userService';

const DashboardLayout = ({ children }) => {
  const { user, pharmacy, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const allNavigation = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Pharmacies', path: '/admin/pharmacies', icon: '🏥' },
    { name: 'POS / Billing', path: '/sales/pos', icon: '🛒' },
    { name: 'Sales History', path: '/sales', icon: '🧾' },
    { name: 'Medicines', path: '/inventory/medicines', icon: '💊' },
    { name: 'Stock Batches', path: '/inventory/batches', icon: '📦' },
    { name: 'Categories', path: '/inventory/categories', icon: '🏷️' },
    { name: 'Companies', path: '/inventory/companies', icon: '🏭' },
    { name: 'Units', path: '/inventory/units', icon: '📏' },
    { name: 'Purchases', path: '/purchases', icon: '📝' },
    { name: 'Suppliers', path: '/partners/suppliers', icon: '🚚' },
    { name: 'Customers', path: '/partners/customers', icon: '👥' },
    { name: 'Expenses', path: '/financials/expenses', icon: '💸' },
    { name: 'Supplier Ledger', path: '/financials/supplier-ledger', icon: '📒' },
    { name: 'Customer Ledger', path: '/financials/customer-ledger', icon: '📗' },
    { name: 'Customer Returns', path: '/returns/customer', icon: '🔄' },
    { name: 'Supplier Returns', path: '/returns/supplier', icon: '↩️' },
    { name: 'Branches', path: '/settings/branches', icon: '🏢' },
    { name: 'Users & Roles', path: '/settings/users', icon: '🔑' },
  ];

  // Filter sidebar items based on user's software role permissions
  const navigation = useMemo(() => {
    const softwareRole = getUserSoftwareRole(user);
    const allowedPaths = getAllowedSidebarPaths(softwareRole);

    // Super Admin and unknown roles should still see the full navigation.
    if (allowedPaths === null) return allNavigation;

    return allNavigation.filter((item) => allowedPaths.includes(item.path));
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: 'var(--color-surface-primary)', color: 'var(--color-text-primary)' }}>
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}
        style={{ backgroundColor: 'var(--color-surface-sidebar)', borderColor: 'var(--color-border-primary)' }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-5 border-b" style={{ borderColor: 'var(--color-border-primary)' }}>
          <span className="text-2xl flex-shrink-0">⚡</span>
          {sidebarOpen && (
            <span className="font-display text-lg font-bold bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent truncate">
              PrimePharm
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto space-y-0.5 px-3 py-4">
          {navigation.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                title={item.name}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? 'text-brand-600 dark:text-brand-400'
                    : ''
                }`}
                style={{
                  backgroundColor: active ? 'var(--color-surface-active)' : 'transparent',
                  color: active ? 'var(--color-text-brand)' : 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info Bottom */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--color-border-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{user?.name}</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>{getUserSoftwareRole(user)}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header
          className="flex h-16 items-center justify-between border-b px-6"
          style={{ backgroundColor: 'var(--color-surface-primary)', borderColor: 'var(--color-border-primary)' }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-lg"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ☰
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
                {user?.pharmacy_id === null ? 'System' : 'Pharmacy'}
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {user?.pharmacy_id === null ? 'Global Admin Panel' : (pharmacy?.name || 'Loading...')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-lg transition-all hover:scale-110"
              style={{ color: 'var(--color-text-secondary)' }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Status Badge */}
            <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: 'var(--color-surface-active)', color: 'var(--color-text-brand)', border: '1px solid var(--color-border-primary)' }}
            >
              {pharmacy?.status || 'Trial'}
            </span>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="rounded-xl px-4 py-2 text-xs font-semibold transition-all"
              style={{ backgroundColor: 'var(--color-surface-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)'}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
