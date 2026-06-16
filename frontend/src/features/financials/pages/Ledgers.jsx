import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Button from '../../../components/UI/Button';
import Modal from '../../../components/UI/Modal';
import { getSuppliers } from '../../../services/suppliersService';
import { getCustomers } from '../../../services/salesService';
import { getSupplierLedger, getCustomerLedger } from '../../../services/financialsService';

const Ledgers = () => {
  const location = useLocation();
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Tab: 'suppliers' or 'customers'
  const [activeTab, setActiveTab] = useState(
    location.pathname.includes('customer') ? 'customers' : 'suppliers'
  );

  useEffect(() => {
    setActiveTab(location.pathname.includes('customer') ? 'customers' : 'suppliers');
  }, [location.pathname]);

  // Ledger details modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState(null); // Contains { account, entries }

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [supData, custData] = await Promise.all([
        getSuppliers(),
        getCustomers(),
      ]);
      setSuppliers(supData);
      setCustomers(custData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch ledger accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSupplierLedger = async (id) => {
    setLedgerLoading(true);
    setLedgerData(null);
    setIsModalOpen(true);
    try {
      const data = await getSupplierLedger(id);
      setLedgerData({
        type: 'Supplier',
        name: data.supplier.name,
        balance: data.supplier.balance,
        entries: data.entries,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to load supplier ledger details.');
      setIsModalOpen(false);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleViewCustomerLedger = async (id) => {
    setLedgerLoading(true);
    setLedgerData(null);
    setIsModalOpen(true);
    try {
      const data = await getCustomerLedger(id);
      setLedgerData({
        type: 'Customer',
        name: data.customer.name,
        balance: data.customer.balance,
        entries: data.entries,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to load customer ledger details.');
      setIsModalOpen(false);
    } finally {
      setLedgerLoading(false);
    }
  };

  const supplierColumns = [
    {
      key: 'name',
      label: 'Supplier Name',
      render: (val, row) => (
        <button
          onClick={() => handleViewSupplierLedger(row.id)}
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline text-left"
        >
          {val}
        </button>
      ),
    },
    {
      key: 'contact_person',
      label: 'Contact Person',
      render: (val) => <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{val || 'N/A'}</span>,
    },
    {
      key: 'phone',
      label: 'Phone Number',
      render: (val) => <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>{val || 'N/A'}</span>,
    },
    {
      key: 'balance',
      label: 'Payable Balance',
      render: (val) => {
        const bal = Number(val || 0);
        return (
          <span className={`font-mono text-xs font-bold ${bal > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
            PKR {bal.toFixed(2)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => handleViewSupplierLedger(row.id)}
          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
        >
          Inspect Account Statement
        </button>
      ),
    },
  ];

  const customerColumns = [
    {
      key: 'name',
      label: 'Customer Name',
      render: (val, row) => (
        <button
          onClick={() => handleViewCustomerLedger(row.id)}
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline text-left"
        >
          {val}
        </button>
      ),
    },
    {
      key: 'phone',
      label: 'Phone Number',
      render: (val) => <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>{val || 'N/A'}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (val) => <span className="text-xs text-slate-500">{val || 'N/A'}</span>,
    },
    {
      key: 'balance',
      label: 'Receivable Balance',
      render: (val) => {
        const bal = Number(val || 0);
        return (
          <span className={`font-mono text-xs font-bold ${bal > 0 ? 'text-brand-650 dark:text-brand-400' : 'text-slate-500'}`}>
            PKR {bal.toFixed(2)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => handleViewCustomerLedger(row.id)}
          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
        >
          Inspect Account Statement
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Double-Entry Ledgers"
        subtitle="Verify accounts payable summaries for wholesale suppliers and receivables for retail customers."
      />

      <div className="flex border-b border-slate-200 dark:border-zinc-850">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'suppliers'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-display'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Supplier Payable Accounts
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'customers'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-display'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Customer Receivable Accounts
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-650 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400 text-sm">
          Loading ledger accounts...
        </div>
      ) : activeTab === 'suppliers' ? (
        <DataTable
          columns={supplierColumns}
          data={suppliers}
          searchPlaceholder="Search suppliers by name or phone..."
        />
      ) : (
        <DataTable
          columns={customerColumns}
          data={customers}
          searchPlaceholder="Search customers by name or phone..."
        />
      )}

      {/* Ledger Entries Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={ledgerData ? `${ledgerData.type} Statement: ${ledgerData.name}` : 'Account Statement'}
        size="xl"
        footer={
          <Button variant="primary" onClick={() => setIsModalOpen(false)}>
            Close Statement
          </Button>
        }
      >
        {ledgerLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading ledger transaction logs...</div>
        ) : !ledgerData ? (
          <div className="p-8 text-center text-sm text-red-500">Failed to load ledger records.</div>
        ) : (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-850 p-4 rounded-xl">
              <div>
                <span className="text-slate-450 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block">
                  Account Name
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{ledgerData.name}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-450 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block">
                  Current Running Balance
                </span>
                <span className="text-sm font-bold text-brand-650 dark:text-brand-450">
                  PKR {Number(ledgerData.balance).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Ledger table */}
            <div className="border border-slate-200 dark:border-zinc-850 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-150 dark:border-zinc-850 text-[10px] font-bold uppercase text-slate-550 tracking-wider">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Reference / Doc No</th>
                    <th className="px-4 py-3">Action Type</th>
                    <th className="px-4 py-3 text-right">Debit (PKR)</th>
                    <th className="px-4 py-3 text-right">Credit (PKR)</th>
                    <th className="px-4 py-3 text-right">Running Balance (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-zinc-900">
                  {ledgerData.entries.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-450">
                        No transactions registered under this account ledger yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-4 py-3 font-mono">
                          {new Date(entry.transaction_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-slate-350">
                          {entry.transaction_no}
                        </td>
                        <td className="px-4 py-3 font-bold text-[10px] tracking-wide text-slate-500 uppercase">
                          {entry.transaction_type}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-red-500 font-semibold">
                          {Number(entry.debit) > 0 ? Number(entry.debit).toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-450 font-semibold">
                          {Number(entry.credit) > 0 ? Number(entry.credit).toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          PKR {Number(entry.running_balance).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Ledgers;
