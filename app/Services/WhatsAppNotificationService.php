<?php

namespace App\Services;

use App\Models\OnlineOrder;
use App\Models\CustomerUser;
use App\Models\NotificationDelivery;
use App\Services\PhoneNormalizer;

class WhatsAppNotificationService
{
    /**
     * Get official company WhatsApp phone number
     */
    public static function getCompanyWhatsAppNumber(): string
    {
        return config('services.whatsapp.business_phone', '923323228684');
    }

    /**
     * Generate customer click-to-send WhatsApp link to message the company regarding an order.
     */
    public static function generateCustomerToCompanyOrderLink(OnlineOrder $order): string
    {
        $companyPhone = self::getCompanyWhatsAppNumber();
        $customer = $order->customerUser;
        $customerName = $customer ? $customer->name : 'Customer';
        $orderNo = $order->order_no;
        $amount = number_format($order->final_total, 2);

        $text = "Hello Haramain Traders! 👋\n"
              . "I have placed Order #{$orderNo} for Rs. {$amount}.\n"
              . "Name: {$customerName}\n"
              . "Mobile: {$customer?->mobile}\n"
              . "Please review and confirm my order. Thank you!";

        // Log notification attempt
        self::recordDeliveryLog($order, 'customer_to_company_order_link', 'whatsapp', $companyPhone, 'click_to_send_generated');

        return 'https://wa.me/' . $companyPhone . '?text=' . rawurlencode($text);
    }

    /**
     * Generate admin click-to-send WhatsApp link to message the customer about order confirmation.
     */
    public static function generateAdminOrderConfirmedLink(OnlineOrder $order): ?string
    {
        $customer = $order->customerUser;
        if (!$customer || !$customer->mobile) {
            return null;
        }

        $recipientPhone = PhoneNormalizer::normalizeWhatsApp($customer->mobile);
        if (!$recipientPhone) {
            return null;
        }

        $orderNo = $order->order_no;
        $saleInvoice = $order->sale ? $order->sale->invoice : null;
        $invoiceRef = $saleInvoice ? " (Invoice: {$saleInvoice})" : '';
        $amount = number_format($order->final_total, 2);

        $text = "Assalam-o-Alaikum {$customer->name},\n\n"
              . "Great news! Your Order #{$orderNo}{$invoiceRef} of Rs. {$amount} has been CONFIRMED by Haramain Traders.\n"
              . "Our dispatch team is currently processing your delivery.\n\n"
              . "Thank you for choosing Haramain Traders!";

        self::recordDeliveryLog($order, 'admin_order_confirmed_link', 'whatsapp', $recipientPhone, 'click_to_send_generated');

        return 'https://wa.me/' . $recipientPhone . '?text=' . rawurlencode($text);
    }

    /**
     * Generate admin click-to-send WhatsApp link to message the customer about order cancellation.
     */
    public static function generateAdminOrderCanceledLink(OnlineOrder $order, string $reason): ?string
    {
        $customer = $order->customerUser;
        if (!$customer || !$customer->mobile) {
            return null;
        }

        $recipientPhone = PhoneNormalizer::normalizeWhatsApp($customer->mobile);
        if (!$recipientPhone) {
            return null;
        }

        $orderNo = $order->order_no;

        $text = "Assalam-o-Alaikum {$customer->name},\n\n"
              . "Your Order #{$orderNo} has been CANCELED.\n"
              . "Reason: {$reason}\n\n"
              . "If you have any questions, please contact our support team at 0332-3228684.";

        self::recordDeliveryLog($order, 'admin_order_canceled_link', 'whatsapp', $recipientPhone, 'click_to_send_generated');

        return 'https://wa.me/' . $recipientPhone . '?text=' . rawurlencode($text);
    }

    /**
     * Record a delivery attempt in the notification_deliveries audit table.
     */
    private static function recordDeliveryLog(
        OnlineOrder $order,
        string $eventKey,
        string $channel,
        string $recipient,
        string $status
    ): void {
        try {
            NotificationDelivery::create([
                'customer_user_id' => $order->customer_user_id,
                'online_order_id' => $order->id,
                'event_key' => $eventKey,
                'channel' => $channel,
                'recipient' => $recipient,
                'delivery_status' => $status,
                'attempt_count' => 1,
                'last_attempt_at' => now(),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to record notification delivery: " . $e->getMessage());
        }
    }
}

