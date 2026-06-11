import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/Layout/DashboardLayout';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Dashboard from './features/dashboard/Dashboard';
import Pharmacies from './features/admin/pages/Pharmacies';
import Categories from './features/inventory/pages/Categories';
import Companies from './features/inventory/pages/Companies';
import Units from './features/inventory/pages/Units';
import Users from './features/settings/pages/Users';
import Medicines from './features/inventory/pages/Medicines';
import Batches from './features/inventory/pages/Batches';
import Pos from './features/sales/pages/Pos';
import Sales from './features/sales/pages/Sales';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/admin/pharmacies" element={<Pharmacies />} />
                    <Route path="/inventory/categories" element={<Categories />} />
                    <Route path="/inventory/companies" element={<Companies />} />
                    <Route path="/inventory/units" element={<Units />} />
                    <Route path="/settings/users" element={<Users />} />
                    {/* Placeholder routes for modules */}
                    <Route path="/inventory/medicines" element={<Medicines />} />
                    <Route path="/inventory/batches" element={<Batches />} />
                    <Route path="/sales/pos" element={<Pos />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/purchases" element={<div className="rounded-2xl border border-slate-900 bg-slate-990/40 p-6 backdrop-blur-md text-slate-300">Purchase Orders Module</div>} />
                    <Route path="/partners" element={<div className="rounded-2xl border border-slate-900 bg-slate-990/40 p-6 backdrop-blur-md text-slate-300">Suppliers & Customers Ledgers Module</div>} />
                    <Route path="/financials" element={<div className="rounded-2xl border border-slate-900 bg-slate-990/40 p-6 backdrop-blur-md text-slate-300">Financial Ledger & Expenses</div>} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
