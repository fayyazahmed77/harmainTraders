<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class ActivityLogger
{
    /**
     * Log a system activity.
     */
    public static function log(string $action, string $module, string $description = null, array $oldValues = null, array $newValues = null): void
    {
        $ip = Request::ip();
        $location = self::getGeolocation($ip);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'module' => $module,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $ip,
            'user_agent' => Request::userAgent(),
            'location' => $location,
        ]);
    }

    /**
     * Get geolocation from IP address.
     */
    private static function getGeolocation(string $ip): ?string
    {
        if ($ip === '127.0.0.1' || $ip === '::1') {
            return 'Localhost';
        }

        return Cache::remember('geo_ip_' . $ip, 86400, function () use ($ip) {
            try {
                $response = Http::timeout(5)->get("http://ip-api.com/json/{$ip}");
                
                if ($response->successful()) {
                    $data = $response->json();
                    if ($data['status'] === 'success') {
                        return "{$data['city']}, {$data['regionName']}, {$data['country']}";
                    }
                }
            } catch (\Exception $e) {
                // Silently fail if API is down
            }
            return 'Unknown';
        });
    }
}
