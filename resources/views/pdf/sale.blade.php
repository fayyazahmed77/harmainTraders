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
    <title>Sale Invoice</title>
    <style>
        * {
            box-sizing: border-box;
        }

        @page {
            margin: 0.4cm;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #000;
            font-size: 11px;
            margin: 0;
            padding: 0;
        }

        /* Padding wrappers */
        .content-padding {
            padding: 0 5px;
        }

        .top-section {
            padding-top: 5px;
            padding-bottom: 2px;
        }

        /* Logo Styles */
        .logo-icon {
            display: inline-block;
            vertical-align: middle;
            width: 35px;
            height: 35px;
            /* Dark Icon */
            border-radius: 8px;
            margin-right: 15px;
            text-align: center;
            line-height: 35px;
            color: white;
            font-weight: bold;
            font-size: 20px;
        }

        .brand-text {
            display: inline-block;
            vertical-align: middle;
        }

        .brand-name {
            font-size: 16px;
            font-weight: bold;
            color: #444;
            line-height: 1;
        }

        .brand-tagline {
            font-size: 8px;
            color: #888;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-top: 2px;
        }

        /* Top Right Contact */
        .header-contact {
            float: right;
            text-align: right;
            vertical-align: middle;
            padding-top: 5px;
        }

        .contact-item {
            font-size: 11px;
            font-weight: bold;
            color: #000;
            /* Was Brand Color */
            margin-bottom: 2px;
        }

        /* Banner Row */
        .banner-row {
            width: 100%;
            margin-bottom: 10px;
            overflow: hidden;
            /* Clear floats */
        }

        .banner-table {
            width: 100%;
            border-collapse: collapse;
        }

        .left-bar-cell {
            width: 65%;
            vertical-align: middle;
        }

        .left-orange-bar {
            border-bottom: 1px dashed #000;
            height: 1px;
            width: 100%;
        }

        .right-invoice-cell {
            width: 35%;
            vertical-align: middle;
            text-align: right;
        }

        .invoice-title-table {
            width: 100%;
            border-collapse: collapse;
        }

        .invoice-text {
            font-size: 22px;
            color: #444;
            text-transform: uppercase;
            font-weight: 500;
            text-align: right;
            padding-right: 25px;
            letter-spacing: 1px;
            line-height: 1;
            font-family: sans-serif;
        }

        .right-orange-block {
            border-bottom: 1px dashed #000;
            width: 50px;
            height: 1px;
        }

        /* Info Section */
        .info-section {
            margin-bottom: 5px;
        }

        .invoice-to-wrapper {
            width: 55%;
            float: left;
        }

        .invoice-details-wrapper {
            width: 40%;
            float: right;
            text-align: right;
        }

        .label-title {
            font-size: 14px;
            font-weight: bold;
            color: #555;
            margin-bottom: 2px;
        }

        .customer-name {
            font-size: 14px;
            font-weight: bold;
            color: #222;
            margin-bottom: 2px;
        }

        .customer-address {
            color: #555;
            font-size: 11px;
            line-height: 1.3;
            max-width: 300px;
        }

        .details-table {
            width: 100%;
            text-align: right;
            border-collapse: collapse;
        }

        .detail-label-cell {
            padding-bottom: 2px;
            font-weight: bold;
            color: #444;
            font-size: 11px;
            padding-right: 15px;
        }

        .detail-value-cell {
            padding-bottom: 2px;
            font-weight: bold;
            color: #222;
            font-size: 11px;
        }

        /* Items Section */
        .items-section {
            margin-bottom: 5px;
            border: 1px dashed #000;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
        }

        .items-table th {
            background-color: transparent;
            /* Removed Dark Header */
            color: #000;
            padding: 3px 2px;
            /* Further Reduced Padding */
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            text-transform: capitalize;
            border-bottom: 1px dashed #000;
            border-right: 1px dashed #000;
        }

        /* Remove border-right from the actual last column only */
        .items-table th.no-right-border {
            border-right: none;
        }

        .items-table td {
            padding: 4px 5px;
            color: #000;
            font-size: 10px;
            border-right: 1px dashed #000;
            text-align: center;
            border-bottom: 1px dashed #000;
        }

        .items-table td:last-child {
            border-right: none;
        }

        .text-left {
            text-align: left !important;
        }

        .text-right {
            text-align: right !important;
        }

        .text-center {
            text-align: center !important;
        }

        /* Footer Section */
        .footer-section {
            margin-top: 2px;
            color: #000;
        }

        .footer-left {
            width: 30%;
            float: left;
            padding-top: 10px;
        }

        .footer-center {
            width: 30%;
            float: left;
            text-align: center;
            padding-top: 10px;
        }

        .footer-right {
            width: 40%;
            float: right;
            text-align: right;
        }

        .footer-totals-table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer-totals-table td {
            padding: 2px 0;
            font-size: 11px;
            font-weight: bold;
            color: #222;
        }

        .footer-totals-table .label {
            text-align: right;
            padding-right: 10px;
        }

        .footer-totals-table .value {
            text-align: right;
            width: 120px;
        }

        .auth-sign-line {
            margin-top: 40px;
            border-top: 1px dashed #000;
            width: 200px;
            text-align: center;
            padding-top: 5px;
            font-weight: bold;
            font-size: 12px;
        }

        .bottom-bar {
            position: fixed;
            bottom: 40px;
            left: 50px;
            right: 0;
        }

        .bottom-line {
            height: 1px;
            border-bottom: 1px dashed #000;
            width: 65%;
            float: left;
        }

        .bottom-right-line {
            height: 1px;
            border-bottom: 1px dashed #000;
            width: 20%;
            float: right;
            margin-right: -50px;
            margin-right: 0;
        }

        .bottom-info {
            position: fixed;
            bottom: 15px;
            left: 50px;
            font-weight: bold;
            color: #555;
            font-size: 12px;
            letter-spacing: 1px;
        }

        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }

        /* Watermark Styles */
        .watermark-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            opacity: 0.1;
            z-index: -1000;
            width: 80%;
            text-align: center;
        }

        .watermark-container img {
            width: 450px;
            height: auto;
        }
    </style>
