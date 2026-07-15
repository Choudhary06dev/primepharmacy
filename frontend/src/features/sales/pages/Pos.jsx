import React, { useState, useEffect, useRef, useMemo } from 'react';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Select from '../../../components/UI/Select';
import SearchableSelect from '../../../components/UI/SearchableSelect';
import Modal from '../../../components/UI/Modal';
import { getMedicines, getUnits, getMedicine } from '../../../services/inventoryService';
import { getCustomers, createCustomer, checkoutPOS } from '../../../services/salesService';
import { useAuth } from '../../../context/AuthContext';

const Pos = () => {
  const { pharmacy, user } = useAuth();
  
  // Lists
  const [units, setUnits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Cart states
  const [selectedMedId, setSelectedMedId] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [medQty, setMedQty] = useState(1);
  const [cart, setCart] = useState([]);

  // Pricing summaries
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(5); // 5% default tax
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [customerId, setCustomerId] = useState('');

  // Modals & Receipts
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [customerSaving, setCustomerSaving] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // References for printing
  const receiptRef = useRef();

  useEffect(() => {
    fetchPOSData();
  }, []);

  const fetchPOSData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [unitsData, custData] = await Promise.all([
        getUnits(),
        getCustomers()
      ]);
      setUnits(unitsData);
      setCustomers(custData);
    } catch (err) {
      console.error(err);
      setError('Failed to configure POS registry. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // Medicine Selection Change (Fetch full details from server including batches/stock)
  useEffect(() => {
    if (!selectedMedId) {
      setSelectedMed(null);
      setSelectedUnitId('');
      return;
    }
    const loadSelectedMedicine = async () => {
      try {
        const med = await getMedicine(selectedMedId);
        setSelectedMed(med);
        setSelectedUnitId(med?.base_unit_id || '');
        setMedQty(1);
      } catch (err) {
        console.error('Error loading medicine details:', err);
        alert('Failed to load stock details for the selected medicine.');
        setSelectedMedId('');
      }
    };
    loadSelectedMedicine();
  }, [selectedMedId]);

  // Calculate dynamic options for packaging selector
  const activeUnitOptions = useMemo(() => {
    if (!selectedMed) return [];
    
    // Base unit is always an option
    const baseOpt = {
      value: selectedMed.base_unit_id,
      label: `${selectedMed.base_unit?.name} (${selectedMed.base_unit?.abbreviation}) - Base`,
      factor: 1
    };

    // Conversion units
    const convOpts = (selectedMed.conversions || []).map(c => ({
      value: c.from_unit_id,
      label: `${c.from_unit?.name} (${c.from_unit?.abbreviation}) - Pack of ${Number(c.factor)}`,
      factor: Number(c.factor)
    }));

    return [baseOpt, ...convOpts];
  }, [selectedMed]);

  // Pricing calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    return (cartSubtotal * taxRate) / 100;
  }, [cartSubtotal, taxRate]);

  const grandTotal = useMemo(() => {
    return Math.max(0, cartSubtotal + taxAmount - discount);
  }, [cartSubtotal, taxAmount, discount]);

  const changeReturn = useMemo(() => {
    const paid = Number(paidAmount || 0);
    return Math.max(0, paid - grandTotal);
  }, [paidAmount, grandTotal]);

  // Add Item to cart
  const handleAddToCart = () => {
    if (!selectedMed || !selectedUnitId) return;

    const unitOpt = activeUnitOptions.find(o => o.value === Number(selectedUnitId));
    const factor = unitOpt ? unitOpt.factor : 1;
    const reqBaseQty = medQty * factor;

    // Check inventory stock limits
    const existingInCart = cart
      .filter(item => item.medicine_id === selectedMed.id)
      .reduce((acc, curr) => acc + curr.quantity * curr.conversion_factor, 0);

    const totalRequested = reqBaseQty + existingInCart;
    if (totalRequested > selectedMed.total_stock) {
      alert(`Insufficient stock! Available in inventory: ${selectedMed.total_stock} ${selectedMed.base_unit?.abbreviation}. You have already requested ${existingInCart} in cart.`);
      return;
    }

    // Set prices: sale_price is per base unit, so pack price is sale_price * factor
    // To set retail packing price, we fetch first available batch or default retail from system
    // (mocking retail pricing per unit)
    const baseRetail = selectedMed.batches?.[0]?.sale_price 
      ? Number(selectedMed.batches[0].sale_price)
      : 50.00; // default mockup price if no batches checked in yet
    const unitPrice = baseRetail * factor;

    const cartItem = {
      id: Date.now() + Math.random(),
      medicine_id: selectedMed.id,
      name: selectedMed.name,
      generic_name: selectedMed.generic_name,
      unit_id: Number(selectedUnitId),
      unit_name: units.find(u => u.id === Number(selectedUnitId))?.abbreviation || 'PCS',
      quantity: medQty,
      unit_price: unitPrice,
      conversion_factor: factor,
    };

    setCart(prev => [...prev, cartItem]);
    
    // Clear selector
    setSelectedMedId('');
  };

  const handleRemoveFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Add New Customer Flow
  const handleCreateCustomerSubmit = async (e) => {
    e.preventDefault();
    setCustomerSaving(true);
    try {
      const created = await createCustomer(customerFormData);
      setCustomers(prev => [...prev, created]);
      setCustomerId(created.id);
      setIsCustomerModalOpen(false);
      setCustomerFormData({ name: '', phone: '', email: '', address: '' });
    } catch (err) {
      alert(err.message || 'Failed to save customer profiles.');
    } finally {
      setCustomerSaving(false);
    }
  };

  // Checkout process
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add items.');
      return;
    }

    const paidVal = Number(paidAmount || 0);
    if (paymentStatus === 'PAID' && paidVal < grandTotal) {
      alert('Paid amount cannot be less than Grand Total for PAID invoices. Adjust to PARTIALLY_PAID or DUE.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const payload = {
        customer_id: customerId ? Number(customerId) : null,
        sub_total: cartSubtotal,
        tax: taxAmount,
        discount: Number(discount),
        grand_total: grandTotal,
        paid_amount: paidVal,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          medicine_id: item.medicine_id,
          unit_id: item.unit_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          conversion_factor: item.conversion_factor
        }))
      };

      const result = await checkoutPOS(payload);
      setCheckoutResult(result.sale);
      
      // Clear Cart & States
      setCart([]);
      setDiscount(0);
      setPaidAmount('');
      setCustomerId('');
    } catch (err) {
      alert(err.message || 'Failed to process POS transaction checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Create simple print window styling
    document.body.innerHTML = `
      <div style="font-family: monospace; padding: 20px; max-width: 320px; margin: auto; font-size: 13px;">
        ${printContent}
      </div>
    `;
    window.print();
    document.body.innerHTML = originalContent;
    
    // Force complete react page refresh
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="POS Billing Terminal"
        subtitle="Point of sale cash checkout register. Stock auto-deduction with FEFO logic."
      />

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-650 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400 text-sm">
          Loading billing terminal registry...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT: Medicine search and selector */}
          <div className="lg:col-span-7 space-y-6 flex flex-col">
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm space-y-5 flex-1">
              <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>🛒</span> Selector Cart Add
              </h3>
              
              <div className="space-y-4">
                <SearchableSelect
                  label="Search Medicine / Generic barcode"
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  async={true}
                  onSearch={async (query) => {
                    const res = await getMedicines(undefined, query, 50, true);
                    return res.filter(m => m.is_active).map(m => ({
                      value: m.id,
                      label: `${m.name} | ${m.generic_name || 'Generic'} [Stock: ${m.total_stock} ${m.base_unit?.abbreviation || 'PCS'}]`
                    }));
                  }}
                  placeholder="Type to search medicine..."
                  helpText="Type and search product name or generic composition."
                />

                {selectedMed && (
                  <div className="grid grid-cols-2 gap-4 bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 p-4 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Manufacturer</span>
                      <span className="text-sm font-semibold">{selectedMed.company?.name || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Inventory Stock</span>
                      <span className="text-sm font-semibold font-mono text-brand-600 dark:text-brand-400">
                        {selectedMed.total_stock} {selectedMed.base_unit?.abbreviation}
                      </span>
                    </div>
                  </div>
                )}

                {selectedMed && (
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div className="col-span-2">
                      <Select
                        label="Packaging Unit"
                        value={selectedUnitId}
                        onChange={(e) => setSelectedUnitId(e.target.value)}
                        options={activeUnitOptions}
                        emptyOption={false}
                      />
                    </div>
                    <div>
                      <Input
                        label="Quantity"
                        type="number"
                        min="1"
                        value={medQty}
                        onChange={(e) => setMedQty(Math.max(1, Number(e.target.value)))}
                      />
                    </div>
                  </div>
                )}

                {selectedMed && (
                  <Button
                    onClick={handleAddToCart}
                    variant="primary"
                    className="w-full flex justify-center items-center gap-2"
                  >
                    <span>+</span> Add Medicine to Cart
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Cart & Checkout Summary */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm flex flex-col justify-between flex-1 space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-3">
                  <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-100">
                    Active Receipt List ({cart.length})
                  </h3>
                  <button 
                    onClick={() => setCart([])} 
                    className="text-xs font-semibold text-red-500 hover:underline"
                  >
                    Clear Cart
                  </button>
                </div>

                {/* Cart list items */}
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-xs">
                    <span>🛒 Empty Cart</span>
                    <span>Please add catalog medicines to checkout.</span>
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto space-y-3 pr-1">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-start gap-4 border-b border-slate-50 dark:border-zinc-900 pb-2">
                        <div className="flex-1">
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block truncate max-w-xs">{item.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-xs">{item.generic_name}</span>
                          <span className="text-[10px] font-mono bg-slate-150 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-450 mt-1 inline-block">
                            {item.quantity} {item.unit_name} x PKR {item.unit_price.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                            PKR {(item.quantity * item.unit_price).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-[10px] font-bold text-red-500 hover:underline mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing Form, Customer Selections */}
              <div className="border-t border-slate-100 dark:border-zinc-850 pt-4 space-y-4">
                
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Select
                      label="Select Customer"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      options={customers.map(c => ({ value: c.id, label: `${c.name} (${c.phone || 'N/A'})` }))}
                      emptyOptionLabel="-- Walk-in Customer --"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-6 text-sm py-2"
                    onClick={() => setIsCustomerModalOpen(true)}
                  >
                    + New
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <div className="rounded-xl bg-slate-50 dark:bg-zinc-900/40 p-4 border border-slate-200/50 dark:border-zinc-850 space-y-2.5">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Sub Total:</span>
                    <span className="font-mono font-semibold">PKR {cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Tax ({taxRate}%):</span>
                    <span className="font-mono font-semibold">PKR {taxAmount.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-red-500">
                      <span>Discount Deduction:</span>
                      <span className="font-mono font-semibold">- PKR {Number(discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t border-slate-200 dark:border-zinc-800 pt-2 text-slate-800 dark:text-slate-100">
                    <span>Grand Total:</span>
                    <span className="font-mono" style={{ color: 'var(--color-text-brand)' }}>PKR {grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Billing inputs */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input
                      label="Cash Received / Paid"
                      type="number"
                      required
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="PKR 0.00"
                    />
                  </div>
                  <div>
                    <Select
                      label="Method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      options={[
                        { value: 'Cash', label: 'Cash' },
                        { value: 'Card', label: 'Card' },
                        { value: 'Mobile Wallet', label: 'Wallet' }
                      ]}
                      emptyOption={false}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  <Select
                    label="Payment Status"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    options={[
                      { value: 'PAID', label: 'PAID' },
                      { value: 'PARTIALLY_PAID', label: 'PARTIALLY' },
                      { value: 'DUE', label: 'DUE (Credit)' }
                    ]}
                    emptyOption={false}
                  />
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Change Return</span>
                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-450">PKR {changeReturn.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  variant="primary"
                  className="w-full flex justify-center items-center gap-2 py-3"
                  disabled={checkoutLoading || cart.length === 0}
                >
                  {checkoutLoading ? 'Processing Invoice...' : '✓ Submit Invoice'}
                </Button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Register New Customer"
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCustomerModalOpen(false)}
              disabled={customerSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={customerSaving}
              onClick={handleCreateCustomerSubmit}
            >
              {customerSaving ? 'Saving...' : 'Save Customer'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateCustomerSubmit} className="space-y-4">
          <Input
            label="Customer Name"
            name="name"
            required
            value={customerFormData.name}
            onChange={(e) => setCustomerFormData(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Salim Shah"
          />
          <Input
            label="Phone Number"
            name="phone"
            value={customerFormData.phone}
            onChange={(e) => setCustomerFormData(p => ({ ...p, phone: e.target.value }))}
            placeholder="e.g. 0333-1234567"
          />
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={customerFormData.email}
            onChange={(e) => setCustomerFormData(p => ({ ...p, email: e.target.value }))}
            placeholder="e.g. salim@gmail.com"
          />
          <Input
            label="Address"
            name="address"
            value={customerFormData.address}
            onChange={(e) => setCustomerFormData(p => ({ ...p, address: e.target.value }))}
            placeholder="e.g. Block C2, Lahore"
          />
        </form>
      </Modal>

      {/* Checkout Print Receipt Popup */}
      {checkoutResult && (
        <Modal
          isOpen={!!checkoutResult}
          onClose={() => setCheckoutResult(null)}
          title="Checkout Completed Successfully"
          size="md"
          footer={
            <div className="flex gap-2 w-full justify-between">
              <Button
                variant="outline"
                onClick={() => setCheckoutResult(null)}
              >
                New Transaction
              </Button>
              <Button
                variant="primary"
                onClick={handlePrint}
              >
                🖨 Print Invoice
              </Button>
            </div>
          }
        >
          <div 
            ref={receiptRef}
            className="border-2 border-dashed border-slate-350 dark:border-zinc-800 p-4 rounded-xl bg-white text-black space-y-3 shadow-inner max-w-sm mx-auto"
            style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: 'monospace' }}
          >
            {/* Header */}
            <div className="text-center">
              <h2 className="text-lg font-bold font-display leading-tight">{pharmacy?.name || checkoutResult.pharmacy?.name || checkoutResult.branch?.name || 'PrimePharm ERP'}</h2>
              <p className="text-[10px] text-slate-500 leading-tight">{checkoutResult.branch?.address || 'Multan Road, Lahore, Pakistan'}</p>
              {checkoutResult.branch?.phone && (
                <p className="text-[10px] text-slate-400 font-mono leading-none">Phone: {checkoutResult.branch.phone}</p>
              )}
              <p className="text-xs font-semibold mt-1">INVOICE RECEIPT</p>
            </div>

            {/* Invoice Metadata in Side-by-Side rows */}
            <div className="border-t border-b border-dashed border-slate-300 py-1.5 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-bold font-mono">{checkoutResult.invoice_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-mono">{checkoutResult.sale_date ? checkoutResult.sale_date.split('T')[0] : ''}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 pt-0.5">
                <span>Cashier: {user?.name || 'Operator'}</span>
                <span>Cust: {checkoutResult.customer?.name || 'Walk-in'}</span>
              </div>
            </div>

            {/* Items List (Single Line layout) */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-bold border-b border-slate-200 pb-1">
                <span>Item [Qty]</span>
                <span>Subtotal</span>
              </div>
              
              {checkoutResult.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-0.5">
                  <div className="flex flex-col">
                    <span>{item.medicine?.name || item.name} [{item.quantity} {item.unit?.abbreviation || item.unit_name}]</span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      @ PKR {Number(item.unit_price).toFixed(2)}
                    </span>
                  </div>
                  <span className="font-semibold font-mono text-right">
                    PKR {(item.quantity * item.unit_price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary (Side-by-Side layout) */}
            <div className="border-t border-dashed border-slate-300 pt-1.5 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Subtotal: PKR {Number(checkoutResult.sub_total).toFixed(2)}</span>
                <span>Tax: PKR {Number(checkoutResult.tax).toFixed(2)}</span>
              </div>
              {Number(checkoutResult.discount) > 0 && (
                <div className="text-right text-red-650 font-mono">
                  <span>Discount: - PKR {Number(checkoutResult.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-b border-slate-200 py-1 my-1">
                <span>Grand Total:</span>
                <span>PKR {Number(checkoutResult.grand_total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Paid: PKR {Number(checkoutResult.paid_amount).toFixed(2)}</span>
                <span>Change: PKR {Math.max(0, checkoutResult.paid_amount - checkoutResult.grand_total).toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-400 border-t border-dashed border-slate-300 pt-2 leading-tight">
              <p>Thank You For Buying From Us!</p>
              <p>Software Powered by PrimePharm ERP</p>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default Pos;
