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
     * Place order from live offer catalog
     */
    public function checkoutOfferOrder(Request $request)
    {
        $request->validate([
            'offer_id' => 'nullable|exists:price_offer_to,id',
            'auth_type' => 'required|in:existing,new',
            'customer_code' => 'required_if:auth_type,existing|nullable|string',
            'name' => 'required_if:auth_type,new|nullable|string|max:255',
            'phone' => 'required_if:auth_type,new|nullable|string|max:50',
            'business_name' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.qty_carton' => 'required|numeric|min:0',
            'items.*.qty_pcs' => 'required|numeric|min:0',
            'items.*.price_carton' => 'nullable|numeric|min:0',
            'items.*.price_piece' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $offer = null;
            if ($request->offer_id) {
                $offer = PriceOfferTo::find($request->offer_id);
            }

            $defaultSalesman = \App\Models\Saleman::first();
            $defaultSalesmanId = $defaultSalesman ? $defaultSalesman->id : 1;

            // Determine Customer Account
            $account = null;
            if ($request->auth_type === 'existing') {
                $query = trim($request->customer_code);
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
                        'message' => 'Invalid Customer Code or Mobile number.',
                    ], 404);
                }
            } else {
                // New Customer Registration
                $customerType = \App\Models\AccountType::where('name', 'Customers')->first();
                $customerTypeId = $customerType ? $customerType->id : 1;

                // Generate unique customer code C-XXXX
                $maxCode = Account::where('code', 'LIKE', 'C-%')->count() + 1;
                $code = 'C-' . str_pad($maxCode, 4, '0', STR_PAD_LEFT);
                while (Account::where('code', $code)->exists()) {
                    $maxCode++;
                    $code = 'C-' . str_pad($maxCode, 4, '0', STR_PAD_LEFT);
                }

                // Target TP / item_category derived from offer or default to 1
                $offerTp = '1';
                if ($offer && $offer->offertype) {
                    $offerTp = (string)$offer->offertype;
                }

                $account = Account::create([
                    'code' => $code,
                    'title' => trim($request->name . ($request->business_name ? " ({$request->business_name})" : '')),
                    'type' => $customerTypeId,
                    'saleman_id' => $defaultSalesmanId,
                    'mobile' => $request->phone,
                    'telephone1' => $request->phone,
                    'address1' => $request->address,
                    'item_category' => $offerTp,
                    'status' => true,
                    'guest_token' => (string) Str::uuid(),
                    'opening_date' => now(),
                ]);
            }

            // Calculate order totals and save items
            $invoiceNo = 'OFF-' . strtoupper(Str::random(8));
            $grossTotal = 0;
            $orderItems = [];

            foreach ($request->items as $it) {
                $item = Items::find($it['item_id']);
                if (!$item) continue;

                $qtyCarton = (float)($it['qty_carton'] ?? 0);
                $qtyPcs = (float)($it['qty_pcs'] ?? 0);

                if ($qtyCarton <= 0 && $qtyPcs <= 0) continue;

                $packing = $item->packing_qty ?: 1;
                $totalPcs = ($qtyCarton * $packing) + $qtyPcs;

                $priceCarton = (float)($it['price_carton'] ?? 0);
                $pricePiece = (float)($it['price_piece'] ?? 0);

                $subtotal = ($qtyCarton * $priceCarton) + ($qtyPcs * $pricePiece);
                if ($subtotal <= 0) {
                    $subtotal = $totalPcs * ($item->trade_price ?: 0);
                }

                $grossTotal += $subtotal;

                $orderItems[] = [
                    'item_id' => $item->id,
                    'qty_carton' => $qtyCarton,
                    'qty_pcs' => $qtyPcs,
                    'total_pcs' => $totalPcs,
                    'trade_price' => $pricePiece > 0 ? $pricePiece : ($item->trade_price ?: 0),
                    'retail_price' => $item->retail,
                    'subtotal' => $subtotal,
                ];
            }

            if (empty($orderItems)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cart is empty or item quantities are invalid.',
                ], 422);
            }

            $firm = $offer?->firm ?? Firm::first();
            $firmId = $firm ? $firm->id : 1;
            $salesmanId = $account->saleman_id ?: $defaultSalesmanId;

            $sale = Sales::create([
                'date' => now(),
                'invoice' => $invoiceNo,
                'customer_id' => $account->id,
                'salesman_id' => $salesmanId,
                'firm_id' => $firmId,
                'no_of_items' => count($orderItems),
                'gross_total' => $grossTotal,
                'discount_total' => 0,
                'tax_total' => 0,
                'courier_charges' => 0,
                'extra_discount' => 0,
                'net_total' => $grossTotal,
                'total_receivable' => $grossTotal + (float)$account->current_balance,
                'paid_amount' => 0,
                'remaining_amount' => $grossTotal,
                'status' => 'Pending Order',
                'is_online' => true,
            ]);

            foreach ($orderItems as $oi) {
                $oi['sale_id'] = $sale->id;
                SalesItem::create($oi);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'invoice' => $invoiceNo,
                'customer_code' => $account->code,
                'guest_token' => $account->guest_token,
                'message' => 'Order placed successfully!',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to place order: ' . $e->getMessage(),
            ], 422);
        }
    }
}

