<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PriceOfferTo;
use App\Models\Account;
use App\Models\ItemCategory;
use App\Models\Items;
use App\Models\Sales;
use App\Models\SalesItem;
use App\Models\Firm;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class PublicOfferController extends Controller
{
    /**
     * Show live public offers
     */
    public function index(Request $request)
    {
        $offerId = $request->get('id');

        $customerOffer = null;
        $marketOffer = null;

        $withRelations = [
            'items.items.images',
            'items.items.category',
            'items.items.companyAccount',
            'firm',
            'messageLine'
        ];

        if ($offerId) {
            $specificOffer = PriceOfferTo::with($withRelations)
                ->where('id', $offerId)
                ->where('is_live', true)
                ->first();
                
            if ($specificOffer) {
                if ($specificOffer->offertype == '1') {
                    $customerOffer = $specificOffer;
                } else if ($specificOffer->offertype == '2') {
                    $marketOffer = $specificOffer;
                } else {
                    $customerOffer = $specificOffer; // default
                }
            }
        } else {
            // Fetch the latest live offer for Customer Group (1) and Market Offer (2)
            $customerOffer = PriceOfferTo::with($withRelations)
                ->where('offertype', '1')
                ->where('is_live', true)
                ->orderBy('date', 'desc')
                ->first();

            $marketOffer = PriceOfferTo::with($withRelations)
                ->where('offertype', '2')
                ->where('is_live', true)
                ->orderBy('date', 'desc')
                ->first();
        }

        $categories = ItemCategory::where('status', 'active')->orderBy('name')->get();

        return Inertia::render('public/LiveOffers', [
            'customerOffer' => $customerOffer,
            'marketOffer' => $marketOffer,
            'sharedOfferId' => $offerId,
            'categories' => $categories,
        ]);
    }

    /**
     * Validate Customer ID and redirect to guest portal
     */
    public function accessMyOffer(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|string',
        ]);

        $account = Account::where(function($q) use ($request) {
                $q->where('code', $request->customer_id)
                  ->orWhere('telephone1', $request->customer_id)
                  ->orWhere('mobile', $request->customer_id);
            })
            ->whereHas('accountType', function ($q) {
                $q->where('name', 'Customers');
            })
            ->first();

        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid Customer ID. Please double check your code or mobile number.',
            ], 404);
        }

        // Generate UUID if missing
        if (!$account->guest_token) {
            $account->guest_token = (string) Str::uuid();
            $account->save();
        }

        return response()->json([
            'success' => true,
            'redirect_url' => route('guest.dashboard', ['token' => $account->guest_token]),
        ]);
    }

    /**
     * Verify Customer Code or Mobile for checkout
     */
    public function verifyCustomer(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|string',
        ]);

        $query = trim($request->customer_id);

        $account = Account::where(function($q) use ($query) {
                $q->where('code', $query)
                  ->orWhere('telephone1', $query)
                  ->orWhere('mobile', $query);
            })
            ->whereHas('accountType', function ($q) {
                $q->where('name', 'Customers');
            })
            ->first();

        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'Customer Code or Mobile number not found. Please double check or register as a new customer.',
            ], 404);
        }

        if (!$account->guest_token) {
            $account->guest_token = (string) Str::uuid();
            $account->save();
        }

        return response()->json([
            'success' => true,
            'account' => [
                'id' => $account->id,
                'code' => $account->code,
                'title' => $account->title,
                'mobile' => $account->mobile,
                'address' => $account->address1,
                'item_category' => $account->item_category,
                'guest_token' => $account->guest_token,
            ],
        ]);
    }

    /**
     * Place order from live offer catalog into isolated online_orders staging
     */
    public function checkoutOfferOrder(Request $request)
    {
        $request->validate([
            'offer_id' => 'nullable|exists:price_offer_to,id',
            'auth_type' => 'nullable|in:existing,new,authenticated',
            'customer_code' => 'nullable|string',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
            'name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'business_name' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'customer_notes' => 'nullable|string|max:1000',
            'idempotency_key' => 'nullable|string|max:64',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.qty_carton' => 'required|numeric|min:0',
            'items.*.qty_pcs' => 'required|numeric|min:0',
        ]);

        // 1. Resolve Customer User
        $customer = \Illuminate\Support\Facades\Auth::guard('customer')->user();

        if (!$customer) {
            $authType = $request->input('auth_type', 'existing');

            if ($authType === 'existing') {
                $loginInput = trim($request->input('customer_code') ?? $request->input('username') ?? $request->input('phone') ?? '');
                $password = $request->input('password');

                $normalizedMobile = \App\Services\PhoneNormalizer::normalizeLocal($loginInput);

                $customer = \App\Models\CustomerUser::where('username', $loginInput)
                    ->orWhere('email', $loginInput)
                    ->when($normalizedMobile, function ($q) use ($normalizedMobile) {
                        $q->orWhere('mobile', $normalizedMobile);
                    })
                    ->first();

                // If customer exists and password is provided, check password
                if ($customer && $password) {
                    if (!\Illuminate\Support\Facades\Hash::check($password, $customer->password)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Invalid password for existing customer account.',
                        ], 401);
                    }
                }

                // If no CustomerUser exists yet, but an ERP account exists with this code/mobile:
                if (!$customer) {
                    $erpAccount = \App\Models\Account::where(function($q) use ($loginInput, $normalizedMobile) {
                            $q->where('code', $loginInput);
                            if ($normalizedMobile) {
                                $q->orWhere('mobile', $normalizedMobile)->orWhere('telephone1', $normalizedMobile);
                            }
                        })
                        ->whereHas('accountType', function ($q) {
                            $q->where('name', 'Customers');
                        })
                        ->first();

                    if ($erpAccount) {
                        // Create customer_user on the fly for this existing verified ERP account
                        $newUsername = 'cust_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $erpAccount->code ?: $erpAccount->id));
                        $counter = 1;
                        $baseUsername = $newUsername;
                        while (\App\Models\CustomerUser::where('username', $newUsername)->exists()) {
                            $newUsername = $baseUsername . '_' . $counter++;
                        }

                        $customer = \App\Models\CustomerUser::create([
                            'account_id' => $erpAccount->id,
                            'name' => $erpAccount->title,
                            'username' => $newUsername,
                            'mobile' => $normalizedMobile ?: ($erpAccount->mobile ?: '03000000000'),
                            'email' => $erpAccount->email,
                            'password' => $password ?: 'welcome123',
                            'approval_status' => 'approved', // already existing verified ERP account
                            'approved_at' => now(),
                            'business_name' => $erpAccount->title,
                            'address' => $erpAccount->address1,
                        ]);
                    }
                }

                if (!$customer) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Customer account not found. Please register as a new customer or verify your mobile number.',
                    ], 404);
                }

                \Illuminate\Support\Facades\Auth::guard('customer')->login($customer);

            } else {
                // New Customer Registration during checkout
                $normalizedMobile = \App\Services\PhoneNormalizer::normalizeLocal($request->phone);
                if (!$normalizedMobile) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Please enter a valid Pakistani mobile number (e.g. 03323228684).',
                    ], 422);
                }

                $existingMobileUser = \App\Models\CustomerUser::where('mobile', $normalizedMobile)->first();
                if ($existingMobileUser) {
                    $customer = $existingMobileUser;
                    \Illuminate\Support\Facades\Auth::guard('customer')->login($customer);
                } else {
                    $name = trim($request->name ?: 'New Customer');
                    $username = $request->username ? strtolower(trim($request->username)) : ('user_' . substr($normalizedMobile, -7));
                    $counter = 1;
                    $baseUsername = $username;
                    while (\App\Models\CustomerUser::where('username', $username)->exists()) {
                        $username = $baseUsername . $counter++;
                    }

                    $customer = \App\Models\CustomerUser::create([
                        'name' => $name,
                        'username' => $username,
                        'mobile' => $normalizedMobile,
                        'email' => $request->email ? strtolower(trim($request->email)) : null,
                        'password' => $request->password ?: 'customer123',
                        'approval_status' => 'pending',
                        'business_name' => $request->business_name ? trim($request->business_name) : null,
                        'address' => $request->address ? trim($request->address) : null,
                    ]);

                    \Illuminate\Support\Facades\Auth::guard('customer')->login($customer);
                }
            }
        }

        // 2. Delegate order placement to OnlineOrderPlacementService
        $placementService = app(\App\Services\OnlineOrderPlacementService::class);
        [$success, $message, $order, $extra] = $placementService->placeOrder(
            customer: $customer,
            offerId: $request->offer_id,
            itemsInput: $request->items,
            customerNotes: $request->customer_notes,
            idempotencyKey: $request->idempotency_key
        );

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => $message,
                'reason_code' => $extra['reason_code'] ?? 'ORDER_FAILED',
            ], 422);
        }

        // 3. Generate WhatsApp click-to-send link
        $whatsAppUrl = \App\Services\WhatsAppNotificationService::generateCustomerToCompanyOrderLink($order);

        return response()->json([
            'success' => true,
            'order_no' => $order->order_no,
            'invoice' => $order->order_no, // backward-compat with UI
            'final_total' => $order->final_total,
            'status' => $order->status,
            'approval_status' => $customer->approval_status,
            'customer_name' => $customer->name,
            'customer_code' => $customer->username,
            'whatsapp_url' => $whatsAppUrl,
            'message' => $message,
        ]);
    }
}

