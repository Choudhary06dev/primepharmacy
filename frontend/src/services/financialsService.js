import api from './api';

const CAT_STORAGE_KEY = 'primepharm_mock_expense_categories';
const EXP_STORAGE_KEY = 'primepharm_mock_expenses';
const SUP_LEDGER_KEY = 'primepharm_mock_supplier_ledgers';
const CUST_LEDGER_KEY = 'primepharm_mock_customer_ledgers';

const isMockMode = () => localStorage.getItem('primepharm_auth_mode') === 'mock';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getActivePharmacyId = () => {
  const user = localStorage.getItem('primepharm_user')
    ? JSON.parse(localStorage.getItem('primepharm_user'))
    : null;
  return user ? Number(user.pharmacy_id) : null;
};

let expenseCategoriesCache = null;

export const getExpenseCategories = async () => {
  if (isMockMode()) {
    await delay(150);
    const pharmacyId = getActivePharmacyId();
    const stored = JSON.parse(localStorage.getItem(CAT_STORAGE_KEY) || '[]');
    return stored.filter((c) => c.pharmacy_id === pharmacyId || c.pharmacy_id === undefined || c.pharmacy_id === null);
  }
  if (expenseCategoriesCache) return expenseCategoriesCache;
  const response = await api.get('/expenses/categories');
  expenseCategoriesCache = response.data;
  return expenseCategoriesCache;
};

export const createExpenseCategory = async (data) => {
  if (isMockMode()) {
    await delay(200);
    const pharmacyId = getActivePharmacyId();
    const stored = JSON.parse(localStorage.getItem(CAT_STORAGE_KEY) || '[]');
    const newCat = {
      id: Date.now(),
      pharmacy_id: pharmacyId,
      name: data.name,
      description: data.description || '',
    };
    stored.push(newCat);
    localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(stored));
    return newCat;
  }
  try {
    const response = await api.post('/expenses/categories', data);
    expenseCategoriesCache = null;
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create expense category.');
  }
};

export const updateExpenseCategory = async (id, data) => {
  if (isMockMode()) {
    await delay(200);
    const stored = JSON.parse(localStorage.getItem(CAT_STORAGE_KEY) || '[]');
    const idx = stored.findIndex((c) => c.id === Number(id));
    if (idx === -1) throw new Error('Expense category not found.');
    stored[idx] = {
      ...stored[idx],
      name: data.name,
      description: data.description || '',
    };
    localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(stored));
    return stored[idx];
  }
  try {
    const response = await api.put(`/expenses/categories/${id}`, data);
    expenseCategoriesCache = null;
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update expense category.');
  }
};

export const deleteExpenseCategory = async (id) => {
  if (isMockMode()) {
    await delay(150);
    const stored = JSON.parse(localStorage.getItem(CAT_STORAGE_KEY) || '[]');
    const idx = stored.findIndex((c) => c.id === Number(id));
    if (idx === -1) throw new Error('Expense category not found.');

    const mockExpenses = JSON.parse(localStorage.getItem(EXP_STORAGE_KEY) || '[]');
    const hasExpenses = mockExpenses.some((e) => Number(e.expense_category_id) === Number(id));
    if (hasExpenses) {
      throw new Error('Cannot delete category: it has registered expenses.');
    }

    stored.splice(idx, 1);
    localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(stored));
    return { success: true };
  }
  try {
    const response = await api.delete(`/expenses/categories/${id}`);
    expenseCategoriesCache = null;
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete expense category.');
  }
};

// --- EXPENSES ---
export const getExpenses = async () => {
  if (isMockMode()) {
    await delay(200);
    const pharmacyId = getActivePharmacyId();
    const storedExp = JSON.parse(localStorage.getItem(EXP_STORAGE_KEY) || '[]');
    const storedCats = JSON.parse(localStorage.getItem(CAT_STORAGE_KEY) || '[]');
    
    const filtered = storedExp.filter((e) => e.pharmacy_id === pharmacyId || e.pharmacy_id === undefined || e.pharmacy_id === null);
    
    // Map categories in mock mode
    return filtered.map((e) => ({
      ...e,
      category: storedCats.find((c) => c.id === Number(e.expense_category_id)) || null,
    }));
  }
  const response = await api.get('/expenses');
  return response.data;
};

