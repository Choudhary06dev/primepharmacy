import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Select from '../../../components/UI/Select';
import Modal from '../../../components/UI/Modal';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from '../../../services/financialsService';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Active Tab: 'expenses' or 'categories'
  const [activeTab, setActiveTab] = useState('expenses');

  // Expense Modal States
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [isExpEdit, setIsExpEdit] = useState(false);
  const [currentExpId, setCurrentExpId] = useState(null);
  const [expFormData, setExpFormData] = useState({
    expense_category_id: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [expFormError, setExpFormError] = useState(null);
  const [expSaving, setExpSaving] = useState(false);

  // Category Modal States
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isCatEdit, setIsCatEdit] = useState(false);
  const [currentCatId, setCurrentCatId] = useState(null);
  const [catFormData, setCatFormData] = useState({ name: '', description: '' });
  const [catFormError, setCatFormError] = useState(null);
  const [catSaving, setCatSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [expData, catData] = await Promise.all([
        getExpenses(),
        getExpenseCategories(),
      ]);
      setExpenses(expData);
      setCategories(catData);
    } catch (err) {
      console.error(err);
      setError('Failed to load financials data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateExp = () => {
    setExpFormData({
      expense_category_id: categories[0]?.id || '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setExpFormError(null);
    setIsExpEdit(false);
    setIsExpModalOpen(true);
  };

  const handleOpenEditExp = (exp) => {
    setExpFormData({
      expense_category_id: exp.expense_category_id,
      amount: exp.amount,
      expense_date: new Date(exp.expense_date).toISOString().split('T')[0],
      description: exp.description || '',
    });
    setExpFormError(null);
    setCurrentExpId(exp.id);
    setIsExpEdit(true);
    setIsExpModalOpen(true);
  };

  const handleExpChange = (e) => {
    const { name, value } = e.target;
    setExpFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleExpSubmit = async (e) => {
    e.preventDefault();
    setExpFormError(null);
    if (!expFormData.expense_category_id || !expFormData.amount || !expFormData.expense_date) {
      setExpFormError('Please fill out Category, Amount, and Expense Date.');
      return;
    }

    setExpSaving(true);
    try {
      if (isExpEdit) {
        const updated = await updateExpense(currentExpId, expFormData);
        setExpenses((prev) => prev.map((item) => (item.id === currentExpId ? updated : item)));
        showToast('Expense record updated successfully.');
      } else {
        const created = await createExpense(expFormData);
        setExpenses((prev) => [created, ...prev]);
        showToast('Expense record added successfully.');
      }
      setIsExpModalOpen(false);
    } catch (err) {
      setExpFormError(err.message || 'Failed to save expense.');
    } finally {
      setExpSaving(false);
    }
  };

  const handleDeleteExp = async (exp) => {
    if (window.confirm(`Are you sure you want to delete the expense of PKR ${Number(exp.amount).toFixed(2)}?`)) {
      setError(null);
      try {
        await deleteExpense(exp.id);
        setExpenses((prev) => prev.filter((item) => item.id !== exp.id));
        showToast('Expense record deleted.');
      } catch (err) {
        setError(err.message || 'Failed to delete expense.');
      }
    }
  };

  // Category Submit
  const handleOpenCreateCat = () => {
    setCatFormData({ name: '', description: '' });
    setCatFormError(null);
    setIsCatEdit(false);
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat) => {
    setCatFormData({ name: cat.name, description: cat.description || '' });
    setCatFormError(null);
    setCurrentCatId(cat.id);
    setIsCatEdit(true);
    setIsCatModalOpen(true);
  };

  const handleDeleteCat = async (cat) => {
    if (window.confirm(`Are you sure you want to delete the category "${cat.name}"?`)) {
      setError(null);
      try {
        await deleteExpenseCategory(cat.id);
        setCategories((prev) => prev.filter((item) => item.id !== cat.id));
        showToast('Classification category deleted.');
      } catch (err) {
        setError(err.message || 'Failed to delete category.');
      }
    }
  };

  const handleCatChange = (e) => {
    const { name, value } = e.target;
    setCatFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    setCatFormError(null);
    if (!catFormData.name) {
      setCatFormError('Category name is required.');
      return;
    }

    setCatSaving(true);
    try {
      if (isCatEdit) {
        const updated = await updateExpenseCategory(currentCatId, catFormData);
        setCategories((prev) => prev.map((item) => (item.id === currentCatId ? updated : item)));
        showToast('Expense category updated successfully.');
      } else {
        const created = await createExpenseCategory(catFormData);
        setCategories((prev) => [...prev, created]);
        showToast('Expense category added successfully.');
        // Automatically select this category if recording an expense
        setExpFormData((prev) => ({ ...prev, expense_category_id: created.id }));
      }
      setIsCatModalOpen(false);
    } catch (err) {
      setCatFormError(err.message || 'Failed to save category.');
    } finally {
      setCatSaving(false);
    }
  };

  const showToast = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const expenseColumns = [
    {
      key: 'expense_date',
      label: 'Expense Date',
      render: (val) => {
        const d = new Date(val);
        return <span className="font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{d.toLocaleDateString()}</span>;
      },
    },
    {
      key: 'category',
      label: 'Classification Category',
      render: (val) => (
        <span className="font-semibold text-xs text-brand-700 dark:text-brand-400 bg-brand-500/5 px-2 py-0.5 rounded border border-brand-500/10">
          {val?.name || 'General Expense'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount Paid',
      render: (val) => (
        <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
          PKR {Number(val).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description Details',
      render: (val) => (
        <span className="block max-w-sm truncate text-xs" title={val} style={{ color: 'var(--color-text-secondary)' }}>
          {val || <span style={{ color: 'var(--color-text-tertiary)' }}>No details provided</span>}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <button onClick={() => handleOpenEditExp(row)} className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Edit
          </button>
          <button onClick={() => handleDeleteExp(row)} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline">
            Delete
          </button>
        </div>
      ),
    },
  ];

  const categoryColumns = [
    {
      key: 'name',
      label: 'Category Name',
      render: (val) => <span className="font-semibold text-xs" style={{ color: 'var(--color-text-primary)' }}>{val}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{val || 'N/A'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <button onClick={() => handleOpenEditCat(row)} className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Edit
          </button>
          <button onClick={() => handleDeleteCat(row)} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline">
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Expenses"
        subtitle="Manage daily operating expenditures, utility bills, rent, and packaging costs."
      >
        <div className="flex gap-2">
          <Button onClick={handleOpenCreateCat} variant="outline" className="text-xs py-2">
            + Add Classification
          </Button>
          <Button onClick={handleOpenCreateExp} variant="primary" className="text-xs py-2">
            Record Expense
          </Button>
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-zinc-850">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'expenses'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-display'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Expense Logs List
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'categories'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-display'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Classification Categories
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
          Loading financials logs...
        </div>
      ) : activeTab === 'expenses' ? (
        <DataTable
          columns={expenseColumns}
          data={expenses}
          searchPlaceholder="Search expense logs by description details..."
        />
      ) : (
        <DataTable
          columns={categoryColumns}
          data={categories}
          searchPlaceholder="Search classification labels..."
        />
      )}

      {/* Record Expense Modal */}
      <Modal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        title={isExpEdit ? 'Edit Expense Record' : 'Record Business Expense'}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsExpModalOpen(false)} disabled={expSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={expSaving || categories.length === 0} onClick={handleExpSubmit}>
              {expSaving ? 'Saving...' : 'Save Record'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleExpSubmit} className="space-y-4">
          {expFormError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-650 dark:text-red-400">
              ⚠️ {expFormError}
            </div>
          )}

          {categories.length === 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-medium text-amber-600 dark:text-amber-400">
              ⚠️ Please configure at least one classification category first.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Classification Category"
              name="expense_category_id"
              value={expFormData.expense_category_id}
              onChange={handleExpChange}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              required
            />
            <Input
              label="Expense Date"
              name="expense_date"
              type="date"
              value={expFormData.expense_date}
              onChange={handleExpChange}
              required
            />
            <Input
              label="Amount Paid (PKR)"
              name="amount"
              type="number"
              value={expFormData.amount}
              onChange={handleExpChange}
              placeholder="0.00"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-semibold text-black dark:text-slate-400 uppercase tracking-wider">
              Expenditure Description / Notes
            </label>
            <textarea
              name="description"
              value={expFormData.description}
              onChange={handleExpChange}
              rows="3"
              placeholder="e.g. Paid LESCO electricity bill for the month of May..."
              className="w-full text-sm outline-none px-4 py-2.5 rounded-lg border-2 border-slate-400 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900/60 text-black dark:text-slate-100 placeholder-slate-600 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={isCatEdit ? "Edit Expense Classification" : "Add Expense Classification"}
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCatModalOpen(false)} disabled={catSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={catSaving} onClick={handleCatSubmit}>
              {catSaving ? 'Saving...' : (isCatEdit ? 'Update Category' : 'Save Category')}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCatSubmit} className="space-y-4">
          {catFormError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-650 dark:text-red-400">
              ⚠️ {catFormError}
            </div>
          )}

          <Input
            label="Category Name"
            name="name"
            value={catFormData.name}
            onChange={handleCatChange}
            placeholder="e.g. Utility Bills, Rent, Salaries"
            required
          />

          <Input
            label="Description / Details"
            name="description"
            value={catFormData.description}
            onChange={handleCatChange}
            placeholder="e.g. Electricity, Water, Internet expenses..."
          />
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
