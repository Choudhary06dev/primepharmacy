import api from './api';

/**
 * Branch Service — CRUD operations for pharmacy branches.
 * Follows the same mock/live pattern used across all services.
 */

const STORAGE_KEY = 'primepharm_mock_branches';

const isMockMode = () => localStorage.getItem('primepharm_auth_mode') === 'mock';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getActivePharmacyId = () => {
  const user = localStorage.getItem('primepharm_user')
    ? JSON.parse(localStorage.getItem('primepharm_user'))
    : null;
  return user ? Number(user.pharmacy_id) : null;
};

const getInitialBranches = () => {
  if (!isMockMode()) return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

let mockBranches = getInitialBranches();

const saveBranches = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockBranches));
};

let branchesCache = null;

/**
 * Fetch all branches for the current pharmacy.
 */
export const getBranches = async (params) => {
  if (isMockMode()) {
    await delay(200);
    const pharmacyId = getActivePharmacyId();
    return mockBranches.filter(
      (b) => b.pharmacy_id === pharmacyId || b.pharmacy_id === undefined || b.pharmacy_id === null
    );
  }
  if (!params && branchesCache) return branchesCache;
  const response = await api.get('/branches', { params });
  if (!params) {
    branchesCache = response.data;
  }
  return response.data;
};

/**
 * Create a new branch.
 */
export const createBranch = async (data) => {
  if (isMockMode()) {
    await delay(250);
    const pharmacyId = getActivePharmacyId();

    // Check duplicate name
    const exists = mockBranches.some(
      (b) => b.pharmacy_id === pharmacyId && b.name.toLowerCase() === data.name.toLowerCase()
    );
    if (exists) throw new Error('A branch with this name already exists.');

    // If setting as main, unset others
    if (data.is_main) {
      mockBranches = mockBranches.map((b) =>
        b.pharmacy_id === pharmacyId ? { ...b, is_main: false } : b
      );
    }

    const newBranch = {
      id: Date.now(),
      pharmacy_id: pharmacyId,
      name: data.name,
      address: data.address || null,
      phone: data.phone || null,
      is_main: data.is_main || false,
      users_count: 0,
      sales_count: 0,
      purchases_count: 0,
    };
    mockBranches.push(newBranch);
    saveBranches();
    return newBranch;
  }

  try {
    const response = await api.post('/branches', data);
    branchesCache = null;
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to create branch.';
    throw new Error(msg);
  }
};

/**
 * Update an existing branch.
 */
export const updateBranch = async (id, data) => {
  if (isMockMode()) {
    await delay(250);
    const pharmacyId = getActivePharmacyId();
    const idx = mockBranches.findIndex((b) => b.id === Number(id));
    if (idx === -1) throw new Error('Branch not found.');

    // Check duplicate name (exclude self)
    const exists = mockBranches.some(
      (b) =>
        b.pharmacy_id === pharmacyId &&
        b.name.toLowerCase() === data.name.toLowerCase() &&
        b.id !== Number(id)
    );
    if (exists) throw new Error('A branch with this name already exists.');

    // Prevent unsetting main if it's the only main
    if (mockBranches[idx].is_main && data.is_main === false) {
      throw new Error('Cannot unset main branch. Set another branch as main first.');
    }

    // If setting as main, unset others
    if (data.is_main && !mockBranches[idx].is_main) {
      mockBranches = mockBranches.map((b) =>
        b.pharmacy_id === pharmacyId ? { ...b, is_main: false } : b
      );
    }

    mockBranches[idx] = { ...mockBranches[idx], ...data };
    saveBranches();
    return mockBranches[idx];
  }

  try {
    const response = await api.put(`/branches/${id}`, data);
    branchesCache = null;
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to update branch.';
    throw new Error(msg);
  }
};

/**
 * Delete a branch.
 */
export const deleteBranch = async (id) => {
  if (isMockMode()) {
    await delay(150);
    const idx = mockBranches.findIndex((b) => b.id === Number(id));
    if (idx === -1) throw new Error('Branch not found.');
    if (mockBranches[idx].is_main) {
      throw new Error('Cannot delete the main branch.');
    }
    mockBranches.splice(idx, 1);
    saveBranches();
    return { success: true };
  }

  try {
    const response = await api.delete(`/branches/${id}`);
    branchesCache = null;
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete branch.');
  }
};
