<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SupplierLedger;
use App\Models\CustomerLedger;
use App\Models\Supplier;
use App\Models\Customer;
use Illuminate\Http\Request;

class LedgerController extends Controller
{
    /**
     * Get transaction ledger for a supplier.
     */
    public function supplier(int $id)
    {
        $supplier = Supplier::findOrFail($id);
        
        $entries = SupplierLedger::where('supplier_id', $id)
            ->orderBy('transaction_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();
            
        return response()->json([
            'supplier' => $supplier,
            'entries' => $entries
        ]);
    }

    /**
     * Get transaction ledger for a customer.
     */
    public function customer(int $id)
    {
        $customer = Customer::findOrFail($id);
        
        $entries = CustomerLedger::where('customer_id', $id)
            ->orderBy('transaction_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();
            
        return response()->json([
            'customer' => $customer,
            'entries' => $entries
        ]);
    }
}
