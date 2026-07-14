import api from './api';

const STORAGE_USERS_KEY = 'primepharm_mock_users';
const STORAGE_ROLES_KEY = 'primepharm_mock_roles';

const isMockMode = () => localStorage.getItem('primepharm_auth_mode') === 'mock';

const getInitialUsers = () => {
  if (!isMockMode()) {
    return [];
  }
  const stored = localStorage.getItem(STORAGE_USERS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing mock users', e);
    }
  }
  const initial = [];
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(initial));
  return initial;
};

const getInitialRoles = () => {
  if (!isMockMode()) {
    return [];
  }
  const stored = localStorage.getItem(STORAGE_ROLES_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0) {
        // Upgrade check: Ensure Admin and Manager roles have required permissions
        let updated = false;
        const adminRole = parsed.find((r) => r.name === 'Admin');
        if (adminRole) {
          if (!adminRole.permissions.includes('module_users_roles')) {
            adminRole.permissions.push('module_users_roles');
            updated = true;
          }
          if (!adminRole.permissions.includes('module_branches')) {
            adminRole.permissions.push('module_branches');
            updated = true;
          }
          if (!adminRole.permissions.includes('module_financial_reports')) {
            adminRole.permissions.push('module_financial_reports');
            updated = true;
          }
        }
        const managerRole = parsed.find((r) => r.name === 'Manager');
        if (managerRole) {
          if (!managerRole.permissions.includes('module_financial_reports')) {
            managerRole.permissions.push('module_financial_reports');
            updated = true;
          }
        }
        if (updated) {
          localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing mock roles', e);
    }
  }
  const initial = [
    {
      id: 1,
      name: 'Super Admin',
      description: 'Global unrestricted access to all software modules, settings, and administration panels.',
      is_system: true,
      permissions: [
        'module_dashboard',
        'module_pharmacies',
        'module_pos',
        'module_sales',
        'module_medicines',
        'module_batches',
        'module_categories',
        'module_companies',
        'module_units',
        'module_purchases',
        'module_suppliers',
        'module_customers',
        'module_expenses',
        'module_supplier_ledger',
        'module_customer_ledger',
        'module_financial_reports',
        'module_customer_returns',
        'module_supplier_returns',
        'module_branches',
        'module_users_roles',
      ],
    },
    {
      id: 2,
      name: 'Admin',
      description: 'Pharmacy Owner / Manager. Full access to all pharmacy operations, branches, and user management.',
      is_system: true,
      permissions: [
        'module_dashboard',
        'module_pos',
        'module_sales',
        'module_medicines',
        'module_batches',
        'module_categories',
        'module_companies',
        'module_units',
        'module_purchases',
        'module_suppliers',
        'module_customers',
        'module_expenses',
        'module_supplier_ledger',
        'module_customer_ledger',
        'module_financial_reports',
        'module_customer_returns',
        'module_supplier_returns',
        'module_branches',
        'module_users_roles',
      ],
    },
    {
      id: 3,
      name: 'Manager',
      description: 'Access to inventory, sales, purchases, and financials. Cannot manage users or branches.',
      is_system: true,
      permissions: [
        'module_dashboard',
        'module_pos',
        'module_sales',
        'module_medicines',
        'module_batches',
        'module_categories',
        'module_companies',
        'module_units',
        'module_purchases',
        'module_suppliers',
        'module_customers',
        'module_expenses',
        'module_supplier_ledger',
        'module_customer_ledger',
        'module_financial_reports',
        'module_customer_returns',
        'module_supplier_returns',
      ],
    },
    {
      id: 4,
      name: 'Operator',
      description: 'Access to POS billing, sales history, and basic inventory viewing.',
      is_system: true,
      permissions: [
        'module_dashboard',
        'module_pos',
        'module_sales',
        'module_medicines',
        'module_batches',
      ],
    },
    {
      id: 5,
      name: 'Viewer',
      description: 'Read-only access to dashboard and inventory. Cannot perform transactions.',
      is_system: true,
      permissions: [
        'module_dashboard',
        'module_medicines',
        'module_batches',
        'module_categories',
        'module_companies',
        'module_units',
      ],
    },
  ];
  localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(initial));
  return initial;
};

