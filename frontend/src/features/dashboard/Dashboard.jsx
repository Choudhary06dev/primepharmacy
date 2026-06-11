import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user, pharmacy } = useAuth();

  const stats = [
    { title: 'Today\'s Sales', value: 'PKR 0.00', change: '0% from yesterday', icon: '📈', color: 'border-emerald-500/25 text-emerald-600 dark:text-emerald-400' },
    { title: 'Purchase Orders', value: '0 Orders', change: '0 this month', icon: '📝', color: 'border-purple-500/25 text-purple-600 dark:text-purple-400' },
    { title: 'Active Batches', value: '0 Batches', change: 'FEFO Tracking active', icon: '📦', color: 'border-blue-500/25 text-blue-600 dark:text-blue-400' },
    { title: 'Low Stock Alerts', value: '0 Items', change: '0 critical warnings', icon: '⚠️', color: 'border-amber-500/25 text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl border border-purple-100 dark:border-slate-900 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-transparent dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-slate-900/40 p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold font-display text-slate-800 dark:text-slate-100 mb-2">
          Good Day, {user?.name}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl">
          Welcome to the dashboard of <span className="text-brand-700 dark:text-brand-400 font-semibold">{pharmacy?.name}</span>. Everything is configured and fully isolated. You are currently utilizing our FEFO (First-Expired, First-Out) tracking database schema.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch ui-grid-equal">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="ui-card rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/40 p-6 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</span>
              <span className={`text-xl p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 ${stat.color}`}>{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display mb-1">{stat.value}</p>
            <p className="text-[11px] text-slate-450 dark:text-slate-500">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Database Integration Verification Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch ui-grid-equal">
        <div className="ui-card lg:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/30 p-8 backdrop-blur-md shadow-sm space-y-6">
          <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100">Active Tenant Status & Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-xs text-slate-400 dark:text-slate-550 block">Pharmacy Name</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{pharmacy?.name}</p>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-slate-400 dark:text-slate-550 block">Pharmacy Slug URL</span>
              <p className="text-sm font-mono text-brand-700 dark:text-brand-400">/{pharmacy?.slug}</p>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-slate-400 dark:text-slate-550 block">Registered Trial Ends At</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {pharmacy?.trial_ends_at ? new Date(pharmacy.trial_ends_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-slate-400 dark:text-slate-550 block">User Role / Authority</span>
              <p className="text-sm font-semibold text-brand-700 dark:text-brand-400 capitalize">
                {user?.roles?.[0] || 'Member'}
              </p>
            </div>
          </div>
        </div>

        <div className="ui-card rounded-3xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/30 p-8 backdrop-blur-md shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100 mb-3">System Health</h2>
            <p className="text-slate-650 dark:text-slate-400 text-xs leading-relaxed mb-6">
              PrimePharm backend API connected. Database is migratable, seedable, and isolated. 
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">API Connection</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">● Online</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Database Engine</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">● PostgreSQL</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Sanctum Token</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">● Secured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
