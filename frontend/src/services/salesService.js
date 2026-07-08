import api from './api';
import { getInitialMedicines } from './inventoryService';

const STORAGE_SALES_KEY = 'primepharm_mock_sales';
const STORAGE_CUSTOMERS_KEY = 'primepharm_mock_customers';

const isMockMode = () => localStorage.getItem('primepharm_auth_mode') === 'mock';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getActivePharmacyId = () => {
  const user = localStorage.getItem('primepharm_user')
    ? JSON.parse(localStorage.getItem('primepharm_user'))
    : null;
  return user ? Number(user.pharmacy_id) : null;
};

const getInitialSales = () => {
  const stored = localStorage.getItem(STORAGE_SALES_KEY);
  return stored ? JSON.parse(stored) : [];
};

const getInitialCustomers = () => {
  const stored = localStorage.getItem(STORAGE_CUSTOMERS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Clean up legacy hardcoded customers
      const filtered = parsed.filter(
        (c) => !(c.id === 1 && c.name === 'Walk-in Customer') &&
               !(c.id === 2 && c.name === 'Amjad Khan') &&
               !(c.id === 3 && c.name === 'Sarah Ali')
      );
      if (filtered.length !== parsed.length) {
        localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(filtered));
        return filtered;
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing mock customers:', e);
    }
  }
  return [];
};

let mockSales = getInitialSales();
let mockCustomers = getInitialCustomers();

const saveSales = () => { localStorage.setItem(STORAGE_SALES_KEY, JSON.stringify(mockSales)); };
const saveCustomers = () => { localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(mockCustomers)); };

// ─── CUSTOMERS MANAGEMENT ───────────────────────────────────────────────

