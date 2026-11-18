<?php

namespace App\Services;

use App\Models\Account;
use App\Models\CustomerUser;
use App\Services\PhoneNormalizer;
use App\Services\WhatsAppNotificationService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CustomerAccessProvisioningService
{
    /**
     * Generate a unique, clean, human-readable username from customer account title.
     * e.g., "FAHEEM ( CUSTOMER ) 2 FLOOR" -> "faheem" (or "faheem_000002" if collision)
     */
    public static function generateUniqueUsername(string $title, ?string $code = null): string
    {
        // 1. Strip parenthetical ERP tags like (CUSTOMER), (DEALER), (2 FLOOR), etc.
        $clean = preg_replace('/\([^)]*\)/', '', $title);

        // 2. Remove non-alphanumeric except spaces
        $clean = preg_replace('/[^a-zA-Z0-9\s]/', '', $clean);

        // 3. Convert to lowercase slug with single underscore or no spaces
        $words = preg_split('/\s+/', strtolower(trim($clean)));
        $slug = implode('_', array_filter($words));

        // Fallback if title was all symbols or empty
        if (empty($slug) || strlen($slug) < 2) {
            $slug = 'customer';
        }

        // Truncate base to 20 chars
        $base = substr($slug, 0, 20);

        // 4. Check uniqueness
        if (!CustomerUser::where('username', $base)->exists()) {
            return $base;
        }

        // Try with account code if available (e.g. faheem_000002)
        if ($code) {
            $withCode = substr($base, 0, 14) . '_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $code));
            if (!CustomerUser::where('username', $withCode)->exists()) {
                return $withCode;
            }
        }

        // Incremental numeric suffix
        $counter = 2;
        while (CustomerUser::where('username', "{$base}_{$counter}")->exists()) {
            $counter++;
        }

        return "{$base}_{$counter}";
    }

    /**
     * Provision or Re-enable online access for a single ERP Customer Account.
     *
     * @param Account $account
     * @param string|null $overrideMobile If account has no mobile, admin can supply one
     * @param int|null $adminId
     * @return array
     */
    public static function provisionSingle(Account $account, ?string $overrideMobile = null, ?int $adminId = null): array
    {
        $rawPhone = trim($overrideMobile ?: ($account->mobile ?: ''));
        $normalizedMobile = PhoneNormalizer::normalizeLocal($rawPhone);

        if (!$normalizedMobile || strlen($normalizedMobile) < 10) {
            return [
                'success' => false,
                'error' => "Account [{$account->code}] '{$account->title}' does not have a valid mobile number.",
                'account_id' => $account->id,
            ];
        }

        // Persist the mobile number to the ERP account if it was missing or overridden by admin
        if (empty(trim($account->mobile ?? '')) || ($overrideMobile && trim($overrideMobile) !== '')) {
            $account->mobile = $normalizedMobile;
            $account->save();
        }

        // 1. Check if this ERP account already has an online user
        $existingLinked = CustomerUser::where('account_id', $account->id)->first();
        if ($existingLinked) {
            $wasInactive = !$existingLinked->isActive();
            $existingLinked->is_active = true;
            $existingLinked->approval_status = 'approved';
            $existingLinked->approved_by = $adminId ?: $existingLinked->approved_by;
            $existingLinked->approved_at = $existingLinked->approved_at ?: now();
            $existingLinked->save();

            return [
                'success' => true,
                'already_existed' => true,
                'reactivated' => $wasInactive,
                'customer' => $existingLinked,
                'message' => "Account is already linked to online user '{$existingLinked->username}'." . ($wasInactive ? " Online access has been re-enabled." : ""),
            ];
        }

        // 2. Check if a CustomerUser already exists with this mobile number
        $mobileCollision = CustomerUser::where('mobile', $normalizedMobile)->first();
        if ($mobileCollision) {
            if ($mobileCollision->account_id && $mobileCollision->account_id !== $account->id) {
                return [
                    'success' => false,
                    'error' => "Mobile number {$normalizedMobile} is already assigned to another ERP Account (#{$mobileCollision->account_id}).",
                    'account_id' => $account->id,
                ];
            }

            // Reconcile: User had self-registered online without account_id, now linking!
            $mobileCollision->account_id = $account->id;
            $mobileCollision->approval_status = 'approved';
            $mobileCollision->is_active = true;
            $mobileCollision->approved_by = $adminId ?: $mobileCollision->approved_by;
            $mobileCollision->approved_at = $mobileCollision->approved_at ?: now();
            $mobileCollision->save();

            return [
                'success' => true,
                'reconciled' => true,
                'customer' => $mobileCollision,
                'message' => "Existing online registration for {$normalizedMobile} reconciled and linked to ERP Account [{$account->code}].",
            ];
        }

        // 3. Brand New Provisioning: Generate Username & Temp Password
        $username = self::generateUniqueUsername($account->title, $account->code);
        $tempPassword = Str::password(10, letters: true, numbers: true, symbols: false);

        $customer = CustomerUser::create([
            'account_id'           => $account->id,
            'name'                 => $account->title,
            'username'             => $username,
            'mobile'               => $normalizedMobile,
            'email'                => $account->email ? strtolower(trim($account->email)) : null,
            'password'             => $tempPassword, // Automatically hashed via cast
            'is_active'            => true,
            'must_change_password' => true,
            'registered_via'       => 'erp_linked',
            'approval_status'      => 'approved',
            'approved_by'          => $adminId,
            'approved_at'          => now(),
            'business_name'        => $account->title,
            'address'              => $account->address1,
        ]);

        $whatsappLink = WhatsAppNotificationService::generateCustomerWelcomeCredentialsLink($customer, $tempPassword);

        return [
            'success'       => true,
            'created'       => true,
            'customer'      => $customer,
            'username'      => $username,
            'mobile'        => $normalizedMobile,
            'temp_password' => $tempPassword,
            'whatsapp_link' => $whatsappLink,
            'message'       => "Online credentials generated successfully for [{$account->code}] '{$account->title}'.",
        ];
    }

    /**
     * Bulk Provision or Re-enable online access for multiple ERP Accounts.
     *
     * @param array $accountIds
     * @param int|null $adminId
     * @param array $customMobiles Keyed by account_id => mobile string
     * @return array
     */
    public static function provisionBulk(array $accountIds, ?int $adminId = null, array $customMobiles = []): array
    {
        $accounts = Account::whereIn('id', $accountIds)->get();

        $summary = [
            'total'       => $accounts->count(),
            'created'     => 0,
            'reactivated' => 0,
            'reconciled'  => 0,
            'skipped'     => 0,
        ];

        $credentials = [];
        $skippedDetails = [];

        DB::beginTransaction();
        try {
            foreach ($accounts as $acc) {
                $overrideMobile = $customMobiles[$acc->id] ?? ($customMobiles[(string) $acc->id] ?? null);
                $res = self::provisionSingle($acc, $overrideMobile, $adminId);

                if (!$res['success']) {
                    $summary['skipped']++;
                    $skippedDetails[] = [
                        'account_id'    => $acc->id,
                        'account_code'  => $acc->code,
                        'customer_name' => $acc->title,
                        'reason'        => $res['error'],
                    ];
                    continue;
                }

                if (!empty($res['created'])) {
                    $summary['created']++;
                    $credentials[] = [
                        'account_id'    => $acc->id,
                        'account_code'  => $acc->code,
                        'customer_name' => $acc->title,
                        'username'      => $res['username'],
                        'mobile'        => $res['mobile'],
                        'temp_password' => $res['temp_password'],
                        'whatsapp_link' => $res['whatsapp_link'],
                    ];
                } elseif (!empty($res['reactivated'])) {
                    $summary['reactivated']++;
                } elseif (!empty($res['reconciled'])) {
                    $summary['reconciled']++;
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Bulk customer provisioning failed: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            throw $e;
        }

        return [
            'summary'         => $summary,
            'credentials'     => $credentials,
            'skipped_details' => $skippedDetails,
        ];
    }

    /**
     * Enable or Disable portal access for a CustomerUser.
     */
    public static function toggleAccess(CustomerUser $customer, bool $enable): bool
    {
        $customer->is_active = $enable;

        if (!$enable) {
            // Revoke remember token to invalidate persistent sessions
            $customer->remember_token = null;
        }

        return $customer->save();
    }

    /**
     * Regenerate temporary password and prepare WhatsApp message for an existing customer.
     */
    public static function resetPassword(CustomerUser $customer): array
    {
        $newTempPassword = Str::password(10, letters: true, numbers: true, symbols: false);

        $customer->password = $newTempPassword;
        $customer->must_change_password = true;
        $customer->is_active = true;
        $customer->remember_token = null;
        $customer->save();

        $whatsappLink = WhatsAppNotificationService::generateCustomerPasswordResetLink($customer, $newTempPassword);

        return [
            'success'       => true,
            'customer'      => $customer,
            'username'      => $customer->username,
            'mobile'        => $customer->mobile,
            'temp_password' => $newTempPassword,
            'whatsapp_link' => $whatsappLink,
        ];
    }
}
