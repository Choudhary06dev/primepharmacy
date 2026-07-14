import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Select from '../../../components/UI/Select';
import SearchableSelect from '../../../components/UI/SearchableSelect';
import Modal from '../../../components/UI/Modal';
import { getPurchases, getPurchaseDetails, createPurchase } from '../../../services/purchasesService';
import { getSuppliers } from '../../../services/suppliersService';
import { getMedicines, getMedicine, getUnits, getCategories, getCompanies, createMedicine } from '../../../services/inventoryService';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // New Purchase Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [purchaseNo, setPurchaseNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierId, setSupplierId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');

  // Items list in the new purchase cart
  const [items, setItems] = useState([]);

  // Quick Add Medicine Modal States
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({
    name: '',
    generic_name: '',
    category_id: '',
    company_id: '',
    base_unit_id: '',
    barcode: '',
    sku: '',
    min_stock_level: 0,
  });
  const [quickAddError, setQuickAddError] = useState(null);
  const [quickAdding, setQuickAdding] = useState(false);

  const handleQuickAddSubmit = async () => {
    setQuickAddError(null);
    if (!quickAddForm.name || !quickAddForm.category_id || !quickAddForm.company_id || !quickAddForm.base_unit_id) {
      setQuickAddError('Please fill out all required fields (Name, Category, Company, and Base Unit).');
      return;
    }

    setQuickAdding(true);
    try {
      const payload = {
        name: quickAddForm.name,
        generic_name: quickAddForm.generic_name,
        category_id: Number(quickAddForm.category_id),
        company_id: Number(quickAddForm.company_id),
        base_unit_id: Number(quickAddForm.base_unit_id),
        sku: quickAddForm.sku || undefined,
        barcode: quickAddForm.barcode || undefined,
        min_stock_level: Number(quickAddForm.min_stock_level || 0),
        is_active: true,
        conversions: [],
      };

      const newMedicine = await createMedicine(payload);
      
      // Add the new medicine to the local list
      setMedicines((prev) => [...prev, newMedicine]);
      
      // Auto-select the newly added medicine
      setSelectedMedId(newMedicine.id.toString());
      
      // Close the modal
      setIsQuickAddOpen(false);
      
      showToast(`Medicine "${newMedicine.name}" created and selected.`);
    } catch (err) {
      setQuickAddError(err.message || 'Failed to create medicine.');
    } finally {
      setQuickAdding(false);
    }
  };

  // Selected item form in the modal
  const [selectedMedId, setSelectedMedId] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Detail view Modal States
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [purchData, supData, unitsData, catsData, compsData] = await Promise.all([
        getPurchases(),
        getSuppliers(),
        getUnits(),
        getCategories(),
        getCompanies(),
      ]);
      setPurchases(purchData);
      setSuppliers(supData);
      setUnits(unitsData);
      setCategories(catsData);
      setCompanies(compsData);
    } catch (err) {
      console.error(err);
      setError('Failed to load purchases configuration database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Medicine Selection Change in Form — fetch full details from server
  useEffect(() => {
    if (!selectedMedId) {
      setSelectedMed(null);
      setSelectedUnitId('');
      setUnitCost('');
      setSalePrice('');
      return;
    }
    const loadMedicine = async () => {
      try {
        const med = await getMedicine(selectedMedId);
        setSelectedMed(med);
        setSelectedUnitId(med?.base_unit_id || '');
        setUnitCost('');
        setSalePrice('');
      } catch (err) {
        console.error('Error loading medicine details:', err);
        setSelectedMedId('');
      }
    };
    loadMedicine();
  }, [selectedMedId]);

  // Available units based on selected medicine
  const activeUnitOptions = useMemo(() => {
    if (!selectedMed) return [];
    const baseOpt = {
      value: selectedMed.base_unit_id,
      label: `${selectedMed.base_unit?.name} (${selectedMed.base_unit?.abbreviation}) - Base`,
      factor: 1,
    };
    const convOpts = (selectedMed.conversions || []).map((c) => ({
      value: c.from_unit_id,
      label: `${c.from_unit?.name} (${c.from_unit?.abbreviation}) - Pack of ${Number(c.factor)}`,
      factor: Number(c.factor),
    }));
    return [baseOpt, ...convOpts];
  }, [selectedMed]);

  // Conversion factor helper
  const selectedConversionFactor = useMemo(() => {
    const opt = activeUnitOptions.find((o) => Number(o.value) === Number(selectedUnitId));
    return opt ? opt.factor : 1;
  }, [selectedUnitId, activeUnitOptions]);

  const handleOpenCreate = () => {
    setPurchaseNo(`PO-${Date.now().toString().slice(-6)}`);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setSupplierId(suppliers[0]?.id || '');
    setPaymentStatus('PAID');
    setPaymentMethod('Cash');
    setPaidAmount('');
    setDiscount(0);
    setTaxRate(0);
    setNotes('');
    setItems([]);
    setFormError(null);
    // Reset selection states
    setSelectedMedId('');
    setQty(1);
    setUnitCost('');
    setSalePrice('');
    setBatchNo('');
    setExpiryDate('');
    setIsModalOpen(true);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!selectedMedId || !selectedUnitId || !qty || !unitCost || !batchNo || !expiryDate || !salePrice) {
      alert('Please fill out all item fields (Medicine, Unit, Quantity, Purchase Price, Retail Price, Batch #, and Expiry Date).');
      return;
    }

    const itemUnit = units.find((u) => u.id === Number(selectedUnitId));
    const newItem = {
      id: Date.now() + Math.random(),
      medicine_id: Number(selectedMedId),
      medicine_name: selectedMed?.name,
      unit_id: Number(selectedUnitId),
      unit_name: itemUnit?.name || 'Unit',
      quantity: Number(qty),
      unit_price: Number(unitCost),
      conversion_factor: selectedConversionFactor,
      batch_no: batchNo,
      expiry_date: expiryDate,
      sale_price: Number(salePrice),
    };

    setItems((prev) => [...prev, newItem]);
    // Reset selection inputs
    setSelectedMedId('');
    setQty(1);
    setUnitCost('');
    setSalePrice('');
    setBatchNo('');
    setExpiryDate('');
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return (subtotal * Number(taxRate || 0)) / 100;
  }, [subtotal, taxRate]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + taxAmount - Number(discount || 0));
  }, [subtotal, taxAmount, discount]);

  // Handle paid amount auto-update on status change
  useEffect(() => {
    if (paymentStatus === 'PAID') {
      setPaidAmount(grandTotal.toFixed(2));
    } else if (paymentStatus === 'DUE') {
      setPaidAmount('0.00');
    }
  }, [paymentStatus, grandTotal]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (items.length === 0) {
      setFormError('Please add at least one line item before checking out.');
      return;
    }
    if (!supplierId) {
      setFormError('Please select a supplier.');
      return;
    }

    setSaving(true);
    const payload = {
      supplier_id: Number(supplierId),
      purchase_no: purchaseNo,
      purchase_date: purchaseDate,
      sub_total: subtotal,
      tax: taxAmount,
      discount: Number(discount),
      grand_total: grandTotal,
      paid_amount: Number(paidAmount || 0),
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      notes: notes,
      items: items.map((i) => ({
        medicine_id: i.medicine_id,
        unit_id: i.unit_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        conversion_factor: i.conversion_factor,
        batch_no: i.batch_no,
        expiry_date: i.expiry_date,
        sale_price: i.sale_price,
      })),
    };

    try {
      const created = await createPurchase(payload);
      setPurchases((prev) => [created, ...prev]);
      showToast('Purchase registered successfully. Stock inwarded.');
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to record purchase. Verify form fields.');
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = async (id) => {
    setDetailLoading(true);
    setDetailData(null);
    setIsDetailOpen(true);
    try {
      const details = await getPurchaseDetails(id);
      setDetailData(details);
    } catch (err) {
      console.error(err);
      alert('Failed to load invoice receipt details.');
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const showToast = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const columns = [
    {
      key: 'purchase_no',
      label: 'Invoice / PO #',
      render: (val, row) => (
        <button
          onClick={() => handleViewDetails(row.id)}
          className="text-xs font-semibold hover:underline text-brand-600 dark:text-brand-400 font-mono"
        >
          {val}
        </button>
      ),
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (val) => (
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {val?.name || 'Unknown'}
        </span>
      ),
    },
    {
      key: 'purchase_date',
      label: 'Purchase Date',
      render: (val) => {
        const d = new Date(val);
        return <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>{d.toLocaleDateString()}</span>;
      },
    },
    {
      key: 'grand_total',
      label: 'Grand Total',
      render: (val) => (
        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
          PKR {Number(val).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'payment_status',
      label: 'Status',
      render: (val) => {
        let style = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
        if (val === 'DUE') {
          style = 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
        } else if (val === 'PARTIALLY_PAID') {
          style = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
        }
        return (
          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${style}`}>
            {val}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => handleViewDetails(row.id)}
          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
        >
          View Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Invoices"
        subtitle="Manage supplier wholesale stock invoices and log incoming batches."
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
          New Purchase Inward
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
          Loading purchases database...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={purchases}
          searchPlaceholder="Search purchases by invoice number or supplier name..."
        />
      )}

      {/* New Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Inward Stock - Register Purchase Invoice"
        size="xl"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving || items.length === 0} onClick={handleFormSubmit}>
              {saving ? 'Registering...' : 'Register Purchase Inward'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {formError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-650 dark:text-red-400">
              ⚠️ {formError}
            </div>
          )}

          {/* Invoice Meta */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
              required
            />
            <Input
              label="Invoice / Bill No"
              value={purchaseNo}
              onChange={(e) => setPurchaseNo(e.target.value)}
              required
            />
            <Input
              label="Inward Date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
            <Select
              label="Payment Status"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              options={[
                { value: 'PAID', label: 'Paid (Full)' },
                { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
                { value: 'DUE', label: 'Due / Pending' },
              ]}
            />
          </div>

          {/* Add Item Form */}
          <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 bg-slate-50 dark:bg-zinc-900/30 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Add Line Item
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex justify-between items-center -mb-1">
                  <label className="block text-xs font-semibold text-black dark:text-slate-400 uppercase tracking-wider">
                    Select Medicine
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAddForm({
                        name: '',
                        generic_name: '',
                        category_id: categories[0]?.id || '',
                        company_id: companies[0]?.id || '',
                        base_unit_id: units[0]?.id || '',
                        barcode: '',
                        sku: '',
                        min_stock_level: 0,
                      });
                      setQuickAddError(null);
                      setIsQuickAddOpen(true);
                    }}
                    className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                  >
                    + Quick Add
                  </button>
                </div>
                <SearchableSelect
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  async={true}
                  onSearch={async (query) => {
                    const res = await getMedicines(undefined, query, 50, true);
                    return res.filter(m => m.is_active).map(m => ({ value: m.id, label: m.name }));
                  }}
                  placeholder="Type to search product..."
                />
              </div>
              <Select
                label="Selected Unit"
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                options={activeUnitOptions}
                disabled={!selectedMedId}
              />
              <Input
                label="Purchase Qty"
                type="number"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                disabled={!selectedMedId}
              />
              <Input
                label="Unit Cost Price (PKR)"
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(Math.max(0, Number(e.target.value)))}
                placeholder="0.00"
                disabled={!selectedMedId}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Retail Sale Price (PKR)"
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(Math.max(0, Number(e.target.value)))}
                placeholder="0.00"
                disabled={!selectedMedId}
              />
              <Input
                label="Batch Number"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                placeholder="e.g. B-101"
                disabled={!selectedMedId}
              />
              <Input
                label="Expiry Date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                disabled={!selectedMedId}
              />
              <div className="flex items-end">
                <Button type="button" variant="outline" className="w-full py-2.5 text-xs font-semibold" onClick={handleAddItem} disabled={!selectedMedId}>
                  + Add Line Item
                </Button>
              </div>
            </div>
          </div>

          {/* Cart Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Purchased Line Items
            </h4>
            <div className="border border-slate-200 dark:border-zinc-850 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-850 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    <th className="px-4 py-3">Medicine</th>
                    <th className="px-4 py-3">Batch & Expiry</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Retail</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-900 text-xs">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                        No inward items added. Select a medicine above to create items.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                          {item.medicine_name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col text-[10px] font-mono">
                            <span>Batch: {item.batch_no}</span>
                            <span className="text-slate-500">Exp: {item.expiry_date}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium">
                          {item.quantity} {item.unit_name}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          PKR {item.unit_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-450">
                          PKR {item.sale_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          PKR {(item.quantity * item.unit_price).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-xs font-bold text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  options={[
                    { value: 'Cash', label: 'Cash' },
                    { value: 'Bank Transfer', label: 'Bank Transfer' },
                    { value: 'Cheque', label: 'Cheque' },
                  ]}
                />
                <Input
                  label="Paid Amount (PKR)"
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  disabled={paymentStatus === 'PAID' || paymentStatus === 'DUE'}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                  Internal Invoice Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="2"
                  placeholder="e.g. Received intact, verified batch number..."
                  className="w-full text-sm outline-none px-4 py-2.5 rounded-lg border-2 border-slate-400 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900/60 text-black dark:text-slate-100 placeholder-slate-600 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 border border-slate-200/50 dark:border-zinc-850 rounded-2xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Discount (PKR)"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                />
                <Input
                  label="Tax Rate (%)"
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div className="border-t border-slate-200 dark:border-zinc-800 my-2 pt-2 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Sub Total:</span>
                  <span className="font-mono font-semibold">PKR {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax ({taxRate}%):</span>
                  <span className="font-mono font-semibold">PKR {taxAmount.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount:</span>
                    <span className="font-mono font-semibold">- PKR {Number(discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 dark:border-zinc-800 pt-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                  <span>Grand Total:</span>
                  <span className="font-mono">PKR {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Purchase Invoice Details"
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setIsDetailOpen(false)}>
            Close Receipt
          </Button>
        }
      >
        {detailLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading invoice items details...</div>
        ) : !detailData ? (
          <div className="p-8 text-center text-sm text-red-500">Failed to fetch invoice.</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100 dark:border-zinc-850 pb-4 text-xs">
              <div>
                <span className="text-slate-450 dark:text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Supplier</span>
                <span className="font-semibold text-slate-750 dark:text-slate-200">{detailData.supplier?.name}</span>
              </div>
              <div>
                <span className="text-slate-450 dark:text-slate-500 block uppercase tracking-wider text-[9px] font-bold">PO Invoice No</span>
                <span className="font-mono font-semibold text-brand-650 dark:text-brand-400">{detailData.purchase_no}</span>
              </div>
              <div>
                <span className="text-slate-450 dark:text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Inward Date</span>
                <span className="font-mono text-slate-750 dark:text-slate-200">{new Date(detailData.purchase_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-450 dark:text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Inward Status</span>
                <span className="font-semibold text-slate-750 dark:text-slate-200">{detailData.payment_status}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Inwarded Stock Items</h4>
              <div className="border border-slate-100 dark:border-zinc-850 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-zinc-950 text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-850 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      <th className="px-4 py-2.5">Medicine</th>
                      <th className="px-4 py-2.5">Batch</th>
                      <th className="px-4 py-2.5">Expiry</th>
                      <th className="px-4 py-2.5 text-right">Inwarded Qty</th>
                      <th className="px-4 py-2.5 text-right">Cost</th>
                      <th className="px-4 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-900 font-medium">
                    {detailData.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2.5">{item.medicine?.name}</td>
                        <td className="px-4 py-2.5 font-mono text-[10px]">{item.batch_no}</td>
                        <td className="px-4 py-2.5 font-mono text-[10px]">{item.expiry_date}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{item.quantity} {item.unit?.abbreviation || 'Units'}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500">PKR {Number(item.unit_price).toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-right font-mono">PKR {(item.quantity * item.unit_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-64 bg-slate-50 dark:bg-zinc-900/60 p-4 border border-slate-150 dark:border-zinc-850 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Sub Total:</span>
                  <span className="font-mono font-semibold">PKR {Number(detailData.sub_total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax:</span>
                  <span className="font-mono font-semibold">PKR {Number(detailData.tax).toFixed(2)}</span>
                </div>
                {Number(detailData.discount) > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount:</span>
                    <span className="font-mono font-semibold">- PKR {Number(detailData.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 dark:border-zinc-850 pt-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                  <span>Grand Total:</span>
                  <span className="font-mono">PKR {Number(detailData.grand_total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>Paid Amount:</span>
                  <span className="font-mono">PKR {Number(detailData.paid_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Quick Add Medicine Modal */}
      <Modal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        title="Quick Add Medicine"
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsQuickAddOpen(false)} disabled={quickAdding}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleQuickAddSubmit} disabled={quickAdding}>
              {quickAdding ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {quickAddError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-650 dark:text-red-400">
              ⚠️ {quickAddError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Medicine Name *"
              value={quickAddForm.name}
              onChange={(e) => setQuickAddForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              placeholder="e.g. Panadol 500mg"
            />
            <Input
              label="Generic Name / Formula"
              value={quickAddForm.generic_name}
              onChange={(e) => setQuickAddForm((prev) => ({ ...prev, generic_name: e.target.value }))}
              placeholder="e.g. Paracetamol"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category *"
              value={quickAddForm.category_id}
              onChange={(e) => setQuickAddForm((prev) => ({ ...prev, category_id: e.target.value }))}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              required
              emptyOption="-- Select Category --"
            />
            <Select
              label="Company / Manufacturer *"
              value={quickAddForm.company_id}
              onChange={(e) => setQuickAddForm((prev) => ({ ...prev, company_id: e.target.value }))}
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
              required
              emptyOption="-- Select Company --"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Base Unit *"
              value={quickAddForm.base_unit_id}
              onChange={(e) => setQuickAddForm((prev) => ({ ...prev, base_unit_id: e.target.value }))}
              options={units.map((u) => ({ value: u.id, label: `${u.name} (${u.abbreviation})` }))}
              required
              emptyOption="-- Select Unit --"
            />
            <Input
              label="Min Stock Level"
              type="number"
              value={quickAddForm.min_stock_level}
              onChange={(e) => setQuickAddForm((prev) => ({ ...prev, min_stock_level: Math.max(0, Number(e.target.value)) }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SKU"
              value={quickAddForm.sku}
              onChange={(e) => setQuickAddForm((prev) => ({ ...prev, sku: e.target.value }))}
              placeholder="Auto-generated if empty"
            />
            <Input
              label="Barcode"
              value={quickAddForm.barcode}
              onChange={(e) => setQuickAddForm((prev) => ({ ...prev, barcode: e.target.value }))}
              placeholder="e.g. 50123456789"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Purchases;
