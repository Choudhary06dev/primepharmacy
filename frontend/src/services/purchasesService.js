import api from './api';
import { getInitialMedicines } from './inventoryService';

const STORAGE_KEY = 'primepharm_mock_purchases';

const isMockMode = () => localStorage.getItem('primepharm_auth_mode') === 'mock';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getActivePharmacyId = () => {
  const user = localStorage.getItem('primepharm_user')
    ? JSON.parse(localStorage.getItem('primepharm_user'))
    : null;
  return user ? Number(user.pharmacy_id) : null;
};

const getInitialPurchases = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

let mockPurchases = getInitialPurchases();

export const getPurchases = async () => {
  if (isMockMode()) {
    await delay(200);
    const pharmacyId = getActivePharmacyId();
    return mockPurchases.filter((p) => p.pharmacy_id === pharmacyId || p.pharmacy_id === undefined || p.pharmacy_id === null);
  }
  const response = await api.get('/purchases/orders');
  return response.data;
};

export const getPurchaseDetails = async (id) => {
  if (isMockMode()) {
    await delay(150);
    const purchase = mockPurchases.find((p) => p.id === Number(id));
    if (!purchase) throw new Error('Purchase not found.');
    return purchase;
  }
  const response = await api.get(`/purchases/orders/${id}`);
  return response.data;
};

export const createPurchase = async (data) => {
  if (isMockMode()) {
    await delay(300);
    const pharmacyId = getActivePharmacyId();
    const branchId = 1;
    
    const mockBatches = JSON.parse(localStorage.getItem('primepharm_mock_batches') || '[]');
    const mockMedicines = getInitialMedicines();
    const mockUnits = JSON.parse(localStorage.getItem('primepharm_mock_units') || '[]');
    const mockSuppliers = JSON.parse(localStorage.getItem('primepharm_mock_suppliers') || '[]');
    const mockLedgers = JSON.parse(localStorage.getItem('primepharm_mock_supplier_ledgers') || '[]');

    const processedItems = [];

    for (const item of data.items) {
      const baseQty = Math.round(item.quantity * item.conversion_factor);
      const basePrice = item.unit_price / item.conversion_factor;

      // Find or create batch
      const existingBatchIdx = mockBatches.findIndex(
        (b) => b.medicine_id === item.medicine_id && b.batch_no === item.batch_no && b.expiry_date === item.expiry_date
      );

      if (existingBatchIdx !== -1) {
        mockBatches[existingBatchIdx].quantity = Number(mockBatches[existingBatchIdx].quantity) + baseQty;
        mockBatches[existingBatchIdx].remaining_quantity = Number(mockBatches[existingBatchIdx].remaining_quantity) + baseQty;
        mockBatches[existingBatchIdx].purchase_price = basePrice;
        mockBatches[existingBatchIdx].sale_price = Number(item.sale_price);
        mockBatches[existingBatchIdx].status = 'ACTIVE';
      } else {
        mockBatches.push({
          id: Date.now() + Math.random(),
          pharmacy_id: pharmacyId,
          branch_id: branchId,
          medicine_id: item.medicine_id,
          batch_no: item.batch_no,
          expiry_date: item.expiry_date,
          purchase_price: basePrice,
          sale_price: Number(item.sale_price),
          quantity: baseQty,
          remaining_quantity: baseQty,
          status: 'ACTIVE'
        });
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
        base_price: basePrice,
        batch_no: item.batch_no,
        expiry_date: item.expiry_date
      });
    }

    localStorage.setItem('primepharm_mock_batches', JSON.stringify(mockBatches));

    // Update supplier balance
    const supIdx = mockSuppliers.findIndex((s) => s.id === Number(data.supplier_id));
    const netEffect = data.grand_total - data.paid_amount;
    if (supIdx !== -1) {
      mockSuppliers[supIdx].balance = Number(mockSuppliers[supIdx].balance || 0) + netEffect;
      localStorage.setItem('primepharm_mock_suppliers', JSON.stringify(mockSuppliers));
    }

    const newPurchase = {
      id: Date.now(),
      pharmacy_id: pharmacyId,
      supplier_id: Number(data.supplier_id),
      supplier: mockSuppliers.find((s) => s.id === Number(data.supplier_id)) || null,
      purchase_no: data.purchase_no,
      purchase_date: data.purchase_date,
      sub_total: data.sub_total,
      tax: data.tax || 0.00,
      discount: data.discount || 0.00,
      grand_total: data.grand_total,
      paid_amount: data.paid_amount,
      payment_status: data.payment_status,
      payment_method: data.payment_method,
      notes: data.notes || '',
      items: processedItems,
      created_at: new Date().toISOString()
    };

    mockPurchases.unshift(newPurchase);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockPurchases));

    // Log ledger entry
    mockLedgers.push({
      id: Date.now() + Math.random(),
      pharmacy_id: pharmacyId,
      supplier_id: Number(data.supplier_id),
      transaction_type: 'PURCHASE',
      transaction_id: newPurchase.id,
      transaction_no: newPurchase.purchase_no,
      debit: data.paid_amount,
      credit: data.grand_total,
      running_balance: supIdx !== -1 ? mockSuppliers[supIdx].balance : netEffect,
      transaction_date: data.purchase_date
    });
    localStorage.setItem('primepharm_mock_supplier_ledgers', JSON.stringify(mockLedgers));

    return newPurchase;
  }

  try {
    const response = await api.post('/purchases/orders', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to register purchase invoice.');
  }
};
