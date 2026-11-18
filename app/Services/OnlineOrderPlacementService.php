<?php

namespace App\Services;

use App\Models\CustomerUser;
use App\Models\PriceOfferTo;
use App\Models\OfferList;
use App\Models\Items;
use App\Models\OnlineOrder;
use App\Models\OnlineOrderItem;
use App\Models\OnlineOrderHistory;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Services\CustomerOrderEligibilityService;
use App\Services\PhoneNormalizer;

class OnlineOrderPlacementService
{
    public function __construct(
        protected CustomerOrderEligibilityService $eligibilityService
    ) {}

    /**
     * Generate unique sequential human-readable order number: ORD-YYYYMMDD-XXXX
     */
    public function generateOrderNumber(): string
    {
        $datePrefix = 'ORD-' . date('Ymd') . '-';
        
        $latest = OnlineOrder::where('order_no', 'LIKE', $datePrefix . '%')
            ->lockForUpdate()
            ->orderBy('id', 'desc')
            ->value('order_no');

        $nextSeq = 1;
        if ($latest && preg_match('/' . preg_quote($datePrefix, '/') . '(\d+)/', $latest, $m)) {
            $nextSeq = intval($m[1]) + 1;
        }

        return $datePrefix . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Place an online order atomically with server-authoritative pricing.
     *
     * @param CustomerUser $customer
     * @param int|null $offerId
     * @param array $itemsInput [{item_id, qty_carton, qty_pcs}]
     * @param string|null $customerNotes
     * @param string|null $idempotencyKey
     * @return array [bool $success, string $message, OnlineOrder|null $order, array $extra]
     */
    public function placeOrder(
        CustomerUser $customer,
        ?int $offerId,
        array $itemsInput,
        ?string $customerNotes = null,
        ?string $idempotencyKey = null
    ): array {
        if ($idempotencyKey) {
            $existing = OnlineOrder::where('idempotency_key', $idempotencyKey)
                ->where('customer_user_id', $customer->id)
                ->first();

            if ($existing) {
                return [
                    true,
                    'Order already received (idempotency key matched).',
                    $existing,
                    ['is_duplicate' => true]
                ];
            }
        }

        DB::beginTransaction();

        try {
            // 1. Check customer order eligibility with pessimistic row lock
            [$isEligible, $eligibilityMsg, $reasonCode] = $this->eligibilityService->checkEligibility($customer, true);
            if (!$isEligible) {
                DB::rollBack();
                return [false, $eligibilityMsg, null, ['reason_code' => $reasonCode]];
            }

            // 2. Validate live offer
            $offer = null;
            if ($offerId) {
                $offer = PriceOfferTo::where('id', $offerId)->where('is_live', true)->first();
                if (!$offer) {
                    DB::rollBack();
                    return [false, 'The selected offer is no longer active or available.', null, ['reason_code' => 'OFFER_INACTIVE']];
                }
            } else {
                $offer = PriceOfferTo::where('is_live', true)->orderBy('date', 'desc')->first();
            }

            // 3. Server-authoritative item validation and calculation (single batch query to eliminate N+1)
            $orderItems = [];
            $subtotal = 0;

            // Load offer items map by item_id
            $offerItemsMap = [];
            if ($offer) {
                $offerItemsMap = OfferList::where('offer_id', $offer->id)
                    ->where('status', 'active')
                    ->get()
                    ->keyBy('item_id');
            }

            $requestedItemIds = collect($itemsInput)
                ->pluck('item_id')
                ->filter()
                ->map(fn($id) => (int) $id)
                ->unique()
                ->values()
                ->all();

            $productsMap = !empty($requestedItemIds)
                ? Items::whereIn('id', $requestedItemIds)->where('is_active', 1)->get()->keyBy('id')
                : collect();

            $nowTimestamp = now();

            foreach ($itemsInput as $rawItem) {
                $itemId = isset($rawItem['item_id']) ? (int) $rawItem['item_id'] : null;
                $qtyCarton = max(0, (float)($rawItem['qty_carton'] ?? 0));
                $qtyPcs = max(0, (float)($rawItem['qty_pcs'] ?? 0));

                if (!$itemId || ($qtyCarton <= 0 && $qtyPcs <= 0)) {
                    continue;
                }

                $product = $productsMap->get($itemId);
                if (!$product) {
                    continue; // Skip invalid or inactive products
                }

                $packingQty = (float)($product->packing_size ?: ($product->packing_qty ?: 1));
                if ($packingQty <= 0) $packingQty = 1;

                $totalPcs = ($qtyCarton * $packingQty) + $qtyPcs;

                // Server-authoritative price lookup
                $priceCarton = 0;
                $pricePiece = 0;
                $offerItemId = null;

                if (isset($offerItemsMap[$product->id])) {
                    $oi = $offerItemsMap[$product->id];
                    $offerItemId = $oi->id;
                    $packCtn = (float)$oi->pack_ctn;
                    $loosCtn = (float)$oi->loos_ctn;
                    $price = (float)$oi->price;

                    // If offertype == '1' (Customer Group Offer)
                    if ((string)$offer->offertype === '1' && $packingQty > 1) {
                        $pricePiece = $loosCtn > 0 ? $loosCtn : ($price > 0 ? $price / $packingQty : (float)$product->trade_price);
                        $ctnRatePerPc = $packCtn > 0 ? $packCtn : ($price > 0 ? $price : (float)$product->trade_price);
                        $priceCarton = $ctnRatePerPc * $packingQty;
                    } else {
                        // Market offer or 1-piece packing
                        $pricePiece = $loosCtn > 0 ? $loosCtn : ($price > 0 ? $price : (float)$product->trade_price);
                        $priceCarton = $pricePiece * $packingQty;
                    }
                } else {
                    // Fallback to item master trade price if not in offer list
                    $pricePiece = (float)($product->trade_price ?: 0);
                    $priceCarton = $pricePiece * $packingQty;
                }

                $lineSubtotal = ($qtyCarton * $priceCarton) + ($qtyPcs * $pricePiece);
                $subtotal += $lineSubtotal;

                $orderItems[] = [
                    'offer_item_id' => $offerItemId,
                    'product_id' => $product->id,
                    'item_code_snapshot' => $product->code,
                    'item_name_snapshot' => $product->title,
                    'unit_snapshot' => $product->type ?: 'Pcs',
                    'packing_qty_snapshot' => $packingQty,
                    'qty_carton' => $qtyCarton,
                    'qty_pcs' => $qtyPcs,
                    'total_pcs' => $totalPcs,
                    'price_carton' => $priceCarton,
                    'price_piece' => $pricePiece,
                    'line_subtotal' => $lineSubtotal,
                    'created_at' => $nowTimestamp,
                    'updated_at' => $nowTimestamp,
                ];
            }

            if (empty($orderItems)) {
                DB::rollBack();
                return [false, 'Your order cart is empty or contains no valid products.', null, ['reason_code' => 'EMPTY_CART']];
            }

            // 4. Generate unique sequential order reference
            $orderNo = $this->generateOrderNumber();

            // 5. Create staged online order
            $onlineOrder = OnlineOrder::create([
                'order_no' => $orderNo,
                'customer_user_id' => $customer->id,
                'account_id' => $customer->account_id,
                'offer_id' => $offer?->id,
                'status' => 'pending',
                'original_subtotal' => $subtotal,
                'current_subtotal' => $subtotal,
                'discount_type' => 'none',
                'discount_rate' => 0.00,
                'discount_amount' => 0.00,
                'delivery_charges' => 0.00,
                'final_total' => $subtotal,
                'currency' => 'PKR',
                'customer_notes' => $customerNotes ? trim($customerNotes) : null,
                'submitted_at' => $nowTimestamp,
                'idempotency_key' => $idempotencyKey,
                'revision_number' => 1,
            ]);

            // 6. Batch insert line items in a single SQL query
            foreach ($orderItems as &$itemRow) {
                $itemRow['online_order_id'] = $onlineOrder->id;
            }
            unset($itemRow);
            OnlineOrderItem::insert($orderItems);

            // 7. Create immutable history record
            OnlineOrderHistory::create([
                'online_order_id' => $onlineOrder->id,
                'action' => 'submitted',
                'previous_status' => null,
                'new_status' => 'pending',
                'actor_type' => 'Customer',
                'actor_id' => $customer->id,
                'description' => "Order #{$orderNo} submitted by {$customer->name} ({$customer->mobile}) via live offer.",
                'new_values' => [
                    'order_no' => $orderNo,
                    'subtotal' => $subtotal,
                    'item_count' => count($orderItems),
                    'approval_status' => $customer->approval_status,
                ],
                'created_at' => $nowTimestamp,
            ]);

            DB::commit();

            // 8. Create in-app notifications immediately (fast batch DB insert) & dispatch emails/WebSockets after HTTP response
            try {
                $existingRoles = \Spatie\Permission\Models\Role::whereIn('name', ['Admin', 'Super Admin', 'admin', 'super-admin'])
                    ->pluck('name')
                    ->toArray();

                $roleUsers = !empty($existingRoles) ? User::role($existingRoles)->get() : collect();
                $permUsers = \Spatie\Permission\Models\Permission::where('name', 'view online orders')->exists()
                    ? User::permission('view online orders')->get()
                    : collect();

                $admins = $roleUsers->merge($permUsers)->unique('id')->values();
                if ($admins->isEmpty()) {
                    $admins = User::all();
                }

                $notifTitle = "New Wholesale Order #{$onlineOrder->order_no}";
                $customerLabel = $customer->business_name
                    ? "{$customer->name} ({$customer->business_name})"
                    : $customer->name;
                $itemCount = count($orderItems);
                $notifMessage = "{$customerLabel} placed an order of {$itemCount} " . ($itemCount === 1 ? 'item' : 'items') . " worth Rs. " . number_format((float)$onlineOrder->final_total) . ".";
                $actionUrl = "/online-orders/{$onlineOrder->id}";

                $notificationRows = [];
                $broadcastPayloads = [];
                foreach ($admins as $admin) {
                    $notifId = (string) Str::orderedUuid();
                    $dataPayload = [
                        'title' => $notifTitle,
                        'message' => $notifMessage,
                        'action_url' => $actionUrl,
                        'online_order_id' => $onlineOrder->id,
                        'order_no' => $onlineOrder->order_no,
                        'customer_name' => $customer->name,
                        'business_name' => $customer->business_name,
                        'customer_mobile' => $customer->mobile,
                        'final_total' => (float) $onlineOrder->final_total,
                        'item_count' => $itemCount,
                    ];

                    $notificationRows[] = [
                        'id' => $notifId,
                        'type' => 'App\Notifications\NewOnlineOrderAdminNotification',
                        'notifiable_type' => User::class,
                        'notifiable_id' => $admin->id,
                        'priority' => 'high',
                        'category' => 'online_orders',
                        'data' => json_encode($dataPayload),
                        'created_at' => $nowTimestamp,
                    ];

                    $broadcastPayloads[] = [
                        'recipient_id' => $admin->id,
                        'payload' => [
                            'id' => $notifId,
                            'title' => $notifTitle,
                            'message' => $notifMessage,
                            'actionUrl' => $actionUrl,
                            'category' => 'online_orders',
                            'priority' => 'high',
                            'order_no' => $onlineOrder->order_no,
                            'final_total' => (float) $onlineOrder->final_total,
                            'customer_name' => $customer->name,
                            'read' => false,
                            'createdAt' => 'Just now',
                        ],
                    ];
                }

                if (!empty($notificationRows)) {
                    Notification::insert($notificationRows);
                }

                // Collect unique valid email addresses of Admin role users (plus company contact_email if configured)
                $adminEmails = $admins->pluck('email')
                    ->filter(fn($email) => !empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL))
                    ->map(fn($email) => strtolower(trim($email)))
                    ->unique()
                    ->values()
                    ->all();

                $siteSetting = \App\Models\SiteSetting::first();
                if ($siteSetting && !empty($siteSetting->contact_email) && filter_var($siteSetting->contact_email, FILTER_VALIDATE_EMAIL)) {
                    $contactEmail = strtolower(trim($siteSetting->contact_email));
                    if (!in_array($contactEmail, $adminEmails, true)) {
                        $adminEmails[] = $contactEmail;
                    }
                }

                // Queue email onto the database queue (NewOnlineOrderAdminMail implements ShouldQueue — takes ~2ms, never blocks HTTP!)
                if (!empty($adminEmails)) {
                    $primaryRecipient = $adminEmails[0];
                    $ccRecipients = array_slice($adminEmails, 1);
                    $pendingMail = \Illuminate\Support\Facades\Mail::to($primaryRecipient);
                    if (!empty($ccRecipients)) {
                        $pendingMail->cc($ccRecipients);
                    }
                    $pendingMail->queue(new \App\Mail\NewOnlineOrderAdminMail($onlineOrder));
                }

                // Queue WebSocket broadcast events (RealtimeNotificationEvent implements ShouldBroadcast — queued in ~1ms, never blocks HTTP!)
                if (config('queue.default') !== 'sync') {
                    foreach ($broadcastPayloads as $bp) {
                        try {
                            broadcast(new \App\Events\RealtimeNotificationEvent($bp['recipient_id'], $bp['payload']));
                        } catch (\Throwable $broadcastEx) {
                            // Ignore if broadcast queueing fails
                        }
                    }
                }

            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Failed to dispatch admin notification for order #{$orderNo}: " . $e->getMessage());
            }

            return [
                true,
                'Your order has been placed successfully and is awaiting admin review.',
                $onlineOrder,
                [
                    'order_no' => $orderNo,
                    'final_total' => $subtotal,
                    'customer_name' => $customer->name,
                    'approval_status' => $customer->approval_status,
                ]
            ];

        } catch (\Throwable $e) {
            DB::rollBack();
            return [
                false,
                'Failed to submit online order: ' . $e->getMessage(),
                null,
                ['exception' => $e->getMessage()]
            ];
        }
    }
}

