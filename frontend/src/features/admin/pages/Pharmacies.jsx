import { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Select from '../../../components/UI/Select';
import Modal from '../../../components/UI/Modal';
import { createPharmacy, getPharmacies, updatePharmacy, deletePharmacy } from '../../../services/pharmacyService';
import { getRoles } from '../../../services/userService';

// ─── Shared form shape for both Create & Edit ──────────────────
const emptyForm = {
  pharmacy_name: '',
  pharmacy_slug: '',
  pharmacy_address: '',
  pharmacy_phone: '',
  status: 'trial',
  trial_days: 30,
  owner_name: '',
  owner_email: '',
  owner_phone: '',
  role: 'Manager',
  password: '',
};

const calculateRemainingDays = (dateStr) => {
  if (!dateStr) return 30;
  const end = new Date(dateStr);
  const today = new Date();
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const Pharmacies = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [roles, setRoles] = useState([]);

  useEffect(() => {
    fetchPharmacies();
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setRoles(await getRoles());
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const fetchPharmacies = async () => {
    setLoading(true);
    setError(null);
    try {
      setPharmacies(await getPharmacies());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pharmacies.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  // ─── OPEN CREATE ─────────────────────────────────────────────
  const openCreate = () => {
    setFormData({ ...emptyForm });
    setIsEditMode(false);
    setCurrentId(null);
    setError(null);
    setIsModalOpen(true);
  };

  // ─── OPEN EDIT ───────────────────────────────────────────────
  const openEdit = (pharmacy) => {
    setFormData({
      pharmacy_name: pharmacy.name || '',
      pharmacy_slug: pharmacy.slug || '',
      pharmacy_address: pharmacy.pharmacy_address || '',
      pharmacy_phone: pharmacy.pharmacy_phone || '',
      status: pharmacy.status || 'trial',
      trial_days: calculateRemainingDays(pharmacy.trial_ends_at),
      owner_name: pharmacy.owner_name || '',
      owner_email: pharmacy.owner_email || '',
      owner_phone: pharmacy.owner_phone || '',
      role: pharmacy.role || 'Manager',
      password: '',
    });
    setCurrentId(pharmacy.id);
    setIsEditMode(true);
    setError(null);
    setIsModalOpen(true);
  };

  // ─── FORM CHANGE ─────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ─── SUBMIT (Create or Update) ───────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        trial_days: Number(formData.trial_days || 0),
      };
      // Don't send blank password on edit
      if (!payload.password) delete payload.password;

      if (isEditMode) {
        const result = await updatePharmacy(currentId, payload);
        setPharmacies((prev) =>
          prev.map((p) => (p.id === currentId ? result.pharmacy : p))
        );
        showToast('Pharmacy updated successfully.');
      } else {
        const result = await createPharmacy(payload);
        setPharmacies((prev) => [result.pharmacy, ...prev]);
        showToast('Pharmacy created successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstError = errors ? Object.values(errors).flat()[0] : null;
      setError(firstError || err.response?.data?.message || err.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  // ─── DELETE ──────────────────────────────────────────────────
  const handleDelete = async (pharmacy) => {
    if (window.confirm(`Are you sure you want to delete "${pharmacy.name}"? This action cannot be undone.`)) {
      setError(null);
      try {
        await deletePharmacy(pharmacy.id);
        setPharmacies((prev) => prev.filter((p) => p.id !== pharmacy.id));
        showToast(`Pharmacy "${pharmacy.name}" deleted successfully.`);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to delete pharmacy.');
      }
    }
  };

  // ─── TABLE COLUMNS ──────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      label: 'Pharmacy',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold">{val}</span>
          <span className="text-[11px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>{row.slug}</span>
        </div>
      ),
    },
    {
      key: 'owner_name',
      label: 'Owner',
      render: (val, row) => val ? (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{val}</span>
          <span className="text-[11px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>{row.owner_email}</span>
        </div>
      ) : (
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>No owner assigned</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const styles = {
          active: 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
          trial: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
          suspended: 'bg-red-50 dark:bg-red-950/25 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30',
        };
        return (
          <span className={`status-pill inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[val] || ''}`}>
            {val}
          </span>
        );
      },
    },
    {
      key: 'trial_ends_at',
      label: 'Trial Ends',
      render: (val, row) => row.status === 'trial'
        ? <span className="text-xs font-mono">{val || '—'}</span>
        : <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>N/A</span>,
    },
    { key: 'created_at', label: 'Created' },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              localStorage.setItem('primepharm_pharmacy_id', String(row.id));
              window.location.href = '/';
            }}
            className="text-xs font-bold text-emerald-650 dark:text-emerald-400 hover:underline"
          >
            View Panel
          </button>
          <button onClick={() => openEdit(row)} className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Edit
          </button>
          <button onClick={() => handleDelete(row)} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline">
            Delete
          </button>
        </div>
      ),
    },
  ];

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacies"
        subtitle="Manage client pharmacies and their owner login credentials."
      >
        <Button onClick={openCreate} variant="primary" icon={
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        }>
          Add Pharmacy
        </Button>
      </PageHeader>

      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          ✓ {success}
        </div>
      )}

      {error && !isModalOpen && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs font-medium text-red-700 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Loading pharmacies...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={pharmacies}
          searchPlaceholder="Search pharmacies by name, owner, email, or slug..."
          emptyMessage="No pharmacies created yet."
        />
      )}

      {/* ─── Unified Create / Edit Modal ────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Pharmacy' : 'Create New Pharmacy'}
        size="xl"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Pharmacy'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
              <span>⚠️</span> <span>{error}</span>
            </div>
          )}

          {/* ── Section 1: Pharmacy Info ──────────────────────────── */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800/60">
            <span className="text-sm">🏥</span>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">
              Pharmacy Information
            </h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Input
              label="Pharmacy Name"
              name="pharmacy_name"
              required
              value={formData.pharmacy_name}
              onChange={handleChange}
              placeholder="e.g. CareFirst Pharmacy"
            />
            <Input
              label="Slug / Code"
              name="pharmacy_slug"
              value={formData.pharmacy_slug}
              onChange={handleChange}
              placeholder="e.g. carefirst"
              helpText="Leave blank to auto-generate from name."
            />
            <Input
              label="Pharmacy Address"
              name="pharmacy_address"
              value={formData.pharmacy_address}
              onChange={handleChange}
              placeholder="e.g. Multan Road, Lahore"
            />
            <Input
              label="Pharmacy Phone / Contact"
              name="pharmacy_phone"
              value={formData.pharmacy_phone}
              onChange={handleChange}
              placeholder="e.g. 042-35111111"
            />
            <Select
              label="Account Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              emptyOption={false}
              options={[
                { value: 'trial', label: 'Trial' },
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
              ]}
            />
            {formData.status === 'trial' && (
              <Input
                label={isEditMode ? 'Trial Days (Reset)' : 'Trial Days'}
                name="trial_days"
                type="number"
                value={formData.trial_days}
                onChange={handleChange}
                placeholder="30"
                helpText={isEditMode ? 'Set new trial period from today.' : undefined}
              />
            )}
          </div>

          {/* ── Section 2: Owner Credentials ─────────────────────── */}
          <div className="flex items-center gap-2 pt-3 pb-2 border-b border-slate-100 dark:border-zinc-800/60">
            <span className="text-sm">👤</span>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">
              Owner Credentials (Admin)
            </h4>
            {!isEditMode && (
              <span className="text-[10px] ml-auto font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/25 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                Optional — assign later via Edit
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Input
              label="Owner Full Name"
              name="owner_name"
              value={formData.owner_name}
              onChange={handleChange}
              placeholder="e.g. Sarah Ahmed"
            />
            <Input
              label="Owner Login Email"
              name="owner_email"
              type="email"
              value={formData.owner_email}
              onChange={handleChange}
              placeholder="e.g. owner@pharmacy.com"
            />
            <Input
              label="Owner Phone Number"
              name="owner_phone"
              value={formData.owner_phone}
              onChange={handleChange}
              placeholder="e.g. +923000000000"
            />

            <Select
              label="Owner Software Role"
              name="role"
              required={!isEditMode || !!formData.owner_email}
              value={formData.role}
              onChange={handleChange}
              options={[
                { value: 'Manager', label: 'Manager' },
                { value: 'Pharmacy Operator', label: 'Pharmacy Operator' },
              ]}
              emptyOption={false}
            />

            <Input
              label={isEditMode ? 'Reset Password' : 'Owner Password'}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              helpText={isEditMode ? 'Leave blank to keep existing password.' : 'Minimum 8 characters.'}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Pharmacies;
