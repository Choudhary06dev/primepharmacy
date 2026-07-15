import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Modal from '../../../components/UI/Modal';
import Select from '../../../components/UI/Select';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../../../services/branchService';
import { getPharmacies } from '../../../services/pharmacyService';
import { useAuth } from '../../../context/AuthContext';

const Branches = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.pharmacy_id === null;

  const [branches, setBranches] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    is_main: false,
    pharmacy_id: '',
  });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBranches();
      setBranches(data);
      if (isSuperAdmin) {
        const pharms = await getPharmacies();
        setPharmacies(pharms);
      }
    } catch (err) {
      setError('Failed to fetch branches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      is_main: false,
      pharmacy_id: pharmacies.length > 0 ? String(pharmacies[0].id) : '',
    });
    setFormError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch) => {
    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      is_main: branch.is_main || false,
      pharmacy_id: branch.pharmacy_id ? String(branch.pharmacy_id) : '',
    });
    setFormError(null);
    setCurrentId(branch.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const payload = {
        ...formData,
        pharmacy_id: formData.pharmacy_id ? Number(formData.pharmacy_id) : null
      };

      if (isEditMode) {
        const updated = await updateBranch(currentId, payload);
        // If we set a new main branch, update all others in local state
        if (formData.is_main) {
          setBranches((prev) =>
            prev.map((b) =>
              b.id === currentId
                ? { ...updated, is_main: true }
                : { ...b, is_main: false }
            )
          );
        } else {
          setBranches((prev) =>
            prev.map((b) => (b.id === currentId ? updated : b))
          );
        }
        showToast('Branch updated successfully.');
      } else {
        const created = await createBranch(payload);
        if (formData.is_main) {
          setBranches((prev) => [
            ...prev.map((b) => ({ ...b, is_main: false })),
            created,
          ]);
        } else {
          setBranches((prev) => [...prev, created]);
        }
        showToast('Branch created successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branch) => {
    if (branch.is_main) {
      setError('Cannot delete the main branch. Assign another branch as main first.');
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete the branch "${branch.name}"? This action cannot be undone.`
      )
    ) {
      setError(null);
      try {
        await deleteBranch(branch.id);
        setBranches((prev) => prev.filter((b) => b.id !== branch.id));
        showToast('Branch deleted successfully.');
      } catch (err) {
        setError(err.message || 'Failed to delete branch.');
      }
    }
  };

  const showToast = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const columns = [
    {
      key: 'name',
      label: 'Branch Name',
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{
              background: row.is_main
                ? 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))'
                : 'var(--color-surface-hover)',
              color: row.is_main ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {row.is_main ? '🏠' : '🏢'}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {val}
            </span>
            {row.is_main && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800/40 w-fit mt-0.5">
                Main Branch
              </span>
            )}
          </div>
        </div>
      ),
    },
    ...(isSuperAdmin ? [{
      key: 'pharmacy_name',
      label: 'Pharmacy',
      render: (val) => <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{val}</span>,
    }] : []),
    {
      key: 'phone',
      label: 'Phone',
      render: (val) => (
        <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
          {val || <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>}
        </span>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      render: (val) => (
        <span
          className="block max-w-xs truncate text-xs"
          title={val}
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {val || <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>}
        </span>
      ),
    },
    {
      key: 'users_count',
      label: 'Staff',
      render: (val) => (
        <div className="flex items-center gap-1.5">
          <span className="text-xs">👤</span>
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {val ?? 0}
          </span>
        </div>
      ),
    },
    {
      key: 'stats',
      label: 'Activity',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" title="Total Sales">
            <span className="text-[10px]">🧾</span>
            <span className="text-[11px] font-semibold tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
              {row.sales_count ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-1" title="Total Purchases">
            <span className="text-[10px]">📦</span>
            <span className="text-[11px] font-semibold tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
              {row.purchases_count ?? 0}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenEdit(row)}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Edit
          </button>
          {!row.is_main && (
            <button
              onClick={() => handleDelete(row)}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Management"
        subtitle="Manage your pharmacy locations. Each branch tracks its own staff, stock, sales, and purchases."
      >
        <Button
          onClick={handleOpenCreate}
          variant="primary"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          }
        >
          Add Branch
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      {!loading && branches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: 'var(--color-surface-primary)',
              borderColor: 'var(--color-border-primary)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center text-lg">
                🏢
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                  {branches.length}
                </p>
                <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                  Total Branches
                </p>
              </div>
            </div>
          </div>
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: 'var(--color-surface-primary)',
              borderColor: 'var(--color-border-primary)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-lg">
                👥
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                  {branches.reduce((sum, b) => sum + (b.users_count ?? 0), 0)}
                </p>
                <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                  Total Staff Across Branches
                </p>
              </div>
            </div>
          </div>
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: 'var(--color-surface-primary)',
              borderColor: 'var(--color-border-primary)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-lg">
                📊
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                  {branches.reduce((sum, b) => sum + (b.sales_count ?? 0) + (b.purchases_count ?? 0), 0)}
                </p>
                <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                  Total Transactions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-700 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400 text-sm">
          Loading branches...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={branches.map((b) => {
            const pharm = pharmacies.find((p) => p.id === b.pharmacy_id);
            return {
              ...b,
              pharmacy_name: pharm ? pharm.name : `Pharmacy ${b.pharmacy_id}`,
            };
          })}
          searchPlaceholder="Search branches by name, phone, or address..."
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Branch' : 'Add New Branch'}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving} onClick={handleFormSubmit}>
              {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Branch'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          {formError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
              <span>⚠️</span> <span>{formError}</span>
            </div>
          )}

          {/* Section: Branch Info */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800/60">
            <span className="text-sm">🏢</span>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">
              Branch Information
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isSuperAdmin && !isEditMode && (
              <Select
                label="Select Pharmacy"
                name="pharmacy_id"
                required
                value={formData.pharmacy_id}
                onChange={handleFormChange}
                options={pharmacies.map((p) => ({
                  value: String(p.id),
                  label: p.name,
                }))}
                emptyOption={false}
              />
            )}
            <Input
              label="Branch Name"
              name="name"
              required
              value={formData.name}
              onChange={handleFormChange}
              placeholder="e.g. Model Town Branch"
            />
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              placeholder="e.g. 042-35741234"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="block text-xs font-semibold text-black dark:text-slate-400 uppercase tracking-wider">
              Branch Address
            </label>
            <textarea
              name="address"
              rows="3"
              value={formData.address}
              onChange={handleFormChange}
              placeholder="e.g. Shop #5, Model Town Market, Near ABC Hospital, Lahore"
              className={`w-full text-sm outline-none px-4 py-2.5 rounded-lg border-2 text-black dark:text-slate-100 placeholder-slate-600 dark:placeholder-slate-500 transition-all focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 ${
                formData.address
                  ? 'border-brand-500/70 bg-brand-50/60 dark:border-brand-500/60 dark:bg-brand-950/25'
                  : 'border-slate-400 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900/60'
              }`}
            />
          </div>

          {/* Main Branch Toggle */}
          <div className="flex items-center gap-2 pt-2 pb-2 border-b border-slate-100 dark:border-zinc-800/60">
            <span className="text-sm">⚙️</span>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">
              Settings
            </h4>
          </div>

          <label
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              formData.is_main
                ? 'border-brand-500/50 bg-brand-50/60 dark:bg-brand-950/25 dark:border-brand-500/40'
                : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900/40'
            }`}
          >
            <input
              type="checkbox"
              name="is_main"
              checked={formData.is_main}
              onChange={handleFormChange}
              className="h-4 w-4 rounded border-slate-300 dark:border-zinc-700 text-brand-600 focus:ring-brand-500/30"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Set as Main Branch
              </span>
              <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                The main branch is the primary location of your pharmacy. Only one branch can be the main branch.
              </span>
            </div>
          </label>

          {/* Info Tip */}
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/25 border-2 border-blue-500/30 dark:border-blue-500/40">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong className="text-blue-700 dark:text-blue-400">💡 How it works:</strong> Staff members are assigned
              to branches in <strong>Settings → Users</strong>. All their sales, purchases, and stock
              operations are automatically linked to their assigned branch.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Branches;
