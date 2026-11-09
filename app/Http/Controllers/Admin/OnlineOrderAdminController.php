<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\OnlineOrder;
use App\Models\OnlineOrderItem;
use App\Models\OnlineOrderHistory;
use App\Models\OnlineOrderRevision;
use App\Models\OnlineOrderRevisionItem;
use App\Models\OfferList;
use App\Models\Items;
use App\Services\StockService;
use App\Services\WhatsAppNotificationService;
use App\Services\OnlineOrderConfirmationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class OnlineOrderAdminController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view online orders', only: ['index', 'show', 'whatsappLink', 'searchRevisionItems']),
            new Middleware('permission:review online orders', only: ['startReview']),
            new Middleware('permission:create online order revisions', only: ['createRevision', 'searchRevisionItems']),
            new Middleware('permission:cancel online orders', only: ['cancel']),
            new Middleware('permission:confirm online orders', only: ['confirm']),
        ];
    }

    /**
     * Display list of online orders with server-side filtering, status tabs, and pending-first priority.
     */
    public function index(Request $request)
    {
        $statusTab = $request->input('tab', 'all');
        $search = trim($request->input('search', ''));
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $customerUserId = $request->input('customer_user_id');

        $query = OnlineOrder::with([
            'customerUser:id,name,username,mobile,approval_status,account_id',
            'offer:id,offertype,date',
            'sale:id,invoice,net_total,extra_discount,total_receivable,status',
        ]);

        // Filter by Tab / Status
        if ($statusTab && $statusTab !== 'all') {
            $query->where('status', $statusTab);
        }

        // Filter by Search (Order No, Customer Name, Mobile)
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('order_no', 'LIKE', "%{$search}%")
                  ->orWhereHas('customerUser', function ($sub) use ($search) {
                      $sub->where('name', 'LIKE', "%{$search}%")
                          ->orWhere('username', 'LIKE', "%{$search}%")
                          ->orWhere('mobile', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Filter by Date Range
        if ($startDate && $endDate) {
            $query->whereBetween('submitted_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        }

        // Filter by Customer
        if ($customerUserId) {
            $query->where('customer_user_id', $customerUserId);
        }

        // Status Priority Ordering:
        // 1: pending, 2: under_review, 3: awaiting_customer_acceptance, 4: confirmed, 5: canceled
        $query->orderByRaw("
            CASE status
                WHEN 'pending' THEN 1
                WHEN 'under_review' THEN 2
                WHEN 'awaiting_customer_acceptance' THEN 3
                WHEN 'confirmed' THEN 4
                WHEN 'canceled' THEN 5
                ELSE 6
            END ASC
        ")->orderBy('submitted_at', 'desc')->orderBy('id', 'desc');

        $orders = $query->paginate(25)->withQueryString();

        // Status Counts for Tabs Badges
        $counts = [
            'all' => OnlineOrder::count(),
            'pending' => OnlineOrder::where('status', 'pending')->count(),
            'under_review' => OnlineOrder::where('status', 'under_review')->count(),
            'awaiting_customer_acceptance' => OnlineOrder::where('status', 'awaiting_customer_acceptance')->count(),
            'confirmed' => OnlineOrder::where('status', 'confirmed')->count(),
            'canceled' => OnlineOrder::where('status', 'canceled')->count(),
        ];

        return Inertia::render('daily/online_orders/index', [
            'orders' => $orders,
            'counts' => $counts,
            'filters' => [
                'tab' => $statusTab,
                'search' => $search,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'customer_user_id' => $customerUserId,
            ],
        ]);
    }

    /**
     * Show comprehensive order workspace with original submitted items, revision history, and live stock.
     */
    public function show($orderNo)
    {
        $order = OnlineOrder::with([
            'customerUser.account',
            'customerUser.approvedBy',
            'offer',
            'sale',
            'items.item',
            'items.product',
            'histories',
            'revisions.items.item',
            'revisions.items.product',
            'revisions.creator',
            'confirmedByUser',
            'canceledByUser',
        ])
        ->where(function ($q) use ($orderNo) {
            $q->where('order_no', $orderNo);
            if (is_numeric($orderNo)) {
                $q->orWhere('id', $orderNo);
            }
        })
        ->firstOrFail();

        // Attach true real-time warehouse balances for all ordered products
        $productIds = $order->items->pluck('product_id')->toArray();
        $stockBalances = StockService::getBatchBalances($productIds);

        foreach ($order->items as $it) {
            $balObj = $stockBalances[$it->product_id] ?? null;
            $balPcs = $balObj ? (float)$balObj->balance_pcs : 0.0;
            $it->available_stock_pcs = $balPcs;
            $it->stock_balance = [
                'balance_pcs' => $balPcs,
                'balance_carton' => 0,
            ];
            $it->is_stock_sufficient = $balPcs >= (float)$it->total_pcs;
        }

        // WhatsApp links
        $customerWhatsAppLink = WhatsAppNotificationService::generateCustomerToCompanyOrderLink($order);
        $adminConfirmWhatsAppLink = WhatsAppNotificationService::generateAdminOrderConfirmedLink($order);

        return Inertia::render('daily/online_orders/show', [
            'order' => $order,
            'stockBalances' => $stockBalances,
            'whatsappDirectLink' => $customerWhatsAppLink,
            'customerWhatsAppLink' => $customerWhatsAppLink,
            'adminConfirmWhatsAppLink' => $adminConfirmWhatsAppLink,
        ]);
    }

    /**
     * Move pending order to 'under_review' status.
     */
    public function startReview($id)
    {
        $order = OnlineOrder::findOrFail($id);

        if ($order->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending orders can be moved to under review.');
        }

        $order->status = 'under_review';
        $order->save();

        OnlineOrderHistory::create([
            'online_order_id' => $order->id,
            'action' => 'review_started',
            'previous_status' => 'pending',
            'new_status' => 'under_review',
            'actor_type' => 'Admin',
            'actor_id' => Auth::id(),
            'description' => "Review started by " . Auth::user()->name,
            'created_at' => now(),
        ]);

        return redirect()->back()->with('success', "Order #{$order->order_no} is now Under Review.");
    }

    /**
     * Search active ERP items with live stock and default rates for adding to revision.
     */
    public function searchRevisionItems(Request $request)
    {
        $query = preg_replace('/\s+/', ' ', trim($request->query('query', '')));
        if (strlen($query) < 1) {
            return response()->json([]);
        }

        $items = Items::where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                  ->orWhere('code', 'like', "%{$query}%");
            })
            ->orderByRaw("CASE 
                WHEN code LIKE ? THEN 1 
                WHEN title LIKE ? THEN 2 
                ELSE 3 
            END", [$query . '%', $query . '%'])
            ->limit(20)
            ->get();

        $productIds = $items->pluck('id')->toArray();
        $stockBalances = StockService::getBatchBalances($productIds);

        // Fetch latest active offer rates if available
        $offerRates = OfferList::whereIn('item_id', $productIds)
            ->whereHas('priceOfferTo', function ($q) {
                $q->where('is_live', true);
            })
            ->latest('id')
            ->get()
            ->keyBy('item_id');

        $results = $items->map(function ($item) use ($stockBalances, $offerRates) {
            $balObj = $stockBalances[$item->id] ?? null;
            $balPcs = $balObj ? (float)$balObj->balance_pcs : 0.0;
            $packing = (float)($item->packing_size ?: ($item->packing ?: ($item->packing_qty ?: 1)));
            if ($packing <= 0) $packing = 1;

            $offerItem = $offerRates[$item->id] ?? null;
            $rate = 0.0;
            if ($offerItem && (float)$offerItem->price > 0) {
                $rate = (float)$offerItem->price;
            } elseif ((float)$item->trade_price > 0) {
                $rate = (float)$item->trade_price;
            } elseif ((float)$item->retail > 0) {
                $rate = (float)$item->retail;
            }

            $mrp = $offerItem && (float)$offerItem->mrp > 0
                ? (float)$offerItem->mrp
                : (float)($item->retail ?? 0);

            return [
                'id' => $item->id,
                'title' => $item->title,
                'code' => $item->code,
                'packing' => $packing,
                'sale_rate' => $rate,
                'trade_price' => (float)($item->trade_price ?? 0),
                'retail_price' => $mrp,
                'available_stock_pcs' => $balPcs,
                'unit' => $item->type ?: 'Pcs',
            ];
        });

        return response()->json($results);
    }

    /**
     * Create an order revision proposing modified items, discounts, or delivery charges.
     */
    public function createRevision(Request $request, $id)
    {
        $changeReason = trim($request->input('change_reason') ?: $request->input('notes', ''));
        if (strlen($changeReason) < 2) {
            return redirect()->back()->with('error', 'Please provide revision notes or reason for the customer.');
        }

        $items = $request->input('items', []);
        if (empty($items) || !is_array($items)) {
            return redirect()->back()->with('error', 'Revision must contain at least one item.');
        }

        $discountType = $request->input('discount_type', 'none');
        if (!in_array($discountType, ['none', 'fixed', 'percentage'])) {
            $discountType = 'none';
        }
        $discountRate = max(0, (float)$request->input('discount_rate', 0));
        $deliveryCharges = max(0, (float)$request->input('delivery_charges', 0));

        DB::beginTransaction();
        try {
            $order = OnlineOrder::with('items')->findOrFail($id);

            if (in_array($order->status, ['confirmed', 'canceled'])) {
                return redirect()->back()->with('error', 'Cannot create revision for confirmed or canceled orders.');
            }

            // Calculate proposed subtotal
            $proposedSubtotal = 0;
            $revisionItemsData = [];

            foreach ($items as $it) {
                $productId = $it['product_id'] ?? $it['item_id'] ?? null;
                if (!$productId) {
                    continue;
                }

                $product = Items::findOrFail($productId);
                $packing = (float)($product->packing_size ?: ($product->packing ?: ($product->packing_qty ?: 1)));
                if ($packing <= 0) $packing = 1;

                // Support both flat quantity/price and carton/piece split
                if (isset($it['qty_carton']) || isset($it['qty_pcs'])) {
                    $qtyCarton = max(0, (float)($it['qty_carton'] ?? 0));
                    $qtyPcs = max(0, (float)($it['qty_pcs'] ?? 0));
                    $totalPcs = ($qtyCarton * $packing) + $qtyPcs;
                    $pricePiece = max(0, (float)($it['unit_price'] ?? $it['price_piece'] ?? $product->trade_price ?? 0));
                    $priceCarton = round($pricePiece * $packing, 2);
                    $lineSubtotal = round($totalPcs * $pricePiece, 2);
                } elseif (isset($it['quantity']) || isset($it['unit_price'])) {
                    $totalPcs = max(0, (float)($it['quantity'] ?? 0));
                    $pricePiece = max(0, (float)($it['unit_price'] ?? $product->trade_price ?? 0));
                    $qtyCarton = floor($totalPcs / $packing);
                    $qtyPcs = fmod($totalPcs, $packing);
                    $priceCarton = round($pricePiece * $packing, 2);
                    $lineSubtotal = round($totalPcs * $pricePiece, 2);
                } else {
                    $qtyCarton = max(0, (float)($it['qty_carton'] ?? 0));
                    $qtyPcs = max(0, (float)($it['qty_pcs'] ?? 0));
                    $totalPcs = ($qtyCarton * $packing) + $qtyPcs;
                    $priceCarton = max(0, (float)($it['price_carton'] ?? 0));
                    $pricePiece = max(0, (float)($it['price_piece'] ?? ($packing > 0 ? $priceCarton / $packing : 0)));
                    $lineSubtotal = round(($qtyCarton * $priceCarton) + ($qtyPcs * $pricePiece), 2);
                }

                $proposedSubtotal += $lineSubtotal;

                $revisionItemsData[] = [
                    'product_id' => $product->id,
                    'item_code_snapshot' => $product->code,
                    'item_name_snapshot' => $product->title,
                    'unit_snapshot' => $product->type ?: 'Pcs',
                    'qty_carton' => $qtyCarton,
                    'qty_pcs' => $qtyPcs,
                    'total_pcs' => $totalPcs,
                    'price_carton' => $priceCarton,
                    'price_piece' => $pricePiece,
                    'line_subtotal' => $lineSubtotal,
                    'change_reason' => $it['change_reason'] ?? null,
                ];
            }

            if (empty($revisionItemsData)) {
                return redirect()->back()->with('error', 'Valid product items are required to create a revision.');
            }

            // Calculate discount amount
            $discountAmount = 0;
            if ($discountType === 'fixed') {
                $discountAmount = min($discountRate, $proposedSubtotal);
            } elseif ($discountType === 'percentage') {
                $discountAmount = round(($proposedSubtotal * min(100, $discountRate)) / 100, 2);
            }

            $proposedFinalTotal = max(0, round($proposedSubtotal - $discountAmount + $deliveryCharges, 2));

            $nextRevNo = (int)($order->revision_number ?? 0) + 1;

            // Mark any previous pending revisions as superseded
            OnlineOrderRevision::where('online_order_id', $order->id)
                ->whereIn('revision_status', ['draft', 'awaiting_customer_acceptance'])
                ->update(['revision_status' => 'superseded']);

            // Create revision
            $revision = OnlineOrderRevision::create([
                'online_order_id' => $order->id,
                'revision_number' => $nextRevNo,
                'revision_status' => 'awaiting_customer_acceptance',
                'proposed_subtotal' => $proposedSubtotal,
                'proposed_discount_type' => $discountType,
                'proposed_discount_rate' => $discountRate,
                'proposed_discount_amount' => $discountAmount,
                'proposed_delivery_charges' => $deliveryCharges,
                'proposed_final_total' => $proposedFinalTotal,
                'change_reason' => $changeReason,
                'created_by' => Auth::id(),
                'submitted_to_customer_at' => now(),
            ]);

            foreach ($revisionItemsData as $revItem) {
                $revItem['revision_id'] = $revision->id;
                OnlineOrderRevisionItem::create($revItem);
            }

            // Move order to awaiting_customer_acceptance
            $prevStatus = $order->status;
            $order->status = 'awaiting_customer_acceptance';
            $order->revision_number = $nextRevNo;
            $order->save();

            OnlineOrderHistory::create([
                'online_order_id' => $order->id,
                'action' => 'revision_proposed',
                'previous_status' => $prevStatus,
                'new_status' => 'awaiting_customer_acceptance',
                'actor_type' => 'Admin',
                'actor_id' => Auth::id(),
                'description' => "Revision #{$nextRevNo} created by " . Auth::user()->name . ". Proposed Total: Rs. " . number_format($proposedFinalTotal, 2) . ". Notes: {$changeReason}",
                'reason' => $changeReason,
                'new_values' => [
                    'revision_number' => $nextRevNo,
                    'proposed_subtotal' => $proposedSubtotal,
                    'discount_amount' => $discountAmount,
                    'delivery_charges' => $deliveryCharges,
                    'final_total' => $proposedFinalTotal,
                ],
                'created_at' => now(),
            ]);

            DB::commit();

            return redirect()->back()->with('success', "Revision #{$nextRevNo} created successfully. Sent to customer for acceptance.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to create revision: ' . $e->getMessage());
        }
    }

    /**
     * Cancel an online order with a mandatory reason.
     */
    public function cancel(Request $request, $id)
    {
        $request->validate([
            'cancellation_reason' => 'required|string|min:3|max:1000',
        ]);

        $order = OnlineOrder::findOrFail($id);

        if ($order->status === 'confirmed') {
            return redirect()->back()->with('error', 'Confirmed orders cannot be canceled through online order cancellation.');
        }

        if ($order->status === 'canceled') {
            return redirect()->back()->with('error', 'This order is already canceled.');
        }

        $prevStatus = $order->status;
        $order->status = 'canceled';
        $order->cancellation_reason = trim($request->cancellation_reason);
        $order->canceled_by = Auth::id();
        $order->canceled_at = now();
        $order->save();

        OnlineOrderHistory::create([
            'online_order_id' => $order->id,
            'action' => 'canceled',
            'previous_status' => $prevStatus,
            'new_status' => 'canceled',
            'actor_type' => 'Admin',
            'actor_id' => Auth::id(),
            'description' => "Order #{$order->order_no} canceled by " . Auth::user()->name,
            'reason' => $request->cancellation_reason,
            'created_at' => now(),
        ]);

        // WhatsApp notification link for cancellation
        $cancelWhatsAppLink = WhatsAppNotificationService::generateAdminOrderCanceledLink($order, $request->cancellation_reason);

        return redirect()->back()->with('success', "Order #{$order->order_no} has been canceled.")
            ->with('cancel_whatsapp_link', $cancelWhatsAppLink);
    }

    /**
     * Atomically confirm online order into a finalized ERP Sales record.
     */
    public function confirm(Request $request, $id)
    {
        $request->validate([
            'discount_type' => 'nullable|in:none,fixed,percentage',
            'discount_rate' => 'nullable|numeric|min:0',
            'delivery_charges' => 'nullable|numeric|min:0',
        ]);

        $confirmationService = app(OnlineOrderConfirmationService::class);
        $order = OnlineOrder::findOrFail($id);

        $result = $confirmationService->confirmOrder(
            order: $order,
            confirmedByUserId: Auth::id(),
            discountType: $request->discount_type ?? $order->discount_type,
            discountRate: $request->discount_rate !== null ? (float)$request->discount_rate : (float)$order->discount_rate,
            deliveryCharges: $request->delivery_charges !== null ? (float)$request->delivery_charges : (float)$order->delivery_charges
        );

        if (!$result['success']) {
            return redirect()->back()->with('error', $result['message']);
        }

        $sale = $result['sale'];
        $whatsappLink = WhatsAppNotificationService::generateAdminOrderConfirmedLink($order);

        return redirect()->back()->with('success', "Order #{$order->order_no} successfully confirmed into ERP Sale #{$sale->invoice}!")
            ->with('confirmed_whatsapp_link', $whatsappLink);
    }
}

