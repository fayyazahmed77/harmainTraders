<?php

if (!function_exists('format_rate')) {
    /**
     * Format a rate/monetary value preserving meaningful decimals without unnecessary trailing zeros.
     * Examples:
     *  31.00   => "31"
     *  31.50   => "31.5"
     *  31.75   => "31.75"
     *  6.850   => "6.85"
     *  176.125 => "176.125"
     *
     * @param mixed $value
     * @param int $maxDecimals
     * @return string
     */
    function format_rate($value, int $maxDecimals = 3): string
    {
        if ($value === null || $value === '') {
            return '0';
        }

        $floatVal = (float)$value;
        $formatted = number_format($floatVal, $maxDecimals, '.', ',');
        if (strpos($formatted, '.') !== false) {
            $formatted = rtrim(rtrim($formatted, '0'), '.');
        }
        return $formatted;
    }
}

if (!function_exists('format_qty')) {
    /**
     * Format quantities cleanly (e.g. 5.00 -> 5, 5.50 -> 5.5)
     *
     * @param mixed $value
     * @return string
     */
    function format_qty($value): string
    {
        if ($value === null || $value === '') {
            return '0';
        }
        $floatVal = (float)$value;
        if (floor($floatVal) == $floatVal) {
            return (string)(int)$floatVal;
        }
        return rtrim(rtrim(number_format($floatVal, 2, '.', ','), '0'), '.');
    }
}

