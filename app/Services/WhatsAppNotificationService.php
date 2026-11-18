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
        return config('services.whatsapp.business_phone', '923318102001');
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
        self::recordDeliveryLog($order, 'customer_to_company_order_link', 'whatsapp', $companyPhone, 'sent');

        return 'https://wa.me/' . $companyPhone . '?text=' . rawurlencode($text);
    }

    /**
     * Generate admin click-to-send WhatsApp link to message the customer about order update / revision.
     */
    public static function generateAdminToCustomerRevisedOrderLink(OnlineOrder $order): ?string
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
        $itemsCount = $order->items ? $order->items->count() : 0;
        $subtotal = number_format((float)($order->current_subtotal ?: $order->original_subtotal ?: $order->final_total), 2);
        $discountAmount = (float)$order->discount_amount;
        $deliveryCharges = (float)$order->delivery_charges;
        $finalTotal = number_format((float)$order->final_total, 2);

        $portalUrl = url('/customer/orders/' . $orderNo);

        $text = "Assalam-o-Alaikum {$customer->name},\n\n"
              . "Your Order #{$orderNo} has been reviewed and updated by Haramain Traders.\n\n"
              . "📋 *Order Summary:*\n"
              . "• Total Items: {$itemsCount}\n"
              . "• Subtotal: Rs. {$subtotal}\n";

        if ($discountAmount > 0) {
            $text .= "• Discount: -Rs. " . number_format($discountAmount, 2) . "\n";
        }

        if ($deliveryCharges > 0) {
            $text .= "• Delivery: +Rs. " . number_format($deliveryCharges, 2) . "\n";
        }

        $text .= "• *Net Payable:* Rs. {$finalTotal}\n\n"
              . "📄 *View Order Details & Invoice:* \n{$portalUrl}\n\n"
              . "Thank you for choosing Haramain Traders!";

        self::recordDeliveryLog($order, 'admin_order_revised_link', 'whatsapp', $recipientPhone, 'sent');

        return 'https://wa.me/' . $recipientPhone . '?text=' . rawurlencode($text);
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

        self::recordDeliveryLog($order, 'admin_order_confirmed_link', 'whatsapp', $recipientPhone, 'sent');

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
              . "If you have any questions, please contact our support team on WhatsApp at 0331 8102001.";

        self::recordDeliveryLog($order, 'admin_order_canceled_link', 'whatsapp', $recipientPhone, 'sent');

        return 'https://wa.me/' . $recipientPhone . '?text=' . rawurlencode($text);
    }

    /**
     * Generate admin click-to-send WhatsApp link with Pro-Level B2B Welcome & Online Ordering Credentials.
     */
    public static function generateCustomerWelcomeCredentialsLink(CustomerUser $customer, string $tempPassword): ?string
    {
        if (!$customer->mobile) {
            return null;
        }

        $recipientPhone = PhoneNormalizer::normalizeWhatsApp($customer->mobile);
        if (!$recipientPhone) {
            return null;
        }

        $portalUrl = url('/customer/login');
        $customerName = $customer->business_name ?: $customer->name;

        $text = "*HARAMAIN TRADERS — B2B DIGITAL PORTAL*\n"
              . "═══════════════════════════════════════\n"
              . "*Assalam-o-Alaikum, {$customerName}*\n\n"
              . "We are pleased to inform you that your official B2B Online Ordering Account is now *ACTIVE*!\n\n"
              . "You can now directly browse our complete product catalogue, check real-time trade prices & active schemes, place orders online 24/7, and view your account ledgers anytime.\n\n"
              . "🔐 *YOUR LOGIN CREDENTIALS:*\n"
              . "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
              . "🌐 *Portal URL:* {$portalUrl}\n"
              . "👤 *Username:* {$customer->username}\n"
              . "📱 *Mobile (Alt Login):* {$customer->mobile}\n"
              . "🔑 *Temporary Password:* {$tempPassword}\n\n"
              . "📦 *START ORDERING NOW:*\n"
              . "1. Open the portal link above.\n"
              . "2. Sign in with your Username or Mobile and Password.\n"
              . "3. Update your password when prompted for security.\n"
              . "4. Select your required items and submit your order instantly!\n\n"
              . "For any assistance or special inquiries, our team is always at your service.\n\n"
              . "*Haramain Traders*\n"
              . "_Wholesale OTC & FMCG Distribution_\n"
              . "📞 Support / WhatsApp: 0331 8102001\n"
              . "═══════════════════════════════════════";

        return 'https://wa.me/' . $recipientPhone . '?text=' . rawurlencode($text);
    }

    /**
     * Generate admin click-to-send WhatsApp link for Password Reset.
     */
    public static function generateCustomerPasswordResetLink(CustomerUser $customer, string $newTempPassword): ?string
    {
        if (!$customer->mobile) {
            return null;
        }

        $recipientPhone = PhoneNormalizer::normalizeWhatsApp($customer->mobile);
        if (!$recipientPhone) {
            return null;
        }

        $portalUrl = url('/customer/login');
        $customerName = $customer->business_name ?: $customer->name;

        $text = "*HARAMAIN TRADERS — PASSWORD RESET*\n"
              . "═══════════════════════════════════════\n"
              . "*Assalam-o-Alaikum, {$customerName}*\n\n"
              . "Your password for the Haramain Traders B2B Portal has been reset by administration.\n\n"
              . "🔐 *NEW LOGIN CREDENTIALS:*\n"
              . "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
              . "🌐 *Portal URL:* {$portalUrl}\n"
              . "👤 *Username:* {$customer->username}\n"
              . "📱 *Mobile (Alt Login):* {$customer->mobile}\n"
              . "🔑 *New Temporary Password:* {$newTempPassword}\n\n"
              . "⚠️ *Note:* You will be asked to choose a new personal password upon signing in.\n\n"
              . "*Haramain Traders*\n"
              . "_Wholesale OTC & FMCG Distribution_\n"
              . "📞 Support / WhatsApp: 0331 8102001\n"
              . "═══════════════════════════════════════";

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

