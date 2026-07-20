import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import heroVisual from '../../assets/pharmacy_erp_hero.png';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
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
    <div className="h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] font-sans antialiased text-slate-900 overflow-hidden selection:bg-blue-500 selection:text-white">

      {/* ========================================================================= */}
      {/* LEFT COLUMN — IMAGE / VISUAL SHOWCASE (60%) */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:w-[60%] xl:w-[58%] h-screen relative bg-[#090D16] overflow-hidden items-center justify-center p-8 xl:p-12">

        {/* Dynamic Glowing Ambient Blur Blobs */}
        <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-[#2563EB]/25 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#06B6D4]/25 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2.5s' }} />
        <div className="absolute top-10 right-10 w-72 h-72 bg-[#10B981]/15 rounded-full blur-[90px] pointer-events-none" />

        {/* Geometric Grid Mesh Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none" />

        {/* Soft Animated Particles Layer */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-12 left-24 w-2 h-2 rounded-full bg-cyan-400 animate-float-slow" />
          <div className="absolute top-1/3 right-32 w-2.5 h-2.5 rounded-full bg-blue-400 animate-float-reverse" />
          <div className="absolute bottom-32 left-36 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-float-slow" />
          <div className="absolute bottom-20 right-48 w-2 h-2 rounded-full bg-blue-300 animate-float-delayed" />
        </div>

        {/* Center Canvas Container */}
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">

          {/* Main 3D Healthcare ERP Hero Illustration — FULLY VISIBLE */}
          <div className="relative w-full max-w-2xl group transition-all duration-500">
            {/* Glowing Border Backdrop */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#2563EB] via-[#06B6D4] to-[#10B981] opacity-30 blur-xl group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />

            <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] bg-slate-900/80 backdrop-blur-2xl">
              <img
                src={heroVisual}
                alt="Prime Pharmacy ERP Dashboard Showcase"
                className="w-full h-auto max-h-[50vh] object-contain object-center transform group-hover:scale-[1.02] transition-transform duration-700 ease-out p-2"
              />

              {/* Glassmorphism Title Overlay Banner */}
              <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent backdrop-blur-xs flex items-center justify-between border-t border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
                    <span className="text-xs font-semibold text-cyan-300 tracking-wider uppercase">Live Operations Intelligence</span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Smart Pharmaceutical Enterprise Suite
                  </h3>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-xs text-white font-medium">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>v2.4 Enterprise</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6 FLOATING GLASS METRIC CARDS */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 xl:gap-3.5 mt-6 relative z-20">

            {/* Card 1: 250+ Pharmacies */}
            <div className="glass-card-premium p-3.5 rounded-2xl animate-float-slow hover:border-cyan-400/50 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-[#10B981] shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white tracking-tight">250+ Pharmacies</div>
                  <p className="text-[10px] text-slate-300 font-medium">Active Network</p>
                </div>
              </div>
            </div>

            {/* Card 2: 99.9% Uptime */}
            <div className="glass-card-premium p-3.5 rounded-2xl animate-float-reverse hover:border-cyan-400/50 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-[#10B981] shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white tracking-tight">99.9% Uptime</div>
                  <p className="text-[10px] text-slate-300 font-medium">SLA Availability</p>
                </div>
              </div>
            </div>

            {/* Card 3: Secure Cloud Storage */}
            <div className="glass-card-premium p-3.5 rounded-2xl animate-float-delayed hover:border-cyan-400/50 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-[#10B981] shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white tracking-tight">Secure Cloud</div>
                  <p className="text-[10px] text-slate-300 font-medium">HIPAA Encrypted</p>
                </div>
              </div>
            </div>

            {/* Card 4: Real-Time Inventory */}
            <div className="glass-card-premium p-3.5 rounded-2xl animate-float-delayed hover:border-cyan-400/50 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-[#10B981] shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white tracking-tight">Real-Time Inventory</div>
                  <p className="text-[10px] text-slate-300 font-medium">Multi-Branch Sync</p>
                </div>
              </div>
            </div>

            {/* Card 5: Smart Billing */}
            <div className="glass-card-premium p-3.5 rounded-2xl animate-float-slow hover:border-cyan-400/50 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-400/30 text-[#10B981] shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white tracking-tight">Smart Billing</div>
                  <p className="text-[10px] text-slate-300 font-medium">Automated POS</p>
                </div>
              </div>
            </div>

            {/* Card 6: Batch & Expiry Tracking */}
            <div className="glass-card-premium p-3.5 rounded-2xl animate-float-reverse hover:border-cyan-400/50 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400/30 text-[#10B981] shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white tracking-tight">Batch & Expiry</div>
                  <p className="text-[10px] text-slate-300 font-medium">Predictive Alerts</p>
                </div>
              </div>
            </div>

          </div>

          {/* Healthcare Compliance Trust Badges */}
          <div className="mt-5 flex items-center justify-center gap-8 text-xs text-slate-400 font-medium border-t border-white/10 pt-5 w-full">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>FDA & Pharmacy Board Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Zero Downtime Architecture</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Instant Data Replication</span>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN — LOGIN FORM (40%) */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[40%] xl:w-[42%] h-screen flex flex-col justify-between p-5 sm:p-8 lg:p-10 xl:p-12 bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#EEF6FF] relative z-10 border-l border-slate-200/60 shadow-xl lg:shadow-2xl overflow-hidden">

        {/* Subtle Decorative Ambient Background Blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none -translate-x-1/3 translate-y-1/3" />

        {/* Top Header / Brand Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5 group cursor-pointer">
            <div className="relative p-2 bg-white rounded-xl border border-slate-200/80 shadow-md shadow-blue-500/5 transition-transform duration-300 group-hover:scale-105">
              <img src={logo} alt="Prime Pharmacy Logo" className="h-8 w-8 object-contain rounded-lg" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#10B981] rounded-full border-2 border-white shadow-xs animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-[#2563EB] to-[#06B6D4] bg-clip-text text-transparent">
                  Prime Pharmacy
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-[#2563EB] border border-blue-200/60 rounded-full">
                  ERP SaaS
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 tracking-wide uppercase mt-0.5">
                Next-Gen Healthcare Management
              </p>
            </div>
          </div>
        </div>

        {/* Main Content & Login Form */}
        <div className="my-auto py-2 relative z-10 max-w-md w-full mx-auto">
          {/* Welcome Text */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] text-xs font-semibold mb-3">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Enterprise Portal Login
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Welcome Back
            </h1>
            <p className="text-slate-600 text-sm mt-2 leading-relaxed">
              Manage your pharmacy smarter with <span className="font-semibold text-slate-800">Prime Pharmacy ERP</span>.
            </p>
          </div>

          {/* Form Error Alert */}
          {error && (
            <div className="mb-3 p-3 rounded-2xl bg-red-50/90 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-3 shadow-xs">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Work Email or Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2563EB] transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="pharmacist@primepharmacy.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2563EB] transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-[#2563EB] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md text-[#2563EB] border-slate-300 focus:ring-blue-500/30 accent-[#2563EB] transition-all cursor-pointer"
                />
                <span className="text-slate-600 group-hover:text-slate-900 font-medium">
                  Remember this session
                </span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => { e.preventDefault(); alert('Please contact your administrator to reset credentials.'); }}
                className="font-semibold text-[#2563EB] hover:text-[#06B6D4] transition-colors focus:outline-none"
              >
                Forgot password?
              </a>
            </div>

            {/* Large Gradient Login Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#06B6D4] hover:from-[#1D4ED8] hover:to-[#0891B2] text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating ERP Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>

            {/* Secure Login Badge */}
            <div className="flex items-center justify-center gap-2 py-2 px-4 bg-white/70 border border-slate-200/70 rounded-xl text-xs font-semibold text-slate-600 shadow-2xs">
              <svg className="w-4 h-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secure Login with Shield Authentication</span>
            </div>
          </form>
        </div>

        {/* Security & Footer — pinned to bottom */}
        <div className="relative z-10 mt-auto space-y-3">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <svg className="w-3.5 h-3.5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Protected with enterprise-grade security.</span>
            </div>
            <p className="text-[11px] text-slate-400">
              256-Bit SSL Encryption • HIPAA Compliant Storage • ISO 27001 Certified
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-1 border-t border-slate-200/40">
            <span>© 2026 Prime Pharmacy ERP</span>
            <span className="font-semibold text-slate-600">Built for Modern Pharmacies</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
