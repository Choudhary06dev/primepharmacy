import api from './api';

const STORAGE_KEY = 'primepharm_mock_pharmacies';

const isMockMode = () => localStorage.getItem('primepharm_auth_mode') === 'mock';

const getInitialPharmacies = () => {
  if (!isMockMode()) {
    return [];
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.some((p) => p.slug === 'demo')) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing mock pharmacies', e);
    }
  }
  const initial = [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
};

let mockPharmacies = getInitialPharmacies();

const savePharmacies = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockPharmacies));
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let pharmaciesCache = null;

export const getPharmacies = async () => {
  if (isMockMode()) {
    await delay(200);
    const users = JSON.parse(localStorage.getItem('primepharm_mock_users') || '[]');
    return mockPharmacies.map((p) => {
      const owner = users.find((u) => u.pharmacy_id === p.id);
      return {
        ...p,
        owner_name: owner ? owner.name : null,
        owner_email: owner ? owner.email : null,
        owner_phone: owner ? owner.phone : null,
        role: owner ? owner.role : 'Admin',
      };
    });
  }
  if (pharmaciesCache) return pharmaciesCache;
  const response = await api.get('/pharmacies');
  pharmaciesCache = response.data;
  return pharmaciesCache;
};

export const createPharmacy = async (data) => {
  if (isMockMode()) {
    await delay(250);
    const exists = mockPharmacies.some(
      (p) => p.slug?.toLowerCase() === (data.pharmacy_slug || '').toLowerCase() && data.pharmacy_slug
    );
    if (exists) {
      throw new Error('A pharmacy with this slug already exists.');
    }

    const status = data.status || 'trial';
    const trialEndsAt = status === 'trial'
      ? new Date(Date.now() + (data.trial_days || 30) * 86400000).toISOString().split('T')[0]
      : null;

    const newPharmacy = {
      id: Date.now(),
      name: data.pharmacy_name,
      slug: data.pharmacy_slug || data.pharmacy_name.toLowerCase().replace(/\s+/g, '-'),
      status: status,
      trial_ends_at: trialEndsAt,
      plan: 'Basic',
      owner_name: data.owner_name || null,
      owner_email: data.owner_email || null,
      owner_phone: data.owner_phone || null,
      pharmacy_address: data.pharmacy_address || null,
      pharmacy_phone: data.pharmacy_phone || null,
      created_at: new Date().toISOString().split('T')[0],
    };

    // Sync owner into mock users database if email provided
    if (data.owner_email) {
      const users = JSON.parse(localStorage.getItem('primepharm_mock_users') || '[]');
      users.push({
        id: Date.now() + 1,
        name: data.owner_name || 'Owner',
        email: data.owner_email,
        phone: data.owner_phone || '',
        role: data.role || 'Admin',
        designation: 'Owner',
        status: 'Active',
        password: data.owner_password || 'Password123!',
        created_at: new Date().toISOString().split('T')[0],
        pharmacy_id: newPharmacy.id,
      });
      localStorage.setItem('primepharm_mock_users', JSON.stringify(users));
    }

    mockPharmacies.unshift(newPharmacy);
    savePharmacies();

    return {
      message: 'Pharmacy created successfully.',
      pharmacy: newPharmacy,
      credentials: data.owner_email ? { email: data.owner_email } : null,
    };
  }

  const response = await api.post('/pharmacies', data);
  pharmaciesCache = null;
  return response.data;
};

export const updatePharmacy = async (id, data) => {
  if (isMockMode()) {
    await delay(250);
    const idx = mockPharmacies.findIndex((p) => p.id === Number(id));
    if (idx === -1) throw new Error('Pharmacy not found.');

    if (data.pharmacy_slug) {
      const slugExists = mockPharmacies.some(
        (p) => p.id !== Number(id) && p.slug?.toLowerCase() === data.pharmacy_slug.toLowerCase()
      );
      if (slugExists) throw new Error('A pharmacy with this slug already exists.');
    }

    const newStatus = data.status || mockPharmacies[idx].status;

    // Sync owner details with mock users database in localStorage
    const users = JSON.parse(localStorage.getItem('primepharm_mock_users') || '[]');
    let ownerIdx = users.findIndex((u) => u.pharmacy_id === Number(id));
    if (ownerIdx !== -1) {
      users[ownerIdx] = {
        ...users[ownerIdx],
        name: data.owner_name !== undefined ? data.owner_name : users[ownerIdx].name,
        email: data.owner_email !== undefined ? data.owner_email : users[ownerIdx].email,
        phone: data.owner_phone !== undefined ? data.owner_phone : users[ownerIdx].phone,
        role: data.role !== undefined ? data.role : users[ownerIdx].role,
      };
      if (data.password) {
        users[ownerIdx].password = data.password;
      }
    } else if (data.owner_email) {
      users.push({
        id: Date.now(),
        name: data.owner_name || 'Owner',
        email: data.owner_email,
        phone: data.owner_phone || '',
        role: data.role || 'Admin',
        designation: 'Owner',
        status: 'Active',
        password: data.password || 'Password123!',
        created_at: new Date().toISOString().split('T')[0],
        pharmacy_id: Number(id),
      });
    }
    localStorage.setItem('primepharm_mock_users', JSON.stringify(users));

    mockPharmacies[idx] = {
      ...mockPharmacies[idx],
      name: data.pharmacy_name || mockPharmacies[idx].name,
      slug: data.pharmacy_slug || mockPharmacies[idx].slug,
      status: newStatus,
      owner_name: data.owner_name || mockPharmacies[idx].owner_name,
      owner_email: data.owner_email || mockPharmacies[idx].owner_email,
      owner_phone: data.owner_phone || mockPharmacies[idx].owner_phone,
      pharmacy_address: data.pharmacy_address !== undefined ? data.pharmacy_address : mockPharmacies[idx].pharmacy_address,
      pharmacy_phone: data.pharmacy_phone !== undefined ? data.pharmacy_phone : mockPharmacies[idx].pharmacy_phone,
      password: data.password || mockPharmacies[idx].password,
    };
    if (newStatus !== 'trial') {
      mockPharmacies[idx].trial_ends_at = null;
    } else if (data.trial_days !== undefined) {
      const days = Number(data.trial_days);
      mockPharmacies[idx].trial_ends_at = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
    }

    savePharmacies();
    return { message: 'Pharmacy updated successfully.', pharmacy: mockPharmacies[idx] };
  }

  const response = await api.put(`/pharmacies/${id}`, data);
  pharmaciesCache = null;
  return response.data;
};

export const deletePharmacy = async (id) => {
  if (isMockMode()) {
    await delay(200);
    const idx = mockPharmacies.findIndex((p) => p.id === Number(id));
    if (idx === -1) throw new Error('Pharmacy not found.');

    mockPharmacies.splice(idx, 1);
    savePharmacies();
    return { message: 'Pharmacy deleted successfully.' };
  }

  const response = await api.delete(`/pharmacies/${id}`);
  pharmaciesCache = null;
  return response.data;
};
