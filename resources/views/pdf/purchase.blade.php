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
    <title>Purchase Invoice</title>
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
            margin-bottom: 2px;
        }

        /* Banner Row */
        .banner-row {
            width: 100%;
            margin-bottom: 10px;
            overflow: hidden;
        }

        .banner-table {
            width: 100%;
            border-collapse: collapse;
        }

        .invoice-text {
            font-size: 22px;
            color: #444;
            text-transform: uppercase;
            font-weight: 500;
            letter-spacing: 1px;
            line-height: 1;
            font-family: sans-serif;
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
            color: #000;
            padding: 3px 2px;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            text-transform: capitalize;
            border-bottom: 1px dashed #000;
            border-right: 1px dashed #000;
        }

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
            <div class="contact-item">Phone : 0317-2288084</div>
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
                <div class="customer-name">Supplier : {{ $purchase->supplier->title }}</div>
                <div class="customer-address">
                    Address : {{ $purchase->supplier->address1 ?? 'Address not available' }}
                </div>
                <div class="customer-address" style="font-weight: bold; color: #222; margin-top: 2px;">
                    Invoice No : {{ $purchase->invoice }}
                </div>
            </div>
            <div class="invoice-details-wrapper">
                <table class="details-table" align="right">
                    <tr>
                        <td class="detail-label-cell">Invoice Time :</td>
                        <td class="detail-value-cell">{{ $purchase->created_at ? \Carbon\Carbon::parse($purchase->created_at)->format('h:i A') : \Carbon\Carbon::now()->format('h:i A') }}</td>
                    </tr>
                    <tr>
                        <td class="detail-label-cell">Invoice Date :</td>
                        <td class="detail-value-cell">{{ \Carbon\Carbon::parse($purchase->date)->format('d-M-y') }}</td>
                    </tr>
                    <tr>
                        <td class="detail-label-cell">Due Date :</td>
                        <td class="detail-value-cell">{{ \Carbon\Carbon::parse($purchase->date)->addDays((int)($purchase->supplier->aging_days ?? 0))->format('d-M-y') }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Items Section -->
        <div class="items-section">
            <table class="items-table">
                <thead>
                    <tr>
                        <th colspan="2" style="border-bottom: 1px dashed #000;">Quantity</th>
                        <th rowspan="2" class="text-left" style="width: 35%; margin-left: 5px;">Description Of Goods</th>
                        <th rowspan="2">Rate</th>
                        <th rowspan="2">Disc %</th>
                        <th rowspan="2">After Disc</th>
                        <th rowspan="2" class="no-right-border text-right">Net Amount</th>
                    </tr>
                    <tr>
                        <th style="width: 40px; border-top: 1px dashed #000;">Box</th>
                        <th style="width: 40px; border-top: 1px dashed #000;">Pcs</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($purchase->items as $item)
                    @php
                    // Calculations
                    $subtotal_gross = $item->trade_price * $item->total_pcs;
                    $disc_percent = $subtotal_gross > 0 ? ($item->discount / $subtotal_gross) * 100 : 0;
                    $after_disc_rate = $item->trade_price * (1 - ($disc_percent / 100));
                    @endphp
                    <tr>
                        <td>{{ (int)$item->qty_carton }}</td>
                        <td>{{ (int)$item->qty_pcs }}</td>
                        <td class="text-left">{{ $item->item->title }}</td>
                        <td>{{ number_format($item->trade_price, 2) }}</td>
                        <td>{{ number_format($disc_percent, 2) }}</td>
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
                    Total # Of Items : &nbsp; {{ $purchase->items->count() }}
                </div>

                <div class="auth-sign-line">
                    Check By Name & Time
                </div>
            </div>

            <div class="footer-center">
                <div style="font-weight: bold; margin-top: 0px;">
                    Discount Amount : &nbsp; {{ number_format($purchase->discount_total, 2) }}
                </div>
            </div>

            <div class="footer-right">
                <div style="display: inline-block; width: 100%;">
                    <table class="footer-totals-table" align="right">
                        <!-- Courier Charges -->
                        <tr>
                            <td class="label">Courier Charges :-</td>
                            <td class="value">{{ number_format($purchase->courier_charges ?? 0, 2) }}</td>
                        </tr>
                        <!-- Total Rs. (Net of current invoice) -->
                        <tr>
                            <td class="label">Total Rs. :-</td>
                            <td class="value">{{ number_format($purchase->net_total, 2) }}</td>
                        </tr>
                        <!-- Previous Balance -->
                        @php
                        $prev_balance = $purchase->supplier->opening_balance ?? 0;
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
                            <td class="value">{{ number_format($purchase->net_total + $prev_balance, 2) }}</td>
                        </tr>
                        <!-- Cash Received -->
                        <tr>
                            <td class="label">Paid Amount :-</td>
                            <td class="value">{{ number_format($purchase->paid_amount, 2) }}</td>
                        </tr>
                        <!-- Divider Line -->
                        <tr>
                            <td colspan="2" style="border-bottom: 1px dashed #000;"></td>
                        </tr>

                        <!-- Total Payable -->
                        <tr>
                            <td class="label">Net Payable :</td>
                            <td class="value">{{ number_format(($purchase->net_total + $prev_balance) - $purchase->paid_amount, 2) }}</td>
                        </tr>
                    </table>
                </div>
            </div>

        </div>
    </div>
</body>

</html>