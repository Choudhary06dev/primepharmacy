import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Modal from '../../../components/UI/Modal';
import Button from '../../../components/UI/Button';
import { getInvoices, getInvoiceDetails } from '../../../services/salesService';

const Sales = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [totalRows, setTotalRows] = useState(0);

  // Detail Modal states
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, searchQuery, pageSize]);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInvoices(currentPage, searchQuery, pageSize);
      if (response && response.data) {
        setInvoices(response.data);
        setTotalRows(response.total || response.data.length);
      } else {
        setInvoices(response || []);
        setTotalRows((response || []).length);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch sales invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleViewDetails = async (invoice) => {
    setSelectedInvoice(invoice);
    setDetailsLoading(true);
    try {
      const details = await getInvoiceDetails(invoice.id);
      setInvoiceDetails(details);
    } catch (err) {
      alert('Failed to retrieve invoice details.');
      setSelectedInvoice(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedInvoice(null);
    setInvoiceDetails(null);
  };

  // DataTable columns
  const columns = [
    {
      key: 'invoice_no',
      label: 'Invoice No.',
      render: (val, row) => (
        <button
          onClick={() => handleViewDetails(row)}
          className="font-mono font-bold text-xs text-brand-600 dark:text-brand-400 hover:underline text-left"
        >
          {val}
        </button>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (val) => <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{val?.name || 'Walk-in Customer'}</span>
    },
    {
      key: 'sale_date',
      label: 'Sale Date',
      render: (val) => <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>{val}</span>
    },
    {
      key: 'grand_total',
      label: 'Billing Total',
      render: (_, row) => (
        <div className="flex flex-col font-mono text-xs text-slate-700 dark:text-slate-300">
          <span className="font-bold">Total: PKR {Number(row.grand_total).toFixed(2)}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Paid: PKR {Number(row.paid_amount).toFixed(2)}</span>
        </div>
      )
    },
    {
      key: 'payment_status',
      label: 'Payment Status',
      render: (val) => {
        let badgeStyle = '';
        if (val === 'PAID') badgeStyle = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-100 dark:border-emerald-900/30';
        else if (val === 'PARTIALLY_PAID') badgeStyle = 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
        else badgeStyle = 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30';
        
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
            {val}
          </span>
        );
      }
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      render: (val) => <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{val}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewDetails(row)}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Invoices History"
        subtitle="Review pharmacy sales logs, billing statuses, and FEFO stock deduction audit reports."
      />

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-650 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {loading && invoices.length === 0 ? (
        <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400 text-sm">
          Loading sales ledger...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={invoices}
          serverSide={true}
          totalRows={totalRows}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          onSearchChange={handleSearchChange}
          searchVal={searchQuery}
          searchPlaceholder="Search invoices by invoice number or customer name..."
        />
      )}

      {/* Invoice Details Popup Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={handleCloseDetails}
          title={`Invoice ${selectedInvoice.invoice_no}`}
          size="lg"
          footer={
            <Button variant="outline" onClick={handleCloseDetails}>
              Close Invoice
            </Button>
          }
        >
          {detailsLoading || !invoiceDetails ? (
            <div className="flex items-center justify-center p-12 text-xs text-slate-400">
              Retrieving invoice records...
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Customer, Cashier information */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-zinc-850 pb-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Customer Details</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {invoiceDetails.customer?.name || 'Walk-in Customer'}
                  </p>
                  {invoiceDetails.customer?.phone && <p className="text-slate-500 dark:text-slate-400">Phone: {invoiceDetails.customer.phone}</p>}
                  {invoiceDetails.customer?.email && <p className="text-slate-500 dark:text-slate-400">Email: {invoiceDetails.customer.email}</p>}
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Invoice details</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Date: {invoiceDetails.sale_date}</p>
                  <p className="text-slate-500 dark:text-slate-400">Payment: {invoiceDetails.payment_method}</p>
                  <p className="text-slate-500 dark:text-slate-400">Cashier: {invoiceDetails.user?.name || 'Operator'}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Itemized Billing details</h4>
                
                <div className="border border-slate-200 dark:border-zinc-800/80 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-12 bg-slate-50 dark:bg-zinc-900/60 font-bold p-3 border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400">
                    <span className="col-span-5">Medicine Item</span>
                    <span className="col-span-2 text-center">Unit</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-3 text-right">Subtotal</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-zinc-900">
                    {invoiceDetails.items?.map((item) => (
                      <div key={item.id} className="p-3">
                        <div className="grid grid-cols-12 items-start text-slate-800 dark:text-slate-200">
                          <div className="col-span-5 flex flex-col">
                            <span className="font-semibold">{item.medicine?.name || item.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.medicine?.generic_name}</span>
                          </div>
                          <span className="col-span-2 text-center">{item.unit?.abbreviation || item.unit_name}</span>
                          <span className="col-span-2 text-center font-mono">{item.quantity}</span>
                          <span className="col-span-3 text-right font-mono font-bold">
                            PKR {(item.quantity * item.unit_price).toFixed(2)}
                          </span>
                        </div>

                        {/* Batch Audit Trail (FEFO checks) */}
                        {item.batches && item.batches.length > 0 && (
                          <div className="bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/15 p-2 rounded-lg mt-2 space-y-1 text-[10px] font-mono text-brand-650 dark:text-brand-400">
                            <span className="font-bold block uppercase tracking-wider text-[9px] mb-1">🔍 FEFO Stock Deduction Trace:</span>
                            {item.batches.map((b) => (
                              <div key={b.id} className="flex justify-between">
                                <span>• Batch: {b.batch?.batch_no || 'N/A'} (Exp: {b.batch?.expiry_date ? new Date(b.batch.expiry_date).toISOString().split('T')[0] : 'N/A'})</span>
                                <span className="font-bold">Deducted: {b.quantity} {item.medicine?.base_unit?.abbreviation || 'Base units'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Invoice summary info */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-zinc-850">
                <div className="w-64 space-y-2 text-xs text-right">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">PKR {Number(invoiceDetails.sub_total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Tax:</span>
                    <span className="font-mono">PKR {Number(invoiceDetails.tax).toFixed(2)}</span>
                  </div>
                  {Number(invoiceDetails.discount) > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount:</span>
                      <span className="font-mono">- PKR {Number(invoiceDetails.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-800 dark:text-slate-100 border-t border-slate-200 dark:border-zinc-800 pt-2">
                    <span>Grand Total:</span>
                    <span className="font-mono" style={{ color: 'var(--color-text-brand)' }}>
                      PKR {Number(invoiceDetails.grand_total).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 pt-1">
                    <span>Paid Amount:</span>
                    <span className="font-mono">PKR {Number(invoiceDetails.paid_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Remaining Due:</span>
                    <span className="font-mono font-bold text-red-500">
                      PKR {Math.max(0, invoiceDetails.grand_total - invoiceDetails.paid_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default Sales;
