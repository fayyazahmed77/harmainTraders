<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark'=> ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <script>
        (function() {
            const appearance = '{{ $appearance ?? "system" }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    <title inertia>{{ config('app.name', 'Haramain Traders') }}</title>

    <link rel="icon" href="/storage/img/favicon.png" type="image/png">
    <link rel="apple-touch-icon" href="/storage/img/favicon.png">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Barlow:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

    {{-- Dynamic broadcast config --}}
    @php
        try {
            $settings = \Illuminate\Support\Facades\Cache::remember('site_setting_singleton', 3600, function () {
                return \App\Models\SiteSetting::first();
            });
            $broadcastConfig = [
                'driver' => $settings->broadcast_driver ?? 'reverb',
                'pusher' => [
                    'key' => $settings->pusher_app_key ?? env('PUSHER_APP_KEY'),
                    'cluster' => $settings->pusher_app_cluster ?? env('PUSHER_APP_CLUSTER', 'mt1'),
                ],
                'reverb' => [
                    'key' => env('REVERB_APP_KEY', 'local'),
                    'host' => env('REVERB_HOST', '127.0.0.1'),
                    'port' => env('REVERB_PORT', 8080),
                    'scheme' => env('REVERB_SCHEME', 'http'),
                ]
            ];
        } catch (\Exception $e) {
            $broadcastConfig = [
                'driver' => 'reverb',
                'pusher' => [],
                'reverb' => []
            ];
        }
    @endphp
    <meta id="broadcast-config" data-config="{{ json_encode($broadcastConfig) }}">
    <script>
        (function() {
            var el = document.getElementById('broadcast-config');
            window.broadcastConfig = el ? JSON.parse(el.getAttribute('data-config') || '{}') : {};
        })();
    </script>

    @routes
    @php
        $useProdBuild = env('FORCE_VITE_BUILD', false) || request()->has('prod');
        if ($useProdBuild) {
            app(\Illuminate\Foundation\Vite::class)->useHotFile(storage_path('non-existent-hot-file'));
        }
    @endphp
    @unless($useProdBuild)
        @viteReactRefresh
    @endunless
    @vite(['resources/js/app.tsx'])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>