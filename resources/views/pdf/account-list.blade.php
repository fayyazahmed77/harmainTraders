@php
$logo_path = storage_path('app/public/img/favicon.png');
if (!file_exists($logo_path)) {
    $logo_path = public_path('storage/img/favicon.png');
}

$logo_base64 = "";
if (file_exists($logo_path)) {
    $logo_data = file_get_contents($logo_path);
    $logo_type = pathinfo($logo_path, PATHINFO_EXTENSION);
    $logo_base64 = 'data:image/' . $logo_type . ';base64,' . base64_encode($logo_data);
}
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Accounts List</title>
    <style>
        * { box-sizing: border-box; }
        @page {
            margin: 0.8cm;
            size: portrait;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px;
            color: #000;
            margin: 0;
            padding: 0;
            background: #fff;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        
        .header {
            text-align: center;
            margin-bottom: 12px;
        }
        .logo-section {
            display: inline-block;
            margin-bottom: 6px;
        }
        .logo-icon {
            display: inline-block;
            vertical-align: middle;
            margin-right: 8px;
        }
        .brand-text {
            display: inline-block;
            vertical-align: middle;
            text-align: left;
        }
        .brand-name {
            font-size: 19px;
            font-weight: bold;
            color: #222;
            line-height: 1;
        }
        .brand-name span {
            color: #ea580c;
        }
        .brand-tagline {
            font-size: 9px;
            color: #666;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-top: 2px;
        }
        .report-title-box {
            margin-top: 8px;
            border-top: 1px solid #ddd;
            padding-top: 6px;
        }
        .report-title {
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #111;
        }
        
        .criteria-row {
            margin-bottom: 10px;
            font-size: 10.5px;
            padding-bottom: 4px;
            border-bottom: 1px solid #000;
        }
        .criteria-label {
            font-weight: bold;
            text-transform: uppercase;
        }
        
        table.accounts-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        table.accounts-table thead {
            display: table-header-group;
        }
        table.accounts-table tr {
            page-break-inside: avoid;
        }
        table.accounts-table th {
            background-color: #f3f4f6;
            border: 1px solid #000;
            padding: 5px 6px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
        }
        table.accounts-table td {
            border: 1px solid #d1d5db;
            padding: 4px 6px;
            font-size: 10px;
        }
        table.accounts-table tbody tr:nth-child(even) {
            background-color: #fafafa;
        }
        
        .summary-box {
            text-align: right;
            margin-top: 10px;
            margin-bottom: 25px;
            padding-right: 5px;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        
        .signature-section {
            margin-top: 35px;
            width: 100%;
            page-break-inside: avoid;
        }
        .signature-table {
            width: 100%;
            border-collapse: collapse;
        }
        .signature-table td {
            border: none;
            text-align: center;
            font-size: 10px;
            color: #333;
            padding: 0 20px;
        }
        .sig-line {
            width: 160px;
            margin: 0 auto 5px auto;
            border-top: 1px solid #000;
        }
        
        .footer {
            margin-top: 25px;
            padding-top: 8px;
            border-top: 1px solid #000;
            width: 100%;
            font-size: 9px;
            page-break-inside: avoid;
        }
        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }
        .footer-table td {
            border: none;
            padding: 2px 0;
            font-size: 9px;
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            @if($logo_base64)
                <div class="logo-icon">
                    <img src="{{ $logo_base64 }}" width="32" height="32" alt="Logo">
                </div>
            @endif
            <div class="brand-text">
                <div class="brand-name">Haramain <span>Traders</span></div>
                <div class="brand-tagline">Wholesale & Supply Chain</div>
            </div>
        </div>
        <div class="report-title-box">
            <div class="report-title">ACCOUNTS LIST</div>
        </div>
    </div>

    <div class="criteria-row">
        <span class="criteria-label">CRITERIA:</span> {{ $criteria }}
    </div>

    <table class="accounts-table">
        <thead>
            <tr>
                <th width="10%">Code</th>
                <th width="35%" class="text-left">Title</th>
                <th width="28%" class="text-left">Address</th>
                <th width="14%">Tel #</th>
                <th width="13%">Typed</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data as $account)
            <tr>
                <td class="text-center font-bold">{{ $account->code }}</td>
                <td class="text-left font-bold">{{ strtoupper($account->title) }}</td>
                <td class="text-left">{{ $account->area ? strtoupper($account->area->name) : ($account->address1 ? strtoupper($account->address1) : '-') }}</td>
                <td class="text-center">{{ $account->telephone1 ?: ($account->mobile ?: '-') }}</td>
                <td class="text-center">{{ strtoupper($account->accountType->name ?? ($account->type ?? '-')) }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="5" class="text-center" style="padding: 20px; font-weight: bold;">NO ACCOUNTS FOUND</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="summary-box">
        TOTAL ACCOUNTS LISTED: {{ count($data) }}
    </div>

    <div class="signature-section">
        <table class="signature-table">
            <tr>
                <td width="50%">
                    <div class="sig-line"></div>
                    <div>Generated By {{ auth()->user() ? strtoupper(auth()->user()->name) : 'ADMIN' }}</div>
                </td>
                <td width="50%">
                    <div class="sig-line"></div>
                    <div>Authorized signature</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <table class="footer-table">
            <tr>
                <td width="33%" class="font-bold">{{ date('l F d Y h:i A') }}</td>
                <td width="34%" class="text-center font-bold">Page 1 of 1</td>
                <td width="33%" class="text-right font-bold"><span style="font-weight: normal;">Printed By :</span> {{ auth()->user() ? strtoupper(auth()->user()->name) : 'ADMIN' }}</td>
            </tr>
            <tr>
                <td colspan="3" class="text-center" style="padding-top: 6px; font-size: 9px; color: #555;">
                    Software Designed By Aishtycoons : 0300-2086828
                </td>
            </tr>
        </table>
    </div>

    @if(isset($is_print_mode) && $is_print_mode)
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
    @endif
</body>
</html>
