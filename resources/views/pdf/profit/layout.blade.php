@php
$logo_options = [

    public_path('storage/img/favicon.png')
];

$logo_path = null;
foreach ($logo_options as $path) {
    if (file_exists($path)) {
        $logo_path = $path;
        break;
    }
}

$logo_base64 = "";
if ($logo_path) {
    $logo_data = file_get_contents($logo_path);
    $logo_type = pathinfo($logo_path, PATHINFO_EXTENSION);
    $logo_base64 = 'data:image/' . $logo_type . ';base64,' . base64_encode($logo_data);
}
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>@yield('title', 'Profit Analysis Report')</title>
    <style>
        @page {
            margin: 20px 30px;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #1e293b;
            margin: 0;
            padding: 0;
            line-height: 1.4;
        }
        .header {
            padding-bottom: 15px;
            margin-bottom: 15px;
            border-bottom: 1px solid #000;
            text-align: center;
        }
        .logo-container {
            margin-bottom: 15px;
        }
        .logo-img {
            height: 50px;
            display: inline-block;
            vertical-align: middle;
            margin-right: 12px;
        }
        .brand-text {
            display: inline-block;
            vertical-align: middle;
            text-align: left;
        }
        .company-name {
            font-size: 26px;
            font-weight: 900;
            color: #373536;
            text-transform: uppercase;
            margin: 0;
            line-height: 1;
        }
        .company-name span {
            color: #000;
        }
        .tagline {
            font-size: 11px;
            font-weight: 700;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 5px;
        }
        .report-header-info {
            margin-top: 15px;
        }
        .report-title {
            font-size: 14px;
            font-weight: 900;
            color: #1e293b;
            letter-spacing: -0.5px;
            margin: 0;
        }
        .report-dimension {
            font-size: 10px;
            font-weight: 800;
            color: #000;
            text-transform: uppercase;
            margin-top: 4px;
            letter-spacing: 1px;
        }
        .criteria-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px;
            margin-bottom: 20px;
            border-radius: 2px;
        }
        .criteria-table {
            width: 100%;
            border-collapse: collapse;
        }
        .criteria-label {
            font-size: 8px;
            font-weight: 800;
            color: #94a3b8;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .criteria-value {
            font-size: 10px;
            font-weight: 700;
            color: #1e293b;
        }
        .pill {
            display: inline-block;
            padding: 2px 8px;
            background: #e2e8f0;
            color: #475569;
            font-size: 8px;
            font-weight: 800;
            border-radius: 2px;
            text-transform: uppercase;
        }
        .stats-grid {
            width: 100%;
            margin-bottom: 20px;
        }
        .stat-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            padding: 10px 15px;
            width: 23%;
            border-radius: 2px;
        }
        .stat-label {
            font-size: 8px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .stat-value {
            font-size: 15px;
            font-weight: 900;
            color: #1e293b;
            letter-spacing: -0.5px;
        }
        .stat-revenue { color: #2563eb; }
        .stat-profit { color: #059669; }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            border: 1px solid #000;
            table-layout: fixed;
        }
        .data-table th {
            background-color: #f2f2f2;
            color: #000;
            font-size: 7.5px;
            font-weight: 900;
            text-transform: uppercase;
            padding: 3px 2px;
            border: 1px solid #000;
            text-align: center;
            white-space: nowrap;
        }
        .data-table td {
            padding: 3px 4px;
            border: 1px solid #000;
            vertical-align: middle;
            font-size: 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-black { font-weight: 900; }
        .font-bold { font-weight: 700; }
        .text-indigo { color: #000; }
        .text-emerald { color: #000; }
        .text-rose { color: #000; }
        .text-muted { color: #000; }
        .footer {
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
            font-size: 8px;
            color: #000;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .total-row {
            background-color: #f2f2f2;
        }
        .total-row td {
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            font-weight: 900;
            font-size: 10px;
            padding: 4px 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-container">
            @if($logo_base64)
                <img src="{{ $logo_base64 }}" class="logo-img">
            @endif
            <div class="brand-text">
                <h1 class="company-name">HARMAIN <span>TRADERS</span></h1>
                <p class="tagline">WHOLESALE <span class="text-indigo">&</span> SUPPLY CHAIN</p>
            </div>
        </div>
        <div class="report-header-info">
            <h2 class="report-title">Profit & Loss {{ str_replace('_', ' ', $type) }} Wise </h2>
           
        </div>
    </div>



    <table class="data-table">
        @yield('content')
    </table>

    <div class="footer">
        <p>Verified Financial Statement - Confidential & Proprietary - Harmain Traders Reporting Engine</p>
        <p>Level 4 Security Validation: Success - End of Report</p>
    </div>
</body>
</html>
