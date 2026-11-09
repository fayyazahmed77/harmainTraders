<?php

namespace App\Services;

use App\Models\OnlineOrder;
use App\Models\OnlineOrderItem;
use App\Models\OnlineOrderHistory;
use App\Models\Sales;
use App\Models\SalesItem;
use App\Models\Items;
use App\Models\Account;
use App\Services\StockService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OnlineOrderConfirmationService
{
    /**
     * Atomically confirm an online order into a finalized ERP Sales record.
     *
     * @param OnlineOrder $order
     * @param int $confirmedByUserId
     * @param string|null $discountType
     * @param float|null $discountRate
     * @param float|null $deliveryCharges
     * @return array [success => bool, message => string, sale => Sales|null]
     */
    public function confirmOrder(
        OnlineOrder $order,
        int $confirmedByUserId,
        ?string $discountType = null,
        ?float $discountRate = null,
        ?float $deliveryCharges = null
    ): array {
        return DB::transaction(function () use (
            $order,
            $confirmedByUserId,
            $discountType,
            $discountRate,
            $deliveryCharges
        ) {
            // 1. Lock the order row to prevent concurrent confirmation
            $lockedOrder = OnlineOrder::where('id', $order->id)->lockForUpdate()->first();

            if (!$lockedOrder) {
                return ['success' => false, 'message' => 'Order not found.'];
            }

            // Already confirmed check (idempotency)
            if ($lockedOrder->status === 'confirmed') {
                return [
                    'success' => false,
                    'message' => "Order #{$lockedOrder->order_no} has already been confirmed as Sale #{$lockedOrder->sale_id}.",
                ];
            }

            if ($lockedOrder->status === 'canceled') {
                return [
                    'success' => false,
                    'message' => "Order #{$lockedOrder->order_no} is canceled and cannot be confirmed.",
                ];
            }

            // Customer Revision acceptance check
            if ($lockedOrder->status === 'awaiting_customer_acceptance') {
                return [
                    'success' => false,
                    'message' => "Order #{$lockedOrder->order_no} has a pending revision awaiting customer acceptance. Customer must accept or reject the revision first.",
                ];
            }

            // 2. Validate Customer Account & Linkage
            $customerUser = $lockedOrder->customerUser;
            if (!$customerUser) {
                return [
                    'success' => false,
                    'message' => 'No registered customer is attached to this order.',
                ];
            }

            if (strtolower($customerUser->approval_status ?? '') !== 'approved') {
                return [
                    'success' => false,
                    'message' => "Customer account '{$customerUser->name}' is {$customerUser->approval_status}. Please approve the customer account before confirming the order.",
                ];
            }

            if (!$customerUser->account_id) {
                return [
                    'success' => false,
                    'message' => "Customer account '{$customerUser->name}' is not linked to an ERP Chart of Accounts (Customer) entry. Please link an ERP account under Setup > Customer Approvals.",
                ];
            }

            $erpAccount = Account::find($customerUser->account_id);
            if (!$erpAccount) {
                return [
                    'success' => false,
                    'message' => "The linked ERP Account ID {$customerUser->account_id} does not exist in Chart of Accounts.",
                ];
            }

            // 3. Load Order Items and Lock Item rows in sorted order (deadlock prevention)
            $orderItems = OnlineOrderItem::where('online_order_id', $lockedOrder->id)->get();
            if ($orderItems->isEmpty()) {
                return ['success' => false, 'message' => 'Order contains no items.'];
            }

            $itemIds = $orderItems->pluck('item_id')->sort()->values()->all();
            $lockedItems = Items::whereIn('id', $itemIds)->lockForUpdate()->get()->keyBy('id');

            // 4. Verify Live Stock for each item
            $stockBalances = StockService::getBatchBalances($itemIds);

            foreach ($orderItems as $orderItem) {
                $item = $lockedItems->get($orderItem->item_id);
                if (!$item) {
                    return [
                        'success' => false,
                        'message' => "Item ID {$orderItem->item_id} ({$orderItem->item_name}) no longer exists in inventory.",
                    ];
                }

                $bal = $stockBalances[$orderItem->item_id] ?? null;
                $availablePcs = $bal ? (float) $bal->balance_pcs : 0.0;
                $requiredPcs = (float) $orderItem->quantity;

                if ($availablePcs < $requiredPcs) {
                    return [
                        'success' => false,
                        'message' => "Insufficient stock for '{$orderItem->item_name}'. Available: {$availablePcs} pcs, Required: {$requiredPcs} pcs.",
                    ];
                }
            }

            // 5. Calculate Financial Adjustments (if admin provided overrides upon confirmation)
            $subtotal = (float) $orderItems->sum('subtotal');
            $appliedDiscountType = $discountType ?? $lockedOrder->discount_type ?? 'none';
            $appliedDiscountRate = $discountRate !== null ? (float) $discountRate : (float) $lockedOrder->discount_rate;
            $appliedDelivery = $deliveryCharges !== null ? (float) $deliveryCharges : (float) $lockedOrder->delivery_charges;

            $discountAmount = 0.0;
            if ($appliedDiscountType === 'percentage' && $appliedDiscountRate > 0) {
                $discountAmount = round(($subtotal * $appliedDiscountRate) / 100, 2);
            } elseif ($appliedDiscountType === 'fixed' && $appliedDiscountRate > 0) {
                $discountAmount = min($subtotal, round($appliedDiscountRate, 2));
            }

            $finalPayable = max(0, round($subtotal - $discountAmount + $appliedDelivery, 2));

            // 6. Create ERP Sales Record
            $today = now()->format('Y-m-d');
            $sale = Sales::create([
                'date'            => $today,
                'invoice'         => uniqid('SLS-TMP-', true),
                'code'            => $lockedOrder->order_no,
                'type'            => 'CREDIT',
                'customer_id'     => $erpAccount->id,
                'salesman_id'     => 0,
                'firm_id'         => null,
                'message_line_id' => null,
                'no_of_items'     => $orderItems->count(),
                'gross_total'     => $subtotal,
                'discount_total'  => 0,
                'tax_total'       => 0,
                'courier_charges' => $appliedDelivery,
                'net_total'       => $subtotal + $appliedDelivery,
                'extra_discount'  => $discountAmount,
                'total_receivable'=> $finalPayable,
                'paid_amount'     => 0,
                'remaining_amount'=> $finalPayable,
                'status'          => 'Completed',
                'is_online'       => 1,
            ]);

            // Set authoritative sequential invoice SLS-00XXXX
            $sale->invoice = 'SLS-' . str_pad($sale->id, 6, '0', STR_PAD_LEFT);
            $sale->save();

            // 7. Create ERP SalesItems (which transactionally updates inventory via StockService join)
            foreach ($orderItems as $orderItem) {
                $item = $lockedItems->get($orderItem->item_id);
                $packing = ($item && (float)$item->packing > 0) ? (float)$item->packing : 1;
                $qtyCarton = floor($orderItem->quantity / $packing);
                $qtyPcs = $orderItem->quantity % $packing;

                SalesItem::create([
                    'sale_id'          => $sale->id,
                    'item_id'          => $orderItem->item_id,
                    'qty_carton'       => $qtyCarton,
                    'qty_pcs'          => $qtyPcs,
                    'total_pcs'        => $orderItem->quantity,
                    'trade_price'      => $orderItem->unit_price,
                    'retail_price'     => $orderItem->retail_price ?? 0,
                    'discount'         => 0,
                    'gst_amount'       => 0,
                    'subtotal'         => $orderItem->subtotal,
                    'bonus_qty_carton' => 0,
                    'bonus_qty_pcs'    => 0,
                ]);
            }

            // 8. Update OnlineOrder row
            $prevStatus = $lockedOrder->status;
            $lockedOrder->status = 'confirmed';
            $lockedOrder->account_id = $erpAccount->id;
            $lockedOrder->sale_id = $sale->id;
            $lockedOrder->discount_type = $appliedDiscountType;
            $lockedOrder->discount_rate = $appliedDiscountRate;
            $lockedOrder->discount_amount = $discountAmount;
            $lockedOrder->delivery_charges = $appliedDelivery;
            $lockedOrder->payable_amount = $finalPayable;
            $lockedOrder->confirmed_by = $confirmedByUserId;
            $lockedOrder->confirmed_at = now();
            $lockedOrder->save();

            // 9. Record History
            OnlineOrderHistory::create([
                'online_order_id' => $lockedOrder->id,
                'action'          => 'confirmed',
                'previous_status' => $prevStatus,
                'new_status'      => 'confirmed',
                'actor_type'      => 'Admin',
                'actor_id'        => $confirmedByUserId,
                'description'     => "Order #{$lockedOrder->order_no} confirmed into ERP Sale #{$sale->invoice}.",
                'created_at'      => now(),
            ]);

            Log::info("OnlineOrderConfirmationService: Order {$lockedOrder->order_no} successfully confirmed into Sale {$sale->invoice} for Account {$erpAccount->title} (#{$erpAccount->id}).");

            return [
                'success' => true,
                'message' => "Order #{$lockedOrder->order_no} successfully converted to Sale #{$sale->invoice}.",
                'sale'    => $sale,
                'order'   => $lockedOrder,
            ];
        });
    }
}
