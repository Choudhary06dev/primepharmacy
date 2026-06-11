import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Modal from '../../../components/UI/Modal';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../../services/inventoryService';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError('Failed to fetch categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({ name: '', description: '' });
    setFormError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setFormData({ name: category.name, description: category.description });
    setFormError(null);
    setCurrentId(category.id);
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
        const updated = await updateCategory(currentId, formData);
        setCategories((prev) =>
          prev.map((cat) => (cat.id === currentId ? updated : cat))
        );
        showToast('Category updated successfully.');
      } else {
        const created = await createCategory(formData);
        setCategories((prev) => [...prev, created]);
        showToast('Category created successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (
      window.confirm(
        `Are you sure you want to delete the category "${category.name}"?`
      )
    ) {
      setError(null);
      try {
        await deleteCategory(category.id);
        setCategories((prev) => prev.filter((cat) => cat.id !== category.id));
        showToast('Category deleted successfully.');
      } catch (err) {
        setError(err.message || 'Failed to delete category.');
      }
    }
  };

  const showToast = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: 'Category Name',
      render: (val) => <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{val}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => (
        <span className="block max-w-sm truncate" title={val} style={{ color: 'var(--color-text-secondary)' }}>
          {val || <span style={{ color: 'var(--color-text-tertiary)' }}>No description provided</span>}
        </span>
      ),
    },
    {
      key: 'medicines_count',
      label: 'Medicines Count',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-900/30">
          {val} medicines
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created At',
      render: (val) => <span className="font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{val}</span>,
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
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medicine Categories"
        subtitle="Manage product categories to classify pharmaceutical stocks and formulas."
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
          Add Category
        </Button>
      </PageHeader>

      {/* Success Notification */}
      {success && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          ✓ {success}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-650 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400 text-sm">
          Loading categories database...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={categories}
          searchPlaceholder="Search categories by name or description..."
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Category' : 'Create New Category'}
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
              {saving ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          {formError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-650 dark:text-red-400 flex items-center gap-2">
              <span>⚠️</span> <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-4">
              <Input
                label="Category Name"
                name="name"
                required
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g. Tablets"
                helpText="Specify the general classification label for medicines."
              />

              <div className="flex flex-col gap-1.5 w-full">
                <label className="block text-xs font-semibold text-black dark:text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="e.g. Solid oral dosage forms containing active ingredients..."
                  className={`w-full text-sm outline-none px-4 py-2.5 rounded-lg border-2 text-black dark:text-slate-100 placeholder-slate-600 dark:placeholder-slate-500 transition-all focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 ${
                    formData.description
                      ? 'border-brand-500/70 bg-brand-50/60 dark:border-brand-500/60 dark:bg-brand-950/25'
                      : 'border-slate-400 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900/60'
                  }`}
                />
                <span className="text-[11px] text-black dark:text-slate-400 mt-0.5">
                  Explain what types of products are mapped to this catalog section.
                </span>
              </div>
            </div>

            <div className="md:col-span-5 bg-brand-50/80 dark:bg-brand-950/25 rounded-xl border-2 border-brand-500/45 dark:border-brand-500/40 p-4 flex flex-col justify-center space-y-3">
              <h4 className="text-xs font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🏷️</span> Classification Tip
              </h4>
              <p className="text-[11px] text-black dark:text-slate-400 leading-relaxed">
                Grouping medicines by category (such as Tablets, Syrups, or Injections) simplifies POS lookups, stock tracking, and sales analytics reports.
              </p>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;
