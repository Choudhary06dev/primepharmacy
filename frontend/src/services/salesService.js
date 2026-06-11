import api from './api';

const STORAGE_SALES_KEY = 'primepharm_mock_sales';
const STORAGE_CUSTOMERS_KEY = 'primepharm_mock_customers';

const isMockMode = () => localStorage.getItem('primepharm_auth_mode') === 'mock';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getInitialSales = () => {
  const stored = localStorage.getItem(STORAGE_SALES_KEY);
  return stored ? JSON.parse(stored) : [];
};

const getInitialCustomers = () => {
  const stored = localStorage.getItem(STORAGE_CUSTOMERS_KEY);
  if (stored) return JSON.parse(stored);
  
  // Seed initial customers in mock mode
  const initial = [
    { id: 1, name: 'Walk-in Customer', phone: '', email: '', address: '', balance: 0.00 },
    { id: 2, name: 'Amjad Khan', phone: '0300-1234567', email: 'amjad@gmail.com', address: 'Lahore, Pakistan', balance: 0.00 },
    { id: 3, name: 'Sarah Ali', phone: '0321-7654321', email: 'sarah@yahoo.com', address: 'Karachi, Pakistan', balance: 1200.00 }
  ];
  localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(initial));
  return initial;
};

let mockSales = getInitialSales();
let mockCustomers = getInitialCustomers();

const saveSales = () => { localStorage.setItem(STORAGE_SALES_KEY, JSON.stringify(mockSales)); };
const saveCustomers = () => { localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(mockCustomers)); };

// ─── CUSTOMERS MANAGEMENT ───────────────────────────────────────────────

export const getCustomers = async () => {
  if (isMockMode()) {
    await delay(150);
    return [...mockCustomers];
  }
  const response = await api.get('/customers');
  return response.data;
};

export const createCustomer = async (data) => {
  if (isMockMode()) {
    await delay(200);
    const newCustomer = {
      id: Date.now(),
      name: data.name,
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      balance: 0.00
    };
    mockCustomers.push(newCustomer);
    saveCustomers();
    return newCustomer;
  }

  try {
    const response = await api.post('/customers', data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to create customer.';
    throw new Error(errorMsg);
  }
};

// ─── POS BILLING & CHECKOUT ────────────────────────────────────────────

export const checkoutPOS = async (data) => {
  if (isMockMode()) {
    await delay(300);
    
    // Deduct mock stock batches using FEFO
    const mockBatches = JSON.parse(localStorage.getItem('primepharm_mock_batches') || '[]');
    const mockMedicines = JSON.parse(localStorage.getItem('primepharm_mock_medicines') || '[]');
    const mockUnits = JSON.parse(localStorage.getItem('primepharm_mock_units') || '[]');
    
    const processedItems = [];
    
    for (const item of data.items) {
      const baseQty = Math.round(item.quantity * item.conversion_factor);
      
      // Get active batches for this medicine
      const activeBatches = mockBatches
        .filter((b) => b.medicine_id === item.medicine_id && b.status === 'ACTIVE' && b.remaining_quantity > 0)
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date)); // FEFO
        
      const available = activeBatches.reduce((acc, curr) => acc + curr.remaining_quantity, 0);
      if (available < baseQty) {
        const med = mockMedicines.find((m) => m.id === item.medicine_id);
        throw new Error(`Insufficient stock for "${med?.name || 'Medicine'}". Available: ${available}, Requested: ${baseQty}`);
      }
      
      // Deduct from batches
      let remainingToDeduct = baseQty;
      const itemBatchesLog = [];
      
      for (const batch of activeBatches) {
        if (remainingToDeduct <= 0) break;
        
        const batchIdx = mockBatches.findIndex((b) => b.id === batch.id);
        if (batchIdx !== -1) {
          const deducted = Math.min(mockBatches[batchIdx].remaining_quantity, remainingToDeduct);
          mockBatches[batchIdx].remaining_quantity -= deducted;
          if (mockBatches[batchIdx].remaining_quantity <= 0) {
            mockBatches[batchIdx].status = 'OUT_OF_STOCK';
          }
          remainingToDeduct -= deducted;
          
          itemBatchesLog.push({
            batch_id: batch.id,
            quantity: deducted,
            batch: batch
          });
        }
      }
      
      const med = mockMedicines.find((m) => m.id === item.medicine_id);
      const unit = mockUnits.find((u) => u.id === item.unit_id);
      
      processedItems.push({
        id: Date.now() + Math.random(),
        medicine_id: item.medicine_id,
        medicine: med,
        unit_id: item.unit_id,
        unit: unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        conversion_factor: item.conversion_factor,
        base_quantity: baseQty,
        base_price: item.unit_price / item.conversion_factor,
        batches: itemBatchesLog
      });
    }
    
    // Save updated batches to localStorage
    localStorage.setItem('primepharm_mock_batches', JSON.stringify(mockBatches));
    
    // Add customer balance if due/partially paid
    if (data.customer_id) {
      const due = data.grand_total - data.paid_amount;
      if (due > 0) {
        const custIdx = mockCustomers.findIndex((c) => c.id === Number(data.customer_id));
        if (custIdx !== -1) {
          mockCustomers[custIdx].balance += due;
          saveCustomers();
        }
      }
    }
    
    const count = mockSales.length + 1;
    const invoiceNo = 'INV-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + String(count).padStart(4, '0');
    
    const newSale = {
      id: Date.now(),
      invoice_no: invoiceNo,
      customer_id: data.customer_id || null,
      customer: mockCustomers.find((c) => c.id === Number(data.customer_id)) || null,
      user: { name: 'Local Operator' },
      sale_date: new Date().toISOString().split('T')[0],
      sub_total: data.sub_total,
      tax: data.tax || 0.00,
      discount: data.discount || 0.00,
      grand_total: data.grand_total,
      paid_amount: data.paid_amount,
      payment_status: data.payment_status,
      payment_method: data.payment_method,
      items: processedItems,
      created_at: new Date().toISOString()
    };
    
    mockSales.unshift(newSale);
    saveSales();
    
    return {
      message: 'Sale checkout processed successfully.',
      sale: newSale
    };
  }

  try {
    const response = await api.post('/sales/pos', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'POS Checkout checkout failed.');
  }
};

export const getInvoices = async () => {
  if (isMockMode()) {
    await delay(200);
    return [...mockSales];
  }
  const response = await api.get('/sales/invoices');
  return response.data;
};

export const getInvoiceDetails = async (id) => {
  if (isMockMode()) {
    await delay(150);
    const sale = mockSales.find((s) => s.id === Number(id));
    if (!sale) throw new Error('Invoice not found.');
    return sale;
  }
  const response = await api.get(`/sales/invoices/${id}`);
  return response.data;
};
