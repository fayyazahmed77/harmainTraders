<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CustomerUser;
use App\Models\Account;
use App\Models\AccountType;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class CustomerApprovalAdminController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view customer approvals', only: ['index', 'searchAccounts']),
            new Middleware('permission:approve customer accounts', only: ['approve']),
            new Middleware('permission:reject customer accounts', only: ['reject']),
            new Middleware('permission:link customer accounts', only: ['linkAccount', 'createAndLinkErpAccount']),
        ];
    }

    /**
     * Display list of customer users with approval statuses and ERP linkage.
     */
    public function index(Request $request)
    {
        $statusTab = strtolower($request->input('tab', 'pending'));
        $search = trim($request->input('search', ''));

        $query = CustomerUser::with(['account:id,title,code,mobile,address1', 'approver:id,name']);

        if ($statusTab && $statusTab !== 'all') {
            $query->where('approval_status', $statusTab);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('username', 'LIKE', "%{$search}%")
                  ->orWhere('mobile', 'LIKE', "%{$search}%")
                  ->orWhere('business_name', 'LIKE', "%{$search}%")
                  ->orWhere('city', 'LIKE', "%{$search}%");
            });
        }

        // Sort: Pending first, newest first
        $query->orderByRaw("
            CASE approval_status
                WHEN 'pending' THEN 1
                WHEN 'approved' THEN 2
                WHEN 'rejected' THEN 3
                ELSE 4
            END ASC
        ")->orderBy('created_at', 'desc');

        $customers = $query->paginate(20)->withQueryString();

        $counts = [
            'all'      => CustomerUser::count(),
            'pending'  => CustomerUser::where('approval_status', 'pending')->count(),
            'approved' => CustomerUser::where('approval_status', 'approved')->count(),
            'rejected' => CustomerUser::where('approval_status', 'rejected')->count(),
        ];

        return Inertia::render('setup/customer_approvals/index', [
            'customers' => $customers,
            'filters'   => [
                'tab'    => $statusTab,
                'search' => $search,
            ],
            'counts'    => $counts,
        ]);
    }

    /**
     * Search ERP Accounts (for linking modal).
     */
    public function searchAccounts(Request $request)
    {
        $term = trim($request->input('query', ''));
        if (strlen($term) < 1) {
            return response()->json([]);
        }

        $customerTypeId = AccountType::where('name', 'Customers')->value('id') ?? 3;

        $accounts = Account::where('type', $customerTypeId)
            ->where(function ($q) use ($term) {
                $q->where('title', 'LIKE', "%{$term}%")
                  ->orWhere('code', 'LIKE', "%{$term}%")
                  ->orWhere('mobile', 'LIKE', "%{$term}%");
            })
            ->select('id', 'code', 'title', 'mobile', 'address1')
            ->limit(15)
            ->get();

        return response()->json($accounts);
    }

    /**
     * Approve customer account.
     */
    public function approve(Request $request, $id)
    {
        $customer = CustomerUser::findOrFail($id);

        if ($request->filled('account_id')) {
            $customer->account_id = $request->account_id;
        }

        $customer->approval_status = 'approved';
        $customer->approved_by = Auth::id();
        $customer->approved_at = now();
        $customer->rejection_reason = null;
        $customer->save();

        return redirect()->back()->with('success', "Customer '{$customer->name}' has been successfully approved.");
    }

    /**
     * Reject customer account with mandatory reason.
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'rejection_reason' => 'required|string|min:3|max:500',
        ]);

        $customer = CustomerUser::findOrFail($id);
        $customer->approval_status = 'rejected';
        $customer->rejection_reason = trim($request->rejection_reason);
        $customer->save();

        return redirect()->back()->with('success', "Customer '{$customer->name}' has been rejected.");
    }

    /**
     * Link existing ERP Account to customer user.
     */
    public function linkAccount(Request $request, $id)
    {
        $request->validate([
            'account_id' => 'required|exists:accounts,id',
        ]);

        $customer = CustomerUser::findOrFail($id);
        $customer->account_id = $request->account_id;
        $customer->save();

        return redirect()->back()->with('success', "ERP Account linked successfully to '{$customer->name}'.");
    }

    /**
     * Automatically create a new Customer Account in Chart of Accounts and link it.
     */
    public function createAndLinkErpAccount(Request $request, $id)
    {
        $customer = CustomerUser::findOrFail($id);

        if ($customer->account_id) {
            return redirect()->back()->with('error', "Customer '{$customer->name}' already has a linked ERP Account (#{$customer->account_id}).");
        }

        return DB::transaction(function () use ($customer) {
            $customerTypeId = AccountType::where('name', 'Customers')->value('id') ?? 3;

            // Generate next sequential code for Customers
            $latestAccount = Account::where('type', $customerTypeId)->latest('id')->first();
            $nextNumber = $latestAccount ? intval($latestAccount->code) + 1 : 1;
            $code = str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

            $erpAccount = Account::create([
                'code'            => $code,
                'title'           => $customer->business_name ? "{$customer->name} ({$customer->business_name})" : $customer->name,
                'type'            => $customerTypeId,
                'mobile'          => $customer->mobile,
                'email'           => $customer->email,
                'address1'        => $customer->address,
                'status'          => 1,
                'opening_balance' => 0,
                'opening_type'    => 'DR',
                'created_by'      => Auth::id(),
            ]);

            $customer->account_id = $erpAccount->id;
            $customer->save();

            return redirect()->back()->with('success', "ERP Customer Account '{$erpAccount->title}' [{$erpAccount->code}] created and linked successfully.");
        });
    }
}
