import api from './api';

const STORAGE_CATEGORIES_KEY = 'primepharm_mock_categories';
const STORAGE_COMPANIES_KEY = 'primepharm_mock_companies';
const STORAGE_UNITS_KEY = 'primepharm_mock_units';
const STORAGE_MEDICINES_KEY = 'primepharm_mock_medicines';
const STORAGE_BATCHES_KEY = 'primepharm_mock_batches';

const getInitialMedicines = () => {
  const stored = localStorage.getItem(STORAGE_MEDICINES_KEY);
  return stored ? JSON.parse(stored) : [];
};

const getInitialBatches = () => {
  const stored = localStorage.getItem(STORAGE_BATCHES_KEY);
  return stored ? JSON.parse(stored) : [];
};

const getInitialCategories = () => {
  const stored = localStorage.getItem(STORAGE_CATEGORIES_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      let updated = false;
      parsed.forEach((cat) => {
        if (cat.pharmacy_id === undefined) {
          cat.pharmacy_id = 1;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing categories', e);
    }
  }
  const initial = [];
  localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(initial));
  return initial;
};

const getInitialCompanies = () => {
  const stored = localStorage.getItem(STORAGE_COMPANIES_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      let updated = false;
      parsed.forEach((comp) => {
        if (comp.pharmacy_id === undefined) {
          comp.pharmacy_id = 1;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_COMPANIES_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing companies', e);
    }
  }
  const initial = [];
  localStorage.setItem(STORAGE_COMPANIES_KEY, JSON.stringify(initial));
  return initial;
};

const getInitialUnits = () => {
  const stored = localStorage.getItem(STORAGE_UNITS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      let updated = false;
      parsed.forEach((u) => {
        if (u.pharmacy_id === undefined) {
          u.pharmacy_id = 1;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing units', e);
    }
  }
  const initial = [];
  localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(initial));
  return initial;
};

let mockCategories = getInitialCategories();
let mockCompanies = getInitialCompanies();
let mockUnits = getInitialUnits();
let mockMedicines = getInitialMedicines();
let mockBatches = getInitialBatches();

const saveCategories = () => { localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(mockCategories)); };
const saveCompanies = () => { localStorage.setItem(STORAGE_COMPANIES_KEY, JSON.stringify(mockCompanies)); };
const saveUnits = () => { localStorage.setItem(STORAGE_UNITS_KEY, JSON.stringify(mockUnits)); };
const saveMedicines = () => { localStorage.setItem(STORAGE_MEDICINES_KEY, JSON.stringify(mockMedicines)); };
const saveBatches = () => { localStorage.setItem(STORAGE_BATCHES_KEY, JSON.stringify(mockBatches)); };

const getActivePharmacyId = () => {
  const user = localStorage.getItem('primepharm_user')
    ? JSON.parse(localStorage.getItem('primepharm_user'))
    : null;
  return user ? user.pharmacy_id : null;
};

const isMockMode = () => localStorage.getItem('primepharm_auth_mode') === 'mock';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getCategories = async () => {
  if (isMockMode()) {
    try {
      await delay(200);
      const pharmacyId = getActivePharmacyId();
      return mockCategories.filter((c) => c.pharmacy_id === pharmacyId);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
  const response = await api.get('/inventory/categories');
  return response.data;
};

export const createCategory = async (data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const pharmacyId = getActivePharmacyId();
      const newCategory = {
        id: Date.now(),
        name: data.name,
        description: data.description || '',
        medicines_count: 0,
        created_at: new Date().toISOString().split('T')[0],
        pharmacy_id: pharmacyId,
      };
      
      const exists = mockCategories.some(
        (cat) => cat.pharmacy_id === pharmacyId && cat.name.toLowerCase() === data.name.toLowerCase()
      );
      if (exists) {
        throw new Error('A category with this name already exists.');
      }
      
      mockCategories.push(newCategory);
      saveCategories();
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  try {
    const response = await api.post('/inventory/categories', data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to create category.';
    throw new Error(errorMsg);
  }
};

export const updateCategory = async (id, data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const idx = mockCategories.findIndex((cat) => cat.id === Number(id));
      if (idx === -1) throw new Error('Category not found.');

      const pharmacyId = getActivePharmacyId();
      const exists = mockCategories.some(
        (cat) => cat.pharmacy_id === pharmacyId && cat.id !== Number(id) && cat.name.toLowerCase() === data.name.toLowerCase()
      );
      if (exists) {
        throw new Error('A category with this name already exists.');
      }

      mockCategories[idx] = {
        ...mockCategories[idx],
        name: data.name,
        description: data.description || '',
      };
      saveCategories();
      return mockCategories[idx];
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  try {
    const response = await api.put(`/inventory/categories/${id}`, data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to update category.';
    throw new Error(errorMsg);
  }
};

export const deleteCategory = async (id) => {
  if (isMockMode()) {
    try {
      await delay(200);
      const idx = mockCategories.findIndex((cat) => cat.id === Number(id));
      if (idx === -1) throw new Error('Category not found.');

      if (mockCategories[idx].medicines_count > 0) {
        throw new Error(`Cannot delete category: ${mockCategories[idx].medicines_count} medicines are currently classified under it.`);
      }

      mockCategories.splice(idx, 1);
      saveCategories();
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  try {
    const response = await api.delete(`/inventory/categories/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete category.');
  }
};

export const getCompanies = async () => {
  if (isMockMode()) {
    try {
      await delay(200);
      const pharmacyId = getActivePharmacyId();
      return mockCompanies.filter((comp) => comp.pharmacy_id === pharmacyId);
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }
  const response = await api.get('/inventory/companies');
  return response.data;
};

export const createCompany = async (data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const pharmacyId = getActivePharmacyId();
      const exists = mockCompanies.some(
        (comp) => comp.pharmacy_id === pharmacyId && comp.name.toLowerCase() === data.name.toLowerCase()
      );
      if (exists) {
        throw new Error('A company with this name already registered.');
      }

      const newCompany = {
        id: Date.now(),
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        medicines_count: 0,
        created_at: new Date().toISOString().split('T')[0],
        pharmacy_id: pharmacyId,
      };
      
      mockCompanies.push(newCompany);
      saveCompanies();
      return newCompany;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  try {
    const response = await api.post('/inventory/companies', data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to register company.';
    throw new Error(errorMsg);
  }
};

export const updateCompany = async (id, data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const idx = mockCompanies.findIndex((comp) => comp.id === Number(id));
      if (idx === -1) throw new Error('Company not found.');

      const pharmacyId = getActivePharmacyId();
      const exists = mockCompanies.some(
        (comp) => comp.pharmacy_id === pharmacyId && comp.id !== Number(id) && comp.name.toLowerCase() === data.name.toLowerCase()
      );
      if (exists) {
        throw new Error('A company with this name already registered.');
      }

      mockCompanies[idx] = {
        ...mockCompanies[idx],
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
      };
      saveCompanies();
      return mockCompanies[idx];
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  try {
    const response = await api.put(`/inventory/companies/${id}`, data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to update company.';
    throw new Error(errorMsg);
  }
};

export const deleteCompany = async (id) => {
  if (isMockMode()) {
    try {
      await delay(200);
      const idx = mockCompanies.findIndex((comp) => comp.id === Number(id));
      if (idx === -1) throw new Error('Company not found.');

      if (mockCompanies[idx].medicines_count > 0) {
        throw new Error(`Cannot delete manufacturer: ${mockCompanies[idx].medicines_count} medicines are linked to this company.`);
      }

      mockCompanies.splice(idx, 1);
      saveCompanies();
      return { success: true };
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  try {
    const response = await api.delete(`/inventory/companies/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete company.');
  }
};

export const getUnits = async () => {
  if (isMockMode()) {
    try {
      await delay(200);
      const pharmacyId = getActivePharmacyId();
      return mockUnits.filter((u) => u.pharmacy_id === pharmacyId);
    } catch (error) {
      console.error('Error fetching units:', error);
      throw error;
    }
  }
  const response = await api.get('/inventory/units');
  return response.data;
};

export const createUnit = async (data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const pharmacyId = getActivePharmacyId();
      const exists = mockUnits.some(
        (u) => u.pharmacy_id === pharmacyId && (u.name.toLowerCase() === data.name.toLowerCase() || u.abbreviation.toLowerCase() === data.abbreviation.toLowerCase())
      );
      if (exists) {
        throw new Error('A unit with this name or abbreviation already registered.');
      }

      const newUnit = {
        id: Date.now(),
        name: data.name,
        abbreviation: data.abbreviation.toUpperCase(),
        type: data.type || 'Base',
        description: data.description || '',
        pharmacy_id: pharmacyId,
      };
      
      mockUnits.push(newUnit);
      saveUnits();
      return newUnit;
    } catch (error) {
      console.error('Error creating unit:', error);
      throw error;
    }
  }

  try {
    const response = await api.post('/inventory/units', data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to create unit.';
    throw new Error(errorMsg);
  }
};

export const updateUnit = async (id, data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const idx = mockUnits.findIndex((u) => u.id === Number(id));
      if (idx === -1) throw new Error('Unit not found.');

      const pharmacyId = getActivePharmacyId();
      const exists = mockUnits.some(
        (u) => u.pharmacy_id === pharmacyId && u.id !== Number(id) && (u.name.toLowerCase() === data.name.toLowerCase() || u.abbreviation.toLowerCase() === data.abbreviation.toLowerCase())
      );
      if (exists) {
        throw new Error('A unit with this name or abbreviation already registered.');
      }

      mockUnits[idx] = {
        ...mockUnits[idx],
        name: data.name,
        abbreviation: data.abbreviation.toUpperCase(),
        type: data.type || 'Base',
        description: data.description || '',
      };
      saveUnits();
      return mockUnits[idx];
    } catch (error) {
      console.error('Error updating unit:', error);
      throw error;
    }
  }

  try {
    const response = await api.put(`/inventory/units/${id}`, data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to update unit.';
    throw new Error(errorMsg);
  }
};

export const deleteUnit = async (id) => {
  if (isMockMode()) {
    try {
      await delay(200);
      const idx = mockUnits.findIndex((u) => u.id === Number(id));
      if (idx === -1) throw new Error('Unit not found.');

      mockUnits.splice(idx, 1);
      saveUnits();
      return { success: true };
    } catch (error) {
      console.error('Error deleting unit:', error);
      throw error;
    }
  }

  try {
    const response = await api.delete(`/inventory/units/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete unit.');
  }
};

// ─── MEDICINES CATALOG INTEGRATIONS ────────────────────────────────────

export const getMedicines = async () => {
  if (isMockMode()) {
    try {
      await delay(200);
      const pharmacyId = getActivePharmacyId();
      const cats = JSON.parse(localStorage.getItem('primepharm_mock_categories') || '[]');
      const comps = JSON.parse(localStorage.getItem('primepharm_mock_companies') || '[]');
      const units = JSON.parse(localStorage.getItem('primepharm_mock_units') || '[]');
      const batches = JSON.parse(localStorage.getItem('primepharm_mock_batches') || '[]');

      return mockMedicines.filter((m) => m.pharmacy_id === pharmacyId).map((m) => {
        const activeBatches = batches.filter((b) => b.medicine_id === m.id && b.status === 'ACTIVE');
        return {
          ...m,
          category: cats.find((c) => c.id === Number(m.category_id)),
          company: comps.find((c) => c.id === Number(m.company_id)),
          base_unit: units.find((u) => u.id === Number(m.base_unit_id)),
          conversions: (m.conversions || []).map((c) => ({
            ...c,
            from_unit: units.find((u) => u.id === Number(c.from_unit_id))
          })),
          total_stock: activeBatches.reduce((acc, curr) => acc + Number(curr.remaining_quantity), 0)
        };
      });
    } catch (error) {
      console.error('Error fetching mock medicines:', error);
      throw error;
    }
  }

  const response = await api.get('/inventory/medicines');
  return response.data;
};

export const createMedicine = async (data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const pharmacyId = getActivePharmacyId();
      
      const newMed = {
        id: Date.now(),
        pharmacy_id: pharmacyId,
        category_id: Number(data.category_id),
        company_id: Number(data.company_id),
        name: data.name,
        generic_name: data.generic_name || '',
        sku: data.sku || `SKU-${Date.now()}`,
        barcode: data.barcode || '',
        min_stock_level: Number(data.min_stock_level || 0),
        base_unit_id: Number(data.base_unit_id),
        is_active: data.is_active !== undefined ? data.is_active : true,
        conversions: (data.conversions || []).map((c) => ({
          id: Date.now() + Math.random(),
          from_unit_id: Number(c.from_unit_id),
          to_unit_id: Number(data.base_unit_id),
          factor: Number(c.factor),
        }))
      };

      // Simulated unique checks
      if (mockMedicines.some((m) => m.pharmacy_id === pharmacyId && m.sku === newMed.sku)) {
        throw new Error('A medicine with this SKU already exists.');
      }

      mockMedicines.push(newMed);
      saveMedicines();
      return newMed;
    } catch (error) {
      console.error('Error creating mock medicine:', error);
      throw error;
    }
  }

  try {
    const response = await api.post('/inventory/medicines', data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to create medicine.';
    throw new Error(errorMsg);
  }
};

export const updateMedicine = async (id, data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const idx = mockMedicines.findIndex((m) => m.id === Number(id));
      if (idx === -1) throw new Error('Medicine not found.');

      const pharmacyId = getActivePharmacyId();

      mockMedicines[idx] = {
        ...mockMedicines[idx],
        category_id: Number(data.category_id),
        company_id: Number(data.company_id),
        name: data.name,
        generic_name: data.generic_name || '',
        sku: data.sku,
        barcode: data.barcode || '',
        min_stock_level: Number(data.min_stock_level || 0),
        base_unit_id: Number(data.base_unit_id),
        is_active: data.is_active !== undefined ? data.is_active : true,
        conversions: (data.conversions || []).map((c) => ({
          id: c.id || Date.now() + Math.random(),
          from_unit_id: Number(c.from_unit_id),
          to_unit_id: Number(data.base_unit_id),
          factor: Number(c.factor),
        }))
      };

      saveMedicines();
      return mockMedicines[idx];
    } catch (error) {
      console.error('Error updating mock medicine:', error);
      throw error;
    }
  }

  try {
    const response = await api.put(`/inventory/medicines/${id}`, data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to update medicine.';
    throw new Error(errorMsg);
  }
};

export const deleteMedicine = async (id) => {
  if (isMockMode()) {
    try {
      await delay(200);
      const idx = mockMedicines.findIndex((m) => m.id === Number(id));
      if (idx === -1) throw new Error('Medicine not found.');

      // Prevent delete if batches exist
      const batches = JSON.parse(localStorage.getItem('primepharm_mock_batches') || '[]');
      if (batches.some((b) => b.medicine_id === Number(id))) {
        throw new Error('Cannot delete medicine: physical stock batches are currently in inventory.');
      }

      mockMedicines.splice(idx, 1);
      saveMedicines();
      return { success: true };
    } catch (error) {
      console.error('Error deleting mock medicine:', error);
      throw error;
    }
  }

  try {
    const response = await api.delete(`/inventory/medicines/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete medicine.');
  }
};

// ─── STOCK BATCHES INTEGRATIONS ───────────────────────────────────────

export const getBatches = async () => {
  if (isMockMode()) {
    try {
      await delay(200);
      const pharmacyId = getActivePharmacyId();
      const units = JSON.parse(localStorage.getItem('primepharm_mock_units') || '[]');

      return mockBatches.filter((b) => b.pharmacy_id === pharmacyId).map((b) => {
        const med = mockMedicines.find((m) => m.id === Number(b.medicine_id));
        const baseUnit = units.find((u) => u.id === Number(med?.base_unit_id));
        return {
          ...b,
          medicine: med ? { ...med, base_unit: baseUnit } : null
        };
      });
    } catch (error) {
      console.error('Error fetching mock batches:', error);
      throw error;
    }
  }

  const response = await api.get('/inventory/batches');
  return response.data;
};

export const createBatch = async (data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const pharmacyId = getActivePharmacyId();
      
      const newBatch = {
        id: Date.now(),
        pharmacy_id: pharmacyId,
        branch_id: 1,
        medicine_id: Number(data.medicine_id),
        batch_no: data.batch_no,
        expiry_date: data.expiry_date,
        purchase_price: Number(data.purchase_price),
        sale_price: Number(data.sale_price),
        quantity: Number(data.quantity),
        remaining_quantity: Number(data.quantity),
        status: 'ACTIVE',
        created_at: new Date().toISOString().split('T')[0],
      };

      mockBatches.push(newBatch);
      saveBatches();

      const units = JSON.parse(localStorage.getItem('primepharm_mock_units') || '[]');
      const med = mockMedicines.find((m) => m.id === Number(newBatch.medicine_id));
      const baseUnit = units.find((u) => u.id === Number(med?.base_unit_id));
      
      return {
        ...newBatch,
        medicine: med ? { ...med, base_unit: baseUnit } : null
      };
    } catch (error) {
      console.error('Error creating mock batch:', error);
      throw error;
    }
  }

  try {
    const response = await api.post('/inventory/batches', data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to create stock batch.';
    throw new Error(errorMsg);
  }
};

export const updateBatch = async (id, data) => {
  if (isMockMode()) {
    try {
      await delay(250);
      const idx = mockBatches.findIndex((b) => b.id === Number(id));
      if (idx === -1) throw new Error('Batch not found.');

      mockBatches[idx] = {
        ...mockBatches[idx],
        batch_no: data.batch_no,
        expiry_date: data.expiry_date,
        purchase_price: Number(data.purchase_price),
        sale_price: Number(data.sale_price),
        quantity: Number(data.quantity),
        remaining_quantity: Number(data.remaining_quantity),
        status: data.status,
      };

      saveBatches();

      const units = JSON.parse(localStorage.getItem('primepharm_mock_units') || '[]');
      const med = mockMedicines.find((m) => m.id === Number(mockBatches[idx].medicine_id));
      const baseUnit = units.find((u) => u.id === Number(med?.base_unit_id));

      return {
        ...mockBatches[idx],
        medicine: med ? { ...med, base_unit: baseUnit } : null
      };
    } catch (error) {
      console.error('Error updating mock batch:', error);
      throw error;
    }
  }

  try {
    const response = await api.put(`/inventory/batches/${id}`, data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to update batch.';
    throw new Error(errorMsg);
  }
};

export const deleteBatch = async (id) => {
  if (isMockMode()) {
    try {
      await delay(200);
      const idx = mockBatches.findIndex((b) => b.id === Number(id));
      if (idx === -1) throw new Error('Batch not found.');

      mockBatches.splice(idx, 1);
      saveBatches();
      return { success: true };
    } catch (error) {
      console.error('Error deleting mock batch:', error);
      throw error;
    }
  }

  try {
    const response = await api.delete(`/inventory/batches/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete batch.');
  }
};
