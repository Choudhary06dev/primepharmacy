import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import loginBg from '../../assets/login_bg.png';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 font-sans">
      {/* Left Column: Visual Showcase (Hidden on Mobile) */}
      <div
        className="hidden lg:flex lg:w-3/5 relative bg-cover bg-center items-center justify-center p-12 overflow-hidden"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        {/* Dark Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/80 to-slate-950/40 backdrop-blur-[1px]" />

        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        {/* Content Container */}
        <div className="relative z-10 max-w-xl space-y-8 text-white">
          {/* Logo & Header */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
              <img src={logo} alt="PrimePharm Logo" className="h-10 w-10 object-contain rounded-lg" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-wider uppercase text-brand-400">Next-Gen Platform</span>
              <h1 className="text-xl font-bold font-display leading-none">PrimePharm ERP</h1>
            </div>
          </div>

          {/* Slogan */}
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-[1.1] text-white">
              Empowering Pharmacies,<br />
              <span className="bg-gradient-to-r from-brand-400 to-teal-400 bg-clip-text text-transparent">Elevating Care.</span>
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              A unified intelligent enterprise system tailored for pharmaceutical retailers. Manage multi-branch inventory, real-time sales ledger tracking, automated expiry controls, and detailed performance metrics.
            </p>
          </div>

          {/* Floating Feature Badges */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors duration-300">
              <div className="text-lg mb-1">🏢</div>
              <h4 className="font-semibold text-xs text-white">Multi-Branch Sync</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Consolidated view across all branches instantly.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors duration-300">
              <div className="text-lg mb-1">⚡</div>
              <h4 className="font-semibold text-xs text-white">Real-Time POS</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Ultra-fast checkout with batch & stock matching.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors duration-300">
              <div className="text-lg mb-1">📅</div>
              <h4 className="font-semibold text-xs text-white">Expiry Tracking</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Smart warnings for batch depletion & expiry dates.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors duration-300">
              <div className="text-lg mb-1">📊</div>
              <h4 className="font-semibold text-xs text-white">Consolidated Ledgers</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Detailed financials, reports, and billing data.</p>
            </div>
          </div>
        </div>

        {/* Bottom copyright overlay */}
        <div className="absolute bottom-6 left-12 right-12 flex justify-between items-center text-[10px] text-slate-500 z-10">
          <span>© 2026 PrimePharm ERP. All rights reserved.</span>
          <span>Version 2.4.0</span>
        </div>
      </div>

      {/* Right Column: Login Card Container */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center items-center p-8 lg:p-16 relative bg-white dark:bg-zinc-950 border-l border-slate-100 dark:border-zinc-900">

        {/* Subtle blur background element for mobile view */}
        <div
          className="lg:hidden absolute inset-0 bg-cover bg-center filter blur-md opacity-20"
          style={{ backgroundImage: `url(${loginBg})` }}
        />
        <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-white via-white/95 to-slate-50 dark:from-zinc-950 dark:via-zinc-950/95 dark:to-zinc-900 z-0" />

        <div className="w-full max-w-sm space-y-8 relative z-10">
          {/* Top Brand Banner for Mobile View */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-3">
            <div className="lg:hidden p-2 bg-brand-500/10 rounded-2xl inline-block">
              <img src={logo} alt="PrimePharm Logo" className="h-12 w-12 object-contain rounded-xl" />
            </div>
            <h2 className="text-3xl font-extrabold font-display tracking-tight bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-400 dark:to-brand-300 bg-clip-text text-transparent">
              Access Dashboard
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 text-xs">
              Welcome back! Please enter your administrator credentials to sign in.
            </p>
          </div>

          {/* Form Error Alert */}
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-650 dark:text-red-405 flex items-center gap-3">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">👤</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 pl-10 pr-4 py-3.5 text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-300"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 pl-10 pr-12 py-3.5 text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-zinc-200 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all duration-300 disabled:opacity-50 select-none cursor-pointer"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Footer note inside the card */}
          <div className="text-center text-[10px] text-slate-400 dark:text-zinc-600 pt-6">
            <span>Powered by PrimePharm Cloud Solutions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
