@php
$logo_path = public_path('storage/img/favicon.png');
if (!file_exists($logo_path)) {
    $logo_path = storage_path('app/public/img/favicon.png');
}

$logo_base64 = "";
if (file_exists($logo_path)) {
    $logo_data = file_get_contents($logo_path);
    $logo_type = pathinfo($logo_path, PATHINFO_EXTENSION);
    $logo_base64 = 'data:image/' . $logo_type . ';base64,' . base64_encode($logo_data);
}

function f($num) {
    return number_format($num, 2);
}
function n($num) {
    return number_format($num);
}
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Return Report - Harmain Traders</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #0f172a;
            margin: 0;
            padding: 0;
            line-height: 1.4;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        .uppercase { text-transform: uppercase; }
        
        .text-rose { color: #e11d48; }
        .text-emerald { color: #059669; }
        .text-slate-500 { color: #64748b; }

        .header {
            padding-bottom: 15px;
            border-bottom: 2px solid #f1f5f9;
            margin-bottom: 15px;
        }
        .brand-name {
            font-size: 18px;
            font-weight: 900;
        }
        .report-title {
            font-size: 12px;
            font-weight: 900;
            color: #e11d48;
            margin-top: 5px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th {
            background-color: #f8fafc;
            color: #475569;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 8px;
            padding: 8px 5px;
            border-bottom: 1px solid #e2e8f0;
            text-align: left;
        }
        td {
            padding: 6px 5px;
            border-bottom: 1px solid #f1f5f9;
        }
        .footer {
            position: fixed;
            bottom: 20px;
            width: 100%;
            font-size: 7px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 5px;
        }
        @page {
            margin: 1cm;
        }
    </style>
</head>
<body>
    <div class="header">
        <table style="border: none; margin: 0; width: 100%;">
            <tr>
                <td style="border: none; width: 50px; vertical-align: top;">
                    @if($logo_base64)
                        <img src="{{ $logo_base64 }}" width="45" height="45">
                    @endif
                </td>
                <td style="border: none; vertical-align: top;">
                    <div class="brand-name" style="margin-top: 0;">Harmain <span style="color:#F69A2C">Traders</span></div>
                    <div class="report-title">{{ strtoupper(str_replace('_', ' ', $type)) }} ANALYSIS</div>
                </td>
                <td style="border: none; text-align: right; vertical-align: top;">
                    <div style="font-size: 8px; color: #64748b; font-weight: 900; letter-spacing: 1px;">REPORTING PERIOD</div>
                    <div style="font-size: 10px; font-weight: 900; color: #1e293b;">
                        {{ date('d M Y', strtotime($params['fromDate'])) }} 
                        <span style="color: #cbd5e1; margin: 0 4px;">—</span> 
                        {{ date('d M Y', strtotime($params['toDate'])) }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    @yield('content')

    <div class="footer">
        <table style="border: none; margin: 0;">
            <tr>
                <td style="border: none;">PRINTED ON: {{ date('l, F d, Y g:i A') }}</td>
                <td style="border: none;" class="text-center">CONFIDENTIAL BUSINESS SUMMARY</td>
                <td style="border: none;" class="text-right">HARMAIN PLATFORM</td>
            </tr>
        </table>
    </div>
</body>
</html>
