<?php

namespace App\Http\Controllers;

use App\Models\Country;
use App\Models\Province;
use App\Models\City;
use App\Models\Areas;
use App\Models\Booker;
use App\Models\Account;
use App\Models\Subarea;
use App\Models\Saleman;
use App\Models\AccountType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $query = Account::with(['accountType', 'city', 'area', 'saleman', 'creator']);

        // Filter by Search (Code, Title)
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('code', 'like', '%' . $request->search . '%')
                    ->orWhere('title', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by Account Type (e.g., Customer, Supplier)
        if ($request->has('type') && $request->type && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Filter by City
        if ($request->has('city_id') && $request->city_id && $request->city_id !== 'all') {
            $query->where('city_id', $request->city_id);
        }

        // Filter by Status
        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->where('status', 1);
            } elseif ($request->status === 'inactive') {
                $query->where('status', 0);
            }
        }

        $accounts = $query->latest()->get();

        // Calculate Summary
        // Filter collection by relationship name since 'type' column holds ID
        $customers = $accounts->filter(function ($account) {
            return $account->accountType && $account->accountType->name === 'Customers';
        });

        $suppliers = $accounts->filter(function ($account) {
            return $account->accountType && $account->accountType->name === 'Supplier';
        });

        $receivables = \App\Models\Sales::sum('remaining_amount')
            - \App\Models\SalesReturn::sum('remaining_amount')
            + $customers->where('opening_balance', '>', 0)->sum('opening_balance');
        $payables = \App\Models\Purchase::sum('remaining_amount')
            - \App\Models\PurchaseReturn::sum('remaining_amount')
            + $suppliers->where('opening_balance', '>', 0)->sum('opening_balance');

        $summary = [
            'total_accounts' => $accounts->count(),
            'customers_count' => $customers->count(),
            'suppliers_count' => $suppliers->count(),
            'total_receivables' => $receivables,
            'total_payables' => $payables,
        ];

        // Datasets for Filters
        $cities = City::select('id', 'name')->get();
        // Assuming 'type' is a string field in Account based on store validation "type => required|string".
        // If it refers to AccountType model, we'd fetch that. validation says string in store, but index previously mapped usage of accountType relation.
        // Let's check store() again: 'type' => 'required|string'.
        // But index() used $account->accountType?->name. 
        // It seems 'type' column might store the string name or there is an inconsistency.
        // Looking at 'store': 'type' => 'required|string'.
        // Looking at 'index' map: 'type' => ucfirst($account->accountType?->name ?? 'Unknown').
        // This suggests the DB might have `type` column storing 'Customer'/'Supplier' OR it relies on `account_type_id`.
        // Let's look at `create()` method... $accountTypes = AccountType::all();
        // The store validation has 'type', but not 'account_type_id'.
        // Wait, `Account` model likely has `type` (string) as per validation.
        // But `index` map was using relationship. Maybe `type` input fills `account_type_id`?
        // Let's blindly trust the `type` column for now as a string filter, or `account_type_id` if available.
        // Actually, previous index map: 'type' => ucfirst($account->accountType?->name ?? 'Unknown')
        // This implies the model has `accountType` relationship.
        // Let's pass AccountTypes for filter.
        $accountTypes = AccountType::all();


        return Inertia::render("setup/account/index", [
            'accounts' => $accounts,
            'cities' => $cities,
            'accountTypes' => $accountTypes,
            'summary' => $summary,
            'filters' => $request->all(['search', 'type', 'city_id', 'status']),
        ]);
    }
    public function create()
    {
        $countries = Country::all();
        $provinces = Province::all();
        $cities = City::all();
        $areas = Areas::all();
        $subareas = Subarea::all();
        $salemans = Saleman::all();
        $bookers = Booker::all();
        $accountTypes = AccountType::all();
        return Inertia::render("setup/account/create", [
            'countries' => $countries,
            'provinces' => $provinces,
            'cities' => $cities,
            'areas' => $areas,
            'subareas' => $subareas,
            'salemans' => $salemans,
            'bookers' => $bookers,
            'accountTypes' => $accountTypes,
        ]);
    }
    public function store(Request $request)
    {
        // ✅ Validate incoming data
        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'type' => 'required|string',
            'purchase' => 'nullable|boolean',
            'cashbank' => 'nullable|boolean',
            'sale' => 'nullable|boolean',
            'opening_balance' => 'nullable|numeric',
            'address1' => 'nullable|string|max:255',
            'address2' => 'nullable|string|max:255',
            'telephone1' => 'nullable|string|max:50',
            'telephone2' => 'nullable|string|max:50',
            'fax' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:50',
            'gst' => 'nullable|string|max:50',
            'ntn' => 'nullable|string|max:50',
            'remarks' => 'nullable|string',
            'regards' => 'nullable|string',
            'opening_date' => 'nullable|date',
            'fbr_date' => 'nullable|date',
            'country_id' => 'nullable|integer',
            'province_id' => 'nullable|integer',
            'city_id' => 'nullable|integer',
            'area_id' => 'nullable|integer',
            'subarea_id' => 'nullable|integer',
            'saleman_id' => 'nullable|integer',
            'booker_id' => 'nullable|integer',
            'credit_limit' => 'nullable|numeric',
            'aging_days' => 'nullable|integer',
            'note_head' => 'nullable|string|max:255',
            'item_category' => 'nullable|integer',
            'category' => 'nullable|string|max:100',
            'ats_percentage' => 'nullable|numeric',
            'ats_type' => 'nullable|string|max:50',
            'cnic' => 'nullable|string|max:20',
            'status' => 'boolean',
        ]);

        // ✅ Convert checkbox booleans
        $validated['purchase'] = $request->boolean('purchase');
        $validated['cashbank'] = $request->boolean('cashbank');
        $validated['sale'] = $request->boolean('sale');
        $validated['status'] = $request->boolean('status');

        // ✅ Save to DB
        $account = Account::create($validated);

        // ✅ Redirect back with success message
        return redirect()->route('account.index')
            ->with('success', 'Account created successfully!');
    }
    public function edit(Account $account)
    {
        $countries = Country::all();
        $provinces = Province::all();
        $cities = City::all();
        $areas = Areas::all();
        $subareas = Subarea::all();
        $salemans = Saleman::all();
        $bookers = Booker::all();
        $accountTypes = AccountType::all();
        return Inertia::render("setup/account/edit", [
            'account' => $account,
            'countries' => $countries,
            'provinces' => $provinces,
            'cities' => $cities,
            'areas' => $areas,
            'subareas' => $subareas,
            'salemans' => $salemans,
            'bookers' => $bookers,
            'accountTypes' => $accountTypes,
        ]);
    }
    public function update(Request $request, Account $account)
    {
        // ✅ Validate incoming data
        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'type' => 'required|string',
            'purchase' => 'nullable|boolean',
            'cashbank' => 'nullable|boolean',
            'sale' => 'nullable|boolean',
            'opening_balance' => 'nullable|numeric',
            'address1' => 'nullable|string|max:255',
            'address2' => 'nullable|string|max:255',
            'telephone1' => 'nullable|string|max:50',
            'telephone2' => 'nullable|string|max:50',
            'fax' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:50',
            'gst' => 'nullable|string|max:50',
            'ntn' => 'nullable|string|max:50',
            'remarks' => 'nullable|string',
            'regards' => 'nullable|string',
            'opening_date' => 'nullable|date',
            'fbr_date' => 'nullable|date',
            'country_id' => 'nullable|integer',
            'province_id' => 'nullable|integer',
            'city_id' => 'nullable|integer',
            'area_id' => 'nullable|integer',
            'subarea_id' => 'nullable|integer',
            'saleman_id' => 'nullable|integer',
            'booker_id' => 'nullable|integer',
            'credit_limit' => 'nullable|numeric',
            'aging_days' => 'nullable|integer',
            'note_head' => 'nullable|string|max:255',
            'item_category' => 'nullable|integer',
            'category' => 'nullable|string|max:100',
            'ats_percentage' => 'nullable|numeric',
            'ats_type' => 'nullable|string|max:50',
            'cnic' => 'nullable|string|max:20',
            'status' => 'boolean',
        ]);

        // ✅ Convert checkbox booleans
        $validated['purchase'] = $request->boolean('purchase');
        $validated['cashbank'] = $request->boolean('cashbank');
        $validated['sale'] = $request->boolean('sale');
        $validated['status'] = $request->boolean('status');
        // ✅ Update DB
        $account->update($validated);
        // ✅ Redirect back with success message
        return redirect()->route('account.index')
            ->with('success', 'Account updated successfully!');
    }
    public function show(Account $account)
    {
        $account->load(['accountType', 'country', 'province', 'city', 'area', 'subarea', 'saleman', 'booker']);

        $summary = [];
        $type = $account->accountType->name ?? '';

        if ($type === 'Customers') {
            $totalSales = \App\Models\Sales::where('customer_id', $account->id)->sum('net_total');
            $totalReturns = \App\Models\SalesReturn::where('customer_id', $account->id)->sum('net_total');
            $totalReceipts = \App\Models\Payment::where('account_id', $account->id)->where('type', 'RECEIPT')->sum('amount');
            $unpaidInvoices = \App\Models\Sales::where('customer_id', $account->id)->where('remaining_amount', '>', 0)->count();

            $summary = [
                'total_sales' => $totalSales,
                'total_returns' => $totalReturns,
                'total_receipts' => $totalReceipts,
                'unpaid_invoices' => $unpaidInvoices,
            ];
        } elseif ($type === 'Supplier') {
            $totalPurchases = \App\Models\Purchase::where('supplier_id', $account->id)->sum('net_total');
            $totalReturns = \App\Models\PurchaseReturn::where('supplier_id', $account->id)->sum('net_total');
            $totalPayments = \App\Models\Payment::where('account_id', $account->id)->where('type', 'PAYMENT')->sum('amount');
            $unpaidBills = \App\Models\Purchase::where('supplier_id', $account->id)->where('remaining_amount', '>', 0)->count();

            $summary = [
                'total_purchases' => $totalPurchases,
                'total_returns' => $totalReturns,
                'total_payments' => $totalPayments,
                'unpaid_bills' => $unpaidBills,
            ];
        } elseif ($type === 'Bank' || $type === 'Cash') {
            $totalIn = \App\Models\Payment::where('payment_account_id', $account->id)->where('type', 'RECEIPT')->sum('amount');
            $totalOut = \App\Models\Payment::where('payment_account_id', $account->id)->where('type', 'PAYMENT')->sum('amount');

            $summary = [
                'total_in' => $totalIn,
                'total_out' => $totalOut,
                'current_balance' => $account->opening_balance + $totalIn - $totalOut,
            ];

            if ($type === 'Bank') {
                $totalCheques = \App\Models\Chequebook::where('bank_id', $account->id)->count();
                $issuedCheques = \App\Models\Chequebook::where('bank_id', $account->id)->where('status', 'issued')->count();
                $summary['total_cheques'] = $totalCheques;
                $summary['issued_cheques'] = $issuedCheques;
                $summary['available_cheques'] = $totalCheques - $issuedCheques;
            }
        }

        return Inertia::render("setup/account/view", [
            'account' => $account,
            'financial_summary' => $summary,
        ]);
    }
    public function destroy(Account $account)
    {
        $account->delete();
        return redirect()->route('account.index')
            ->with('success', 'Account deleted successfully!');
    }
    public function getBalance($id)
    {
        $account = Account::findOrFail($id);

        $salesUnpaid = \App\Models\Sales::where('customer_id', $id)->sum('remaining_amount');
        $salesReturnsUnpaid = \App\Models\SalesReturn::where('customer_id', $id)->sum('remaining_amount');

        $purchasesUnpaid = \App\Models\Purchase::where('supplier_id', $id)->sum('remaining_amount');
        $purchaseReturnsUnpaid = \App\Models\PurchaseReturn::where('supplier_id', $id)->sum('remaining_amount');

        // Total Balance = (Opening + Sales - SalesReturns) + (Purchases - PurchaseReturns)
        // This calculates the net outstanding volume for this account across all modules.
        $total = $account->opening_balance
            + ($salesUnpaid - $salesReturnsUnpaid)
            + ($purchasesUnpaid - $purchaseReturnsUnpaid);

        return response()->json(['balance' => $total]);
    }

    public function getNextCode(Request $request)
    {
        $typeId = $request->query('type');
        if (!$typeId) {
            return response()->json(['code' => '']);
        }

        // Find the latest account of this type
        $latestAccount = Account::where('type', $typeId)
            ->latest('id')
            ->first();

        if (!$latestAccount) {
            return response()->json(['code' => '000001']);
        }

        // Extract numeric part
        // Assuming code is numeric or alphanumeric. If it's pure number string:
        if (preg_match('/(\d+)$/', $latestAccount->code, $matches)) {
            $number = intval($matches[1]);
            $nextCode = str_pad($number + 1, strlen($matches[1]), '0', STR_PAD_LEFT);
            return response()->json(['code' => $nextCode]);
        }

        // Fallback if regex fails (e.g. empty code)
        return response()->json(['code' => '000001']);
    }
}
