import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Modal from '../../../components/UI/Modal';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../../services/salesService';
import { useBranchFilter } from '../../../context/BranchFilterContext';

const Customers = () => {
  const { selectedBranchId } = useBranchFilter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedBranchId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      setError('Failed to fetch customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
    });
    setFormError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setFormError(null);
    setCurrentId(customer.id);
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
        const updated = await updateCustomer(currentId, formData);
        setCustomers((prev) =>
          prev.map((c) => (c.id === currentId ? { ...c, ...updated } : c))
        );
        showToast('Customer updated successfully.');
      } else {
        const created = await createCustomer(formData);
        setCustomers((prev) => [...prev, created]);
        showToast('Customer registered successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer) => {
    if (
      window.confirm(
        `Are you sure you want to delete the customer "${customer.name}"?`
      )
    ) {
      setError(null);
      try {
        await deleteCustomer(customer.id);
        setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
        showToast('Customer deleted successfully.');
      } catch (err) {
        setError(err.message || 'Failed to delete customer.');
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
      label: 'Customer Name',
      render: (val) => (
        <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {val}
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
      label: 'Outstanding Balance',
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
        title="Customers Directory"
        subtitle="Manage pharmacy retail clients, credit terms, and outstanding balances."
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
          Add Customer
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
          Loading customers directory...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          searchPlaceholder="Search customers by name, phone, or email..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Customer' : 'Add New Customer'}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving} onClick={handleFormSubmit}>
              {saving ? 'Saving...' : 'Save Customer'}
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
              label="Customer Name"
              name="name"
              required
              value={formData.name}
              onChange={handleFormChange}
              placeholder="e.g. Aslam Pervez"
            />
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              placeholder="e.g. 0321-4567890"
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              placeholder="e.g. aslam@gmail.com"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="block text-xs font-semibold text-black dark:text-slate-400 uppercase tracking-wider">
              Customer Address
            </label>
            <textarea
              name="address"
              rows="3"
              value={formData.address}
              onChange={handleFormChange}
              placeholder="e.g. House 45-B, Sector C, Bahria Town, Lahore"
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

export default Customers;
