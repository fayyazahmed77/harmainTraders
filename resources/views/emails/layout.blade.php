<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? config('app.name') }}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f7fa;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            width: 100% !important;
            height: 100% !important;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f4f7fa;
            padding-bottom: 40px;
        }
        .main {
            background-color: #ffffff;
            margin: 0 auto;
            width: 100%;
            max-width: 600px;
            border-spacing: 0;
            color: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            margin-top: 40px;
        }
        .header {
            background-color: #ffffff;
            padding: 40px 20px;
            text-align: center;
            border-top: 6px solid #F9A11B;
        }
        .header img {
            max-height: 80px;
            width: auto;
        }
        .header h1 {
            color: #111318;
            margin: 0;
            font-size: 26px;
            letter-spacing: 1px;
            font-weight: 700;
        }
        .content {
            padding: 40px 35px;
            line-height: 1.7;
            font-size: 16px;
            color: #374151;
        }
        .footer {
            background-color: #1A1A1A;
            padding: 45px 30px;
            text-align: center;
            font-size: 14px;
            color: #94A3B8;
        }
        .footer p {
            margin: 8px 0;
        }
        .footer .company-name {
            color: #F9A11B;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 15px;
        }
        .social-links {
            margin: 25px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 12px;
            text-decoration: none;
        }
        .social-links img {
            width: 24px;
            height: 24px;
            vertical-align: middle;
        }
        .divider {
            height: 1px;
            background-color: #2D3748;
            margin: 25px auto;
            width: 80%;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #F9A11B;
            color: #111318 !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            margin: 25px 0;
            text-transform: uppercase;
            font-size: 14px;
            letter-spacing: 0.5px;
        }
        .highlight {
            color: #F9A11B;
            font-weight: 600;
        }
        @media only screen and (max-width: 600px) {
            .main {
                width: 95% !important;
                margin-top: 20px !important;
            }
            .content {
                padding: 30px 20px !important;
            }
        }
    </style>
</head>
<body>
    @php
        $settings = \App\Models\SiteSetting::get();
    @endphp
    <div class="wrapper">
        <table class="main" align="center" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
                <td class="header">
                    @if($settings->logo_path)
                        <img src="{{ url($settings->logo_path) }}" alt="{{ $settings->company_name }}">
                    @else
                        <h1>{{ $settings->company_name ?? config('app.name') }}</h1>
                    @endif
                </td>
            </tr>
            <tr>
                <td class="content">
                    @yield('content')
                </td>
            </tr>
            <tr>
                <td class="footer">
                    <p class="company-name">{{ $settings->company_name ?? config('app.name') }}</p>
                    
                    @if($settings->address)
                        <p>{{ $settings->address }}</p>
                    @endif
                    
                    @if($settings->contact_phone || $settings->contact_email)
                        <p>
                            @if($settings->contact_phone) {{ $settings->contact_phone }} @endif
                            @if($settings->contact_phone && $settings->contact_email) | @endif
                            @if($settings->contact_email) {{ $settings->contact_email }} @endif
                        </p>
                    @endif
                    
                    <div class="social-links">
                        @if($settings->facebook_url)
                            <a href="{{ $settings->facebook_url }}">
                                <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" style="filter: invert(100%) brightness(150%) sepia(100%) saturate(500%) hue-rotate(0deg);">
                            </a>
                        @endif
                        @if($settings->twitter_url)
                            <a href="{{ $settings->twitter_url }}">
                                <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" style="filter: invert(100%) brightness(150%) sepia(100%) saturate(500%) hue-rotate(0deg);">
                            </a>
                        @endif
                        @if($settings->linkedin_url)
                            <a href="{{ $settings->linkedin_url }}">
                                <img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="LinkedIn" style="filter: invert(100%) brightness(150%) sepia(100%) saturate(500%) hue-rotate(0deg);">
                            </a>
                        @endif
                        @if($settings->instagram_url)
                            <a href="{{ $settings->instagram_url }}">
                                <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" style="filter: invert(100%) brightness(150%) sepia(100%) saturate(500%) hue-rotate(0deg);">
                            </a>
                        @endif
                    </div>
                    
                    <div class="divider"></div>
                    
                    <p style="font-size: 12px; opacity: 0.8;">&copy; {{ date('Y') }} {{ $settings->company_name ?? config('app.name') }}. All rights reserved.</p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
