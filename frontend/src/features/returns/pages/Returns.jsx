import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Select from '../../../components/UI/Select';
import Modal from '../../../components/UI/Modal';
import { getSuppliers } from '../../../services/suppliersService';
import { getCustomers } from '../../../services/salesService';
import { getPurchases, getPurchaseDetails } from '../../../services/purchasesService';
import {
  getCustomerReturns,
  createCustomerReturn,
  getSupplierReturns,
  createSupplierReturn,
  getSupplierReturnDetails,
  getCustomerReturnDetails,
} from '../../../services/returnsService';
import { useBranchFilter } from '../../../context/BranchFilterContext';

const Returns = () => {
  const { selectedBranchId } = useBranchFilter();
  const location = useLocation();
  const [custReturns, setCustReturns] = useState([]);
  const [supReturns, setSupReturns] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Active Tab: 'customer' or 'supplier'
  const [activeTab, setActiveTab] = useState(
    location.pathname.includes('supplier') ? 'supplier' : 'customer'
  );

  useEffect(() => {
    setActiveTab(location.pathname.includes('supplier') ? 'supplier' : 'customer');
  }, [location.pathname]);

  // Return Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Fields State
  const [partnerId, setPartnerId] = useState('');
  const [returnNo, setReturnNo] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [grandTotal, setGrandTotal] = useState('');
  const [refundedAmount, setRefundedAmount] = useState('');

  // Purchases & Items for Supplier Returns
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [returnItems, setReturnItems] = useState([]);

  // Selected item form states
  const [selectedPurchaseItemId, setSelectedPurchaseItemId] = useState('');
  const [returnQty, setReturnQty] = useState(1);
  const [refundPrice, setRefundPrice] = useState('');

  // Details Modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [configLoading, setConfigLoading] = useState(false);

  // Reset lookup lists when branch changes so they reload for the active branch in modal
  useEffect(() => {
    setSuppliers([]);
    setCustomers([]);
    setPurchases([]);
  }, [selectedBranchId]);

  // Fetch only active tab's list of returns
  useEffect(() => {
    const fetchTabData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'customer') {
          const custRet = await getCustomerReturns();
          setCustReturns(custRet);
        } else {
          const supRet = await getSupplierReturns();
          setSupReturns(supRet);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load returns records. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchTabData();
  }, [activeTab, selectedBranchId]);

  // Lazy load form dropdown configuration data on modal open
  useEffect(() => {
    if (!isModalOpen) return;

    if (activeTab === 'customer' && customers.length > 0) return;
    if (activeTab === 'supplier' && suppliers.length > 0 && purchases.length > 0) return;

    const loadConfigData = async () => {
      setConfigLoading(true);
      try {
        if (activeTab === 'customer') {
          const custList = await getCustomers();
          setCustomers(custList);
        } else {
          const [supList, purchList] = await Promise.all([
            getSuppliers(),
            getPurchases(),
          ]);
          setSuppliers(supList);
          setPurchases(purchList);
        }
      } catch (err) {
        console.error(err);
        setFormError('Failed to load configuration metadata (Customers/Suppliers). Please try again.');
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfigData();
  }, [isModalOpen, activeTab]);

  // Filter purchases for selected supplier
  const supplierPurchases = React.useMemo(() => {
    if (activeTab !== 'supplier' || !partnerId) return [];
    return purchases.filter((p) => Number(p.supplier_id) === Number(partnerId));
  }, [purchases, partnerId, activeTab]);

  // Load items when purchase invoice is selected
  useEffect(() => {
    if (!selectedPurchaseId) {
      setPurchaseItems([]);
      return;
    }
    const fetchPurchaseItems = async () => {
      setPurchaseLoading(true);
      try {
        const details = await getPurchaseDetails(selectedPurchaseId);
        setPurchaseItems(details.items || []);
      } catch (err) {
        console.error(err);
        alert('Failed to load items for this purchase invoice.');
      } finally {
        setPurchaseLoading(false);
      }
    };
    fetchPurchaseItems();
  }, [selectedPurchaseId]);

  // Handle selected item details change
  useEffect(() => {
    if (!selectedPurchaseItemId) {
      setReturnQty(1);
      setRefundPrice('');
      return;
    }
    const item = purchaseItems.find((pi) => pi.id === Number(selectedPurchaseItemId));
    if (item) {
      setReturnQty(1);
      setRefundPrice(Number(item.unit_price || 0));
    }
  }, [selectedPurchaseItemId, purchaseItems]);

  // Calculate totals when returnItems cart changes
  useEffect(() => {
    if (activeTab === 'supplier') {
      const sum = returnItems.reduce((acc, ri) => acc + ri.quantity * ri.refund_price, 0);
      setGrandTotal(sum.toFixed(2));
      setRefundedAmount(sum.toFixed(2));
    }
  }, [returnItems, activeTab]);

  const handleOpenCreate = () => {
    setReturnNo(`RET-${Date.now().toString().slice(-6)}`);
    setReturnDate(new Date().toISOString().split('T')[0]);
    const initialPartner = activeTab === 'customer' ? (customers[0]?.id || '') : (suppliers[0]?.id || '');
    setPartnerId(initialPartner);
    setSelectedPurchaseId('');
    setPurchaseItems([]);
    setReturnItems([]);
    setSelectedPurchaseItemId('');
    setReturnQty(1);
    setRefundPrice('');
    setGrandTotal('');
    setRefundedAmount('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddReturnItem = (e) => {
    e.preventDefault();
    if (!selectedPurchaseItemId || !returnQty || !refundPrice) {
      alert('Please fill out all return item fields.');
      return;
    }
    const item = purchaseItems.find((pi) => pi.id === Number(selectedPurchaseItemId));
    if (!item) return;

    if (Number(returnQty) > Number(item.quantity)) {
      alert(`Cannot return more than purchased quantity (${item.quantity} ${item.unit?.abbreviation || 'units'}).`);
      return;
    }

    const exists = returnItems.some((ri) => ri.purchase_item_id === item.id);
    if (exists) {
      alert('This item is already added to the return list. Remove it first to modify.');
      return;
    }

    const newReturnItem = {
      id: Date.now() + Math.random(),
      purchase_item_id: item.id,
      medicine_id: item.medicine_id,
      medicine_name: item.medicine?.name || item.medicine_name,
      unit_id: item.unit_id,
      unit_name: item.unit?.name || item.unit_name,
      unit_abbreviation: item.unit?.abbreviation || item.unit_name || 'units',
      quantity: Number(returnQty),
      refund_price: Number(refundPrice),
      batch_no: item.batch_no,
      expiry_date: item.expiry_date
    };

    setReturnItems((prev) => [...prev, newReturnItem]);
    setSelectedPurchaseItemId('');
    setReturnQty(1);
    setRefundPrice('');
  };

  const handleRemoveReturnItem = (id) => {
    setReturnItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!partnerId || !returnNo || !grandTotal || !refundedAmount) {
      setFormError('Please fill out all required fields.');
      return;
    }

    setSaving(true);
    try {
      if (activeTab === 'customer') {
        const payload = {
          customer_id: Number(partnerId),
          return_no: returnNo,
          return_date: returnDate,
          grand_total: Number(grandTotal),
          refunded_amount: Number(refundedAmount),
        };
        const created = await createCustomerReturn(payload);
        setCustReturns((prev) => [created, ...prev]);
        showToast('Customer return logged. Customer ledger & balance updated.');
      } else {
        if (!selectedPurchaseId) {
          setFormError('Please select a purchase invoice.');
          setSaving(false);
          return;
        }
        if (returnItems.length === 0) {
          setFormError('Please add at least one item to return.');
          setSaving(false);
          return;
        }
        const payload = {
          supplier_id: Number(partnerId),
          purchase_id: Number(selectedPurchaseId),
          return_no: returnNo,
          return_date: returnDate,
          grand_total: Number(grandTotal),
          refunded_amount: Number(refundedAmount),
          items: returnItems.map((ri) => ({
            purchase_item_id: ri.purchase_item_id,
            quantity: Number(ri.quantity),
            refund_price: Number(ri.refund_price),
          })),
        };
        const created = await createSupplierReturn(payload);
        setSupReturns((prev) => [created, ...prev]);
        showToast('Supplier return logged. Supplier ledger & stock levels updated.');
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleViewReturnDetails = async (row) => {
    setDetailLoading(true);
    setDetailData(null);
    setIsDetailOpen(true);
    try {
      if (activeTab === 'supplier') {
        const details = await getSupplierReturnDetails(row.id);
        setDetailData(details);
      } else {
        const details = await getCustomerReturnDetails(row.id);
        setDetailData(details);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load return transaction details.');
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const showToast = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const customerColumns = [
    {
      key: 'return_no',
      label: 'Return Ref #',
      render: (val, row) => (
        <button
          onClick={() => handleViewReturnDetails(row)}
          className="font-mono text-xs font-semibold hover:underline text-brand-600 dark:text-brand-400 text-left"
        >
          {val}
        </button>
      ),
    },
    {
      key: 'customer',
      label: 'Customer Name',
      render: (val) => <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{val?.name || 'Walk-in'}</span>,
    },
    {
      key: 'return_date',
      label: 'Return Date',
      render: (val) => <span className="font-mono text-xs text-slate-500">{new Date(val).toLocaleDateString()}</span>,
    },
    {
      key: 'grand_total',
      label: 'Returned Items Value',
      render: (val) => <span className="font-mono text-xs">PKR {Number(val).toFixed(2)}</span>,
    },
    {
      key: 'refunded_amount',
      label: 'Refunded / Adjusted',
      render: (val) => <span className="font-mono text-xs font-bold text-red-500">PKR {Number(val).toFixed(2)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => handleViewReturnDetails(row)}
          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
        >
          View Details
        </button>
      ),
    }
  ];

  const supplierColumns = [
    {
      key: 'return_no',
      label: 'Return Ref #',
      render: (val, row) => (
        <button
          onClick={() => handleViewReturnDetails(row)}
          className="font-mono text-xs font-semibold hover:underline text-brand-600 dark:text-brand-400 text-left"
        >
          {val}
        </button>
      ),
    },
    {
      key: 'supplier',
      label: 'Supplier Name',
      render: (val) => <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{val?.name || 'Unknown'}</span>,
    },
    {
      key: 'items',
      label: 'Returned Medicines',
      render: (_, row) => {
        const items = row.items || [];
        if (items.length === 0) return <span className="text-slate-450 dark:text-slate-550 italic text-xs">No items breakdown</span>;
        const names = items.map((i) => i.medicine?.name || i.medicine_name || 'Medicine').join(', ');
        return (
          <span className="text-xs truncate max-w-xs block text-slate-700 dark:text-slate-350" title={names}>
            {names}
          </span>
        );
      }
    },
    {
      key: 'return_date',
      label: 'Return Date',
      render: (val) => <span className="font-mono text-xs text-slate-500">{new Date(val).toLocaleDateString()}</span>,
    },
    {
      key: 'grand_total',
      label: 'Returned Items Value',
      render: (val) => <span className="font-mono text-xs">PKR {Number(val).toFixed(2)}</span>,
    },
    {
      key: 'refunded_amount',
      label: 'Refunded / Adjusted',
      render: (val) => <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-450">PKR {Number(val).toFixed(2)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => handleViewReturnDetails(row)}
          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
        >
          View Details
        </button>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns Registry"
        subtitle="Record medicines returned by customer bills or returned back to wholesale vendors."
      >
        <Button onClick={handleOpenCreate} variant="primary">
          Log New Return
        </Button>
      </PageHeader>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-zinc-850">
        <button
          onClick={() => setActiveTab('customer')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'customer'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-display'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Customer Return Logs
        </button>
        <button
          onClick={() => setActiveTab('supplier')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'supplier'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-display'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Supplier Return Logs
        </button>
      </div>

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
          Loading returns database...
        </div>
      ) : activeTab === 'customer' ? (
        <DataTable
          columns={customerColumns}
          data={custReturns}
          searchPlaceholder="Search customer returns by reference number..."
        />
      ) : (
        <DataTable
          columns={supplierColumns}
          data={supReturns}
          searchPlaceholder="Search supplier returns by reference number..."
        />
      )}

      {/* Log Return Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeTab === 'customer' ? 'Log Customer Product Return' : 'Log Return to Wholesale Supplier'}
        size={activeTab === 'supplier' ? 'xl' : 'lg'}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving || (activeTab === 'supplier' && returnItems.length === 0)} onClick={handleFormSubmit}>
              {saving ? 'Logging...' : 'Save Return'}
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

          {configLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400 text-sm gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading return configuration options (customers, suppliers, purchases)...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTab === 'customer' ? (
              <Select
                label="Select Customer"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                options={customers.map((c) => ({ value: c.id, label: c.name }))}
                required
              />
            ) : (
              <Select
                label="Select Supplier"
                value={partnerId}
                onChange={(e) => {
                  setPartnerId(e.target.value);
                  setSelectedPurchaseId('');
                  setPurchaseItems([]);
                  setReturnItems([]);
                }}
                options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
                required
              />
            )}
            {activeTab === 'supplier' && (
              <Select
                label="Select Purchase Invoice"
                value={selectedPurchaseId}
                onChange={(e) => {
                  setSelectedPurchaseId(e.target.value);
                  setSelectedPurchaseItemId('');
                  setReturnItems([]);
                }}
                options={supplierPurchases.map((p) => ({
                  value: p.id,
                  label: `${p.purchase_no} - ${new Date(p.purchase_date).toLocaleDateString()} (Total: PKR ${Number(p.grand_total).toFixed(2)})`
                }))}
                emptyOptionLabel="-- Select Purchase Invoice --"
                required
                disabled={!partnerId}
              />
            )}
            <Input
              label="Return Reference #"
              value={returnNo}
              onChange={(e) => setReturnNo(e.target.value)}
              required
            />
            <Input
              label="Return Date"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
            />
          </div>

          {activeTab === 'supplier' && selectedPurchaseId && (
            <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 bg-slate-50 dark:bg-zinc-900/30 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Add Returned Item
              </h4>
              {purchaseLoading ? (
                <div className="text-xs text-slate-500 py-2">Loading items for purchase invoice...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <Select
                    label="Select Medicine Item"
                    value={selectedPurchaseItemId}
                    onChange={(e) => setSelectedPurchaseItemId(e.target.value)}
                    options={purchaseItems.map((pi) => ({
                      value: pi.id,
                      label: `${pi.medicine?.name || pi.medicine_name} (Qty: ${pi.quantity} ${pi.unit?.abbreviation || 'units'}, Batch: ${pi.batch_no})`
                    }))}
                    emptyOptionLabel="-- Select Medicine --"
                  />
                  <Input
                    label="Return Quantity"
                    type="number"
                    value={returnQty}
                    onChange={(e) => setReturnQty(Math.max(1, Number(e.target.value)))}
                    disabled={!selectedPurchaseItemId}
                  />
                  <Input
                    label="Refund Price (PKR)"
                    type="number"
                    value={refundPrice}
                    onChange={(e) => setRefundPrice(Math.max(0, Number(e.target.value)))}
                    disabled={!selectedPurchaseItemId}
                  />
                  <Button type="button" variant="outline" className="w-full py-2.5 text-xs font-semibold" onClick={handleAddReturnItem} disabled={!selectedPurchaseItemId}>
                    + Add to Return
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'supplier' && returnItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Returned Items Cart
              </h4>
              <div className="border border-slate-200 dark:border-zinc-850 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-850 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      <th className="px-4 py-3">Medicine</th>
                      <th className="px-4 py-3">Batch & Expiry</th>
                      <th className="px-4 py-3 text-right">Return Qty</th>
                      <th className="px-4 py-3 text-right">Refund Price</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                    {returnItems.map((item) => (
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
                          {item.quantity} {item.unit_abbreviation}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          PKR {item.refund_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          PKR {(item.quantity * item.refund_price).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveReturnItem(item.id)}
                            className="text-xs font-bold text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Returned Goods Value (PKR)"
              type="number"
              value={grandTotal}
              onChange={(e) => setGrandTotal(Math.max(0, Number(e.target.value)))}
              required
              disabled={activeTab === 'supplier'}
            />
            <Input
              label="Refunded / Adjusted Amount (PKR)"
              type="number"
              value={refundedAmount}
              onChange={(e) => setRefundedAmount(Math.max(0, Number(e.target.value)))}
              required
            />
          </div>
        </>)}
      </form>
      </Modal>

      {/* View Return Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={activeTab === 'customer' ? 'Customer Return Details' : 'Supplier Return Details'}
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setIsDetailOpen(false)}>
            Close Details
          </Button>
        }
      >
        {detailLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading return details...</div>
        ) : !detailData ? (
          <div className="p-8 text-center text-sm text-red-500">Failed to fetch return details.</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100 dark:border-zinc-850 pb-4 text-xs">
              <div>
                <span className="text-slate-450 dark:text-slate-500 block uppercase tracking-wider text-[9px] font-bold">
                  {activeTab === 'customer' ? 'Customer' : 'Supplier'}
                </span>
                <span className="font-semibold text-slate-750 dark:text-slate-200">
                  {activeTab === 'customer' ? (detailData.customer?.name || 'Walk-in') : detailData.supplier?.name}
                </span>
              </div>
              <div>
                <span className="text-slate-450 dark:text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Return Ref No</span>
                <span className="font-mono font-semibold text-brand-650 dark:text-brand-400">{detailData.return_no}</span>
              </div>
              <div>
                <span className="text-slate-450 dark:text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Return Date</span>
                <span className="font-mono text-slate-750 dark:text-slate-200">{new Date(detailData.return_date).toLocaleDateString()}</span>
              </div>
              {activeTab === 'supplier' && detailData.purchase && (
                <div>
                  <span className="text-slate-450 dark:text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Original Purchase Invoice</span>
                  <span className="font-mono font-semibold text-slate-750 dark:text-slate-200">{detailData.purchase.purchase_no}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Returned Medicines</h4>
              <div className="border border-slate-100 dark:border-zinc-850 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-zinc-950 text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-850 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      <th className="px-4 py-2.5">Medicine</th>
                      <th className="px-4 py-2.5">Batch</th>
                      <th className="px-4 py-2.5 text-right">Returned Qty</th>
                      <th className="px-4 py-2.5 text-right">Refund Unit Price</th>
                      <th className="px-4 py-2.5 text-right">Total Refund</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-900 font-medium">
                    {(!detailData.items || detailData.items.length === 0) ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-4 text-center text-slate-400 italic">No item breakdown available.</td>
                      </tr>
                    ) : (
                      detailData.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2.5">{item.medicine?.name || item.medicine_name}</td>
                          <td className="px-4 py-2.5 font-mono text-[10px]">{item.batch_no || item.batch?.batch_no || 'N/A'}</td>
                          <td className="px-4 py-2.5 text-right font-mono">
                            {item.quantity} {item.unit?.abbreviation || item.unit_name || 'units'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-500">
                            PKR {Number(item.refund_price).toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">
                            PKR {(item.quantity * item.refund_price).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-64 bg-slate-50 dark:bg-zinc-900/60 p-4 border border-slate-150 dark:border-zinc-850 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Total Returned Value:</span>
                  <span className="font-mono font-semibold">PKR {Number(detailData.grand_total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-zinc-850 pt-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                  <span>Refunded / Adjusted:</span>
                  <span className="font-mono">PKR {Number(detailData.refunded_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Returns;
