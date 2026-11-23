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
use App\Models\AccountCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Investor;
use App\Models\InvestorCapitalAccount;
use App\Services\InvestorCapitalService;
use App\Mail\InvestorWelcomeMail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use App\Exports\AccountSampleExport;
use App\Services\AccountBulkUploadService;
use Maatwebsite\Excel\Facades\Excel;

class AccountController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view accounts', only: ['index', 'show', 'getBalance', 'getNextCode', 'searchSuggestions', 'downloadSample']),
            new Middleware('permission:view accounts|create sales|edit sales|create purchase|edit purchase|create returns|edit returns|create purchase returns|edit purchase returns', only: ['picker']),
            new Middleware('permission:manage accounts', only: ['create', 'store', 'edit', 'update', 'destroy', 'toggleStatus', 'resetGuestToken', 'bulkUpload', 'previewBulkUpload', 'processBulkImport']),
        ];
    }
    public function index(Request $request)
    {
        $hasFilters = $request->filled('search') ||
            ($request->filled('type') && $request->type !== 'all') ||
            ($request->filled('city_id') && $request->city_id !== 'all') ||
            ($request->filled('status') && $request->status !== 'all');

        $query = Account::with([
            'accountType:id,name',
            'city:id,name',
            'area:id,name',
            'saleman:id,name',
        ]);

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

        $colsToSelect = [
            'id', 'code', 'title', 'type', 'purchase', 'sale', 'cashbank',
            'opening_balance', 'opening_balance_type', 'credit_limit', 'status',
            'created_at', 'city_id', 'area_id', 'saleman_id', 'image', 'guest_token'
        ];

        $accountsQuery = (clone $query)->select($colsToSelect)->latest();

        if (!$hasFilters && !$request->boolean('all')) {
            $accounts = $accountsQuery->take(100)->get();
        } else {
            $accounts = $accountsQuery->get();
        }

        // Bulk calculate & attach live current_balance to the displayed accounts
        \App\Services\PaymentAccountingService::attachBulkBalances($accounts);

        // Calculate Summary across all accounts (or filtered accounts when filters active)
        if ($hasFilters || $request->boolean('all')) {
            $summaryAccounts = $accounts;
        } else {
            $summaryAccounts = Account::with('accountType:id,name')
                ->whereHas('accountType', fn($q) => $q->whereIn('name', ['Customers', 'Supplier']))
                ->select(['id', 'type', 'purchase', 'sale', 'opening_balance', 'opening_balance_type'])
                ->get();
            \App\Services\PaymentAccountingService::attachBulkBalances($summaryAccounts);
        }

        // Filter collection by relationship name since 'type' column holds ID
        $customers = $summaryAccounts->filter(function ($account) {
            return $account->accountType && $account->accountType->name === 'Customers';
        });

        $suppliers = $summaryAccounts->filter(function ($account) {
            return $account->accountType && $account->accountType->name === 'Supplier';
        });

        $receivables = 0;
        foreach ($customers as $customer) {
            $bal = (float)$customer->current_balance;
            if ($bal > 0) $receivables += $bal; // Only DR balances count as receivable
        }

        $payables = 0;
        foreach ($suppliers as $supplier) {
            $bal = (float)$supplier->current_balance;
            if ($bal > 0) $payables += $bal; // Only CR balances count as payable
        }

        $summary = [
            'total_accounts' => $summaryAccounts->count(),
            'customers_count' => $customers->count(),
            'suppliers_count' => $suppliers->count(),
            'total_receivables' => $receivables,
            'total_payables' => $payables,
        ];

        // Datasets for Filters
        $cities = City::select('id', 'name')->get();
        $accountTypes = AccountType::select('id', 'name')->get();

        return Inertia::render("setup/account/index", [
            'accounts' => $accounts,
            'cities' => $cities,
            'accountTypes' => $accountTypes,
            'summary' => $summary,
            'filters' => $request->all(['search', 'type', 'city_id', 'status', 'all']),
            'isLimited' => !$hasFilters && !$request->boolean('all'),
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
        $accountCategories = AccountCategory::all();
        return Inertia::render("setup/account/create", [
            'countries' => $countries,
            'provinces' => $provinces,
            'cities' => $cities,
            'areas' => $areas,
            'subareas' => $subareas,
            'salemans' => $salemans,
            'bookers' => $bookers,
            'accountTypes' => $accountTypes,
            'accountCategories' => $accountCategories,
        ]);
    }
    public function store(Request $request)
    {
        // ✅ Basic rules common to all
        $rules = [
            'code' => 'required|string|max:50',
            'title' => 'required|string|max:255|unique:accounts,title',
            'type' => 'required|integer|exists:account_types,id',
            'purchase' => 'nullable|boolean',
            'cashbank' => 'nullable|boolean',
            'sale' => 'nullable|boolean',
            'opening_balance'      => 'nullable|numeric|min:0',
            'opening_balance_type' => 'nullable|in:DR,CR',
            'address1'             => 'nullable|string|max:255',
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
            'category' => 'nullable|numeric|exists:account_categories,id',
            'ats_percentage' => 'nullable|numeric',
            'ats_type' => 'nullable|string|max:50',
            'cnic' => 'nullable|string|max:20',
            'status' => 'boolean',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'nullable|string|min:8',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ];

        // ✅ Apply conditional rules
        $accountType = AccountType::find($request->type);
        if ($accountType) {
            if ($accountType->name === 'Customers') {
                $rules['saleman_id'] = 'required|integer';
                $rules['credit_limit'] = 'required|numeric';
                $rules['aging_days'] = 'required|integer';
                $rules['item_category'] = 'required|integer';
            } elseif ($accountType->name === 'Supplier') {
                $rules['opening_balance'] = 'required|numeric';
                $rules['saleman_id'] = 'required|integer';
                $rules['aging_days'] = 'required|integer';
                $rules['category'] = 'required|numeric|exists:account_categories,id';
            }
        }

        $validated = $request->validate($rules, [
            'title.unique' => 'Account name already exists.',
        ]);

        // ✅ Convert checkbox booleans
        $validated['purchase'] = $request->boolean('purchase');
        $validated['cashbank'] = $request->boolean('cashbank');
        $validated['sale'] = $request->boolean('sale');
        $validated['status'] = $request->boolean('status');

        // ✅ Save to DB (Integrated with Investor creation)
        return DB::transaction(function() use ($validated, $request) {
            if ($request->hasFile('image')) {
                $validated['image'] = $request->file('image')->store('accounts', 'public');
            }
            $account = Account::create($validated);

            if ($request->type == 9 && $request->email && $request->password) {
                $user = User::create([
                    'name' => $request->title,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'status' => 'active',
                ]);

                $user->assignRole('investor');

                $investor = Investor::create([
                    'user_id' => $user->id,
                    'full_name' => $request->title,
                    'status' => 'active',
                    'joining_date' => now(),
                    'phone' => $request->mobile,
                    'cnic' => $request->cnic,
                    'address' => $request->address1,
                ]);

                InvestorCapitalAccount::create([
                    'investor_id' => $investor->id,
                    'current_capital' => (float)($request->opening_balance ?? 0),
                    'ownership_percentage' => 0,
                ]);

                if ($request->opening_balance > 0) {
                    app(InvestorCapitalService::class)->recalculateAllOwnerships();
                }
            }

            return redirect()->route('account.index')
                ->with('success', 'Account created successfully!');
        });

        // Send Welcome Email if investor was created
        if ($request->type == 9 && $request->email && $request->password) {
            try {
                $user = User::where('email', $request->email)->first();
                Mail::to($request->email)->send(new InvestorWelcomeMail($user, $request->password));
            } catch (\Exception $e) {
                \Log::error("Failed to send welcome email: " . $e->getMessage());
            }
        }

        return redirect()->route('account.index')
            ->with('success', 'Account created successfully!');
    }
    public function edit(Account $account)
    {
        $account->has_purchases = \App\Models\Purchase::where('supplier_id', $account->id)->exists();
        $account->has_sales = \App\Models\Sales::where('customer_id', $account->id)->exists();
        $account->has_cashbank = \App\Models\Payment::where('account_id', $account->id)->exists();

        $countries = Country::all();
        $provinces = Province::all();
        $cities = City::all();
        $areas = Areas::all();
        $subareas = Subarea::all();
        $salemans = Saleman::all();
        $bookers = Booker::all();
        $accountTypes = AccountType::all();
        $accountCategories = AccountCategory::all();
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
            'accountCategories' => $accountCategories,
        ]);
    }
    public function update(Request $request, Account $account)
    {
        // ✅ Validate incoming data
        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'title' => 'required|string|max:255|unique:accounts,title,' . $account->id,
            'type' => 'required|string',
            'purchase' => 'nullable|boolean',
            'cashbank' => 'nullable|boolean',
            'sale' => 'nullable|boolean',
            'opening_balance'      => 'nullable|numeric|min:0',
            'opening_balance_type' => 'nullable|in:DR,CR',
            'address1'             => 'nullable|string|max:255',
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
            'category' => 'nullable|numeric|exists:account_categories,id',
            'ats_percentage' => 'nullable|numeric',
            'ats_type' => 'nullable|string|max:50',
            'cnic' => 'nullable|string|max:20',
            'status' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ], [
            'title.unique' => 'Account name already exists.',
        ]);

        // ✅ Convert checkbox booleans
        $validated['purchase'] = $request->boolean('purchase');
        $validated['cashbank'] = $request->boolean('cashbank');
        $validated['sale'] = $request->boolean('sale');
        $validated['status'] = $request->boolean('status');
        // ✅ Handle Image Upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($account->image && Storage::disk('public')->exists($account->image)) {
                Storage::disk('public')->delete($account->image);
            }
            $validated['image'] = $request->file('image')->store('accounts', 'public');
        } else {
            unset($validated['image']);
        }

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
        $type = trim($account->accountType->name ?? '');
        $typeLower = strtolower($type);

        $hasSale = (bool) $account->sale || $typeLower === 'customers';
        $hasPurchase = (bool) $account->purchase || $typeLower === 'supplier';

        if ($hasSale && $hasPurchase) {
            // Dual Role: Customer + Supplier
            $totalSalesGross = \App\Models\Sales::where('customer_id', $account->id)->sum('net_total');
            $totalExtraDiscount = \App\Models\Sales::where('customer_id', $account->id)->sum('extra_discount');
            $totalSales = $totalSalesGross - $totalExtraDiscount;
            $totalSalesReturns = \App\Models\SalesReturn::where('customer_id', $account->id)->sum('net_total');

            $totalPurchases = \App\Models\Purchase::where('supplier_id', $account->id)->sum('net_total');
            $totalPurchaseReturns = \App\Models\PurchaseReturn::where('supplier_id', $account->id)->sum('net_total');

            $receiptsQuery = \App\Models\Payment::where('account_id', $account->id)->where('type', 'RECEIPT')->where('cheque_status', '!=', 'Canceled');
            $totalReceiptsCash = (float) (clone $receiptsQuery)->sum('amount');
            $totalReceiptsDiscount = (float) (clone $receiptsQuery)->sum('discount');
            $totalReceipts = $totalReceiptsCash + $totalReceiptsDiscount;

            $paymentsQuery = \App\Models\Payment::where('account_id', $account->id)->where('type', 'PAYMENT')->where('cheque_status', '!=', 'Canceled');
            $totalPaymentsCash = (float) (clone $paymentsQuery)->sum('amount');
            $totalPaymentsDiscount = (float) (clone $paymentsQuery)->sum('discount');
            $totalPayments = $totalPaymentsCash + $totalPaymentsDiscount;

            $unpaidInvoices = \App\Models\Sales::where('customer_id', $account->id)->where('remaining_amount', '>', 0)->count();
            $unpaidBills = \App\Models\Purchase::where('supplier_id', $account->id)->where('remaining_amount', '>', 0)->count();

            $currentBalance = $account->current_balance;

            $outstandingReceivable = (float) \App\Models\Sales::where('customer_id', $account->id)
                ->whereNotIn('status', ['Paid', 'Returned'])
                ->get()
                ->sum(fn($s) => max(0.0, (float)$s->remaining_amount));

            $outstandingPayable = (float) \App\Models\Purchase::where('supplier_id', $account->id)
                ->whereNotIn('status', ['Paid', 'Returned'])
                ->get()
                ->sum(fn($p) => max(0.0, (float)$p->remaining_amount));

            $customerCredit = (float) \App\Models\CustomerCredit::where('customer_id', $account->id)
                ->whereIn('status', ['Available', 'Partial'])
                ->sum('available_balance');

            $supplierCredit = (float) \App\Models\SupplierCredit::where('supplier_id', $account->id)
                ->whereIn('status', ['Available', 'Partial'])
                ->sum('available_balance');

            $advance = \App\Services\PaymentAccountingService::getAccountAdvanceBalance($account);

            $summary = [
                'is_dual_role' => true,
                'total_sales' => $totalSales,
                'total_extra_discount' => $totalExtraDiscount,
                'total_returns' => $totalSalesReturns,
                'total_sales_returns' => $totalSalesReturns,
                'unpaid_invoices' => $unpaidInvoices,
                'outstanding_receivable' => $outstandingReceivable,
                'customer_credit_balance' => $customerCredit,

                'total_purchases' => $totalPurchases,
                'total_purchase_returns' => $totalPurchaseReturns,
                'unpaid_bills' => $unpaidBills,
                'outstanding_payable' => $outstandingPayable,
                'supplier_credit_balance' => $supplierCredit,

                'total_receipts' => $totalReceipts,
                'total_receipts_cash' => $totalReceiptsCash,
                'total_receipts_discount' => $totalReceiptsDiscount,
                'total_payments' => $totalPayments,
                'total_payments_cash' => $totalPaymentsCash,
                'total_payments_discount' => $totalPaymentsDiscount,

                'current_balance' => $currentBalance,
                'outstanding' => $outstandingReceivable,
                'credit_balance' => $customerCredit + $supplierCredit,
                'advance_balance' => $advance,
            ];
        } elseif ($typeLower === 'customers') {
            $totalSalesGross = \App\Models\Sales::where('customer_id', $account->id)->sum('net_total');
            $totalExtraDiscount = \App\Models\Sales::where('customer_id', $account->id)->sum('extra_discount');
            $totalSales = $totalSalesGross - $totalExtraDiscount;
            $totalReturns = \App\Models\SalesReturn::where('customer_id', $account->id)->sum('net_total');

            $receiptsQuery = \App\Models\Payment::where('account_id', $account->id)->where('type', 'RECEIPT')->where('cheque_status', '!=', 'Canceled');
            $totalReceiptsCash = (float) (clone $receiptsQuery)->sum('amount');
            $totalReceiptsDiscount = (float) (clone $receiptsQuery)->sum('discount');
            $totalReceipts = $totalReceiptsCash + $totalReceiptsDiscount;

            $paymentsQuery = \App\Models\Payment::where('account_id', $account->id)->where('type', 'PAYMENT')->where('cheque_status', '!=', 'Canceled');
            $totalPaymentsCash = (float) (clone $paymentsQuery)->sum('amount');
            $totalPaymentsDiscount = (float) (clone $paymentsQuery)->sum('discount');
            $totalPayments = $totalPaymentsCash + $totalPaymentsDiscount;

            $unpaidInvoices = \App\Models\Sales::where('customer_id', $account->id)->where('remaining_amount', '>', 0)->count();

            $currentBalance = $account->current_balance;

            // Detailed Balances
            $outstanding = (float)\App\Models\Sales::where('customer_id', $account->id)
                ->whereNotIn('status', ['Paid', 'Returned'])
                ->get()
                ->sum(fn($s) => max(0.0, (float)$s->remaining_amount));

            $creditBalance = (float)\App\Models\CustomerCredit::where('customer_id', $account->id)
                ->whereIn('status', ['Available', 'Partial'])
                ->sum('available_balance');

            $advance = \App\Services\PaymentAccountingService::getAccountAdvanceBalance($account);

            $summary = [
                'total_sales' => $totalSales,
                'total_extra_discount' => $totalExtraDiscount,
                'total_returns' => $totalReturns,
                'total_receipts' => $totalReceipts,
                'total_receipts_cash' => $totalReceiptsCash,
                'total_receipts_discount' => $totalReceiptsDiscount,
                'total_payments' => $totalPayments,
                'total_payments_cash' => $totalPaymentsCash,
                'total_payments_discount' => $totalPaymentsDiscount,
                'unpaid_invoices' => $unpaidInvoices,
                'current_balance' => $currentBalance,
                'outstanding' => $outstanding,
                'credit_balance' => $creditBalance,
                'advance_balance' => $advance,
            ];
        } elseif ($typeLower === 'supplier') {
            $totalPurchases = \App\Models\Purchase::where('supplier_id', $account->id)->sum('net_total');
            $totalReturns = \App\Models\PurchaseReturn::where('supplier_id', $account->id)->sum('net_total');

            $paymentsQuery = \App\Models\Payment::where('account_id', $account->id)->where('type', 'PAYMENT')->where('cheque_status', '!=', 'Canceled');
            $totalPaymentsCash = (float) (clone $paymentsQuery)->sum('amount');
            $totalPaymentsDiscount = (float) (clone $paymentsQuery)->sum('discount');
            $totalPayments = $totalPaymentsCash + $totalPaymentsDiscount;

            $receiptsQuery = \App\Models\Payment::where('account_id', $account->id)->where('type', 'RECEIPT')->where('cheque_status', '!=', 'Canceled');
            $totalReceiptsCash = (float) (clone $receiptsQuery)->sum('amount');
            $totalReceiptsDiscount = (float) (clone $receiptsQuery)->sum('discount');
            $totalReceipts = $totalReceiptsCash + $totalReceiptsDiscount;

            $unpaidBills = \App\Models\Purchase::where('supplier_id', $account->id)->where('remaining_amount', '>', 0)->count();

            $currentBalance = $account->current_balance;

            // Detailed Balances
            $outstanding = (float)\App\Models\Purchase::where('supplier_id', $account->id)
                ->whereNotIn('status', ['Paid', 'Returned'])
                ->get()
                ->sum(fn($p) => max(0.0, (float)$p->remaining_amount));

            $creditBalance = (float)\App\Models\SupplierCredit::where('supplier_id', $account->id)
                ->whereIn('status', ['Available', 'Partial'])
                ->sum('available_balance');

            $advance = \App\Services\PaymentAccountingService::getAccountAdvanceBalance($account);

            $summary = [
                'total_purchases' => $totalPurchases,
                'total_returns' => $totalReturns,
                'total_payments' => $totalPayments,
                'total_payments_cash' => $totalPaymentsCash,
                'total_payments_discount' => $totalPaymentsDiscount,
                'total_receipts' => $totalReceipts,
                'total_receipts_cash' => $totalReceiptsCash,
                'total_receipts_discount' => $totalReceiptsDiscount,
                'unpaid_bills' => $unpaidBills,
                'current_balance' => $currentBalance,
                'outstanding' => $outstanding,
                'credit_balance' => $creditBalance,
                'advance_balance' => $advance,
            ];
        } elseif ($typeLower === 'cheque in hand') {
            $financialQuery = \App\Models\Payment::where('payment_account_id', $account->id)
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned', 'Refund'])->orWhereNull('cheque_status');
                });

            $totalIn = (clone $financialQuery)->where('type', 'RECEIPT')->sum('amount');
            $currentBalance = (float)$account->current_balance;
            $totalOut = max(0.0, $totalIn - $currentBalance);

            $summary = [
                'total_in' => $totalIn,
                'total_out' => $totalOut,
                'current_balance' => $currentBalance,
            ];
        } elseif (in_array($typeLower, ['bank', 'cash'])) {
            // Financial payments query (where payment_account_id = $account->id)
            $financialQuery = \App\Models\Payment::where('payment_account_id', $account->id)
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned', 'Refund'])->orWhereNull('cheque_status');
                });

            $totalIn = (clone $financialQuery)->where('type', 'RECEIPT')
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Deposit', 'Withdrawal']);
                })->sum('amount');

            $totalOut = (clone $financialQuery)->where('type', 'PAYMENT')
                ->where(function($q) {
                    $q->whereNotIn('payment_method', ['Cheque', 'Online'])
                      ->orWhereIn('cheque_status', ['Clear', 'Cleared', 'In Hand', 'Distributed', 'Deposit', 'Withdrawal']);
                })->sum('amount');

            // Party payments query (where account_id = $account->id)
            $partyQuery = \App\Models\Payment::where('account_id', $account->id)
                ->where(function($q) {
                    $q->whereNotIn('cheque_status', ['Canceled', 'Returned', 'Refund'])->orWhereNull('cheque_status');
                });

            $partyIn = (clone $partyQuery)->where('type', 'PAYMENT')->sum('amount');
            $partyOut = (clone $partyQuery)->where('type', 'RECEIPT')->sum('amount');

            $summary = [
                'total_in' => $totalIn + $partyIn,
                'total_out' => $totalOut + $partyOut,
                'current_balance' => $account->current_balance,
            ];

            if ($typeLower === 'bank') {
                $totalCheques = \App\Models\Chequebook::where('bank_id', $account->id)->count();
                $issuedCheques = \App\Models\Chequebook::where('bank_id', $account->id)->where('status', 'issued')->count();
                $summary['total_cheques'] = $totalCheques;
                $summary['issued_cheques'] = $issuedCheques;
                $summary['available_cheques'] = $totalCheques - $issuedCheques;
            }
        } elseif (in_array($typeLower, ['capital', 'amanat payable', 'reserve'])) {
            $receiptsQuery = \App\Models\Payment::where('account_id', $account->id)->where('type', 'RECEIPT')->where('cheque_status', '!=', 'Canceled');
            $totalIn = (float)(clone $receiptsQuery)->sum(DB::raw('amount + discount'));
            $paymentsQuery = \App\Models\Payment::where('account_id', $account->id)->where('type', 'PAYMENT')->where('cheque_status', '!=', 'Canceled');
            $totalOut = (float)(clone $paymentsQuery)->sum(DB::raw('amount + discount'));

            $summary = [
                'total_in' => $totalIn,
                'total_out' => $totalOut,
                'current_balance' => $account->current_balance,
            ];
        } elseif ($typeLower === 'drawings') {
            $paymentsQuery = \App\Models\Payment::where('account_id', $account->id)->where('type', 'PAYMENT')->where('cheque_status', '!=', 'Canceled');
            $totalIn = (float)(clone $paymentsQuery)->sum(DB::raw('amount + discount'));
            $receiptsQuery = \App\Models\Payment::where('account_id', $account->id)->where('type', 'RECEIPT')->where('cheque_status', '!=', 'Canceled');
            $totalOut = (float)(clone $receiptsQuery)->sum(DB::raw('amount + discount'));

            $summary = [
                'total_in' => $totalIn,
                'total_out' => $totalOut,
                'current_balance' => $account->current_balance,
            ];
        }

        return Inertia::render("setup/account/view", [
            'account' => $account,
            'financial_summary' => $summary,
        ]);
    }
    public function destroy(Account $account)
    {
        // Guard: prevent deletion if account has any linked transactions
        $hasSales     = \App\Models\Sales::where('customer_id', $account->id)->exists();
        $hasPurchases = \App\Models\Purchase::where('supplier_id', $account->id)->exists();
        $hasPayments  = \App\Models\Payment::where('account_id', $account->id)
                            ->orWhere('payment_account_id', $account->id)
                            ->exists();

        if ($hasSales || $hasPurchases || $hasPayments) {
            return redirect()->route('account.index')
                ->with('error', 'Cannot delete this account because it has linked transactions (Sales, Purchases, or Payments). Deactivate it instead.');
        }

        $account->delete();
        return redirect()->route('account.index')
            ->with('success', 'Account deleted successfully!');
    }
    public function getBalance(Request $request, $id)
    {
        $account = Account::with('accountType')->findOrFail($id);
        $role = $request->query('role');
        $excludeBillId = $request->query('exclude_bill_id') ? (int) $request->query('exclude_bill_id') : null;

        $response = [
            'balance' => (float) $account->current_balance,
        ];

        if (in_array($role, ['sale', 'purchase'], true)) {
            $excludeBillType = null;
            if ($excludeBillId) {
                $excludeBillType = $role === 'sale' ? \App\Models\Sales::class : \App\Models\Purchase::class;
            }

            $breakdown = \App\Services\AdvanceAllocationService::getAvailableAdvanceBreakdown(
                $account,
                $role,
                $excludeBillType,
                $excludeBillId
            );

            $response['effective_previous_balance'] = $breakdown['effective_previous_balance'];
            $response['advance_breakdown'] = $breakdown;
        }

        return response()->json($response);
    }

    public function getDetailedBalances($id)
    {
        $account = Account::with('accountType')->findOrFail($id);
        $type = strtolower($account->accountType->name ?? '');

        $previousBalance = (float)$account->current_balance;

        if ($type === 'customers') {
            // Outstanding: unpaid/partial invoices (cap negative remaining_amount to 0)
            $outstanding = (float)\App\Models\Sales::where('customer_id', $id)
                ->whereNotIn('status', ['Paid', 'Returned'])
                ->get()
                ->sum(fn($s) => max(0.0, (float)$s->remaining_amount));

            // Credit Balance: unused credit notes
            $creditBalance = (float)\App\Models\CustomerCredit::where('customer_id', $id)
                ->whereIn('status', ['Available', 'Partial'])
                ->sum('available_balance');

            // Advance Balance: cleared receipts not yet allocated to invoices
            $advance = \App\Services\PaymentAccountingService::getAccountAdvanceBalance($account);

        } elseif ($type === 'supplier') {
            // Outstanding Payable: unpaid/partial purchases (cap negative remaining_amount to 0)
            $outstanding = (float)\App\Models\Purchase::where('supplier_id', $id)
                ->whereNotIn('status', ['Paid', 'Returned'])
                ->get()
                ->sum(fn($p) => max(0.0, (float)$p->remaining_amount));

            // Credit Balance: unused supplier credit notes
            $creditBalance = (float)\App\Models\SupplierCredit::where('supplier_id', $id)
                ->whereIn('status', ['Available', 'Partial'])
                ->sum('available_balance');

            // Advance Payment: payments made to supplier not yet allocated to bills
            $advance = \App\Services\PaymentAccountingService::getAccountAdvanceBalance($account);

        } else {
            $outstanding  = 0.0;
            $creditBalance = 0.0;
            $advance       = 0.0;
        }

        return response()->json([
            'previous_balance' => $previousBalance,
            'outstanding'      => $outstanding,
            'credit_balance'   => $creditBalance,
            'advance_balance'  => $advance,
            'net_ledger'       => $previousBalance,
        ]);
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

    public function toggleStatus(Account $account)
    {
        $account->status = !$account->status;
        $account->save();

        return redirect()->route('account.index')->with('success', 'Account status updated successfully');
    }

    public function searchSuggestions(Request $request)
    {
        $query = $request->query('query', '');
        // Trim and normalize spaces
        $query = preg_replace('/\s+/', ' ', trim($query));
        $excludeId = $request->query('exclude_id');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $accounts = Account::with(['accountType', 'city'])
            ->where('title', 'like', '%' . $query . '%')
            ->when($excludeId, function ($q) use ($excludeId) {
                return $q->where('id', '!=', $excludeId);
            })
            ->orderByRaw("CASE 
                WHEN title LIKE ? THEN 1 
                ELSE 2 
            END", [$query . '%'])
            ->limit(8)
            ->get();

        $results = $accounts->map(function ($acc) {
            return [
                'id' => $acc->id,
                'title' => $acc->title,
                'code' => $acc->code,
                'account_type' => $acc->accountType ? $acc->accountType->name : null,
                'city' => $acc->city ? $acc->city->name : null,
            ];
        });

        return response()->json($results);
    }

    /**
     * Format a lightweight account DTO for the Smart Account Selection Dialog and Edit page initial props.
     */
    public static function formatAccountForPicker(Account $a, string $context = 'sale'): array
    {
        $isPurchaseContext = in_array($context, ['purchase', 'purchase_return'], true);
        $accountTypeName = strtolower($a->accountType->name ?? '');
        $isCrNormal = $accountTypeName === 'supplier' || in_array((int) $a->type, [6, 9, 17, 18], true);

        $balance = round((float) ($a->memoizedCurrentBalance ?? $a->getAttributes()['current_balance'] ?? 0), 2);
        $balanceSide = abs($balance) < 0.005
            ? 'ZERO'
            : ($isCrNormal ? ($balance > 0 ? 'CR' : 'DR') : ($balance > 0 ? 'DR' : 'CR'));

        $phone = trim((string) ($a->mobile ?: ($a->telephone1 ?: ($a->telephone2 ?: ''))));

        $tpLabel = 'Retail';
        if ($isPurchaseContext) {
            if ($a->accountCategory) {
                $pct = (float) ($a->accountCategory->percentage ?? 0);
                $tpLabel = $a->accountCategory->name . ($pct > 0 ? ' (' . rtrim(rtrim(number_format($pct, 2), '0'), '.') . '%)' : '');
            } else {
                $tpLabel = '0% Markup';
            }
        } else {
            $ic = $a->item_category !== null && $a->item_category !== '' ? (string) $a->item_category : null;
            if ($ic !== null && in_array($ic, ['1', '2', '3', '4', '5', '6', '7'], true)) {
                $tpLabel = 'TP ' . $ic;
            }
        }

        return [
            'id' => (int) $a->id,
            'code' => $a->code ?? '',
            'title' => $a->title ?? '',
            'type' => $a->type,
            'phone' => $phone,
            'mobile' => $a->mobile,
            'telephone1' => $a->telephone1,
            'telephone2' => $a->telephone2,
            'aging_days' => (int) ($a->aging_days ?? 0),
            'credit_limit' => $a->credit_limit !== null ? (float) $a->credit_limit : null,
            'saleman_id' => $a->saleman_id ? (int) $a->saleman_id : null,
            'saleman_name' => $a->relationLoaded('saleman') ? $a->saleman?->name : null,
            'city_id' => $a->city_id ? (int) $a->city_id : null,
            'city_name' => $a->relationLoaded('city') ? $a->city?->name : null,
            'area_id' => $a->area_id ? (int) $a->area_id : null,
            'area_name' => $a->relationLoaded('area') ? $a->area?->name : null,
            'item_category' => $a->item_category !== null && $a->item_category !== '' ? (string) $a->item_category : null,
            'tp_label' => $tpLabel,
            'account_type' => $a->accountType ? [
                'id' => (int) $a->accountType->id,
                'name' => $a->accountType->name,
            ] : null,
            'account_category' => $a->accountCategory ? [
                'id' => (int) $a->accountCategory->id,
                'name' => $a->accountCategory->name,
                'percentage' => (float) ($a->accountCategory->percentage ?? 0),
            ] : null,
            'current_balance' => $balance,
            'balance_side' => $balanceSide,
        ];
    }

    /**
     * Load a single account formatted for edit screen initialization (1 row instead of full table).
     */
    public static function loadSingleForPicker(?int $accountId, string $context = 'sale'): array
    {
        if (!$accountId) {
            return [];
        }

        $account = Account::select(
            'id', 'code', 'title', 'type', 'category', 'item_category',
            'mobile', 'telephone1', 'telephone2',
            'city_id', 'area_id', 'saleman_id',
            'aging_days', 'credit_limit',
            'opening_balance', 'opening_balance_type', 'purchase', 'sale'
        )
            ->with([
                'accountType:id,name',
                'accountCategory:id,name,percentage',
            ])
            ->find($accountId);

        if (!$account) {
            return [];
        }

        return [self::formatAccountForPicker($account, $context)];
    }

    /**
     * Server-side paginated, filterable, searchable account picker for Sales, Purchase, and Return screens.
     * Bulk-calculates real-time balances ONLY for the current page (max 50 rows) — zero N+1 queries.
     */
    public function picker(Request $request)
    {
        $context = strtolower((string) $request->query('context', 'sale'));
        if (!in_array($context, ['sale', 'purchase', 'sales_return', 'purchase_return'], true)) {
            $context = 'sale';
        }

        $perPage = (int) $request->query('per_page', 25);
        $perPage = max(10, min(50, $perPage));

        $query = Account::select(
            'id', 'code', 'title', 'type', 'category', 'item_category',
            'mobile', 'telephone1', 'telephone2',
            'city_id', 'area_id', 'saleman_id',
            'aging_days', 'credit_limit',
            'opening_balance', 'opening_balance_type', 'purchase', 'sale'
        )->with([
            'accountType:id,name',
            'accountCategory:id,name,percentage',
            'city:id,name',
            'area:id,name',
            'saleman:id,name',
        ]);

        // Preserve exact module eligibility rules
        if ($context === 'sale') {
            $query->eligibleForSale();
        } elseif ($context === 'purchase') {
            $query->eligibleForPurchase();
        } elseif ($context === 'sales_return') {
            $query->active()->whereHas('sales');
        } elseif ($context === 'purchase_return') {
            $query->active()->where(function ($q) {
                $q->where('purchase', true)
                    ->orWhereHas('accountType', function ($typeQ) {
                        $typeQ->whereIn('name', ['Supplier', 'Suppliers']);
                    });
            });
        }

        // Server-side search: title, code, phone numbers, city, area
        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $digitsOnly = preg_replace('/[^0-9]/', '', $search);
            $query->where(function ($q) use ($search, $digitsOnly) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('code', 'like', '%' . $search . '%')
                    ->orWhere('mobile', 'like', '%' . $search . '%')
                    ->orWhere('telephone1', 'like', '%' . $search . '%')
                    ->orWhere('telephone2', 'like', '%' . $search . '%')
                    ->orWhereHas('city', fn ($cq) => $cq->where('name', 'like', '%' . $search . '%'))
                    ->orWhereHas('area', fn ($aq) => $aq->where('name', 'like', '%' . $search . '%'));

                if (strlen($digitsOnly) >= 3) {
                    $q->orWhereRaw("REPLACE(REPLACE(COALESCE(mobile, ''), ' ', ''), '-', '') LIKE ?", ['%' . $digitsOnly . '%'])
                        ->orWhereRaw("REPLACE(REPLACE(COALESCE(telephone1, ''), ' ', ''), '-', '') LIKE ?", ['%' . $digitsOnly . '%'])
                        ->orWhereRaw("REPLACE(REPLACE(COALESCE(telephone2, ''), ' ', ''), '-', '') LIKE ?", ['%' . $digitsOnly . '%']);
                }
            });
        }

        // Structured filters
        $cityId = $request->query('city_id');
        if ($cityId && $cityId !== 'all') {
            $query->where('city_id', (int) $cityId);
        }

        $areaId = $request->query('area_id');
        if ($areaId && $areaId !== 'all') {
            $query->where('area_id', (int) $areaId);
        }

        $salemanId = $request->query('saleman_id');
        if ($salemanId && $salemanId !== 'all') {
            $query->where('saleman_id', (int) $salemanId);
        }

        $tp = $request->query('tp');
        if ($tp && $tp !== 'all') {
            if (in_array($context, ['purchase', 'purchase_return'], true)) {
                if ($tp === 'none') {
                    $query->where(function ($q) {
                        $q->whereNull('category')->orWhere('category', '')->orWhere('category', '0');
                    });
                } else {
                    $query->where('category', $tp);
                }
            } else {
                if ($tp === 'retail') {
                    $query->where(function ($q) {
                        $q->whereNull('item_category')->orWhere('item_category', '')->orWhere('item_category', 0);
                    });
                } else {
                    $query->where('item_category', (int) $tp);
                }
            }
        }

        // Rank prefix matches first when searching, then alphabetical
        if ($search !== '') {
            $query->orderByRaw('CASE WHEN title LIKE ? THEN 0 WHEN code LIKE ? THEN 1 ELSE 2 END', [$search . '%', $search . '%']);
        }
        $query->orderBy('title', 'asc')->orderBy('id', 'asc');

        $paginator = $query->paginate($perPage);
        $collection = $paginator->getCollection();

        // Bulk-calculate real-time balances ONLY for this page's <= 50 accounts
        \App\Services\PaymentAccountingService::attachBulkBalances($collection);

        $data = $collection->map(fn (Account $a) => self::formatAccountForPicker($a, $context))->values();

        $payload = [
            'data' => $data,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];

        // Return filter dropdown lists only when explicitly requested (first open, cached client-side)
        if ($request->boolean('include_filters')) {
            $payload['filter_options'] = [
                'cities' => City::select('id', 'name')->orderBy('name')->get(),
                'areas' => Areas::select('id', 'name', 'city_id')->orderBy('name')->get(),
                'salemans' => Saleman::select('id', 'name')->orderBy('name')->get(),
                'categories' => in_array($context, ['purchase', 'purchase_return'], true)
                    ? AccountCategory::select('id', 'name', 'percentage')->orderBy('name')->get()
                    : [],
            ];
        }

        return response()->json($payload);
    }

    public function bulkUpload()
    {
        return Inertia::render("setup/account/bulk-upload");
    }

    public function downloadSample(Request $request)
    {
        $format = $request->query('format', 'xlsx');

        if ($format === 'csv') {
            return Excel::download(new AccountSampleExport, 'chart_of_accounts_sample.csv', \Maatwebsite\Excel\Excel::CSV);
        }

        return Excel::download(new AccountSampleExport, 'chart_of_accounts_sample.xlsx', \Maatwebsite\Excel\Excel::XLSX);
    }

    public function previewBulkUpload(Request $request, AccountBulkUploadService $service)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ]);

        $preview = $service->preview($request->file('file'));

        return response()->json($preview);
    }

    public function processBulkImport(Request $request, AccountBulkUploadService $service)
    {
        $request->validate([
            'rows' => 'required|array|min:1',
        ]);

        $result = $service->import($request->input('rows'));

        return response()->json([
            'message' => "Successfully imported {$result['success_count']} accounts.",
            'result' => $result,
        ]);
    }
}
