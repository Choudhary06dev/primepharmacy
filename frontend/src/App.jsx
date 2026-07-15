import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BranchFilterProvider } from './context/BranchFilterContext';
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
import Suppliers from './features/inventory/pages/Suppliers';
import Customers from './features/inventory/pages/Customers';
import Purchases from './features/inventory/pages/Purchases';
import Expenses from './features/financials/pages/Expenses';
import Ledgers from './features/financials/pages/Ledgers';
import Returns from './features/returns/pages/Returns';
import Reports from './features/financials/pages/Reports';
import Branches from './features/settings/pages/Branches';

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
                <BranchFilterProvider>
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/admin/pharmacies" element={<Pharmacies />} />
                    <Route path="/inventory/categories" element={<Categories />} />
                    <Route path="/inventory/companies" element={<Companies />} />
                    <Route path="/inventory/units" element={<Units />} />
                    <Route path="/settings/users" element={<Users />} />
                    <Route path="/settings/branches" element={<Branches />} />
                    {/* Placeholder routes for modules */}
                    <Route path="/inventory/medicines" element={<Medicines />} />
                    <Route path="/inventory/batches" element={<Batches />} />
                    <Route path="/sales/pos" element={<Pos />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/purchases" element={<Purchases />} />
                    <Route path="/partners/suppliers" element={<Suppliers />} />
                    <Route path="/partners/customers" element={<Customers />} />
                    <Route path="/financials/expenses" element={<Expenses />} />
                    <Route path="/financials/supplier-ledger" element={<Ledgers />} />
                    <Route path="/financials/customer-ledger" element={<Ledgers />} />
                    <Route path="/financials/reports" element={<Reports />} />
                    <Route path="/returns/customer" element={<Returns />} />
                    <Route path="/returns/supplier" element={<Returns />} />
                  </Routes>
                </DashboardLayout>
                </BranchFilterProvider>
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
