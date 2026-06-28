import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Select from '../../../components/UI/Select';
import SearchableSelect from '../../../components/UI/SearchableSelect';
import Modal from '../../../components/UI/Modal';
import { getBatches, createBatch, updateBatch, deleteBatch, getMedicines } from '../../../services/inventoryService';

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    medicine_id: '',
    batch_no: '',
    expiry_date: '',
    purchase_price: 0,
    sale_price: 0,
    quantity: 0,
    remaining_quantity: 0,
    status: 'ACTIVE'
  });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch batches & medicines on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [batchesData, medsData] = await Promise.all([
        getBatches(),
        getMedicines()
      ]);
      setBatches(batchesData);
      setMedicines(medsData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch batches data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    if (medicines.length === 0) {
      alert('Please add at least one medicine to the catalog first.');
      return;
    }
    setFormData({
      medicine_id: '',
      batch_no: '',
      expiry_date: '',
      purchase_price: 0.00,
      sale_price: 0.00,
      quantity: 100,
      remaining_quantity: 100,
      status: 'ACTIVE'
    });
    setFormError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch) => {
    // Format date string for HTML date input (YYYY-MM-DD)
    const rawDate = batch.expiry_date ? new Date(batch.expiry_date) : null;
    const formattedDate = rawDate ? rawDate.toISOString().split('T')[0] : '';
    
    setFormData({
      medicine_id: batch.medicine_id,
      batch_no: batch.batch_no,
      expiry_date: formattedDate,
      purchase_price: batch.purchase_price,
      sale_price: batch.sale_price,
      quantity: batch.quantity,
      remaining_quantity: batch.remaining_quantity,
      status: batch.status
    });
    setFormError(null);
    setCurrentId(batch.id);
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
        const updated = await updateBatch(currentId, formData);
        setBatches((prev) =>
          prev.map((b) => (b.id === currentId ? updated : b))
        );
        showToast('Stock batch updated successfully.');
      } else {
        const created = await createBatch(formData);
        setBatches((prev) => [created, ...prev]);
        showToast('Stock batch checked in successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (batch) => {
    if (
      window.confirm(
        `Are you sure you want to delete Batch "${batch.batch_no}" from inventory?`
      )
    ) {
      setError(null);
      try {
        await deleteBatch(batch.id);
        setBatches((prev) => prev.filter((b) => b.id !== batch.id));
        showToast('Batch removed successfully.');
      } catch (err) {
        setError(err.message || 'Failed to delete batch.');
      }
    }
  };

  const showToast = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Helper: check expiry status & format style
  const getExpiryDetails = (dateStr) => {
    if (!dateStr) return { label: 'N/A', style: 'text-slate-400' };
    const exp = new Date(dateStr);
    const today = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);

    const formattedDate = exp.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    if (exp < today) {
      return { label: `${formattedDate} (Expired)`, style: 'text-red-650 dark:text-red-400 font-semibold' };
    } else if (exp <= sixMonthsFromNow) {
      return { label: `${formattedDate} (Expiring Soon)`, style: 'text-amber-600 dark:text-amber-400 font-semibold' };
    }
    return { label: formattedDate, style: 'text-slate-700 dark:text-slate-350' };
  };

  // Columns for DataTable
  const columns = [
    {
      key: 'batch_no',
      label: 'Batch No.',
      render: (val) => <span className="font-mono font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>{val}</span>
    },
    {
      key: 'medicine',
      label: 'Medicine details',
      render: (med) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{med?.name || 'Unknown Product'}</span>
          <span className="text-[10px] font-mono text-slate-500">{med?.generic_name || 'Generic formula N/A'}</span>
        </div>
      )
    },
    {
      key: 'quantity',
      label: 'Remaining / Initial Stock',
      render: (_, row) => {
        const baseAbbr = row.medicine?.base_unit?.abbreviation || 'Base';
        const isLow = row.remaining_quantity <= 0;
        return (
          <span className={`font-mono text-xs font-bold ${isLow ? 'text-red-500' : 'text-slate-700 dark:text-slate-350'}`}>
            {row.remaining_quantity} / {row.quantity} {baseAbbr}
          </span>
        );
      }
    },
    {
      key: 'expiry_date',
      label: 'Expiry Date',
      render: (val) => {
        const details = getExpiryDetails(val);
        return <span className={`text-xs ${details.style}`}>{details.label}</span>;
      }
    },
    {
      key: 'prices',
      label: 'Pricing (Base Unit)',
      render: (_, row) => (
        <div className="flex flex-col font-mono text-xs text-slate-650 dark:text-slate-400">
          <span>Cost: PKR {Number(row.purchase_price).toFixed(2)}</span>
          <span>Retail: PKR {Number(row.sale_price).toFixed(2)}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        let badgeStyle = '';
        if (val === 'ACTIVE') badgeStyle = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
        else if (val === 'EXPIRED') badgeStyle = 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30';
        else badgeStyle = 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-zinc-700/50';
        
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
            {val}
          </span>
        );
      }
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
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Physical Stock Batches"
        subtitle="Manage batch-specific pricing, physical stocks check-in, and track product expiries (FEFO indexes)."
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
          Check In Stock Batch
        </Button>
      </PageHeader>

      {/* Alert boards */}
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
          Loading batches database...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={batches}
          searchPlaceholder="Search batches by batch number or medicine name..."
        />
      )}

      {/* Check In Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Batch Details' : 'Check In Stock Batch'}
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
              {saving ? 'Saving...' : 'Check In Batch'}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SearchableSelect
              label="Select Medicine Product"
              name="medicine_id"
              required
              value={formData.medicine_id}
              onChange={handleFormChange}
              options={medicines.map(m => ({ value: m.id, label: `${m.name} (${m.sku})` }))}
              placeholder="Type medicine name or SKU..."
            />

            <Input
              label="Batch Code/Number"
              name="batch_no"
              required
              value={formData.batch_no}
              onChange={handleFormChange}
              placeholder="e.g. BATCH-123X"
            />

            <Input
              label="Expiry Date"
              name="expiry_date"
              type="date"
              required
              value={formData.expiry_date}
              onChange={handleFormChange}
            />

            <Input
              label="Check-In Quantity (In Base Unit)"
              name="quantity"
              type="number"
              required
              value={formData.quantity}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFormData(prev => ({
                  ...prev,
                  quantity: val,
                  remaining_quantity: !isEditMode ? val : prev.remaining_quantity
                }));
              }}
            />

            {isEditMode && (
              <Input
                label="Remaining Stock Count (In Base Unit)"
                name="remaining_quantity"
                type="number"
                required
                value={formData.remaining_quantity}
                onChange={handleFormChange}
              />
            )}

            <Input
              label="Purchase Price (Cost per single base unit)"
              name="purchase_price"
              type="number"
              step="0.01"
              required
              value={formData.purchase_price}
              onChange={handleFormChange}
              placeholder="PKR 0.00"
            />

            <Input
              label="Sale Price (Retail per single base unit)"
              name="sale_price"
              type="number"
              step="0.01"
              required
              value={formData.sale_price}
              onChange={handleFormChange}
              placeholder="PKR 0.00"
            />

            {isEditMode && (
              <Select
                label="Batch Status"
                name="status"
                required
                value={formData.status}
                onChange={handleFormChange}
                options={[
                  { value: 'ACTIVE', label: 'ACTIVE (For Sale)' },
                  { value: 'OUT_OF_STOCK', label: 'OUT OF STOCK (Deducted)' },
                  { value: 'EXPIRED', label: 'EXPIRED (Locked)' }
                ]}
                emptyOption={false}
              />
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Batches;
