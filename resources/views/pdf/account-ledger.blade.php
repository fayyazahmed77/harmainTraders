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
    <title>Account Ledger</title>
    <style>
        * {
            box-sizing: border-box;
        }

        @page {
            margin: 1cm;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #000;
            font-size: 11px;
            margin: 0;
            padding: 10px;
        }

        /* Padding wrappers */
        .content-padding {
            padding: 0 20px;
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
            text-align: right;
            padding-right: 25px;
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
    </style>
    @if($is_print_mode ?? false)
    <script>
        window.onload = function() {
            window.print();
        }
    </script>
    @endif
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

    <div class="banner-row">
        <table class="banner-table">
            <tr>
                <td style="width: 35%; vertical-align: middle;">
                    <div style="border-bottom: 1px dashed #000; width: 100%;"></div>
                </td>
                <td style="text-align: center; vertical-align: middle; padding: 0 15px;">
                    <div class="invoice-text" style="padding-right: 0; text-align: center;">LEDGER</div>
                </td>
                <td style="width: 35%; vertical-align: middle;">
                    <div style="border-bottom: 1px dashed #000; width: 100%;"></div>
                </td>
            </tr>
        </table>
    </div>

    <div class="content-padding">
        <div class="info-section clearfix">
            <div class="invoice-to-wrapper">
                <div class="customer-name">Account : {{ $account->title }}</div>
                <div class="customer-address">
                    Generated on : {{ date('d-M-Y h:i A') }}
                </div>
            </div>
            <div class="invoice-details-wrapper">
                <table class="details-table" align="right">
                    <tr>
                        <td class="detail-label-cell">From Date :</td>
                        <td class="detail-value-cell">{{ \Carbon\Carbon::parse($from_date)->format('d-M-Y') }}</td>
                    </tr>
                    <tr>
                        <td class="detail-label-cell">To Date :</td>
                        <td class="detail-value-cell">{{ \Carbon\Carbon::parse($to_date)->format('d-M-Y') }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="items-section">
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 15%;">Date</th>
                        <th style="width: 40%;" class="text-left">Description</th>
                        <th style="width: 15%;">Debit</th>
                        <th style="width: 15%;">Credit</th>
                        <th style="width: 15%;" class="no-right-border">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Opening Balance Row -->
                    <tr style="background-color: #f9f9f9;">
                        <td>-</td>
                        <td class="text-left" style="font-weight: bold;">OPENING BALANCE</td>
                        <td class="text-right">-</td>
                        <td class="text-right">-</td>
                        <td class="text-right no-right-border" style="font-weight: bold;">{{ number_format($opening_balance, 2) }}</td>
                    </tr>

                    @php $running_balance = $opening_balance; @endphp

                    @foreach($data as $row)
                    @php
                    $debit = $row->debit;
                    $credit = $row->credit;

                    if ($balance_type === 'cr') {
                    $running_balance += ($credit - $debit);
                    } else {
                    $running_balance += ($debit - $credit);
                    }
                    @endphp
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($row->date)->format('d-M-y') }}</td>
                        <td class="text-left">
                            <div>{{ $row->description }}</div>
                            <div style="font-size: 9px; color: #666;">{{ $row->type }} #{{ $row->id }}</div>
                        </td>
                        <td class="text-right">{{ $debit > 0 ? number_format($debit, 2) : '-' }}</td>
                        <td class="text-right">{{ $credit > 0 ? number_format($credit, 2) : '-' }}</td>
                        <td class="text-right no-right-border" style="font-weight: bold;">{{ number_format($running_balance, 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="footer-section clearfix" style="margin-top: 10px;">
            <div style="float: right; width: 40%;">
                <table class="footer-totals-table" align="right">
                    <tr>
                        <td class="label">Total Debit :</td>
                        <td class="value">{{ number_format($total_debit, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="label">Total Credit :</td>
                        <td class="value">{{ number_format($total_credit, 2) }}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="border-bottom: 1px dashed #000;"></td>
                    </tr>
                    <tr>
                        <td class="label" style="font-size: 12px;">CLOSING BALANCE :</td>
                        <td class="value" style="font-size: 12px;">{{ number_format($closing_balance, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="label" style="font-size: 10px; color: #666;">Status :</td>
                        <td class="value" style="font-size: 10px; color: #666;">{{ $closing_balance >= 0 ? 'SOLVENT' : 'OVERDRAWN' }}</td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</body>

</html>