export const createExpense = async (data) => {
  if (isMockMode()) {
    await delay(250);
    const pharmacyId = getActivePharmacyId();
    const branchId = 1;
    const storedExp = JSON.parse(localStorage.getItem(EXP_STORAGE_KEY) || '[]');
    const storedCats = JSON.parse(localStorage.getItem(CAT_STORAGE_KEY) || '[]');

    const newExp = {
      id: Date.now(),
      pharmacy_id: pharmacyId,
      branch_id: branchId,
      expense_category_id: Number(data.expense_category_id),
      amount: Number(data.amount),
      expense_date: data.expense_date,
      description: data.description || '',
    };
    storedExp.push(newExp);
    localStorage.setItem(EXP_STORAGE_KEY, JSON.stringify(storedExp));

    return {
      ...newExp,
      category: storedCats.find((c) => c.id === Number(newExp.expense_category_id)) || null,
    };
  }
  try {
    const response = await api.post('/expenses', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to record expense.');
  }
};

export const updateExpense = async (id, data) => {
  if (isMockMode()) {
    await delay(200);
    const storedExp = JSON.parse(localStorage.getItem(EXP_STORAGE_KEY) || '[]');
    const storedCats = JSON.parse(localStorage.getItem(CAT_STORAGE_KEY) || '[]');
    const idx = storedExp.findIndex((e) => e.id === Number(id));
    if (idx === -1) throw new Error('Expense not found.');

    storedExp[idx] = {
      ...storedExp[idx],
      expense_category_id: Number(data.expense_category_id),
      amount: Number(data.amount),
      expense_date: data.expense_date,
      description: data.description || '',
    };
    localStorage.setItem(EXP_STORAGE_KEY, JSON.stringify(storedExp));

    return {
      ...storedExp[idx],
      category: storedCats.find((c) => c.id === Number(storedExp[idx].expense_category_id)) || null,
    };
  }
  try {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update expense.');
  }
};

export const deleteExpense = async (id) => {
  if (isMockMode()) {
    await delay(150);
    const storedExp = JSON.parse(localStorage.getItem(EXP_STORAGE_KEY) || '[]');
    const idx = storedExp.findIndex((e) => e.id === Number(id));
    if (idx === -1) throw new Error('Expense not found.');

    storedExp.splice(idx, 1);
    localStorage.setItem(EXP_STORAGE_KEY, JSON.stringify(storedExp));
    return { success: true };
  }
  try {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete expense.');
  }
};

// --- LEDGERS ---
export const getSupplierLedger = async (id) => {
  if (isMockMode()) {
    await delay(250);
    const pharmacyId = getActivePharmacyId();
    const mockSuppliers = JSON.parse(localStorage.getItem('primepharm_mock_suppliers') || '[]');
    const supplier = mockSuppliers.find((s) => s.id === Number(id));
    if (!supplier) throw new Error('Supplier not found.');

    const mockLedgers = JSON.parse(localStorage.getItem(SUP_LEDGER_KEY) || '[]');
    const entries = mockLedgers.filter((l) => Number(l.supplier_id) === Number(id) && (l.pharmacy_id === pharmacyId || l.pharmacy_id === undefined || l.pharmacy_id === null));

    // Sort ascending by date
    entries.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

    return {
      supplier,
      entries,
    };
  }
  const response = await api.get(`/financials/ledgers/supplier/${id}`);
  return response.data;
};

export const getCustomerLedger = async (id) => {
  if (isMockMode()) {
    await delay(250);
    const pharmacyId = getActivePharmacyId();
    const mockCustomers = JSON.parse(localStorage.getItem('primepharm_mock_customers') || '[]');
    const customer = mockCustomers.find((c) => c.id === Number(id));
    if (!customer) throw new Error('Customer not found.');

    const mockLedgers = JSON.parse(localStorage.getItem(CUST_LEDGER_KEY) || '[]');
    const entries = mockLedgers.filter((l) => Number(l.customer_id) === Number(id) && (l.pharmacy_id === pharmacyId || l.pharmacy_id === undefined || l.pharmacy_id === null));

    // Sort ascending by date
    entries.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

    return {
      customer,
      entries,
    };
  }
  const response = await api.get(`/financials/ledgers/customer/${id}`);
  return response.data;
};
