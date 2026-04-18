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

// Firm Logo Base64
$firm_logo_base64 = "";
if (isset($firm) && $firm->logo) {
    $f_path = storage_path('app/public/' . $firm->logo);
    if (file_exists($f_path)) {
        $f_data = file_get_contents($f_path);
        $f_type = pathinfo($f_path, PATHINFO_EXTENSION);
        $firm_logo_base64 = 'data:image/' . $f_type . ';base64,' . base64_encode($f_data);
    }
}

// Group data by type in the view to match frontend logic
$groupedData = [];
foreach($data as $row) {
    $type = $row['account_type'] ?? 'Uncategorized';
    if (!isset($groupedData[$type])) {
        $groupedData[$type] = [];
    }
    $groupedData[$type][] = $row;
}

// Calculate Grand Totals
$grandTotal = [
    'total' => 0,
    'days_01_30' => 0,
    'days_31_60' => 0,
    'days_61_90' => 0,
    'days_91_120' => 0,
    'days_121_150' => 0,
    'days_151_180_plus' => 0,
    'trial_balance' => 0
];

foreach($groupedData as $type => $accounts) {
    foreach($accounts as $acc) {
        $grandTotal['total'] += $acc['total'];
        $grandTotal['days_01_30'] += $acc['days_01_30'];
        $grandTotal['days_31_60'] += $acc['days_31_60'];
        $grandTotal['days_61_90'] += $acc['days_61_90'];
        $grandTotal['days_91_120'] += $acc['days_91_120'];
        $grandTotal['days_121_150'] += $acc['days_121_150'];
        $grandTotal['days_151_180_plus'] += $acc['days_151_180_plus'];
        $grandTotal['trial_balance'] += $acc['trial_balance'];
    }
}
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Accounts Aging Report</title>
    <style>
        * { box-sizing: border-box; }
        @page { margin: 0.5cm; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #000;
            font-size: 9px;
            margin: 0;
            padding: 0;
        }
        .content-padding { padding: 0 10px; }
        .clearfix::after { content: ""; clear: both; display: table; }
        
        /* Branding Section */
        .top-section { padding-bottom: 5px; }
        .logo-icon {
            display: inline-block;
            vertical-align: middle;
            width: 35px;
            height: 35px;
            margin-right: 15px;
        }
        .brand-text { display: inline-block; vertical-align: middle; }
        .brand-name { font-size: 16px; font-weight: bold; color: #444; line-height: 1; }
        .brand-tagline { font-size: 8px; color: #888; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
        .header-contact { float: right; text-align: right; font-size: 10px; padding-top: 5px; }

        /* Banner */
        .banner-row { width: 100%; margin: 10px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; }
        .report-title { font-size: 16px; font-weight: bold; text-align: center; text-transform: uppercase; color: #444; }

        /* Info Section */
        .info-section { margin-bottom: 10px; font-size: 10px; }
        .info-table { width: 100%; }
        
        /* Table Styles */
        .items-table { width: 100%; border-collapse: collapse; border: 1px solid #000; }
        .items-table th {
            background-color: #f1f5f9;
            border: 1px solid #000;
            padding: 4px 2px;
            font-weight: bold;
            text-align: center;
        }
        .items-table td {
            border: 1px solid #000;
            padding: 3px 4px;
            text-align: right;
        }
        .items-table .text-left { text-align: left; }
        .items-table .type-header { background-color: #f8fafc; font-weight: bold; text-transform: uppercase; }
        .items-table .type-footer { background-color: #f1f5f9; font-weight: bold; }
        .items-table .grand-total { background-color: #1e293b; color: #fff; font-weight: bold; }

        .footer-signatures { margin-top: 30px; }
        .sig-box { width: 200px; border-top: 1px solid #000; text-align: center; padding-top: 5px; font-weight: bold; }

        /* Watermark */
        .watermark-container {
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            opacity: 0.05; z-index: -1000; width: 60%; text-align: center;
        }
    </style>
    @if($is_print_mode ?? false)
    <script>window.onload = function() { window.print(); }</script>
    @endif
</head>
<body>
    @if($firm && $firm->name == 'Harmain Traders')
    <div class="watermark-container"><img src="{{ $logo_base64 }}" width="400"></div>
    @endif

    <div class="top-section content-padding clearfix">
        <div style="float: left; width: 60%;">
            @if($firm && $firm->name == 'Harmain Traders')
            <div class="logo-section">
                <div class="logo-icon"><img src="{{ $logo_base64 }}" width="35" height="35"></div>
                <div class="brand-text">
                    <div class="brand-name">Harmain <span style="color:#000">Traders</span></div>
                    <div class="brand-tagline">Wholesale <span style="color:#000">&</span> Supply Chain</div>
                </div>
            </div>
            @else
            <div class="logo-section">
                @if($firm_logo_base64)
                    <div class="logo-icon"><img src="{{ $firm_logo_base64 }}" style="max-height: 35px; width: auto;"></div>
                @endif
                <div class="brand-text">
                    <div class="brand-name">{{ $firm->name ?? 'Harmain Traders' }}</div>
                    <div class="brand-tagline">{{ $firm->business ?? 'Wholesale & Supply Chain' }}</div>
                </div>
            </div>
            @endif
        </div>
        <div class="header-contact">
            <div>Contact: {{ $firm->phone ?? '0332-3228684' }}</div>
            <div>Generated: {{ date('d-M-Y h:i A') }}</div>
        </div>
    </div>

    <div class="banner-row"><div class="report-title">Accounts Aging Wise Detail</div></div>

    <div class="content-padding info-section">
        <table class="info-table">
            <tr>
                <td style="width: 50%;"><strong>Criteria:</strong> AS ON {{ \Carbon\Carbon::parse($to_date)->format('d/M/Y') }} | ACCOUNT: {{ $account_id }}</td>
                <td style="text-align: right;"><strong>Status:</strong> Active Accounts Only</td>
            </tr>
        </table>
    </div>

    <div class="content-padding">
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 25%;">Party Name</th>
                    <th style="width: 10%;">Total</th>
                    <th style="width: 9%;">01-30 Days</th>
                    <th style="width: 9%;">31-60 Days</th>
                    <th style="width: 9%;">61-90 Days</th>
                    <th style="width: 9%;">91-120 Days</th>
                    <th style="width: 9%;">121-150 Days</th>
                    <th style="width: 9%;">151-180 Days</th>
                    <th style="width: 11%;">Trial Balance</th>
                </tr>
            </thead>
            <tbody>
                @foreach($groupedData as $type => $accounts)
                    <tr class="type-header">
                        <td colspan="9" class="text-left font-black" style="padding-left: 10px;">ACCOUNT TYPE: {{ $type }}</td>
                    </tr>
                    @php
                        $typeTotals = ['total' => 0, '01-30' => 0, '31-60' => 0, '61-90' => 0, '91-120' => 0, '121-150' => 0, '151-180_plus' => 0, 'trial' => 0];
                    @endphp
                    @foreach($accounts as $acc)
                        @php
                            $typeTotals['total'] += $acc['total'];
                            $typeTotals['01-30'] += $acc['days_01_30'];
                            $typeTotals['31-60'] += $acc['days_31_60'];
                            $typeTotals['61-90'] += $acc['days_61_90'];
                            $typeTotals['91-120'] += $acc['days_91_120'];
                            $typeTotals['121-150'] += $acc['days_121_150'];
                            $typeTotals['151-180_plus'] += $acc['days_151_180_plus'];
                            $typeTotals['trial'] += $acc['trial_balance'];
                        @endphp
                        <tr>
                            <td class="text-left">{{ $acc['party_name'] }}</td>
                            <td>{{ $acc['total'] != 0 ? number_format($acc['total'], 0) : '-' }}</td>
                            <td>{{ $acc['days_01_30'] > 0 ? number_format($acc['days_01_30'], 0) : '-' }}</td>
                            <td>{{ $acc['days_31_60'] > 0 ? number_format($acc['days_31_60'], 0) : '-' }}</td>
                            <td>{{ $acc['days_61_90'] > 0 ? number_format($acc['days_61_90'], 0) : '-' }}</td>
                            <td>{{ $acc['days_91_120'] > 0 ? number_format($acc['days_91_120'], 0) : '-' }}</td>
                            <td>{{ $acc['days_121_150'] > 0 ? number_format($acc['days_121_150'], 0) : '-' }}</td>
                            <td>{{ $acc['days_151_180_plus'] > 0 ? number_format($acc['days_151_180_plus'], 0) : '-' }}</td>
                            <td>{{ number_format($acc['trial_balance'], 0) }}</td>
                        </tr>
                    @endforeach
                    <tr class="type-footer">
                        <td class="text-right pr-4" style="font-weight: black; text-transform: uppercase;">TYPE WISE TOTAL :</td>
                        <td>{{ number_format($typeTotals['total'], 0) }}</td>
                        <td>{{ number_format($typeTotals['01-30'], 0) }}</td>
                        <td>{{ number_format($typeTotals['31-60'], 0) }}</td>
                        <td>{{ number_format($typeTotals['61-90'], 0) }}</td>
                        <td>{{ number_format($typeTotals['91-120'], 0) }}</td>
                        <td>{{ number_format($typeTotals['121-150'], 0) }}</td>
                        <td>{{ number_format($typeTotals['151-180_plus'], 0) }}</td>
                        <td>{{ number_format($typeTotals['trial'], 0) }}</td>
                    </tr>
                    @php
                        $percentage = $grandTotal['total'] > 0 ? ($typeTotals['total'] / $grandTotal['total']) * 100 : 0;
                    @endphp
                    <tr class="type-footer" style="background-color: #fff;">
                        <td class="text-left">TYPE WISE % :</td>
                        <td>{{ number_format($percentage, 1) }}%</td>
                        <td colspan="7"></td>
                    </tr>
                @endforeach
                <tr class="grand-total">
                    <td class="text-right pr-4">GRAND TOTAL :</td>
                    <td>{{ number_format($grandTotal['total'], 0) }}</td>
                    <td>{{ number_format($grandTotal['days_01_30'], 0) }}</td>
                    <td>{{ number_format($grandTotal['days_31_60'], 0) }}</td>
                    <td>{{ number_format($grandTotal['days_61_90'], 0) }}</td>
                    <td>{{ number_format($grandTotal['days_91_120'], 0) }}</td>
                    <td>{{ number_format($grandTotal['days_121_150'], 0) }}</td>
                    <td>{{ number_format($grandTotal['days_151_180_plus'], 0) }}</td>
                    <td>{{ number_format($grandTotal['trial_balance'], 0) }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="content-padding footer-signatures clearfix">
        <div style="float: left;" class="sig-box">Checked By</div>
        <div style="float: right;" class="sig-box">Authorized Signature</div>
    </div>
</body>
</html>
