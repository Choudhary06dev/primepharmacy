import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Select from '../../../components/UI/Select';
import Modal from '../../../components/UI/Modal';
import { getUnits, createUnit, updateUnit, deleteUnit } from '../../../services/inventoryService';

const Units = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ name: '', abbreviation: '', type: 'Base', description: '' });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Conversion rules simulation calculator states
  const [calcFrom, setCalcFrom] = useState('');
  const [calcTo, setCalcTo] = useState('');
  const [calcQty, setCalcQty] = useState(1);
  const [calcResult, setCalcResult] = useState(null);

  // Fetch units on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUnits();
      setUnits(data);
      if (data.length > 1) {
        setCalcFrom(data.find(u => u.type === 'Multiple')?.id || data[0].id);
        setCalcTo(data.find(u => u.type === 'Base')?.id || data[1].id);
      }
    } catch (err) {
      setError('Failed to fetch units database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Run conversion calculation simulator
  useEffect(() => {
    if (!calcFrom || !calcTo || units.length === 0) return;
    const fromUnit = units.find(u => u.id === Number(calcFrom));
    const toUnit = units.find(u => u.id === Number(calcTo));
    
    if (!fromUnit || !toUnit) return;

    // Simulated conversion factors logic
    let factor = 1;
    if (fromUnit.abbreviation === 'BOX' && toUnit.abbreviation === 'TAB') factor = 100;
    else if (fromUnit.abbreviation === 'BOX' && toUnit.abbreviation === 'STP') factor = 10;
    else if (fromUnit.abbreviation === 'STP' && toUnit.abbreviation === 'TAB') factor = 10;
    else if (fromUnit.abbreviation === 'BOX' && toUnit.abbreviation === 'CAP') factor = 60;
    else if (fromUnit.abbreviation === 'STP' && toUnit.abbreviation === 'CAP') factor = 6;
    else if (fromUnit.abbreviation === toUnit.abbreviation) factor = 1;
    else {
      // General mock conversion fallback
      if (fromUnit.type === 'Multiple' && toUnit.type === 'Base') factor = 10;
      else if (fromUnit.type === 'Base' && toUnit.type === 'Multiple') factor = 0.1;
    }

    setCalcResult(calcQty * factor);
  }, [calcFrom, calcTo, calcQty, units]);

  const handleOpenCreate = () => {
    setFormData({ name: '', abbreviation: '', type: 'Base', description: '' });
    setFormError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (unit) => {
    setFormData({ name: unit.name, abbreviation: unit.abbreviation, type: unit.type, description: unit.description });
    setFormError(null);
    setCurrentId(unit.id);
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
        const updated = await updateUnit(currentId, formData);
        setUnits((prev) =>
          prev.map((u) => (u.id === currentId ? updated : u))
        );
        showToast('Unit updated successfully.');
      } else {
        const created = await createUnit(formData);
        setUnits((prev) => [...prev, created]);
        showToast('Unit created successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (unit) => {
    if (
      window.confirm(
        `Are you sure you want to delete the unit "${unit.name}"?`
      )
    ) {
      setError(null);
      try {
        await deleteUnit(unit.id);
        setUnits((prev) => prev.filter((u) => u.id !== unit.id));
        showToast('Unit deleted successfully.');
      } catch (err) {
        setError(err.message || 'Failed to delete unit.');
      }
    }
  };

  const showToast = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const columns = [
    {
      key: 'name',
      label: 'Unit Name',
      render: (val) => <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{val}</span>,
    },
    {
      key: 'abbreviation',
      label: 'Abbr.',
      render: (val) => <span className="font-mono bg-slate-100 dark:bg-zinc-800 text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700/50" style={{ color: 'var(--color-text-primary)' }}>{val}</span>,
    },
    {
      key: 'type',
      label: 'Unit Type',
      render: (val) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
          val === 'Base'
            ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-450 border-blue-100 dark:border-blue-900/30'
            : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
        }`}>
          {val}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => (
        <span className="block max-w-xs truncate" title={val} style={{ color: 'var(--color-text-secondary)' }}>
          {val || <span className="text-slate-400">No description</span>}
        </span>
      ),
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
        title="Units of Measure"
        subtitle="Configure packaging sizes and define stock base unit conversion ratios."
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
          Add Unit
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

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Units List */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400 text-sm">
              Loading units database...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={units}
              searchPlaceholder="Search units by name or abbreviation..."
            />
          )}
        </div>

        {/* Right Side: Conversion Preview Calculator */}
        <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-100">Conversion Rules</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Test how custom units translate to their equivalent quantity in the smallest base unit.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Quantity"
              type="number"
              value={calcQty}
              onChange={(e) => setCalcQty(Math.max(1, Number(e.target.value)))}
            />

            <Select
              label="From Unit"
              value={calcFrom}
              onChange={(e) => setCalcFrom(e.target.value)}
              options={units.map(u => ({ value: u.id, label: `${u.name} (${u.abbreviation})` }))}
              emptyOption={false}
            />

            <div className="text-center text-slate-400 text-xs py-1">⬇ Converts To ⬇</div>

            <Select
              label="To Unit"
              value={calcTo}
              onChange={(e) => setCalcTo(e.target.value)}
              options={units.map(u => ({ value: u.id, label: `${u.name} (${u.abbreviation})` }))}
              emptyOption={false}
            />

            <div className="rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-850 p-4 space-y-2 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Calculated Result</span>
              {calcResult !== null && units.length > 0 ? (
                <div className="text-lg font-bold font-display" style={{ color: 'var(--color-text-brand)' }}>
                  {calcQty} {units.find(u => u.id === Number(calcFrom))?.abbreviation} = {calcResult.toLocaleString()} {units.find(u => u.id === Number(calcTo))?.abbreviation}
                </div>
              ) : (
                <div className="text-xs text-slate-400">Please configure units.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Unit' : 'Create New Unit'}
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
              {saving ? 'Saving...' : 'Save Unit'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          {formError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-655 dark:text-red-400 flex items-center gap-2">
              <span>⚠️</span> <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Unit Name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Tablets"
                />

                <Input
                  label="Abbreviation"
                  name="abbreviation"
                  required
                  value={formData.abbreviation}
                  onChange={handleFormChange}
                  placeholder="e.g. TAB"
                />
              </div>

              <Select
                label="Unit Type"
                name="type"
                required
                value={formData.type}
                onChange={handleFormChange}
                options={[
                  { value: 'Base', label: 'Base Unit (e.g. Tablet, Capsule, Bottle)' },
                  { value: 'Multiple', label: 'Multiple Unit (e.g. Box, Strip, Pack)' },
                ]}
                emptyOption={false}
                helpText="Base units are the smallest dosage format. Multiple units hold conversion factors."
              />

              <div className="flex flex-col gap-1.5 w-full">
                <label className="block text-xs font-semibold text-black dark:text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="2"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="e.g. Cardboard box packaging containing 10 strips..."
                  className={`w-full text-sm outline-none px-4 py-2.5 rounded-lg border-2 text-black dark:text-slate-100 placeholder-slate-600 dark:placeholder-slate-500 transition-all focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 ${
                    formData.description
                      ? 'border-brand-500/70 bg-brand-50/60 dark:border-brand-500/60 dark:bg-brand-950/25'
                      : 'border-slate-400 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900/60'
                  }`}
                />
              </div>
            </div>

            <div className="md:col-span-5 bg-brand-50/80 dark:bg-brand-950/25 rounded-xl border-2 border-brand-500/45 dark:border-brand-500/40 p-4 flex flex-col justify-center space-y-3">
              <h4 className="text-xs font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>📏</span> Packaging Setup
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Define the units of measure used for purchase orders and customer bills. 
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong>Base Units</strong>: Smallest dosage item (e.g., tablet, vial).
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong>Multiple Units</strong>: Hold a collection of base items (e.g., a box).
              </p>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Units;