let mockUsers = getInitialUsers();
let mockRoles = getInitialRoles();

const saveUsers = () => {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(mockUsers));
};

const saveRoles = () => {
  localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(mockRoles));
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data;
    if (data.errors) {
      const firstKey = Object.keys(data.errors)[0];
      const errors = data.errors[firstKey];
      return Array.isArray(errors) ? errors[0] : errors;
    }
    if (data.message) {
      return data.message;
    }
  }
  return error.message || 'An unexpected error occurred.';
};

let usersCache = null;
let rolesCache = null;

export const getUsers = async () => {
  try {
    if (usersCache) return usersCache;
    const response = await api.get('/users');
    usersCache = response.data;
    return usersCache;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const createUser = async (data) => {
  try {
    const response = await api.post('/users', data);
    usersCache = null;
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const updateUser = async (id, data) => {
  try {
    const response = await api.put(`/users/${id}`, data);
    usersCache = null;
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/users/${id}`);
    usersCache = null;
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error(getErrorMessage(error));
  }
};

// ─── SOFTWARE ROLES ────────────────────────────────────────────
// These are software-level roles that control which sidebar modules a user can access.
// Different from pharmacy designations (Owner, Pharmacist, etc.) which are business titles.
// mockRoles is initialized via getInitialRoles() at the top of the file.

// ─── SIDEBAR MODULE PERMISSIONS ────────────────────────────────
// Each permission maps to a sidebar navigation item.
// When editing a role's permissions, these are the checkboxes shown.
let systemPermissions = [
  { id: 'module_dashboard', label: 'Dashboard', category: 'General', sidebarPath: '/' },
  { id: 'module_pharmacies', label: 'Pharmacies', category: 'Administration', sidebarPath: '/admin/pharmacies' },
  { id: 'module_pos', label: 'POS / Billing', category: 'Sales', sidebarPath: '/sales/pos' },
  { id: 'module_sales', label: 'Sales History', category: 'Sales', sidebarPath: '/sales' },
  { id: 'module_medicines', label: 'Medicines', category: 'Inventory', sidebarPath: '/inventory/medicines' },
  { id: 'module_batches', label: 'Stock Batches', category: 'Inventory', sidebarPath: '/inventory/batches' },
  { id: 'module_categories', label: 'Categories', category: 'Inventory', sidebarPath: '/inventory/categories' },
  { id: 'module_companies', label: 'Companies', category: 'Inventory', sidebarPath: '/inventory/companies' },
  { id: 'module_units', label: 'Units', category: 'Inventory', sidebarPath: '/inventory/units' },
  { id: 'module_purchases', label: 'Purchases', category: 'Purchasing', sidebarPath: '/purchases' },
  { id: 'module_suppliers', label: 'Suppliers', category: 'Partners', sidebarPath: '/partners/suppliers' },
  { id: 'module_customers', label: 'Customers', category: 'Partners', sidebarPath: '/partners/customers' },
  { id: 'module_expenses', label: 'Expenses', category: 'Financials', sidebarPath: '/financials/expenses' },
  { id: 'module_supplier_ledger', label: 'Supplier Ledger', category: 'Financials', sidebarPath: '/financials/supplier-ledger' },
  { id: 'module_customer_ledger', label: 'Customer Ledger', category: 'Financials', sidebarPath: '/financials/customer-ledger' },
  { id: 'module_financial_reports', label: 'Analytics & Reports', category: 'Financials', sidebarPath: '/financials/reports' },
  { id: 'module_customer_returns', label: 'Customer Returns', category: 'Returns', sidebarPath: '/returns/customer' },
  { id: 'module_supplier_returns', label: 'Supplier Returns', category: 'Returns', sidebarPath: '/returns/supplier' },
  { id: 'module_branches', label: 'Branches Settings', category: 'Administration', sidebarPath: '/settings/branches' },
  { id: 'module_users_roles', label: 'Users & Roles Management', category: 'Administration', sidebarPath: '/settings/users' },
];

export const getRoles = async () => {
  try {
    if (rolesCache) return rolesCache;
    const response = await api.get('/roles');
    rolesCache = response.data;
    return rolesCache;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const getSystemPermissions = async () => {
  try {
    await delay(100);
    return [...systemPermissions];
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const createRole = async (data) => {
  try {
    const response = await api.post('/roles', data);
    rolesCache = null;
    return response.data;
  } catch (error) {
    console.error('Error creating role:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const updateRole = async (id, data) => {
  try {
    const response = await api.put(`/roles/${id}`, data);
    rolesCache = null;
    return response.data;
  } catch (error) {
    console.error('Error updating role:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const deleteRole = async (id) => {
  try {
    const response = await api.delete(`/roles/${id}`);
    rolesCache = null;
    return response.data;
  } catch (error) {
    console.error('Error deleting role:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const updateRolePermissions = async (roleName, permissions) => {
  try {
    const response = await api.post(`/roles/${roleName}/permissions`, { permissions });
    rolesCache = null;
    return response.data;
  } catch (error) {
    console.error('Error updating role permissions:', error);
    throw new Error(getErrorMessage(error));
  }
};

// ─── SIDEBAR ACCESS HELPER ────────────────────────────────────
// Returns the list of sidebar paths the given role name is allowed to see.
// Used by DashboardLayout to dynamically filter navigation items.
export const getMockUserByCredentials = (email, password) => {
  const found = mockUsers.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

  if (!found) return null;
  if (found.password !== password) return null;

  return {
    ...found,
    roles: [found.role],
    pharmacy_id: found.pharmacy_id !== undefined ? found.pharmacy_id : null,
    branch_id: found.branch_id !== undefined ? found.branch_id : null,
  };
};

export const getAllowedSidebarPaths = (user) => {
  if (!user) return [];

  // Super Admins (pharmacy_id is null) always see the full sidebar
  if (user.pharmacy_id === null) {
    return null;
  }

  const roleName = user.roles?.[0] || user.role || '';
  if (roleName.toLowerCase() === 'super admin') {
    return null;
  }

  // If user permissions are returned by the backend DB
  if (user.permissions) {
    return systemPermissions
      .filter((p) => user.permissions.includes(p.id))
      .map((p) => p.sidebarPath);
  }

  // Fallback to local mock roles
  const role = mockRoles.find((r) => r.name.toLowerCase() === roleName.toLowerCase());
  if (!role) return [];

  return systemPermissions
    .filter((p) => role.permissions.includes(p.id))
    .map((p) => p.sidebarPath);
};

// Gets the software-level role name for a given user (either from mock users by email or fallback mapping)
export const getUserSoftwareRole = (user) => {
  if (!user) return '';

  const backendRole = user.roles?.[0] || user.role || '';

  if (user.pharmacy_id === null && backendRole.toLowerCase() === 'super admin') {
    return 'Super Admin';
  }

  // 1. Check local mock database by email to retrieve the assigned Software Role
  const mockUser = mockUsers.find((u) => u.email.toLowerCase() === (user.email || '').toLowerCase());
  if (mockUser) {
    return mockUser.role === 'Super Admin' && user.pharmacy_id !== null ? 'Admin' : mockUser.role;
  }

  // 2. Fallback to mapping backend Spatie Roles to Software Roles
  const roleMapping = {
    'owner': 'Admin',
    'pharmacist': 'Admin',
    'manager': 'Manager',
    'cashier': 'Operator',
    'stockist': 'Viewer'
  };
  return roleMapping[backendRole.toLowerCase()] || backendRole;
};
