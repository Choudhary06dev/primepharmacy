import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Select from '../../../components/UI/Select';
import Modal from '../../../components/UI/Modal';
import { getMedicines, createMedicine, updateMedicine, deleteMedicine, getCategories, getCompanies, getUnits } from '../../../services/inventoryService';
import { useBranchFilter } from '../../../context/BranchFilterContext';

const Medicines = () => {
  const { selectedBranchId } = useBranchFilter();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Pagination & Search States
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalRows, setTotalRows] = useState(0);

  // Debounce search input to avoid triggering api calls on every keypress
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    category_id: '',
    company_id: '',
    sku: '',
    barcode: '',
    min_stock_level: 0,
    base_unit_id: '',
    is_active: true,
    conversions: []
  });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);

  // Fetch static data lazily on modal open
  useEffect(() => {
    if (!isModalOpen) return;

    if (categories.length > 0 && companies.length > 0 && units.length > 0) return;

    const fetchStaticData = async () => {
      setConfigLoading(true);
      try {
        const [catsData, compsData, unitsData] = await Promise.all([
          getCategories(),
          getCompanies(),
          getUnits()
        ]);
        setCategories(catsData);
        setCompanies(compsData);
        setUnits(unitsData);
      } catch (err) {
        console.error(err);
        setFormError('Failed to fetch catalog options (Categories, Companies, Units).');
      } finally {
        setConfigLoading(false);
      }
    };
    fetchStaticData();
  }, [isModalOpen]);

  // Fetch medicines list dynamically
  useEffect(() => {
    fetchMedicinesList();
  }, [currentPage, searchQuery, pageSize, selectedBranchId]);

  const fetchMedicinesList = async () => {
    setLoading(true);
    setError(null);
    try {
      const medsResponse = await getMedicines(currentPage, searchQuery, pageSize);
      if (medsResponse && medsResponse.data) {
        setMedicines(medsResponse.data);
        setTotalRows(medsResponse.total || medsResponse.data.length);
      } else {
        setMedicines(medsResponse || []);
        setTotalRows((medsResponse || []).length);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch medicines. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      generic_name: '',
      category_id: categories[0]?.id || '',
      company_id: companies[0]?.id || '',
      sku: '',
      barcode: '',
      min_stock_level: 0,
      base_unit_id: units.find(u => u.type === 'Base')?.id || units[0]?.id || '',
      is_active: true,
      conversions: []
    });
    setFormError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    setFormData({
      name: med.name,
      generic_name: med.generic_name || '',
      category_id: med.category_id,
      company_id: med.company_id,
      sku: med.sku || '',
      barcode: med.barcode || '',
      min_stock_level: med.min_stock_level || 0,
      base_unit_id: med.base_unit_id,
      is_active: med.is_active,
      conversions: (med.conversions || []).map((c) => ({
        id: c.id,
        from_unit_id: c.from_unit_id,
        factor: c.factor
      }))
    });
    setFormError(null);
    setCurrentId(med.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Unit Conversions Setup Helpers
  const addConversionRule = () => {
    // Select first multiple unit that isn't the base unit
    const baseUnitId = Number(formData.base_unit_id);
    const availableUnit = units.find(u => u.id !== baseUnitId && u.type === 'Multiple') || units.find(u => u.id !== baseUnitId);

    if (!availableUnit) {
      alert('Please configure at least one other unit of measure first.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      conversions: [
        ...prev.conversions,
        { id: Math.random(), from_unit_id: availableUnit.id, factor: 10 }
      ]
    }));
  };

  const removeConversionRule = (idx) => {
    setFormData((prev) => ({
      ...prev,
      conversions: prev.conversions.filter((_, i) => i !== idx)
    }));
  };

  const handleConversionChange = (idx, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.conversions];
      updated[idx] = { ...updated[idx], [field]: Number(value) };
      return { ...prev, conversions: updated };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      if (isEditMode) {
        const updated = await updateMedicine(currentId, formData);
        setMedicines((prev) =>
          prev.map((m) => (m.id === currentId ? updated : m))
        );
        showToast('Medicine updated successfully.');
      } else {
        const created = await createMedicine(formData);
        setMedicines((prev) => [created, ...prev]);
        showToast('Medicine registered successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (med) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${med.name}" from catalog?`
      )
    ) {
      setError(null);
      try {
        await deleteMedicine(med.id);
        setMedicines((prev) => prev.filter((m) => m.id !== med.id));
        showToast('Medicine deleted successfully.');
      } catch (err) {
        setError(err.message || 'Failed to delete medicine.');
      }
    }
  };

  const showToast = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // DataTable columns
  const columns = [
    {
      key: 'name',
      label: 'Product details',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{row.name}</span>
          <span className="text-[11px] font-mono text-slate-500">{row.generic_name || 'Generic / Formula N/A'}</span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (val) => <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{val?.name || 'Unclassified'}</span>
    },
    {
      key: 'company',
      label: 'Manufacturer',
      render: (val) => <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>{val?.name || 'N/A'}</span>
    },
    {
      key: 'codes',
      label: 'Codes',
      render: (_, row) => (
        <div className="flex flex-col text-[10px] font-mono text-slate-500">
          <span>SKU: {row.sku}</span>
          {row.barcode && <span>EAN: {row.barcode}</span>}
        </div>
      )
    },
    {
      key: 'conversions',
      label: 'Unit Ratios',
      render: (val, row) => {
        const baseAbbr = row.base_unit?.abbreviation || 'PCS';
        return (
          <div className="flex flex-wrap gap-1.5 items-center max-w-[280px]">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700 font-mono">
              1 {baseAbbr} (Base)
            </span>
            {(val || []).map((c) => {
              const abbr = c.from_unit?.abbreviation || 'Unit';
              return (
                <span key={c.id} className="text-[10px] font-mono text-brand-650 dark:text-brand-400 bg-brand-500/5 px-1.5 py-0.5 rounded border border-brand-500/10">
                  1 {abbr} = {Number(c.factor)} {baseAbbr}
                </span>
              );
            })}
          </div>
        );
      }
    },
    {
      key: 'total_stock',
      label: 'Total Stock',
      render: (val, row) => {
        const baseAbbr = row.base_unit?.abbreviation || 'Base';
        const stockVal = val ?? 0;
        const isLow = stockVal <= (row.min_stock_level || 0);
        return (
          <div className="flex flex-col">
            <span className={`text-sm font-bold font-mono ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-450'}`}>
              {stockVal.toLocaleString()} {baseAbbr}
            </span>
            {isLow && (
              <span className="text-[9px] uppercase tracking-wider text-amber-500 font-bold mt-0.5 flex items-center gap-0.5">
                ⚠️ Low Stock Alert
              </span>
            )}
          </div>
        );
      }
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
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medicines Inventory"
        subtitle="Manage product catalog items, packaging size ratios, and minimum stock alerts."
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
          Add Product
        </Button>
      </PageHeader>

      {/* Notifications */}
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

      <div className="relative">
        <DataTable
          columns={columns}
          data={medicines}
          searchPlaceholder="Search catalog by name, formula generic or sku..."
          serverSide={true}
          totalRows={totalRows}
          currentPage={currentPage}
          pageSize={pageSize}
          searchVal={searchInput}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          onSearchChange={(q) => {
            setSearchInput(q);
          }}
        />
      </div>

      {/* Modal form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Medicine' : 'Register New Medicine'}
        size="xl"
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
              {saving ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {formError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-650 dark:text-red-400 flex items-center gap-2">
              <span>⚠️</span> <span>{formError}</span>
            </div>
          )}

          {configLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400 text-sm gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading form configuration (categories, companies, units)...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Medicine Name"
              name="name"
              required
              value={formData.name}
              onChange={handleFormChange}
              placeholder="e.g. Panadol 500mg"
            />

            <Input
              label="Generic Name / Composition"
              name="generic_name"
              value={formData.generic_name}
              onChange={handleFormChange}
              placeholder="e.g. Paracetamol"
            />

            <Select
              label="Category"
              name="category_id"
              required
              value={formData.category_id}
              onChange={handleFormChange}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              emptyOption={false}
            />

            <Select
              label="Manufacturer"
              name="company_id"
              required
              value={formData.company_id}
              onChange={handleFormChange}
              options={companies.map(c => ({ value: c.id, label: c.name }))}
              emptyOption={false}
            />

            <Input
              label="SKU Code"
              name="sku"
              value={formData.sku}
              onChange={handleFormChange}
              placeholder="e.g. MED-PAN500"
            />

            <Input
              label="Barcode (EAN)"
              name="barcode"
              value={formData.barcode}
              onChange={handleFormChange}
              placeholder="e.g. 501234567890"
            />

            <Select
              label="Base Unit (Smallest packaging size)"
              name="base_unit_id"
              required
              value={formData.base_unit_id}
              onChange={handleFormChange}
              options={units.map(u => ({ value: u.id, label: `${u.name} (${u.abbreviation})` }))}
              emptyOption={false}
              helpText="All physical stock counts will be tracked in this base unit format."
            />

            <Input
              label="Min Alert Stock Level (In base units)"
              name="min_stock_level"
              type="number"
              value={formData.min_stock_level}
              onChange={handleFormChange}
            />
          </div>

          {/* Packaging Units / Conversion rules */}
          <div className="border-t border-slate-200 dark:border-zinc-800 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Packaging Size Conversion Rules</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Define factors for buying or selling in bulk packages (e.g. 1 Box = 100 Tablets).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addConversionRule}
              >
                + Add packaging Unit
              </Button>
            </div>

            {formData.conversions.length === 0 ? (
              <p className="text-xs text-slate-400">No custom packaging units configured. This product can only be checked out in its base unit.</p>
            ) : (
              <div className="space-y-3">
                {formData.conversions.map((rule, idx) => (
                  <div key={rule.id} className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-3 rounded-lg">
                    <div className="w-[30%]">
                      <Select
                        label="Packaging Unit"
                        value={rule.from_unit_id}
                        onChange={(e) => handleConversionChange(idx, 'from_unit_id', e.target.value)}
                        options={units.filter(u => u.id !== Number(formData.base_unit_id)).map(u => ({ value: u.id, label: `${u.name} (${u.abbreviation})` }))}
                        emptyOption={false}
                      />
                    </div>
                    <div className="text-center font-bold text-lg text-slate-400 mt-3">=</div>
                    <div className="flex-1">
                      <Input
                        label={`Holds how many base units (${units.find(u => u.id === Number(formData.base_unit_id))?.abbreviation || 'Base'})?`}
                        type="number"
                        value={rule.factor}
                        onChange={(e) => handleConversionChange(idx, 'factor', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeConversionRule(idx)}
                      className="text-red-500 hover:text-red-700 text-sm font-bold mt-5"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>)}
      </form>
      </Modal>
    </div>
  );
};

export default Medicines;
