<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class ServerTimeController extends Controller
{
    /**
     * Get the current server time and timezone.
     */
    public function __invoke()
    {
        return response()->json([
            'server_time' => now()->toIso8601String(),
            'timezone'    => config('app.timezone'),
        ]);
    }
}
