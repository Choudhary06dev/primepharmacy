import api from './api';
import { getInitialMedicines } from './inventoryService';

const isMockMode = () => localStorage.getItem('primepharm_auth_mode') === 'mock';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getActivePharmacyId = () => {
  const user = localStorage.getItem('primepharm_user')
    ? JSON.parse(localStorage.getItem('primepharm_user'))
    : null;
  return user ? Number(user.pharmacy_id) : null;
};

export const getReportsSummary = async (filters = {}) => {
  const { start_date, end_date } = filters;
  if (isMockMode()) {
    await delay(300);
    const pharmacyId = getActivePharmacyId();

    const mockSales = JSON.parse(localStorage.getItem('primepharm_mock_sales') || '[]');
    const mockExpenses = JSON.parse(localStorage.getItem('primepharm_mock_expenses') || '[]');
    const mockBatches = JSON.parse(localStorage.getItem('primepharm_mock_batches') || '[]');
    const mockMedicines = getInitialMedicines();
    const mockCategories = JSON.parse(localStorage.getItem('primepharm_mock_expense_categories') || '[]');

    const tenantSales = mockSales.filter((s) => s.pharmacy_id === pharmacyId || s.pharmacy_id === undefined || s.pharmacy_id === null);
    const tenantExpenses = mockExpenses.filter((e) => e.pharmacy_id === pharmacyId || e.pharmacy_id === undefined || e.pharmacy_id === null);
    const tenantBatches = mockBatches.filter((b) => b.pharmacy_id === pharmacyId || b.pharmacy_id === undefined || b.pharmacy_id === null);
    const tenantMedicines = mockMedicines.filter((m) => m.pharmacy_id === pharmacyId || m.pharmacy_id === undefined || m.pharmacy_id === null);

    // Apply date range filters
    let filteredSales = tenantSales;
    let filteredExpenses = tenantExpenses;

    if (start_date && end_date) {
      filteredSales = tenantSales.filter((s) => {
        const sDate = s.sale_date || '';
        return sDate >= start_date && sDate <= end_date;
      });
      filteredExpenses = tenantExpenses.filter((e) => {
        const eDate = e.expense_date || '';
        return eDate >= start_date && eDate <= end_date;
      });
    }

    // 1. Profit summaries
    const totalSales = filteredSales.reduce((acc, curr) => acc + Number(curr.grand_total), 0);
    const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    // Cost of Goods Sold (COGS)
    let totalCOGS = 0;
    filteredSales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        (item.batches || []).forEach((ib) => {
          totalCOGS += Number(ib.quantity) * Number(ib.batch?.purchase_price || 0);
        });
      });
    });

    const grossProfit = totalSales - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    // 2. Monthly Trend (last 6 months)
    const monthlyTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const currentMonthPrefix = `${year}-${month}`; // "YYYY-MM"

      const salesVal = tenantSales
        .filter((s) => {
          const sDate = s.sale_date || '';
          return sDate.startsWith(currentMonthPrefix);
        })
        .reduce((acc, curr) => acc + Number(curr.grand_total), 0);

      monthlyTrend.push({ label, sales: salesVal });
    }

    // 3. Expense breakdown by category
    const expenseMap = {};
    filteredExpenses.forEach((exp) => {
      const cat = mockCategories.find((c) => c.id === Number(exp.expense_category_id));
      const catName = cat?.name || 'General Expense';
      expenseMap[catName] = (expenseMap[catName] || 0) + Number(exp.amount);
    });

    const expenseBreakdown = Object.keys(expenseMap).map((name) => ({
      name,
      value: expenseMap[name]
    }));

    // 4. Top Selling Medicines
    const medicineSalesMap = {};
    filteredSales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const medId = item.medicine_id;
        if (!medicineSalesMap[medId]) {
          const med = tenantMedicines.find((m) => m.id === medId) || item.medicine;
          medicineSalesMap[medId] = {
            name: med?.name || item.name || 'Unknown Medicine',
            generic_name: med?.generic_name || 'N/A',
            quantity_sold: 0,
            revenue: 0
          };
        }
        const qty = Number(item.base_quantity || item.quantity);
        const cost = qty * Number(item.base_price || (item.unit_price / item.conversion_factor));
        medicineSalesMap[medId].quantity_sold += qty;
        medicineSalesMap[medId].revenue += cost;
      });
    });

    const topMedicines = Object.values(medicineSalesMap)
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, 5);

    // 5. Inventory Valuation
    const activeBatches = tenantBatches.filter((b) => b.status === 'ACTIVE' && Number(b.remaining_quantity) > 0);
    const inventoryCostValue = activeBatches.reduce((acc, curr) => acc + (Number(curr.remaining_quantity) * Number(curr.purchase_price)), 0);
    const inventoryRetailValue = activeBatches.reduce((acc, curr) => acc + (Number(curr.remaining_quantity) * Number(curr.sale_price)), 0);
    const inventoryMargin = inventoryRetailValue - inventoryCostValue;

    return {
      summary: {
        total_sales: totalSales,
        total_expenses: totalExpenses,
        total_cogs: totalCOGS,
        gross_profit: grossProfit,
        net_profit: netProfit
      },
      monthly_trend: monthlyTrend,
      expense_breakdown: expenseBreakdown,
      top_medicines: topMedicines,
      inventory_valuation: {
        cost_value: inventoryCostValue,
        retail_value: inventoryRetailValue,
        margin: inventoryMargin
      }
    };
  }

  const response = await api.get('/financials/reports/summary', { params: filters });
  return response.data;
};