</head>

<body>

    <div class="watermark-container">
        <img src="{{ $logo_base64 }}" alt="watermark">
    </div>

    <div class="top-section content-padding clearfix">
        <div style="float: left; width: 60%;">
            <div class="logo-section">
                <div class="logo-icon"><img src="{{ $logo_base64 }}" width="35" height="35"> </div>
                <div class="brand-text">
                    <div class="brand-name">Harmain <span style="color:#000">Traders</span></div>
                    <div class="brand-tagline">Wholesale <span style="color:#000">&</span> Supply Chain</div>
                </div>
            </div>
        </div>
        <div class="header-contact" style="width: 40%;">
            <div class="contact-item">Phone : 0332-3228684</div>
            <div class="contact-item">Fix no : 0343-8772357</div>
        </div>
    </div>

    <!-- Banner Row (Centered Title) -->
    <div class="banner-row">
        <table class="banner-table">
            <tr>
                <td style="width: 35%; vertical-align: middle;">
                    <div style="border-bottom: 1px dashed #000; width: 100%;"></div>
                </td>
                <td style="text-align: center; vertical-align: middle; padding: 0 15px;">
                    <div class="invoice-text" style="padding-right: 0; text-align: center;">ESTIMATE</div>
                </td>
                <td style="width: 35%; vertical-align: middle;">
                    <div style="border-bottom: 1px dashed #000; width: 100%;"></div>
                </td>
            </tr>
        </table>
    </div>

    <div class="content-padding">

        <!-- Info Section -->
        <div class="info-section clearfix">
            <div class="invoice-to-wrapper">
                <div class="customer-name">Name : {{ $sale->customer->title }}</div>
                <div class="customer-address">
                    Address : {{ $sale->customer->address1 ?? 'Address not available' }}
                </div>
                <div class="customer-address" style="font-weight: bold; color: #222; margin-top: 2px;">
                    Invoice No : {{ $sale->id }}
                </div>
            </div>
            <div class="invoice-details-wrapper">
                <table class="details-table" align="right">
                    <tr>
                        <td class="detail-label-cell">Invoice Time :</td>
                        <td class="detail-value-cell">{{ $sale->created_at ? \Carbon\Carbon::parse($sale->created_at)->format('h:i A') : \Carbon\Carbon::now()->format('h:i A') }}</td>
                    </tr>
                    <tr>
                        <td class="detail-label-cell">Invoice Date :</td>
                        <td class="detail-value-cell">{{ \Carbon\Carbon::parse($sale->date)->format('d-M-y') }}</td>
                    </tr>
                    <tr>
                        <td class="detail-label-cell">Due Date :</td>
                        <td class="detail-value-cell">{{ \Carbon\Carbon::parse($sale->date)->addDays((int)($sale->customer->aging_days ?? 0))->format('d-M-y') }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Items Section -->
        <div class="items-section">
            <table class="items-table">
                @php
                $hasBonus = $sale->items->sum('bonus_qty_carton') > 0 || $sale->items->sum('bonus_qty_pcs') > 0;
                @endphp
                <thead>
                    <tr>
                        <th colspan="{{ $hasBonus ? 4 : 2 }}" style="border-bottom: 1px dashed #000;">Quantity</th>
                        <th rowspan="2" class="text-left" style="width: 35%; margin-left: 5px;">Description Of Goods</th>
                        <th rowspan="2">Rate</th>
                        <th rowspan="2">Disc %</th>
                        <th rowspan="2">After Disc</th>
                        <th rowspan="2" class="no-right-border text-right">Net Amount</th>
                    </tr>
                    <tr>
                        <th style="width: 40px; border-top: 1px dashed #000;">Box</th>
                        <th style="width: 40px; border-top: 1px dashed #000;">Pcs</th>
                        @if($hasBonus)
                        <th style="width: 40px; border-top: 1px dashed #000;">B.Box</th>
                        <th style="width: 40px; border-top: 1px dashed #000;">B.Pcs</th>
                        @endif
                    </tr>
                </thead>
                <tbody>
                    @foreach($sale->items as $item)
                    @php
                    // Calculations
                    $subtotal_gross = $item->trade_price * $item->total_pcs;

                    $disc_percent = 0;
                    if($subtotal_gross > 0) {
                    $disc_percent = ($item->discount / $subtotal_gross) * 100;
                    }

                    // Rate after discount
                    $after_disc_rate = $item->trade_price * (1 - ($disc_percent / 100));
                    @endphp
                    <tr>
                        <td>{{ $item->qty_carton }}</td>
                        <td>{{ $item->qty_pcs }}</td>
                        @if($hasBonus)
                        <td>{{ $item->bonus_qty_carton > 0 ? $item->bonus_qty_carton : '-' }}</td>
                        <td>{{ $item->bonus_qty_pcs > 0 ? $item->bonus_qty_pcs : '-' }}</td>
                        @endif
                        <td class="text-left">{{ $item->item->title }}</td>
                        <td>{{ number_format($item->trade_price, 2) }}</td>
                        <td>{{ number_format($disc_percent > 0 ? $disc_percent : 0, 2) }}</td>
                        <td>{{ number_format($after_disc_rate, 2) }}</td>
                        <td class="text-right">{{ number_format($item->subtotal - $item->discount, 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Footer Section -->
        <div class="footer-section clearfix">

            <div class="footer-left">
                <div style="font-weight: bold; margin-bottom: 40px;">
                    Total # Of Items : &nbsp; {{ $sale->items->count() }}
                </div>

                <div class="auth-sign-line">
                    Check By Name & Time
                </div>
            </div>

            <div class="footer-center">
                <div style="font-weight: bold; margin-top: 0px;">
                    Discount Amount : &nbsp; {{ number_format($sale->discount_total, 2) }}
                </div>
            </div>

            <div class="footer-right">
                <div style="display: inline-block; width: 100%;">
                    <table class="footer-totals-table" align="right">
                        <!-- Courier Charges -->
                        <tr>
                            <td class="label">Courier Charges :-</td>
                            <td class="value">{{ number_format($sale->courier_charges ?? 0, 2) }}</td>
                        </tr>
                        <!-- Total Rs. (Net of current invoice) -->
                        <tr>
                            <td class="label">Total Rs. :-</td>
                            <td class="value">{{ number_format($sale->net_total, 2) }}</td>
                        </tr>
                        <!-- Previous Balance -->
                        @php
                        $prev_balance = $sale->customer->opening_balance ?? 0;
                        @endphp
                        <tr>
                            <td class="label">Previous Balance :-</td>
                            <td class="value">{{ number_format($prev_balance, 2) }}</td>
                        </tr>
                        <!-- Divider Line -->
                        <tr>
                            <td colspan="2" style="border-bottom: 1px dashed #000;"></td>
                        </tr>

                        <!-- Total Balance -->
                        <tr>
                            <td class="label">Total Balance :-</td>
                            <td class="value">{{ number_format($sale->net_total + $prev_balance, 2) }}</td>
                        </tr>
                        <!-- Cash Received -->
                        <tr>
                            <td class="label">Cash Received :-</td>
                            <td class="value">{{ number_format($sale->paid_amount, 2) }}</td>
                        </tr>
                        <!-- Divider Line -->
                        <tr>
                            <td colspan="2" style="border-bottom: 1px dashed #000;"></td>
                        </tr>

                        <!-- Total Receivable -->
                        <tr>
                            <td class="label">Total Receivable :</td>
                            <td class="value">{{ number_format(($sale->net_total + $prev_balance) - $sale->paid_amount, 2) }}</td>
                        </tr>
                    </table>
                </div>
            </div>

        </div>
    </div>
</body>

</html>