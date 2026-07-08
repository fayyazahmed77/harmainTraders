<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>{{ $subject ?? config('app.name') }}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        body, table, td, a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        table {
            border-collapse: collapse !important;
        }
        body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            font-family: 'Inter', Arial, Helvetica, sans-serif;
            background-color: #F5F7FA;
            color: #374151;
        }
        
        .email-wrapper {
            width: 100%;
            background-color: #F5F7FA;
            padding: 40px 0;
        }
        
        .email-content {
            max-width: 600px;
            margin: 0 auto;
            width: 100%;
        }
        
        .main-card {
            background-color: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 16px 0 !important;
            }
            .main-card {
                border-radius: 8px !important;
                border-left: 0 !important;
                border-right: 0 !important;
            }
            .content-padding {
                padding: 24px 16px !important;
            }
        }
    </style>
</head>
<body>
    @php
        $settings = \App\Models\SiteSetting::get();
    @endphp
    
    <div class="email-wrapper">
        <div class="email-content">
            <div class="main-card">
                <!-- Header -->
                @include('emails.partials.header')
                
                <!-- Content Body -->
                <div class="content-padding" style="padding: 40px;">
                    @yield('content')
                </div>
            </div>
            
            <!-- Footer -->
            @include('emails.partials.footer')
        </div>
    </div>
</body>
</html>
