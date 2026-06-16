import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Modal from '../../../components/UI/Modal';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../../services/suppliersService';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
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
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      setError('Failed to fetch suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
    });
    setFormError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier) => {
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    });
    setFormError(null);
    setCurrentId(supplier.id);
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
        const updated = await updateSupplier(currentId, formData);
        setSuppliers((prev) =>
          prev.map((sup) => (sup.id === currentId ? updated : sup))
        );
        showToast('Supplier updated successfully.');
      } else {
        const created = await createSupplier(formData);
        setSuppliers((prev) => [...prev, created]);
        showToast('Supplier registered successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    if (
      window.confirm(
        `Are you sure you want to delete the supplier "${supplier.name}"?`
      )
    ) {
      setError(null);
      try {
        await deleteSupplier(supplier.id);
        setSuppliers((prev) => prev.filter((sup) => sup.id !== supplier.id));
        showToast('Supplier deleted successfully.');
      } catch (err) {
        setError(err.message || 'Failed to delete supplier.');
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
      label: 'Supplier Name',
      render: (val) => (
        <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'contact_person',
      label: 'Contact Person',
      render: (val) => (
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {val || <span style={{ color: 'var(--color-text-tertiary)' }}>N/A</span>}
        </span>
      ),
    },
    {
      key: 'contact',
      label: 'Contact Details',
      render: (_, row) => (
        <div className="flex flex-col text-xs font-mono">
          <span style={{ color: 'var(--color-text-secondary)' }}>{row.phone || 'Phone: N/A'}</span>
          <span className="text-[10px] text-slate-500">{row.email || 'Email: N/A'}</span>
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      render: (val) => (
        <span className="block max-w-xs truncate text-xs" title={val} style={{ color: 'var(--color-text-secondary)' }}>
          {val || <span style={{ color: 'var(--color-text-tertiary)' }}>N/A</span>}
        </span>
      ),
    },
    {
      key: 'balance',
      label: 'Running Balance',
      render: (val) => {
        const bal = Number(val || 0);
        return (
          <span className={`font-mono text-xs font-bold ${bal > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
            PKR {bal.toFixed(2)}
          </span>
        );
      },
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
        title="Suppliers Directory"
        subtitle="Manage pharmaceutical wholesale distributors, agents, and liability accounts."
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
          Add Supplier
        </Button>
      </PageHeader>

      {success && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-650 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400 text-sm">
          Loading suppliers directory...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={suppliers}
          searchPlaceholder="Search suppliers by name, email, or contact details..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Supplier' : 'Add New Supplier'}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving} onClick={handleFormSubmit}>
              {saving ? 'Saving...' : 'Save Supplier'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-650 dark:text-red-400 flex items-center gap-2">
              <span>⚠️</span> <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Supplier Name"
              name="name"
              required
              value={formData.name}
              onChange={handleFormChange}
              placeholder="e.g. Medix Distributors"
            />
            <Input
              label="Contact Person"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleFormChange}
              placeholder="e.g. Dr. Haris Ali"
            />
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              placeholder="e.g. 0300-1234567"
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              placeholder="e.g. billing@medix.com"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="block text-xs font-semibold text-black dark:text-slate-400 uppercase tracking-wider">
              Supplier Address
            </label>
            <textarea
              name="address"
              rows="3"
              value={formData.address}
              onChange={handleFormChange}
              placeholder="e.g. Office 12, Third Floor, Commercial Market, Lahore"
              className={`w-full text-sm outline-none px-4 py-2.5 rounded-lg border-2 text-black dark:text-slate-100 placeholder-slate-600 dark:placeholder-slate-500 transition-all focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 ${
                formData.address
                  ? 'border-brand-500/70 bg-brand-50/60 dark:border-brand-500/60 dark:bg-brand-950/25'
                  : 'border-slate-400 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900/60'
              }`}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Suppliers;
