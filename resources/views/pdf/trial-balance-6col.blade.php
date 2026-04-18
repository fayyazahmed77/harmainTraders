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
    <title>{{ $report_title ?? 'TRIAL BALANCE 6 COLUMN' }}</title>
    <style>
        @page {
            margin: 0.5cm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #1a1a1a;
            line-height: 1.2;
        }
        .header {
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e2e8f0;
        }
        .logo-container {
            margin-bottom: 15px;
        }
        .logo-icon {
            display: inline-block;
            vertical-align: middle;
            margin-right: 15px;
        }
        .logo-text {
            display: inline-block;
            vertical-align: middle;
            text-align: left;
        }
        .brand-name {
            font-size: 28px;
            font-weight: bold;
            margin: 0;
            padding: 0;
            line-height: 1;
        }
        .brand-traders {
            color: #f97316;
        }
        .brand-tagline {
            font-size: 13px;
            color: #475569;
            margin-top: 5px;
            letter-spacing: 0.5px;
        }
        .tagline-amp {
            color: #f97316;
            font-weight: bold;
        }
        .report-info {
            margin-top: 10px;
        }
        .report-title {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .date-range {
            font-size: 12px;
            color: #64748b;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th {
            background-color: #f2f2f2;
            border: 1px solid #000;
            padding: 5px;
            text-align: center;
            text-transform: uppercase;
            font-weight: bold;
            font-size: 9px;
        }
        td {
            border: 1px solid #000;
            padding: 4px 6px;
            font-size: 9px;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .bg-grey { background-color: #f9f9f9; }
        
        .footer {
            margin-top: 20px;
            font-size: 10px;
            text-align: right;
            font-style: italic;
        }
        .totals-row td {
            background-color: #eeeeee;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header text-center">
        <div class="logo-container">
            @if($logo_base64)
            <div class="logo-icon">
                <img src="{{ $logo_base64 }}" style="height: 55px;">
            </div>
            @endif
            <div class="logo-text">
                <div class="brand-name">
                    <span>Harmain</span> <span class="brand-traders">Traders</span>
                </div>
                <div class="brand-tagline">
                    Wholesale <span class="tagline-amp">&</span> Supply Chain
                </div>
            </div>
        </div>
        
        <div class="report-info">
            <div class="report-title">{{ $report_title ?? 'TRIAL BALANCE 6 COLUMN' }}</div>
            <div class="date-range">
                Period: {{ \Carbon\Carbon::parse($from_date)->format('d-M-Y') }} To {{ \Carbon\Carbon::parse($to_date)->format('d-M-Y') }}
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th rowspan="2">Code</th>
                <th rowspan="2">Account Name</th>
                <th rowspan="2">Type</th>
                <th colspan="2">Opening Balance</th>
                <th colspan="2">Term Transactions</th>
                <th colspan="2">Closing Balance</th>
            </tr>
            <tr>
                <th>Debit</th>
                <th>Credit</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Debit</th>
                <th>Credit</th>
            </tr>
        </thead>
        <tbody>
            @php
                $totals = [
                    'opening_dr' => 0, 'opening_cr' => 0,
                    'period_dr' => 0, 'period_cr' => 0,
                    'closing_dr' => 0, 'closing_cr' => 0
                ];
            @endphp
            @foreach($data as $row)
                @php
                    $totals['opening_dr'] += $row['opening_dr'];
                    $totals['opening_cr'] += $row['opening_cr'];
                    $totals['period_dr'] += $row['period_dr'];
                    $totals['period_cr'] += $row['period_cr'];
                    $totals['closing_dr'] += $row['closing_dr'];
                    $totals['closing_cr'] += $row['closing_cr'];
                @endphp
                <tr>
                    <td class="text-center">{{ $row['code'] }}</td>
                    <td class="font-bold whitespace-nowrap">{{ $row['title'] }}</td>
                    <td class="text-center">{{ $row['type_name'] }}</td>
                    <td class="text-right">{{ $row['opening_dr'] > 0 ? number_format($row['opening_dr'], 2) : '-' }}</td>
                    <td class="text-right">{{ $row['opening_cr'] > 0 ? number_format($row['opening_cr'], 2) : '-' }}</td>
                    <td class="text-right bg-grey">{{ $row['period_dr'] > 0 ? number_format($row['period_dr'], 2) : '-' }}</td>
                    <td class="text-right bg-grey">{{ $row['period_cr'] > 0 ? number_format($row['period_cr'], 2) : '-' }}</td>
                    <td class="text-right">{{ $row['closing_dr'] > 0 ? number_format($row['closing_dr'], 2) : '-' }}</td>
                    <td class="text-right">{{ $row['closing_cr'] > 0 ? number_format($row['closing_cr'], 2) : '-' }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="totals-row">
                <td colspan="3" class="text-right">TOTALS</td>
                <td class="text-right">{{ number_format($totals['opening_dr'], 2) }}</td>
                <td class="text-right">{{ number_format($totals['opening_cr'], 2) }}</td>
                <td class="text-right">{{ number_format($totals['period_dr'], 2) }}</td>
                <td class="text-right">{{ number_format($totals['period_cr'], 2) }}</td>
                <td class="text-right">{{ number_format($totals['closing_dr'], 2) }}</td>
                <td class="text-right">{{ number_format($totals['closing_cr'], 2) }}</td>
            </tr>
        </tfoot>
    </table>

    <div class="footer">
        Printed on: {{ date('d-M-Y H:i A') }} | Page 1
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
