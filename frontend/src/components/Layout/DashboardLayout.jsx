import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAllowedSidebarPaths, getUserSoftwareRole } from '../../services/userService';
import logo from '../../assets/logo.png';

const DashboardLayout = ({ children }) => {
  const { user, pharmacy, logout, isLoggingOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openDropdowns, setOpenDropdowns] = useState({});

  // Filter sidebar items based on user's software role permissions
  const navigation = useMemo(() => {
    const softwareRole = getUserSoftwareRole(user);
    const allowedPaths = getAllowedSidebarPaths(softwareRole);

    const allNavigation = [
      { name: 'Dashboard', path: '/', icon: '📊' },
      { name: 'Pharmacies', path: '/admin/pharmacies', icon: '🏥' },
      {
        name: 'Sales',
        icon: '🛒',
        isDropdown: true,
        children: [
          { name: 'POS / Billing', path: '/sales/pos', icon: '💳' },
          { name: 'Sales History', path: '/sales', icon: '🧾' },
          { name: 'Customers', path: '/partners/customers', icon: '👥' },
        ]
      },
      {
        name: 'Inventory',
        icon: '💊',
        isDropdown: true,
        children: [
          { name: 'Medicines', path: '/inventory/medicines', icon: '🧪' },
          { name: 'Stock Batches', path: '/inventory/batches', icon: '📦' },
          { name: 'Categories', path: '/inventory/categories', icon: '🏷️' },
          { name: 'Companies', path: '/inventory/companies', icon: '🏭' },
          { name: 'Units', path: '/inventory/units', icon: '📏' },
        ]
      },
      {
        name: 'Purchases',
        icon: '📝',
        isDropdown: true,
        children: [
          { name: 'Purchases', path: '/purchases', icon: '📋' },
          { name: 'Suppliers', path: '/partners/suppliers', icon: '🚚' },
        ]
      },
      {
        name: 'Returns',
        icon: '🔄',
        isDropdown: true,
        children: [
          { name: 'Customer Returns', path: '/returns/customer', icon: '↩️' },
          { name: 'Supplier Returns', path: '/returns/supplier', icon: '↩️' },
        ]
      },
      {
        name: 'Financials',
        icon: '💸',
        isDropdown: true,
        children: [
          { name: 'Expenses', path: '/financials/expenses', icon: '💵' },
          { name: 'Customer Accounts', path: '/financials/customer-ledger', icon: '📗' },
          { name: 'Supplier Accounts', path: '/financials/supplier-ledger', icon: '📘' },
          { name: 'Analytics & Reports', path: '/financials/reports', icon: '📈' },
        ]
      },
      {
        name: 'Settings',
        icon: '⚙️',
        isDropdown: true,
        children: [
          { name: 'Branches', path: '/settings/branches', icon: '🏢' },
          { name: 'Users & Roles', path: '/settings/users', icon: '🔑' },
        ]
      },
    ];

    // Super Admin and unknown roles should still see the full navigation.
    if (allowedPaths === null) return allNavigation;

    // Filter normal items and dropdowns (only keep dropdown if at least one child is allowed)
    return allNavigation.reduce((acc, item) => {
      if (item.isDropdown) {
        const allowedChildren = item.children.filter(child => allowedPaths.includes(child.path));
        if (allowedChildren.length > 0) {
          acc.push({ ...item, children: allowedChildren });
        }
      } else {
        if (allowedPaths.includes(item.path)) {
          acc.push(item);
        }
      }
      return acc;
    }, []);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const hasActiveChild = (dropdownItem) => {
    return dropdownItem.children?.some(child => isActive(child.path));
  };

  const isDropdownOpen = (item) => {
    if (openDropdowns[item.name] !== undefined) {
      return openDropdowns[item.name];
    }
    return hasActiveChild(item);
  };

  const toggleDropdown = (name) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleDropdownClick = (name) => {
    if (!sidebarOpen) {
      setSidebarOpen(true);
      setOpenDropdowns(prev => ({ ...prev, [name]: true }));
    } else {
      toggleDropdown(name);
    }
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
          <img src={logo} alt="PrimePharm Logo" className="h-8 w-8 object-contain flex-shrink-0 rounded-lg" />
          {sidebarOpen && (
            <span className="font-display text-lg font-bold bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent truncate">
              PrimePharm
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto space-y-0.5 px-3 py-4">
          {navigation.map((item) => {
            if (item.isDropdown) {
              const isOpen = isDropdownOpen(item);
              const active = hasActiveChild(item);

              return (
                <div key={item.name} className="flex flex-col">
                  <button
                    onClick={() => handleDropdownClick(item.name)}
                    title={item.name}
                    className={`flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                      active ? 'text-brand-600 dark:text-brand-400' : ''
                    }`}
                    style={{
                      backgroundColor: active ? 'var(--color-surface-active)' : 'transparent',
                      color: active ? 'var(--color-text-brand)' : 'var(--color-text-secondary)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      {sidebarOpen && <span className="truncate">{item.name}</span>}
                    </div>
                    {sidebarOpen && (
                      <span className="text-[9px] opacity-70 transition-transform duration-200 mr-1" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        ▼
                      </span>
                    )}
                  </button>

                  {isOpen && sidebarOpen && (
                    <div className="ml-4 mt-0.5 pl-2.5 border-l border-slate-200 dark:border-slate-800 space-y-0.5">
                      {item.children.map((child) => {
                        const childActive = isActive(child.path);
                        return (
                          <Link
                            key={child.name}
                            to={child.path}
                            title={child.name}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] font-medium transition-all duration-200 ${
                              childActive ? 'text-brand-600 dark:text-brand-400' : ''
                            }`}
                            style={{
                              backgroundColor: childActive ? 'var(--color-surface-active)' : 'transparent',
                              color: childActive ? 'var(--color-text-brand)' : 'var(--color-text-secondary)',
                            }}
                            onMouseEnter={(e) => { if (!childActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
                            onMouseLeave={(e) => { if (!childActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <span className="text-sm flex-shrink-0">{child.icon}</span>
                            <span className="truncate">{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

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
              disabled={isLoggingOut}
              className="rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
              style={{
                backgroundColor: isLoggingOut 
                  ? 'rgba(239, 68, 68, 0.15)' 
                  : 'var(--color-surface-secondary)',
                color: isLoggingOut
                  ? '#ef4444' 
                  : 'var(--color-text-secondary)',
                border: isLoggingOut
                  ? '1px solid rgba(239, 68, 68, 0.4)'
                  : '1px solid var(--color-border-primary)',
                cursor: isLoggingOut ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!isLoggingOut) {
                  e.currentTarget.style.backgroundColor = '#10b981';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = '#10b981';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoggingOut) {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--color-border-primary)';
                }
              }}
            >
              {isLoggingOut ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></span>
                  Logging out...
                </span>
              ) : 'Logout'}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
          <div key={location.pathname} className="page-animate">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
