<?php

namespace App\Services;

class PhoneNormalizer
{
    /**
     * Normalize a phone number to local 11-digit format: 03XXXXXXXXX
     */
    public static function normalizeLocal(?string $phone): ?string
    {
        if (!$phone) {
            return null;
        }

        // Keep digits only
        $digits = preg_replace('/\D+/', '', $phone);

        if (empty($digits)) {
            return null;
        }

        // If starts with 923 and is 12 digits, convert to 03...
        if (str_starts_with($digits, '92') && strlen($digits) === 12) {
            return '0' . substr($digits, 2);
        }

        // If starts with 00923 and is 14 digits, convert to 03...
        if (str_starts_with($digits, '0092') && strlen($digits) === 14) {
            return '0' . substr($digits, 4);
        }

        // If starts with 3 and is 10 digits, add leading 0
        if (str_starts_with($digits, '3') && strlen($digits) === 10) {
            return '0' . $digits;
        }

        return $digits;
    }

    /**
     * Normalize a phone number to international WhatsApp format: 923XXXXXXXXX (no + or leading 00)
     */
    public static function normalizeWhatsApp(?string $phone): ?string
    {
        if (!$phone) {
            return null;
        }

        $local = self::normalizeLocal($phone);
        if (!$local) {
            return null;
        }

        if (str_starts_with($local, '03') && strlen($local) === 11) {
            return '92' . substr($local, 1);
        }

        return preg_replace('/\D+/', '', $phone);
    }
}

