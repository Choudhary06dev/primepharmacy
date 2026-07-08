import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token, loading, isLoggingOut } = useAuth();

  if (loading || isLoggingOut) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-display">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-sm font-medium tracking-wide animate-pulse text-emerald-400">
            {isLoggingOut ? 'Logging out of PrimePharm ERP...' : 'Loading PrimePharm ERP...'}
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
