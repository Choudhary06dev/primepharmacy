import api, { registerCacheInvalidator } from './api';

const STORAGE_KEY = 'primepharm_mock_suppliers';

const isMockMode = () => localStorage.getItem('primepharm_auth_mode') === 'mock';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getActivePharmacyId = () => {
  const user = localStorage.getItem('primepharm_user')
    ? JSON.parse(localStorage.getItem('primepharm_user'))
    : null;
  return user ? Number(user.pharmacy_id) : null;
};

const getInitialSuppliers = () => {
  if (!isMockMode()) {
    return [];
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

let mockSuppliers = getInitialSuppliers();

const saveSuppliers = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSuppliers));
};

// NOTE: no module-level cache here — results are branch-scoped and must always be fresh
export const getSuppliers = async () => {
  if (isMockMode()) {
    await delay(200);
    const pharmacyId = getActivePharmacyId();
    return mockSuppliers.filter((s) => s.pharmacy_id === pharmacyId || s.pharmacy_id === undefined || s.pharmacy_id === null);
  }
  const response = await api.get('/suppliers');
  return response.data;
};

export const createSupplier = async (data) => {
  if (isMockMode()) {
    await delay(250);
    const pharmacyId = getActivePharmacyId();
    const newSupplier = {
      id: Date.now(),
      pharmacy_id: pharmacyId,
      name: data.name,
      contact_person: data.contact_person || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      balance: 0.00,
    };
    mockSuppliers.push(newSupplier);
    saveSuppliers();
    return newSupplier;
  }

  try {
    const response = await api.post('/suppliers', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create supplier.');
  }
};

export const updateSupplier = async (id, data) => {
  if (isMockMode()) {
    await delay(250);
    const idx = mockSuppliers.findIndex((s) => s.id === Number(id));
    if (idx === -1) throw new Error('Supplier not found.');

    mockSuppliers[idx] = {
      ...mockSuppliers[idx],
      name: data.name,
      contact_person: data.contact_person || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
    };
    saveSuppliers();
    return mockSuppliers[idx];
  }

  try {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update supplier.');
  }
};

export const deleteSupplier = async (id) => {
  if (isMockMode()) {
    await delay(150);
    const idx = mockSuppliers.findIndex((s) => s.id === Number(id));
    if (idx === -1) throw new Error('Supplier not found.');

    // Restrict if there are purchases linked
    const mockPurchases = JSON.parse(localStorage.getItem('primepharm_mock_purchases') || '[]');
    const hasPurchases = mockPurchases.some((p) => Number(p.supplier_id) === Number(id));
    if (hasPurchases) {
      throw new Error('Cannot delete supplier: they have associated purchase invoices.');
    }

    mockSuppliers.splice(idx, 1);
    saveSuppliers();
    return { success: true };
  }

  try {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete supplier.');
  }
};