export const getCustomers = async () => {
  if (isMockMode()) {
    await delay(150);
    const pharmacyId = getActivePharmacyId();
    return mockCustomers.filter((c) => c.pharmacy_id === pharmacyId || c.pharmacy_id === undefined);
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
      balance: 0.00,
      pharmacy_id: getActivePharmacyId()
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

export const updateCustomer = async (id, data) => {
  if (isMockMode()) {
    await delay(200);
    const idx = mockCustomers.findIndex((c) => c.id === Number(id));
    if (idx === -1) throw new Error('Customer not found.');

    mockCustomers[idx] = {
      ...mockCustomers[idx],
      name: data.name,
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
    };
    saveCustomers();
    return mockCustomers[idx];
  }

  try {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : error.response?.data?.message || 'Failed to update customer.';
    throw new Error(errorMsg);
  }
};

export const deleteCustomer = async (id) => {
  if (isMockMode()) {
    await delay(150);
    const idx = mockCustomers.findIndex((c) => c.id === Number(id));
    if (idx === -1) throw new Error('Customer not found.');

    // Restrict if there are sales linked in mockSales
    const hasSales = mockSales.some((s) => Number(s.customer_id) === Number(id));
    if (hasSales) {
      throw new Error('Cannot delete customer: they have associated sales invoices.');
    }

    mockCustomers.splice(idx, 1);
    saveCustomers();
    return { success: true };
  }

  try {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete customer.');
  }
};

// ─── POS BILLING & CHECKOUT ────────────────────────────────────────────

export const checkoutPOS = async (data) => {
  if (isMockMode()) {
    await delay(300);
    
    // Deduct mock stock batches using FEFO
    const mockBatches = JSON.parse(localStorage.getItem('primepharm_mock_batches') || '[]');
    const mockMedicines = getInitialMedicines();
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
    
    const count = mockSales.length + 1;
    const invoiceNo = 'INV-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + String(count).padStart(4, '0');
    
    const pharmacyId = getActivePharmacyId();
    const mockPharms = JSON.parse(localStorage.getItem('primepharm_mock_pharmacies') || '[]');
    const activePharmacy = mockPharms.find((p) => p.id === pharmacyId);

    // Add customer balance and log ledger entry
    if (data.customer_id) {
      const due = data.grand_total - data.paid_amount;
      const custIdx = mockCustomers.findIndex((c) => c.id === Number(data.customer_id));
      if (custIdx !== -1) {
        mockCustomers[custIdx].balance += due;
        saveCustomers();
      }
      
      const mockCustLedgers = JSON.parse(localStorage.getItem('primepharm_mock_customer_ledgers') || '[]');
      mockCustLedgers.push({
        id: Date.now() + Math.random(),
        pharmacy_id: pharmacyId,
        customer_id: Number(data.customer_id),
        transaction_type: 'SALE',
        transaction_id: Date.now(),
        transaction_no: invoiceNo,
        debit: data.grand_total,
        credit: data.paid_amount,
        running_balance: custIdx !== -1 ? mockCustomers[custIdx].balance : due,
        transaction_date: new Date().toISOString().split('T')[0]
      });
      localStorage.setItem('primepharm_mock_customer_ledgers', JSON.stringify(mockCustLedgers));
    }

    const newSale = {
      id: Date.now(),
      pharmacy_id: pharmacyId,
      invoice_no: invoiceNo,
      customer_id: data.customer_id || null,
      customer: mockCustomers.find((c) => c.id === Number(data.customer_id)) || null,
      user: { name: 'Local Operator' },
      branch: {
        name: 'Main Branch',
        address: activePharmacy?.pharmacy_address || 'Multan Road, Lahore, Pakistan',
        phone: activePharmacy?.pharmacy_phone || '042-35111111'
      },
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
    const pharmacyId = getActivePharmacyId();
    return mockSales.filter((s) => s.pharmacy_id === pharmacyId || s.pharmacy_id === undefined || s.pharmacy_id === null);
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

export const getDashboardStats = async () => {
  if (isMockMode()) {
    await delay(200);
    const pharmacyId = getActivePharmacyId();
    
    // Get mock data from localStorage
    const mockSales = JSON.parse(localStorage.getItem('primepharm_mock_sales') || '[]');
    const mockBatches = JSON.parse(localStorage.getItem('primepharm_mock_batches') || '[]');
    const mockMedicines = getInitialMedicines();
    const mockPurchases = JSON.parse(localStorage.getItem('primepharm_mock_purchases') || '[]');

    // Filter by pharmacyId
    const tenantSales = mockSales.filter((s) => s.pharmacy_id === pharmacyId || s.pharmacy_id === undefined || s.pharmacy_id === null);
    const tenantBatches = mockBatches.filter((b) => b.pharmacy_id === pharmacyId || b.pharmacy_id === undefined || b.pharmacy_id === null);
    const tenantMedicines = mockMedicines.filter((m) => m.pharmacy_id === pharmacyId || m.pharmacy_id === undefined || m.pharmacy_id === null);
    const tenantPurchases = mockPurchases.filter((p) => p.pharmacy_id === pharmacyId || p.pharmacy_id === undefined || p.pharmacy_id === null);

    // 1. Sales calculation
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const todaySales = tenantSales
      .filter((s) => s.sale_date === todayStr)
      .reduce((acc, curr) => acc + Number(curr.grand_total), 0);

    const yesterdaySales = tenantSales
      .filter((s) => s.sale_date === yesterdayStr)
      .reduce((acc, curr) => acc + Number(curr.grand_total), 0);

    let salesChangePercent = 0;
    if (yesterdaySales > 0) {
      salesChangePercent = ((todaySales - yesterdaySales) / yesterdaySales) * 100;
    } else if (todaySales > 0) {
      salesChangePercent = 100;
    }

    let salesChangeStr = '0% from yesterday';
    if (salesChangePercent > 0) {
      salesChangeStr = `+${salesChangePercent.toFixed(1)}% from yesterday`;
    } else if (salesChangePercent < 0) {
      salesChangeStr = `${salesChangePercent.toFixed(1)}% from yesterday`;
    }

    // 2. Purchase calculation
    const totalPurchasesCount = tenantPurchases.length;
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthPurchasesCount = tenantPurchases.filter((p) => {
      const dateStr = p.purchase_date || p.created_at || '';
      return dateStr.startsWith(currentMonthStr);
    }).length;

    // 3. Active Batches count
    const activeBatchesCount = tenantBatches.filter(
      (b) => b.status === 'ACTIVE' && Number(b.remaining_quantity) > 0
    ).length;

    // 4. Low stock alerts
    let lowStockCount = 0;
    let criticalWarnings = 0;

    tenantMedicines.forEach((med) => {
      const stock = tenantBatches
        .filter((b) => b.medicine_id === med.id && b.status === 'ACTIVE' && Number(b.remaining_quantity) > 0)
        .reduce((acc, curr) => acc + Number(curr.remaining_quantity), 0);

      const minStock = Number(med.min_stock_level || 0);

      if (stock <= minStock) {
        lowStockCount++;
        if (stock === 0 && minStock > 0) {
          criticalWarnings++;
        }
      }
    });

    return {
      today_sales: todaySales,
      today_sales_change: salesChangeStr,
      purchase_orders: totalPurchasesCount,
      purchase_orders_this_month: thisMonthPurchasesCount,
      active_batches: activeBatchesCount,
      low_stock_alerts: lowStockCount,
      critical_warnings: criticalWarnings,
    };
  }

  const response = await api.get('/dashboard/stats');
  return response.data;
};

