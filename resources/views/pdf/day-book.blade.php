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

$net_profit = $data['financial']['net_profit'] ?? 0;
$profit_color = $net_profit >= 0 ? '#10b981' : '#f43f5e';
$net_margin = $data['financial']['net_margin'] ?? 0;
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Day Book Summary - Harmain Traders</title>
    <style>
        /* ─── Page Setup ─────────────────────────────────────────── */
        @page {
            size: A4 portrait;
            margin: 1cm 1.2cm;
        }

        /* ─── Base Reset & Full-Page Layout ─────────────────────── */
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9.5px;
            color: #1e293b;
            line-height: 1.4;
            background-color: #fff;
            display: flex;
            flex-direction: column;
            min-height: 267mm; /* A4 height minus 2×1cm margin */
            box-sizing: border-box;
        }
        .page-body {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .content-area {
            flex: 1;
        }

        /* ─── Utilities ─────────────────────────────────────────── */
        .text-center { text-align: center; }
        .text-right  { text-align: right; }
        .text-left   { text-align: left; }
        .font-bold   { font-weight: bold; }
        .text-slate-500 { color: #64748b; }
        .text-slate-900 { color: #0f172a; }
        .text-emerald   { color: #10b981; }
        .text-rose      { color: #f43f5e; }
        .float-left  { float: left; }
        .float-right { float: right; }
        .clearfix::after { content: ""; clear: both; display: table; }

        /* ─── Header ────────────────────────────────────────────── */
        .header {
            padding: 10px 0 10px;
            border-bottom: 2px solid #e2e8f0;
            margin-bottom: 14px;
        }
        .logo-section {
            display: inline-block;
            vertical-align: middle;
        }
        .brand-name {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            letter-spacing: -0.5px;
        }
        .brand-tagline {
            font-size: 7.5px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-top: 2px;
        }
        .report-badge {
            display: inline-block;
            background-color: #f1f5f9;
            color: #475569;
            padding: 4px 12px;
            border-radius: 14px;
            font-size: 9px;
            font-weight: bold;
            margin-top: 4px;
        }

        /* ─── Two-Column Grid ───────────────────────────────────── */
        .container {
            width: 100%;
            box-sizing: border-box;
        }
        .col-left  { width: 48.5%; float: left;  }
        .col-right { width: 48.5%; float: right; }

        /* ─── Cards ─────────────────────────────────────────────── */
        .card {
            border: 1px solid #e2e8f0;
            border-radius: 7px;
            margin-bottom: 11px;
            background-color: #fff;
            overflow: hidden;
        }
        .card-header {
            background-color: #f8fafc;
            padding: 7px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 8.5px;
            font-weight: bold;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .card-body {
            padding: 8px 10px;
        }

        /* ─── Tables ────────────────────────────────────────────── */
        table {
            width: 100%;
            border-collapse: collapse;
        }
        table td {
            padding: 4.5px 0;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
        }
        table tr:last-child td {
            border-bottom: none;
        }
        .label {
            color: #475569;
            font-weight: 500;
            text-align: left;
        }
        .value {
            color: #0f172a;
            font-weight: bold;
            text-align: right;
        }

        /* ─── Highlight Rows ─────────────────────────────────────── */
        .highlight-row { background-color: #f1f5f9; }
        .highlight-row td { padding: 5px; font-weight: bold; }

        /* ─── Mini Side-by-Side Cards ───────────────────────────── */
        .row-mini        { margin-bottom: 11px; }
        .col-mini-left   { width: 48.5%; float: left; }
        .col-mini-right  { width: 48.5%; float: right; }

        /* ─── Footer ────────────────────────────────────────────── */
        .footer {
            margin-top: auto;
            font-size: 7.5px;
            color: #94a3b8;
            border-top: 1.5px solid #e2e8f0;
            padding-top: 8px;
        }
    </style>
</head>
<body>
<div class="page-body">

    <!-- Content Area (flex: 1 fills available space) -->
    <div class="content-area">

    <!-- Professional Header -->
    <div class="header clearfix">
        <div class="float-left">
            @if($logo_base64)
                <img src="{{ $logo_base64 }}" width="30" height="30" style="vertical-align: middle; margin-right: 10px;">
            @endif
            <div class="logo-section">
                <div class="brand-name">Harmain <span style="color:#f97316">Traders</span></div>
                <div class="brand-tagline">Premium Wholesale Distribution</div>
            </div>
        </div>
        <div class="float-right text-right">
            <div class="report-badge">DAY END SUMMARY</div>
            <div style="font-size: 7.5px; color: #64748b; font-weight: bold; margin-top: 3px;" class="uppercase">
                {{ date('d M Y', strtotime($from_date)) }} — {{ date('d M Y', strtotime($to_date)) }}
            </div>
        </div>
    </div>

    <div class="container clearfix">
        
        <!-- LEFT COLUMN: FINANCIAL CORE -->
        <div class="col-left">
            
            <!-- P&L STATEMENT -->
            <div class="card" style="border-left: 3px solid #3b82f6;">
                <div class="card-header">🏦 Profit & Loss Statement</div>
                <div class="card-body">
                    <table>
                        <tr>
                            <td class="label">Total Net Sales</td>
                            <td class="value">{{ f($data['trade']['net_sale']) }}</td>
                        </tr>
                        <tr>
                            <td class="label" style="padding-left: 8px; color: #64748b;">Cost of Goods Sold (COGS)</td>
                            <td class="value text-rose">({{ f($data['financial']['cogs'] ?? 0) }})</td>
                        </tr>
                        <tr class="highlight-row">
                            <td class="label text-slate-900" style="padding-left: 4px;">Gross Profit</td>
                            <td class="value text-slate-900" style="font-size: 9.5px;">{{ f($data['financial']['gross_profit'] ?? 0) }}</td>
                        </tr>
                        <tr>
                            <td class="label" style="padding-left: 8px; color: #64748b;">Operating Expenses</td>
                            <td class="value text-rose">({{ f($data['financial']['total_expenses'] ?? 0) }})</td>
                        </tr>
                        <tr style="background-color: {{ $net_profit >= 0 ? '#f0fdf4' : '#fef2f2' }};">
                            <td class="label" style="padding: 4px; color: {{ $profit_color }};">Net Business Profit</td>
                            <td class="value" style="padding: 4px; color: {{ $profit_color }}; font-size: 10px;">
                                {{ f($net_profit) }}
                                <span style="font-size: 7px; color: #64748b; font-weight: normal; margin-left: 2px;">({{ $net_margin }}%)</span>
                            </td>
                        </tr>
                    </table>

                    <div style="margin-top: 6px; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
                        <table>
                            <tr>
                                <td class="label">Day Receivable</td>
                                <td class="value">{{ f($data['financial']['day_receivable'] ?? 0) }}</td>
                            </tr>
                            <tr>
                                <td class="label">Day Payable</td>
                                <td class="value">{{ f($data['financial']['day_payable'] ?? 0) }}</td>
                            </tr>
                            <tr>
                                <td class="label" style="color: #3b82f6;">Total Receivables</td>
                                <td class="value" style="color: #3b82f6;">{{ f($data['financial']['total_receivable']) }}</td>
                            </tr>
                            <tr>
                                <td class="label text-rose">Total Payables</td>
                                <td class="value text-rose">({{ f($data['financial']['total_payable']) }})</td>
                            </tr>
                            <tr class="highlight-row">
                                <td class="label text-slate-900" style="padding-left: 4px;">Equity Capital</td>
                                <td class="value text-slate-900">{{ f($data['financial']['capital']) }}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>

            <!-- STOCK VALUATION -->
            <div class="card">
                <div class="card-header">📦 Inventory & Stock Status</div>
                <div class="card-body">
                    <table>
                        <tr><td class="label">Opening Stock Units</td><td class="value">{{ n($data['stock']['opening']) }}</td></tr>
                        <tr><td class="label">Inventory Inward (+)</td><td class="value text-emerald">{{ n($data['stock']['in']) }}</td></tr>
                        <tr><td class="label">Inventory Outward (-)</td><td class="value text-rose">{{ n($data['stock']['out']) }}</td></tr>
                        <tr class="highlight-row">
                            <td class="label" style="padding-left: 4px;">Closing Stock Units</td>
                            <td class="value">{{ n($data['stock']['closing']) }}</td>
                        </tr>
                        <tr style="background-color: #f8fafc;">
                            <td class="label font-bold" style="color: #3b82f6; padding-left: 4px;">Total Inventory Value</td>
                            <td class="value" style="color: #3b82f6; font-size: 9.5px;">{{ f($data['stock']['closing_amt']) }}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- LIQUID ASSETS -->
            <div class="row-mini clearfix">
                <div class="col-mini-left">
                    <div class="card">
                        <div class="card-header">💵 Cash Balance</div>
                        <div class="card-body">
                            <table>
                                <tr><td class="label">Opening</td><td class="value">{{ f($data['cash']['opening']) }}</td></tr>
                                <tr style="background-color: #f0fdf4;"><td class="label font-bold text-emerald">Closing</td><td class="value text-emerald">{{ f($data['cash']['closing']) }}</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-mini-right">
                    <div class="card">
                        <div class="card-header">🎫 Unp. Cheques</div>
                        <div class="card-body">
                            <table>
                                <tr><td class="label">Opening</td><td class="value">{{ f($data['cheque']['opening']) }}</td></tr>
                                <tr style="background-color: #f5f3ff;"><td class="label font-bold" style="color: #6366f1;">Closing</td><td class="value font-bold" style="color: #6366f1;">{{ f($data['cheque']['closing']) }}</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <!-- RIGHT COLUMN: BANKING & OPERATIONS -->
        <div class="col-right">
            
            <!-- BANK LEDGERS: DISPLAY ONLY AVAILABLE BALANCE -->
            <div class="card">
                <div class="card-header">🏢 Financial Institution Breakdown</div>
                <div class="card-body" style="padding: 4px 6px;">
                    <table style="width: 100%;">
                        <thead>
                            <tr style="border-bottom: 1.5px solid #cbd5e1; font-weight: bold; color: #475569;">
                                <th style="text-align: left; padding: 3px 4px;">Institution</th>
                                <th style="text-align: right; padding: 3px 4px;">Available Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($data['bank']['details'] as $bank)
                            <tr>
                                <td style="padding: 4px; text-transform: uppercase; color: #334155; font-weight: 500;">{{ $bank['name'] }}</td>
                                <td style="padding: 4px; text-align: right;" class="value {{ $bank['closing'] < 0 ? 'text-rose' : 'text-slate-900' }}">
                                    {{ f($bank['closing']) }}
                                </td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- TOTAL BANKING POSITION -->
            <div class="card" style="border: 1.5px solid #3b82f6;">
                <div class="card-header" style="background-color: #3b82f6; color: #fff;">🏦 Aggregate Banking Position</div>
                <div class="card-body">
                    <table>
                        <tr><td class="label">Opening Pool</td><td class="value">{{ f($data['bank']['summary']['opening']) }}</td></tr>
                        <tr><td class="label">Total Receipts</td><td class="value text-emerald">+ {{ f($data['bank']['summary']['receiving']) }}</td></tr>
                        <tr><td class="label">Total Payments</td><td class="value text-rose">- {{ f($data['bank']['summary']['payment']) }}</td></tr>
                        <tr class="highlight-row" style="background-color: #eff6ff;">
                            <td class="label" style="color: #1e3a8a; padding-left: 4px;">Final Bank Closing</td>
                            <td class="value" style="color: #3b82f6; font-size: 10px;">{{ f($data['bank']['summary']['closing']) }}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- TRADE ACTIVITY -->
            <div class="row-mini clearfix">
                <div class="col-mini-left">
                    <div class="card">
                        <div class="card-header">🛒 Procurement</div>
                        <div class="card-body">
                            <table>
                                <tr><td class="label" style="font-size: 7.5px;">Gross</td><td class="value" style="font-size: 7.5px;">{{ f($data['trade']['purchase']) }}</td></tr>
                                <tr><td class="label text-rose" style="font-size: 7.5px;">Return</td><td class="value text-rose" style="font-size: 7.5px;">{{ f($data['trade']['purchase_return']) }}</td></tr>
                                <tr style="border-top: 1px solid #f1f5f9;">
                                    <td class="label font-bold text-rose" style="font-size: 8px;">Net</td>
                                    <td class="value text-rose" style="font-size: 8.5px;">{{ f($data['trade']['net_purchase']) }}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-mini-right">
                    <div class="card">
                        <div class="card-header">📈 Sales Activity</div>
                        <div class="card-body">
                            <table>
                                <tr><td class="label" style="font-size: 7.5px;">Gross</td><td class="value" style="font-size: 7.5px;">{{ f($data['trade']['sale']) }}</td></tr>
                                <tr><td class="label text-rose" style="font-size: 7.5px;">Return</td><td class="value text-rose" style="font-size: 7.5px;">{{ f($data['trade']['sales_return']) }}</td></tr>
                                <tr style="border-top: 1px solid #f1f5f9;">
                                    <td class="label font-bold text-emerald" style="font-size: 8px;">Net</td>
                                    <td class="value text-emerald" style="font-size: 8.5px;">{{ f($data['trade']['net_sale']) }}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- INTEGRITY CHECK -->
            <div class="card" style="border-style: dashed; border-color: #cbd5e1;">
                <div class="card-header">⚖️ Trial Balance Integrity</div>
                <div class="card-body">
                    @php $diff = abs($data['financial']['total_dr'] - $data['financial']['total_cr']); @endphp
                    <table>
                        <tr><td class="label">Aggregate Debits (DR)</td><td class="value">{{ f($data['financial']['total_dr']) }}</td></tr>
                        <tr><td class="label">Aggregate Credits (CR)</td><td class="value">{{ f($data['financial']['total_cr']) }}</td></tr>
                        <tr style="border-top: 1px solid #e2e8f0;">
                            <td class="label font-bold" style="padding-top: 4px;">Verification Variance</td>
                            <td class="value font-bold {{ $diff < 1 ? 'text-emerald' : 'text-rose' }}" style="padding-top: 4px; font-size: 9px;">{{ f($diff) }}</td>
                        </tr>
                    </table>
                </div>
            </div>

        </div>
    </div>

    </div><!-- /.content-area -->

    <!-- Page Flow Footer (pinned to bottom) -->
    <div class="footer clearfix">
        <table style="width: 100%; border: none;">
            <tr>
                <td class="text-left" style="border: none;">GENERATE AT: {{ date('l, F d, Y g:i A') }}</td>
                <td class="text-center" style="border: none; font-weight: bold; color: #475569;">PRIVATE &amp; CONFIDENTIAL SUMMARY</td>
                <td class="text-right" style="border: none;">HARMAIN PLATFORM v2.0</td>
            </tr>
            <tr>
                <td colspan="3" class="text-center" style="border: none; padding-top: 3px; opacity: 0.6;">
                    SYSTEM USER: {{ strtoupper(Auth::user()->name ?? 'AUTHORIZED ADMIN') }} | HARMAIN TRADERS DISTRIBUTION NETWORK
                </td>
            </tr>
        </table>
    </div>

</div><!-- /.page-body -->

    @if(isset($is_print_mode) && $is_print_mode)
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
    @endif
</body>
</html>
