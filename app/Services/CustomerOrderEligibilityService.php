<?php

namespace App\Services;

use App\Models\CustomerUser;
use App\Models\OnlineOrder;

class CustomerOrderEligibilityService
{
    /**
     * Check whether a customer is currently eligible to place an online order.
     *
     * @param CustomerUser $customer
     * @param bool $lockCustomer If true, locks the customer row for update inside a transaction.
     * @return array [bool $isEligible, string $message, string $reasonCode]
     */
    public function checkEligibility(CustomerUser $customer, bool $lockCustomer = false): array
    {
        if ($lockCustomer) {
            $customer = CustomerUser::where('id', $customer->id)->lockForUpdate()->first();
        }

        if (!$customer) {
            return [false, 'Customer account not found.', 'NOT_FOUND'];
        }

        // 1. Rejected accounts can never order
        if ($customer->approval_status === 'rejected') {
            $reason = $customer->rejection_reason ? " Reason: {$customer->rejection_reason}" : '';
            return [
                false,
                "Your customer registration has been rejected by administration.{$reason} Please contact customer support.",
                'ACCOUNT_REJECTED'
            ];
        }

        // 2. Approved accounts can always order
        if ($customer->approval_status === 'approved') {
            return [true, 'Customer is approved and eligible to place orders.', 'APPROVED'];
        }

        // 3. Pending accounts: Allowed exactly ONE initial order
        if ($customer->approval_status === 'pending') {
            // Count existing non-canceled orders
            $existingOrdersCount = OnlineOrder::where('customer_user_id', $customer->id)
                ->where('status', '!=', 'canceled')
                ->count();

            if ($existingOrdersCount >= 1) {
                return [
                    false,
                    'Your account is currently Pending Approval. You have already submitted your initial order. Subsequent orders are blocked until your account is approved by our team.',
                    'PENDING_LIMIT_REACHED'
                ];
            }

            return [
                true,
                'Pending customer is eligible to submit their initial order.',
                'PENDING_INITIAL_ALLOWED'
            ];
        }

        return [false, 'Unknown customer account status.', 'UNKNOWN_STATUS'];
    }
}

