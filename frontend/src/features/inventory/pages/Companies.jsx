import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Modal from '../../../components/UI/Modal';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../../../services/inventoryService';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch companies on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (err) {
      setError('Failed to fetch companies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({ name: '', email: '', phone: '' });
    setFormError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (company) => {
    setFormData({ name: company.name, email: company.email, phone: company.phone });
    setFormError(null);
    setCurrentId(company.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      if (isEditMode) {
        const updated = await updateCompany(currentId, formData);
        setCompanies((prev) =>
          prev.map((comp) => (comp.id === currentId ? updated : comp))
        );
        showToast('Manufacturer updated successfully.');
      } else {
        const created = await createCompany(formData);
        setCompanies((prev) => [...prev, created]);
        showToast('Manufacturer created successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (company) => {
    if (
      window.confirm(
        `Are you sure you want to delete the company "${company.name}"?`
      )
    ) {
      setError(null);
      try {
        await deleteCompany(company.id);
        setCompanies((prev) => prev.filter((comp) => comp.id !== company.id));
        showToast('Manufacturer deleted successfully.');
      } catch (err) {
        setError(err.message || 'Failed to delete manufacturer.');
      }
    }
  };

  const showToast = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Columns definition
  const columns = [
    {
      key: 'name',
      label: 'Manufacturer Name',
      render: (val) => <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{val}</span>,
    },
    {
      key: 'email',
      label: 'Email Address',
      render: (val) => (
        <span className="font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {val || <span style={{ color: 'var(--color-text-tertiary)' }}>N/A</span>}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone Contact',
      render: (val) => (
        <span className="font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {val || <span style={{ color: 'var(--color-text-tertiary)' }}>N/A</span>}
        </span>
      ),
    },
    {
      key: 'medicines_count',
      label: 'Medicines Linked',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-900/30">
          {val} products
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created At',
      render: (val) => <span className="font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{val}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenEdit(row)}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manufacturers"
        subtitle="Manage pharmaceutical production companies and medicine manufacturers."
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
          Add Manufacturer
        </Button>
      </PageHeader>

      {/* Success Notification */}
      {success && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          ✓ {success}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-650 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400 text-sm">
          Loading manufacturers database...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={companies}
          searchPlaceholder="Search manufacturers by name, email, or phone..."
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Manufacturer' : 'Create New Manufacturer'}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={saving}
              onClick={handleFormSubmit}
            >
              {saving ? 'Saving...' : 'Save Manufacturer'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          {formError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-655 dark:text-red-400 flex items-center gap-2">
              <span>⚠️</span> <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-4">
              <Input
                label="Manufacturer Name"
                name="name"
                required
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g. Pfizer Pakistan"
                helpText="Specify the full corporate name of the medicine producer."
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="e.g. info@pfizer.com"
                helpText="Optional contact email address for corporate orders."
              />

              <Input
                label="Phone Contact"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="e.g. +922132201111"
                helpText="Optional contact phone or office exchange number."
              />
            </div>

            <div className="md:col-span-5 bg-brand-50/80 dark:bg-brand-950/25 rounded-xl border-2 border-brand-500/45 dark:border-brand-500/40 p-4 flex flex-col justify-center space-y-3">
              <h4 className="text-xs font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🏭</span> Manufacturer Profile
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Registering corporate manufacturers allows you to catalog and filter stock batches by their brand origin and track supply chains cleanly.
              </p>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Companies;
