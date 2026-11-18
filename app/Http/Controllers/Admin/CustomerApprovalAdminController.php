<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CustomerUser;
use App\Models\Account;
use App\Models\AccountType;
use App\Services\CustomerAccessProvisioningService;
use App\Services\PhoneNormalizer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class CustomerApprovalAdminController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view pending customers|view accounts|view customer approvals', only: ['index', 'searchAccounts', 'searchErpCustomers']),
            new Middleware('permission:approve customers|approve customer accounts', only: ['approve', 'provisionErp', 'provisionErpBulk', 'toggleAccess', 'resetPassword']),
            new Middleware('permission:reject customers|reject customer accounts', only: ['reject']),
            new Middleware('permission:link customer accounts', only: ['linkAccount', 'createAndLinkErpAccount']),
        ];
    }

    /**
     * Display list of customer users with approval statuses, ERP linkage, and online access control.
     */
    public function index(Request $request)
    {
        $statusTab = strtolower($request->input('tab', 'pending'));
        $search = trim($request->input('search', ''));
        $origin = strtolower($request->input('origin', 'all'));
        $access = strtolower($request->input('access', 'all'));

        $query = CustomerUser::with(['account:id,title,code,mobile,address1,city_id', 'account.city:id,name', 'approver:id,name']);

        // Tab Filter
        if ($statusTab && $statusTab !== 'all') {
            $query->where('approval_status', $statusTab);
        }

        // Origin Filter
        if ($origin && $origin !== 'all') {
            $query->where('registered_via', $origin);
        }

        // Access Filter
        if ($access === 'active') {
            $query->where('is_active', true);
        } elseif ($access === 'disabled') {
            $query->where('is_active', false);
        }

        // Text Search
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('username', 'LIKE', "%{$search}%")
                  ->orWhere('mobile', 'LIKE', "%{$search}%")
                  ->orWhere('business_name', 'LIKE', "%{$search}%")
                  ->orWhereHas('account', function ($accQ) use ($search) {
                      $accQ->where('code', 'LIKE', "%{$search}%")
                           ->orWhere('title', 'LIKE', "%{$search}%");
                  });
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
        $customers->getCollection()->each(function ($customer) {
            if ($customer->relationLoaded('account') && $customer->account) {
                $customer->account->setHidden(['current_balance', 'guest_link', 'image_url']);
            }
        });

        // Single aggregated query for all status & filter counts (eliminates 6 separate COUNT queries)
        $statsRow = CustomerUser::selectRaw("
            COUNT(*) as total_all,
            SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as total_pending,
            SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as total_approved,
            SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as total_rejected,
            SUM(CASE WHEN registered_via = 'erp_linked' THEN 1 ELSE 0 END) as total_erp_linked,
            SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as total_disabled
        ")->first();

        $counts = [
            'all'        => (int) ($statsRow->total_all ?? 0),
            'pending'    => (int) ($statsRow->total_pending ?? 0),
            'approved'   => (int) ($statsRow->total_approved ?? 0),
            'rejected'   => (int) ($statsRow->total_rejected ?? 0),
            'erp_linked' => (int) ($statsRow->total_erp_linked ?? 0),
            'disabled'   => (int) ($statsRow->total_disabled ?? 0),
        ];

        return Inertia::render('setup/customer_approvals/index', [
            'customers' => $customers,
            'filters'   => [
                'tab'    => $statusTab,
                'search' => $search,
                'origin' => $origin,
                'access' => $access,
            ],
            'counts'    => $counts,
        ]);
    }

    /**
     * Search Existing ERP Customers (Accounts table where type = 3).
     * Used by the "Add Existing ERP Customers" modal.
     */
    public function searchErpCustomers(Request $request)
    {
        $term = trim($request->input('query', ''));
        $cityId = $request->input('city_id');
        $mobileStatus = $request->input('mobile_status', 'all');
        $includeOnline = $request->boolean('include_online', false);
        $customerTypeId = AccountType::where('name', 'Customers')->value('id') ?? 3;

        $query = Account::where('type', $customerTypeId)
            ->active()
            ->with(['city:id,name', 'customerUser:id,account_id,username,mobile,is_active,approval_status']);

        if (!$includeOnline) {
            $query->whereDoesntHave('customerUser');
        }

        if ($cityId && $cityId !== 'all') {
            $query->where('city_id', $cityId);
        }

        if ($mobileStatus === 'with_mobile') {
            $query->whereNotNull('mobile')->where('mobile', '!=', '');
        } elseif ($mobileStatus === 'no_mobile') {
            $query->where(function ($q) {
                $q->whereNull('mobile')->orWhere('mobile', '=', '');
            });
        }

        if ($term !== '') {
            $query->where(function ($q) use ($term) {
                $q->where('title', 'LIKE', "%{$term}%")
                  ->orWhere('code', 'LIKE', "%{$term}%")
                  ->orWhere('mobile', 'LIKE', "%{$term}%");
            });
        }

        $accounts = $query
            ->select('id', 'code', 'title', 'mobile', 'address1', 'city_id', 'type', 'status')
            ->orderBy('title')
            ->paginate(25);

        $accounts->getCollection()->each(function ($acc) {
            $acc->setHidden(['current_balance', 'guest_link', 'image_url']);
        });

        return response()->json($accounts);
    }

    /**
     * Provision online access for a single ERP customer.
     */
    public function provisionErp(Request $request, $id)
    {
        $account = Account::findOrFail($id);
        $overrideMobile = $request->input('mobile');

        $result = CustomerAccessProvisioningService::provisionSingle($account, $overrideMobile, Auth::id());

        if (!$result['success']) {
            return response()->json(['success' => false, 'error' => $result['error']], 422);
        }

        return response()->json($result);
    }

    /**
     * Bulk Provision online access for multiple ERP customers.
     */
    public function provisionErpBulk(Request $request)
    {
        $request->validate([
            'account_ids'    => 'required|array|min:1',
            'account_ids.*'  => 'exists:accounts,id',
            'custom_mobiles' => 'nullable|array',
        ]);

        $accountIds = $request->input('account_ids', []);
        $customMobiles = $request->input('custom_mobiles', []);
        $result = CustomerAccessProvisioningService::provisionBulk($accountIds, Auth::id(), $customMobiles);

        return response()->json($result);
    }

    /**
     * Toggle Customer Portal Access (Enable / Disable).
     */
    public function toggleAccess(Request $request, $id)
    {
        $customer = CustomerUser::findOrFail($id);
        $enable = $request->boolean('enable', true);

        CustomerAccessProvisioningService::toggleAccess($customer, $enable);

        $statusText = $enable ? 'enabled' : 'disabled';
        return redirect()->back()->with('success', "Online portal access for '{$customer->name}' has been {$statusText}.");
    }

    /**
     * Admin-Initiated Temporary Password Reset with WhatsApp link generation.
     */
    public function resetPassword(Request $request, $id)
    {
        $customer = CustomerUser::findOrFail($id);

        $result = CustomerAccessProvisioningService::resetPassword($customer);

        return response()->json($result);
    }

    /**
     * Legacy Search ERP Accounts (for manual linking modal).
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
            ->get()
            ->each(function ($acc) {
                $acc->setHidden(['current_balance', 'guest_link', 'image_url']);
            });

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
