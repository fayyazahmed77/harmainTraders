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
    <title>Day End Summary</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #1e293b;
            margin: 0;
            padding: 0;
            background-color: #fff;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        
        .header {
            margin-bottom: 25px;
            padding: 20px;
            border-bottom: 1.5px solid #000;
        }

        
        /* Logo Styles */
        .logo-section {
            display: inline-block;
            margin-bottom: 5px;
        }
        .logo-icon {
            display: inline-block;
            vertical-align: middle;
            margin-right: 12px;
        }
        .brand-text {
            display: inline-block;
            vertical-align: middle;
            text-align: left;
        }
        .brand-name {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            line-height: 1;
        }

        .brand-tagline {
            font-size: 8px;
            color: #334155;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-top: 3px;
        }

        
        .report-title-container {
            margin-top: 10px;
        }
        .report-title {
            font-size: 13px;
            font-weight: bold;
            color: #000;
            display: inline-block;
            padding: 4px 20px;
            border: 1.5px solid #000;
            border-radius: 4px;
        }


        .container {
            width: 100%;
            padding: 0 10px;
            box-sizing: border-box;
        }
        .left-col {
            width: 47%;
            float: left;
        }
        .right-col {
            width: 47%;
            float: right;
        }

        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }

        .card {
            border: 1px solid #94a3b8;
            border-radius: 6px;
            margin-bottom: 15px;
            overflow: hidden;
        }

        .card-header {
            padding: 6px 10px;
            border-bottom: 1.5px solid #0f172a;
            font-weight: bold;
            font-size: 9px;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .card-body {
            padding: 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }
        table td {
            padding: 6px 10px;
            border-bottom: 1px solid #94a3b8;
        }

        table tr:last-child td {
            border-bottom: none;
        }
        .label {
            color: #334155;
            font-weight: 500;
        }

        .value {
            font-weight: bold;
            color: #000;
        }

        
        /* Specialized Table for Bank */
        .bank-table tr.bank-name-row td {
            color: #000;
            font-weight: bold;
            border-top: 1px solid #000;
        }
        .bank-table tr.bank-closing-row td {
            border-top: 1px solid #94a3b8;
        }


        .footer {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            font-size: 8px;
            color: #475569;
            border-top: 1px solid #f1f5f9;
            padding-top: 10px;
        }

        .dr-text { color: #000; }
        .cr-text { color: #000; }
        .profit-text { color: #000; }
        .loss-text { color: #000; }

        
        .bg-success-soft { border-left: 4px solid #000; }
        .bg-danger-soft { border-left: 4px solid #000; }


        @page {
            margin: 0.8cm;
        }

    </style>
</head>
<body>

    <div class="header text-center">
        <div class="logo-section">
            <div class="logo-icon">
                @if($logo_base64)
                    <img src="{{ $logo_base64 }}" width="32" height="32">
                @endif
            </div>
            <div class="brand-text">
                <div class="brand-name">Harmain <span style="color:#F69A2C">Traders</span></div>
                <div class="brand-tagline">Premium Wholesale Distribution</div>
            </div>
        </div>
        
        <div class="report-title-container">
            <div class="report-title uppercase">DAY END SUMMARY</div>
            <div style="font-size: 9px; margin-top: 5px; color: #0c0c0bff;">
                PERIOD: {{ strtoupper(date('d-M-Y', strtotime($from_date))) }} TO {{ strtoupper(date('d-M-Y', strtotime($to_date))) }}
            </div>
        </div>
    </div>

    <div class="container clearfix">
        <!-- LEFT COLUMN -->
        <div class="left-col">
            
            <!-- Stock Card -->
            <div class="card">
                <div class="card-header">Stock Summary</div>
                <div class="card-body">
                    <table>
                        <tr><td class="label">Opening Stock Qty</td><td class="value text-right">{{ n($data['stock']['opening']) }}</td></tr>
                        <tr><td class="label">Total Inward Qty</td><td class="value text-right">{{ n($data['stock']['in']) }}</td></tr>
                        <tr><td class="label">Total Outward Qty</td><td class="value text-right">{{ n($data['stock']['out']) }}</td></tr>
                        <tr><td class="label" style="background-color: #f8fafc;">Closing Stock Qty</td><td class="value text-right" style="background-color: #f8fafc;">{{ n($data['stock']['closing']) }}</td></tr>
                        <tr><td class="label" style="color: #4f46e5;">Closing Stock Value</td><td class="value text-right" style="color: #4f46e5;">{{ f($data['stock']['closing_amt']) }}</td></tr>
                    </table>
                </div>
            </div>

            <!-- Cash Summary -->
            <div class="card">
                <div class="card-header">Cash Summary</div>
                <div class="card-body">
                    <table>
                        <tr><td class="label">Cash Opening</td><td class="value text-right">{{ f($data['cash']['opening']) }}</td></tr>
                        <tr><td class="label">Cash Receiving</td><td class="value text-right" style="color: #000;">+ {{ f($data['cash']['receiving']) }}</td></tr>
                        <tr><td class="label">Cash Payment</td><td class="value text-right" style="color: #000;">- {{ f($data['cash']['payment']) }}</td></tr>
                        <tr style="background-color: #f1f5f9;">
                            <td class="label" style="font-weight: bold;">Cash Closing</td>
                            <td class="value text-right" style="font-weight: bold;">{{ f($data['cash']['closing']) }}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Cheque Summary -->
            <div class="card">
                <div class="card-header">Cheque Summary</div>
                <div class="card-body">
                    <table>
                        <tr><td class="label">Cheque Opening</td><td class="value text-right">{{ f($data['cheque']['opening']) }}</td></tr>
                        <tr><td class="label">Cheque Receiving</td><td class="value text-right" style="color: #000;">+ {{ f($data['cheque']['receiving']) }}</td></tr>
                        <tr><td class="label">Cheque Payment</td><td class="value text-right" style="color: #000;">- {{ f($data['cheque']['payment']) }}</td></tr>
                        <tr style="background-color: #f1f5f9;">
                            <td class="label" style="font-weight: bold;">Cheque Closing</td>
                            <td class="value text-right" style="font-weight: bold;">{{ f($data['cheque']['closing']) }}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Financial Indicators -->
            <div class="card">
                <div class="card-header">Accounts & Financials</div>
                <div class="card-body">
                    <table>
                        <tr><td class="label">Total Receivables (DR)</td><td class="value text-right dr-text">{{ f($data['financial']['total_receivable']) }}</td></tr>
                        <tr><td class="label">Total Payables (CR)</td><td class="value text-right cr-text">{{ f($data['financial']['total_payable']) }}</td></tr>
                        <tr><td class="label">Net Equity / Capital</td><td class="value text-right">{{ f($data['financial']['capital']) }}</td></tr>
                        <tr><td class="label">Estimated Net Profit</td><td class="value text-right profit-text" style="font-size: 11px;">{{ f($data['financial']['profit']) }}</td></tr>
                        <tr style="background-color: #f0fdf4;">
                            <td class="label profit-text">Return on Investment (ROI)</td>
                            <td class="value text-right profit-text" style="font-size: 11px;">{{ $data['financial']['roi'] }} %</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Trade Performance -->
            <div class="card" style="border: 1px solid #4f46e5;">
                <div class="card-header" style="background-color: #4f46e5; color: white;">Sales & Purchase Summary</div>
                <div class="card-body">
                    <table>
                        <tr><td class="label">Net Purchase</td><td class="value text-right">{{ f($data['trade']['net_purchase']) }}</td></tr>
                        <tr><td class="label">Net Sales</td><td class="value text-right" style="color: #4f46e5;">{{ f($data['trade']['net_sale']) }}</td></tr>
                    </table>
                </div>
            </div>

        </div>

        <!-- RIGHT COLUMN -->
        <div class="right-col">
            
            <div class="card">
                <div class="card-header">Bank Ledger Breakdown</div>
                <div class="card-body">
                    <table class="bank-table">
                        @foreach($data['bank']['details'] as $bank)
                        <tr class="bank-name-row">
                            <td colspan="2" class="uppercase" style="font-size: 8px;">{{ $bank['name'] }}</td>
                        </tr>
                        <tr>
                            <td class="label" style="padding-left: 15px;">Opening Balance</td>
                            <td class="value text-right">{{ f($bank['opening']) }}</td>
                        </tr>
                        <tr>
                            <td class="label" style="padding-left: 15px;">Receiving</td>
                            <td class="value text-right" style="color: #000;">+ {{ f($bank['receipts']) }}</td>
                        </tr>
                        <tr>
                            <td class="label" style="padding-left: 15px;">Payment</td>
                            <td class="value text-right" style="color: #000;">- {{ f($bank['payments']) }}</td>
                        </tr>

                        <tr class="bank-closing-row" style="background-color: #f1f5f9;">
                            <td class="label" style="padding-left: 15px; font-weight: bold;">Closing Balance</td>
                            <td class="value text-right" style="font-weight: bold;">{{ f($bank['closing']) }}</td>
                        </tr>
                        @endforeach
                    </table>
                </div>
            </div>

            <!-- Aggregate Bank Card -->
            <div class="card" style="border-style: dashed; background-color: #f8fafc;">
                <div class="card-header">Total Bank Position</div>
                <div class="card-body">
                    <table>
                        <tr><td class="label">Opening</td><td class="value text-right">{{ f($data['bank']['summary']['opening']) }}</td></tr>
                        <tr><td class="label">Receiving</td><td class="value text-right" style="color: #16a34a;">{{ f($data['bank']['summary']['receiving']) }}</td></tr>
                        <tr><td class="label">Payment</td><td class="value text-right" style="color: #dc2626;">{{ f($data['bank']['summary']['payment']) }}</td></tr>
                        <tr><td class="label" style="font-weight: bold; font-size: 11px;">Closing</td><td class="value text-right" style="font-weight: bold; font-size: 11px; color: #4f46e5;">{{ f($data['bank']['summary']['closing']) }}</td></tr>
                    </table>
                </div>
            </div>

            <!-- Trial Balance Summary -->
            <div class="card" style="margin-top: 10px;">
                <div class="card-header">Trial Balance check</div>
                <div class="card-body">
                    <table>
                        <tr><td class="label">Aggregate Debits (DR)</td><td class="value text-right">{{ f($data['financial']['total_dr']) }}</td></tr>
                        <tr><td class="label">Aggregate Credits (CR)</td><td class="value text-right">{{ f($data['financial']['total_cr']) }}</td></tr>
                        @php
                            $diff = abs($data['financial']['total_dr'] - $data['financial']['total_cr']);
                        @endphp
                        <tr class="{{ $diff < 1 ? 'bg-success-soft' : 'bg-danger-soft' }}">

                            <td class="label" style="font-weight: bold;">Difference</td>
                            <td class="value text-right" style="font-weight: bold;">{{ f($diff) }}</td>
                        </tr>
                    </table>
                </div>
            </div>

        </div>
    </div>

    <div class="footer clearfix">
        <table style="width: 100%; border: none;">
            <tr>
                <td class="text-left" style="border: none;">PRINTED ON: {{ strtoupper(date('l, F d, Y g:i A')) }}</td>
                <td class="text-center" style="border: none; font-weight: bold;">CONFIDENTIAL BUSINESS SUMMARY</td>
                <td class="text-right" style="border: none;">PAGE 1 OF 1</td>
            </tr>
            <tr>
                <td colspan="3" class="text-center" style="border: none; padding-top: 5px; opacity: 0.5;">
                    PRINTED BY: {{ strtoupper(Auth::user()->name ?? 'SUPER ADMIN') }} | SYSTEM GENERATED BY HARMAIN PLATFORM
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
