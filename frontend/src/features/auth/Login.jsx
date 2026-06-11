import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-6 font-sans">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/40 p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <span className="text-4xl mb-3">⚡</span>
          <h2 className="text-3xl font-bold font-display bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in to manage your pharmacy operations</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-600 dark:text-red-400">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-3.5 text-sm text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all duration-200"
              placeholder="e.g. owner@pharmacy.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-3.5 text-sm text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition-all duration-200 disabled:opacity-50"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          New to PrimePharm?{' '}
          <Link to="/register" className="font-bold text-brand-650 dark:text-brand-400 hover:underline">
            Register your Pharmacy
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
