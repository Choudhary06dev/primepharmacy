import api from './api';

const CUST_RETURNS_KEY = 'primepharm_mock_customer_returns';
const SUP_RETURNS_KEY = 'primepharm_mock_supplier_returns';

const isMockMode = () => localStorage.getItem('primepharm_auth_mode') === 'mock';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getActivePharmacyId = () => {
  const user = localStorage.getItem('primepharm_user')
    ? JSON.parse(localStorage.getItem('primepharm_user'))
    : null;
  return user ? Number(user.pharmacy_id) : null;
};

// --- CUSTOMER RETURNS ---
export const getCustomerReturns = async () => {
  if (isMockMode()) {
    await delay(200);
    const pharmacyId = getActivePharmacyId();
    const stored = JSON.parse(localStorage.getItem(CUST_RETURNS_KEY) || '[]');
    return stored.filter((r) => r.pharmacy_id === pharmacyId || r.pharmacy_id === undefined || r.pharmacy_id === null);
  }
  const response = await api.get('/returns/customer');
  return response.data;
};

export const createCustomerReturn = async (data) => {
  if (isMockMode()) {
    await delay(250);
    const pharmacyId = getActivePharmacyId();
    const stored = JSON.parse(localStorage.getItem(CUST_RETURNS_KEY) || '[]');
    const mockCustomers = JSON.parse(localStorage.getItem('primepharm_mock_customers') || '[]');
    const mockLedgers = JSON.parse(localStorage.getItem('primepharm_mock_customer_ledgers') || '[]');

    // 1. Decrement customer balance
    const custIdx = mockCustomers.findIndex((c) => c.id === Number(data.customer_id));
    if (custIdx !== -1) {
      mockCustomers[custIdx].balance = Number(mockCustomers[custIdx].balance || 0) - Number(data.refunded_amount);
      localStorage.setItem('primepharm_mock_customers', JSON.stringify(mockCustomers));
    }

    const newReturn = {
      id: Date.now(),
      pharmacy_id: pharmacyId,
      customer_id: Number(data.customer_id),
      customer: mockCustomers.find((c) => c.id === Number(data.customer_id)) || null,
      sale_id: data.sale_id ? Number(data.sale_id) : null,
      return_no: data.return_no,
      return_date: data.return_date,
      grand_total: Number(data.grand_total),
      refunded_amount: Number(data.refunded_amount),
    };
    stored.unshift(newReturn);
    localStorage.setItem(CUST_RETURNS_KEY, JSON.stringify(stored));

    // 2. Log Customer Ledger Entry
    mockLedgers.push({
      id: Date.now() + Math.random(),
      pharmacy_id: pharmacyId,
      customer_id: Number(data.customer_id),
      transaction_type: 'RETURN',
      transaction_id: newReturn.id,
      transaction_no: newReturn.return_no,
      debit: 0.00,
      credit: Number(data.refunded_amount),
      running_balance: custIdx !== -1 ? mockCustomers[custIdx].balance : -Number(data.refunded_amount),
      transaction_date: data.return_date
    });
    localStorage.setItem('primepharm_mock_customer_ledgers', JSON.stringify(mockLedgers));

    return newReturn;
  }
  try {
    const response = await api.post('/returns/customer', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to record customer return.');
  }
};

// --- SUPPLIER RETURNS ---
export const getSupplierReturns = async () => {
  if (isMockMode()) {
    await delay(200);
    const pharmacyId = getActivePharmacyId();
    const stored = JSON.parse(localStorage.getItem(SUP_RETURNS_KEY) || '[]');
    return stored.filter((r) => r.pharmacy_id === pharmacyId || r.pharmacy_id === undefined || r.pharmacy_id === null);
  }
  const response = await api.get('/returns/supplier');
  return response.data;
};

export const createSupplierReturn = async (data) => {
  if (isMockMode()) {
    await delay(250);
    const pharmacyId = getActivePharmacyId();
    const stored = JSON.parse(localStorage.getItem(SUP_RETURNS_KEY) || '[]');
    const mockSuppliers = JSON.parse(localStorage.getItem('primepharm_mock_suppliers') || '[]');
    const mockLedgers = JSON.parse(localStorage.getItem('primepharm_mock_supplier_ledgers') || '[]');
    const mockPurchases = JSON.parse(localStorage.getItem('primepharm_mock_purchases') || '[]');
    const mockBatches = JSON.parse(localStorage.getItem('primepharm_mock_batches') || '[]');

    const processedItems = [];
    const purchase = mockPurchases.find((p) => p.id === Number(data.purchase_id));

    if (purchase && data.items) {
      for (const item of data.items) {
        const purchaseItem = purchase.items.find((pi) => pi.id === Number(item.purchase_item_id));
        if (purchaseItem) {
          const baseQty = Math.round(item.quantity * (purchaseItem.conversion_factor || 1));
          
          const batchIdx = mockBatches.findIndex(
            (b) => b.medicine_id === purchaseItem.medicine_id &&
                   b.batch_no === purchaseItem.batch_no &&
                   b.expiry_date === purchaseItem.expiry_date
          );

          let batchId = null;
          if (batchIdx !== -1) {
            mockBatches[batchIdx].remaining_quantity = Math.max(0, mockBatches[batchIdx].remaining_quantity - baseQty);
            if (mockBatches[batchIdx].remaining_quantity === 0) {
              mockBatches[batchIdx].status = 'OUT_OF_STOCK';
            }
            batchId = mockBatches[batchIdx].id;
          }

          processedItems.push({
            id: Date.now() + Math.random(),
            purchase_item_id: purchaseItem.id,
            medicine_id: purchaseItem.medicine_id,
            medicine: purchaseItem.medicine || { name: purchaseItem.medicine_name },
            unit_id: purchaseItem.unit_id,
            unit: purchaseItem.unit || { name: purchaseItem.unit_name, abbreviation: purchaseItem.unit_name?.substring(0, 3) },
            quantity: item.quantity,
            base_quantity: baseQty,
            refund_price: item.refund_price,
            batch_id: batchId,
            batch: batchIdx !== -1 ? mockBatches[batchIdx] : null
          });
        }
      }
      localStorage.setItem('primepharm_mock_batches', JSON.stringify(mockBatches));
    }

    // 1. Decrement supplier balance
    const supIdx = mockSuppliers.findIndex((s) => s.id === Number(data.supplier_id));
    if (supIdx !== -1) {
      mockSuppliers[supIdx].balance = Number(mockSuppliers[supIdx].balance || 0) - Number(data.refunded_amount);
      localStorage.setItem('primepharm_mock_suppliers', JSON.stringify(mockSuppliers));
    }

    const newReturn = {
      id: Date.now(),
      pharmacy_id: pharmacyId,
      supplier_id: Number(data.supplier_id),
      supplier: mockSuppliers.find((s) => s.id === Number(data.supplier_id)) || null,
      purchase_id: data.purchase_id ? Number(data.purchase_id) : null,
      purchase: purchase,
      return_no: data.return_no,
      return_date: data.return_date,
      grand_total: Number(data.grand_total),
      refunded_amount: Number(data.refunded_amount),
      items: processedItems
    };
    stored.unshift(newReturn);
    localStorage.setItem(SUP_RETURNS_KEY, JSON.stringify(stored));

    // 2. Log Supplier Ledger Entry
    mockLedgers.push({
      id: Date.now() + Math.random(),
      pharmacy_id: pharmacyId,
      supplier_id: Number(data.supplier_id),
      transaction_type: 'RETURN',
      transaction_id: newReturn.id,
      transaction_no: newReturn.return_no,
      debit: Number(data.refunded_amount),
      credit: 0.00,
      running_balance: supIdx !== -1 ? mockSuppliers[supIdx].balance : -Number(data.refunded_amount),
      transaction_date: data.return_date
    });
    localStorage.setItem('primepharm_mock_supplier_ledgers', JSON.stringify(mockLedgers));

    return newReturn;
  }
  try {
    const response = await api.post('/returns/supplier', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to record supplier return.');
  }
};

export const getSupplierReturnDetails = async (id) => {
  if (isMockMode()) {
    await delay(150);
    const stored = JSON.parse(localStorage.getItem(SUP_RETURNS_KEY) || '[]');
    const ret = stored.find((r) => r.id === Number(id));
    if (!ret) throw new Error('Supplier return not found.');
    return ret;
  }
  const response = await api.get(`/returns/supplier/${id}`);
  return response.data;
};

export const getCustomerReturnDetails = async (id) => {
  if (isMockMode()) {
    await delay(150);
    const stored = JSON.parse(localStorage.getItem(CUST_RETURNS_KEY) || '[]');
    const ret = stored.find((r) => r.id === Number(id));
    if (!ret) throw new Error('Customer return not found.');
    return ret;
  }
  const response = await api.get(`/returns/customer/${id}`);
  return response.data;
};
