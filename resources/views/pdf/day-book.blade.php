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
$profit_color = $net_profit >= 0 ? '#059669' : '#e11d48';
$profit_bg = $net_profit >= 0 ? '#ecfdf5' : '#fff1f2';
$profit_border = $net_profit >= 0 ? '#059669' : '#e11d48';
$separator_color = $net_profit >= 0 ? '#d1fae5' : '#fee2e2';
$net_margin = $data['financial']['net_margin'] ?? 0;

// Dynamic style strings to avoid IDE CSS parsing errors
$style_profit_box = "background-color: $profit_bg; border: 1px solid $profit_border; width: 100%; box-sizing: border-box; display: block;";
$style_profit_label = "color: $profit_color; font-size: 8px; font-weight: 900; letter-spacing: 1px;";
$style_profit_value = "color: $profit_color; font-size: 18px; font-weight: 900; margin: 4px 0; font-family: 'Helvetica';";
$style_profit_footer = "color: #64748b; font-size: 8px; font-weight: 900; border-top: 1px solid $separator_color; padding-top: 4px; margin-top: 4px;";
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Day Book Summary - Harmain Traders</title>
    <style>
        /* Base Reset */
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #0f172a;
            margin: 0;
            padding: 0;
            line-height: 1.4;
            background-color: #fff;
        }

        /* Utilities */
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        .uppercase { text-transform: uppercase; }
        .tracking-widest { letter-spacing: 0.1em; }
        
        .text-slate-500 { color: #64748b; }
        .text-slate-900 { color: #0f172a; }
        .text-indigo { color: #4f46e5; }
        .text-emerald { color: #059669; }
        .text-rose { color: #e11d48; }
        
        .float-left { float: left; }
        .float-right { float: right; }
        .clearfix::after { content: ""; clear: both; display: table; }

        /* Header Section */
        .header {
            padding: 20px 0;
            border-bottom: 2px solid #f1f5f9;
            margin-bottom: 20px;
        }
        .logo-section {
            display: inline-block;
            vertical-align: middle;
        }
        .brand-name {
            font-size: 20px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.5px;
        }
        .brand-tagline {
            font-size: 8px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 2px;
        }
        .report-badge {
            display: inline-block;
            background-color: #f1f5f9;
            color: #475569;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 9px;
            font-weight: 900;
            margin-top: 10px;
        }

        /* Main Container */
        .container {
            width: 100%;
            box-sizing: border-box;
        }
        .col-left {
            width: 44%;
            float: left;
        }
        .col-right {
            width: 53%;
            float: right;
        }

        /* Section Cards */
        .card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 15px;
            overflow: hidden;
        }
        .card-header {
            background-color: #f8fafc;
            padding: 8px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 8px;
            font-weight: 900;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .card-body {
            padding: 12px;
        }

        /* Table Styles */
        table {
            width: 100%;
            border-collapse: collapse;
        }
        table td {
            padding: 6px 0;
            border-bottom: 1px solid #f1f5f9;
        }
        table tr:last-child td {
            border-bottom: none;
        }
        .label {
            color: #64748b;
            font-weight: 500;
            width: 60%;
        }
        .value {
            color: #0f172a;
            font-weight: 700;
            text-align: right;
        }

        /* P&L Waterfall */
        .waterfall-row {
            padding: 8px 0;
            border-bottom: 1px dashed #e2e8f0;
        }
        .waterfall-row.indent {
            padding-left: 15px;
        }
        .waterfall-highlight {
            background-color: #eef2ff;
            padding: 10px;
            border-radius: 6px;
            margin: 8px 0;
            border: 1px solid #e0e7ff;
        }
        .net-profit-box {
            padding: 12px;
            border-radius: 8px;
            margin-top: 10px;
            text-align: center;
        }

        /* Bank Ledger */
        .bank-group {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #f1f5f9;
        }
        .bank-group:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        .bank-title {
            font-size: 9px;
            font-weight: 900;
            color: #4f46e5;
            margin-bottom: 6px;
        }

        /* Side-by-side components */
        .row-mini {
            margin-bottom: 10px;
        }
        .col-mini-left {
            width: 48%;
            float: left;
        }
        .col-mini-right {
            width: 48%;
            float: right;
        }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            font-size: 7px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 10px;
        }

        @page {
            margin: 0.8cm;
        }
    </style>
</head>
<body>

    <!-- Professional Header -->
    <div class="header clearfix">
        <div class="float-left">
            @if($logo_base64)
                <img src="{{ $logo_base64 }}" width="40" height="40" style="vertical-align: middle; margin-right: 15px;">
            @endif
            <div class="logo-section">
                <div class="brand-name">Harmain <span style="color:#F69A2C">Traders</span></div>
                <div class="brand-tagline">Premium Wholesale Distribution</div>
            </div>
        </div>
        <div class="float-right text-right">
            <div class="report-badge">DAY END SUMMARY</div>
            <div style="font-size: 8px; color: #64748b; font-weight: 900; margin-top: 5px;" class="uppercase tracking-widest">
                {{ date('d M Y', strtotime($from_date)) }} — {{ date('d M Y', strtotime($to_date)) }}
            </div>
        </div>
    </div>

    <div class="container clearfix">
        
        <!-- LEFT COLUMN: FINANCIAL CORE -->
        <div class="col-left">
            
            <!-- P&L STATEMENT -->
            <div class="card" style="border-left: 4px solid #4f46e5;">
                <div class="card-header">🏦 Profit & Loss Statement</div>
                <div class="card-body">
                    <div class="waterfall-row clearfix">
                        <span class="label float-left">Total Net Sales</span>
                        <span class="value float-right">{{ f($data['trade']['net_sale']) }}</span>
                    </div>
                    <div class="waterfall-row indent clearfix">
                        <span class="label float-left text-slate-500">Cost of Goods Sold (COGS)</span>
                        <span class="value float-right text-rose">({{ f($data['financial']['cogs'] ?? 0) }})</span>
                    </div>
                    
                    <div class="waterfall-highlight clearfix">
                        <span class="text-indigo font-black uppercase float-left" style="font-size: 8px;">Gross Profit</span>
                        <span class="text-indigo font-black float-right" style="font-size: 11px;">{{ f($data['financial']['gross_profit'] ?? 0) }}</span>
                    </div>

                    <div class="waterfall-row indent clearfix">
                        <span class="label float-left text-slate-500">Operating Expenses</span>
                        <span class="value float-right text-rose">({{ f($data['financial']['total_expenses'] ?? 0) }})</span>
                    </div>

                    <div class="net-profit-box" style="<?php echo $style_profit_box; ?>">
                        <div style="<?php echo $style_profit_label; ?>" class="uppercase">Net Business Profit</div>
                        <div style="<?php echo $style_profit_value; ?>"><?php echo number_format($net_profit, 2); ?></div>
                        <div style="<?php echo $style_profit_footer; ?>" class="uppercase">
                            Margin Efficiency: <span style="color: <?php echo $profit_color; ?>;"><?php echo $net_margin; ?>%</span>
                        </div>
                    </div>

                    <div style="margin-top: 15px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                        <table>
                            <tr>
                                <td class="label">Day Receivable</td><td class="value">{{ f($data['financial']['day_receivable'] ?? 0) }}</td>
                            </tr>
                            <tr>
                                <td class="label">Day Payable</td><td class="value">{{ f($data['financial']['day_payable'] ?? 0) }}</td>
                            </tr>
                            <tr>
                                <td class="label text-indigo font-black">Total Receivables</td>
                                <td class="value text-indigo font-black">{{ f($data['financial']['total_receivable']) }}</td>
                            </tr>
                            <tr>
                                <td class="label text-rose font-black">Total Payables</td>
                                <td class="value text-rose font-black">({{ f($data['financial']['total_payable']) }})</td>
                            </tr>
                            <tr style="background-color: #f8fafc;">
                                <td class="label font-black" style="color: #0f172a; padding: 6px;">Equity Capital</td>
                                <td class="value font-black" style="color: #0f172a; padding: 6px;">{{ f($data['financial']['capital']) }}</td>
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
                        <tr style="background-color: #f8fafc;">
                            <td class="label font-black">Closing Stock Units</td>
                            <td class="value font-black">{{ n($data['stock']['closing']) }}</td>
                        </tr>
                        <tr>
                            <td class="label text-indigo font-black">Total Inventory Value</td>
                            <td class="value text-indigo font-black">{{ f($data['stock']['closing_amt']) }}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- LIQUID ASSETS -->
            <div class="row-mini clearfix">
                <div class="col-mini-left">
                    <div class="card">
                        <div class="card-header">💵 Cash Balance</div>
                        <div class="card-body" style="padding: 8px 12px;">
                            <table style="font-size: 9px;">
                                <tr><td class="label" style="width: 40%;">Opening</td><td class="value">{{ f($data['cash']['opening']) }}</td></tr>
                                <tr><td class="label font-black" style="color: #059669;">Closing</td><td class="value text-emerald font-black">{{ f($data['cash']['closing']) }}</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-mini-right">
                    <div class="card">
                        <div class="card-header">🎫 Unp. Cheques</div>
                        <div class="card-body" style="padding: 8px 12px;">
                            <table style="font-size: 9px;">
                                <tr><td class="label" style="width: 40%;">Opening</td><td class="value">{{ f($data['cheque']['opening']) }}</td></tr>
                                <tr><td class="label font-black" style="color: #4f46e5;">Closing</td><td class="value text-indigo font-black">{{ f($data['cheque']['closing']) }}</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <!-- RIGHT COLUMN: BANKING & OPERATIONS -->
        <div class="col-right">
            
            <!-- BANK LEDGERS -->
            <div class="card">
                <div class="card-header">🏢 Financial Institution Breakdown</div>
                <div class="card-body">
                    @foreach($data['bank']['details'] as $bank)
                    <div class="bank-group">
                        <div class="bank-title uppercase tracking-widest">{{ $bank['name'] }}</div>
                        <table>
                            <tr>
                                <td class="label" style="padding-left: 10px;">Opening Reserve</td>
                                <td class="value">{{ f($bank['opening']) }}</td>
                                <td width="15%"></td>
                            </tr>
                            <tr>
                                <td class="label" style="padding-left: 10px;">Inward Credits</td>
                                <td class="value text-emerald">+ {{ f($bank['receipts']) }}</td>
                                <td width="15%"></td>
                            </tr>
                            <tr>
                                <td class="label" style="padding-left: 10px;">Outward Debits</td>
                                <td class="value text-rose">- {{ f($bank['payments']) }}</td>
                                <td width="15%"></td>
                            </tr>
                            @php $delta = $bank['closing'] - $bank['opening']; @endphp
                            <tr style="border-top: 1px solid #f1f5f9;">
                                <td class="label font-black" style="padding-left: 10px; color: #0f172a;">Available Balance</td>
                                <td class="value font-black" style="color: #0f172a;">{{ f($bank['closing']) }}</td>
                                <td class="text-right">
                                    @if($delta > 0) <span style="color: #059669; font-size: 7px; font-weight: 900;">▲</span>
                                    @elseif($delta < 0) <span style="color: #e11d48; font-size: 7px; font-weight: 900;">▼</span>
                                    @endif
                                </td>
                            </tr>
                        </table>
                    </div>
                    @endforeach
                </div>
            </div>

            <!-- TOTAL BANKING POSITION -->
            <div class="card" style="background-color: #f8fafc; border: 1.5px solid #4f46e5;">
                <div class="card-header" style="background-color: #4f46e5; color: #fff;">🏦 Aggregate Banking Position</div>
                <div class="card-body">
                    <table>
                        <tr><td class="label">Opening Pool</td><td class="value">{{ f($data['bank']['summary']['opening']) }}</td></tr>
                        <tr><td class="label">Total Receipts</td><td class="value text-emerald">+ {{ f($data['bank']['summary']['receiving']) }}</td></tr>
                        <tr><td class="label">Total Payments</td><td class="value text-rose">- {{ f($data['bank']['summary']['payment']) }}</td></tr>
                        <tr style="border-top: 2px solid #e2e8f0;">
                            <td class="label font-black" style="color: #0f172a; font-size: 11px;">Final Bank Closing</td>
                            <td class="value font-black" style="color: #4f46e5; font-size: 13px;">{{ f($data['bank']['summary']['closing']) }}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- TRADE ACTIVITY -->
            <div class="row-mini clearfix">
                <div class="col-mini-left">
                    <div class="card">
                        <div class="card-header">🛒 Procurement</div>
                        <div class="card-body" style="padding: 8px 12px;">
                            <table>
                                <tr><td class="label" style="font-size: 8px;">Gross</td><td class="value" style="font-size: 8px;">{{ f($data['trade']['purchase']) }}</td></tr>
                                <tr><td class="label text-rose" style="font-size: 8px;">Return</td><td class="value text-rose" style="font-size: 8px;">{{ f($data['trade']['purchase_return']) }}</td></tr>
                                <tr style="border-top: 1px solid #f1f5f9;">
                                    <td class="label font-black text-rose" style="font-size: 9px;">Net</td>
                                    <td class="value font-black text-rose" style="font-size: 10px;">{{ f($data['trade']['net_purchase']) }}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-mini-right">
                    <div class="card">
                        <div class="card-header">📈 Sales Activity</div>
                        <div class="card-body" style="padding: 8px 12px;">
                            <table>
                                <tr><td class="label" style="font-size: 8px;">Gross</td><td class="value" style="font-size: 8px;">{{ f($data['trade']['sale']) }}</td></tr>
                                <tr><td class="label text-rose" style="font-size: 8px;">Return</td><td class="value text-rose" style="font-size: 8px;">{{ f($data['trade']['sales_return']) }}</td></tr>
                                <tr style="border-top: 1px solid #f1f5f9;">
                                    <td class="label font-black text-emerald" style="font-size: 9px;">Net</td>
                                    <td class="value font-black text-emerald" style="font-size: 10px;">{{ f($data['trade']['net_sale']) }}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- INTEGRITY CHECK -->
            <div class="card" style="border-style: dashed;">
                <div class="card-header">⚖️ Trial Balance Integrity</div>
                <div class="card-body" style="padding: 10px 15px;">
                    @php $diff = abs($data['financial']['total_dr'] - $data['financial']['total_cr']); @endphp
                    <table>
                        <tr><td class="label">Aggregate Debits (DR)</td><td class="value">{{ f($data['financial']['total_dr']) }}</td></tr>
                        <tr><td class="label">Aggregate Credits (CR)</td><td class="value">{{ f($data['financial']['total_cr']) }}</td></tr>
                        <tr style="border-top: 1px solid #f1f5f9;">
                            <td class="label font-black">Verification Variance</td>
                            <td class="value font-black {{ $diff < 1 ? 'text-emerald' : 'text-rose' }}">{{ f($diff) }}</td>
                        </tr>
                    </table>
                </div>
            </div>

        </div>
    </div>

    <div class="footer clearfix">
        <table style="width: 100%; border: none;">
            <tr>
                <td class="text-left" style="border: none;">GENERATE AT: {{ date('l, F d, Y g:i A') }}</td>
                <td class="text-center" style="border: none; font-weight: 900; color: #475569;">PRIVATE & CONFIDENTIAL SUMMARY</td>
                <td class="text-right" style="border: none;">HARMAIN PLATFORM v2.0</td>
            </tr>
            <tr>
                <td colspan="3" class="text-center" style="border: none; padding-top: 5px; opacity: 0.6;">
                    SYSTEM USER: {{ strtoupper(Auth::user()->name ?? 'AUTHORIZED ADMIN') }} | HARMAIN TRADERS DISTRIBUTION NETWORK
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
