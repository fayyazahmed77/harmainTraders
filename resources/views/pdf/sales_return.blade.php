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
    <title>Credit Note - Sales Return</title>
    <style>
        * {
            box-sizing: border-box;
        }

        @page {
            margin: 0.3cm;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #000;
            font-size: 10px;
            margin: 0;
            padding: 0;
        }

        .content-padding {
            padding: 0 5px;
        }

        .top-section {
            padding-top: 2px;
            padding-bottom: 1px;
        }

        .logo-icon {
            display: inline-block;
            vertical-align: middle;
            width: 30px;
            height: 30px;
            border-radius: 8px;
            margin-right: 15px;
            text-align: center;
        }

        .brand-text {
            display: inline-block;
            vertical-align: middle;
        }

        .brand-name {
            font-size: 14px;
            font-weight: bold;
            color: #444;
            line-height: 1;
        }

        .brand-tagline {
            font-size: 7px;
            color: #888;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-top: 1px;
        }

        .header-contact {
            float: right;
            text-align: right;
            vertical-align: middle;
            padding-top: 2px;
        }

        .contact-item {
            font-size: 10px;
            font-weight: bold;
            color: #000;
            margin-bottom: 1px;
        }

        .banner-row {
            width: 100%;
            margin-bottom: 3px;
            margin-top: 2px;
            overflow: hidden;
        }

        .banner-table {
            width: 100%;
            border-collapse: collapse;
        }

        .invoice-text {
            font-size: 18px;
            color: #444;
            text-transform: uppercase;
            font-weight: 500;
            text-align: center;
            letter-spacing: 1px;
            line-height: 1;
            font-family: sans-serif;
        }

        .info-section {
            margin-bottom: 3px;
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
            font-size: 12px;
            font-weight: bold;
            color: #222;
            margin-bottom: 1px;
        }

        .customer-address {
            color: #555;
            font-size: 10px;
            line-height: 1.2;
            max-width: 300px;
        }

        .details-table {
            width: 100%;
            text-align: right;
            border-collapse: collapse;
        }

        .detail-label-cell {
            padding-bottom: 1px;
            font-weight: bold;
            color: #444;
            font-size: 10px;
            padding-right: 15px;
        }

        .detail-value-cell {
            padding-bottom: 1px;
            font-weight: bold;
            color: #222;
            font-size: 10px;
        }

        .items-section {
            margin-bottom: 2px;
            border: 1px dashed #000;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
        }

        .items-table th {
            color: #000;
            padding: 2px 2px;
            text-align: center;
            font-weight: bold;
            font-size: 9px;
            text-transform: capitalize;
            border-bottom: 1px dashed #000;
            border-right: 1px dashed #000;
        }

        .items-table td {
            padding: 2px 3px;
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

        .footer-section {
            margin-top: 1px;
            color: #000;
        }

        .footer-left {
            width: 30%;
            float: left;
            padding-top: 3px;
        }

        .footer-center {
            width: 30%;
            float: left;
            text-align: center;
            padding-top: 3px;
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
            padding: 1px 0;
            font-size: 10px;
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
            margin-top: 20px;
            border-top: 1px dashed #000;
            width: 150px;
            text-align: center;
            padding-top: 3px;
            font-weight: bold;
            font-size: 10px;
        }

        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }

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

    <div class="banner-row">
        <table class="banner-table">
            <tr>
                <td style="width: 30%; vertical-align: middle;">
                    <div style="border-bottom: 2px solid #000; width: 100%;"></div>
                </td>
                <td style="text-align: center; vertical-align: middle; padding: 0 15px;">
                    <div class="invoice-text">SALES RETURN</div>
                </td>
                <td style="width: 30%; vertical-align: middle;">
                    <div style="border-bottom: 2px solid #000; width: 100%;"></div>
                </td>
            </tr>
        </table>
    </div>

    <div class="content-padding">

        <div class="info-section clearfix">
            <div class="invoice-to-wrapper">
                <div class="customer-name">Client Name : {{ $salesReturn->customer->title }}</div>
                <div class="customer-address">
                    Address : {{ $salesReturn->customer->address1 ?? 'N/A' }}
                </div>
                <div class="customer-address" style="font-weight: bold; color: #222; margin-top: 2px;">
                    Reference Invoice : {{ $salesReturn->original_invoice }}
                </div>
            </div>
            <div class="invoice-details-wrapper">
                <table class="details-table" align="right">
                    <tr>
                        <td class="detail-label-cell">Voucher No :</td>
                        <td class="detail-value-cell">{{ $salesReturn->invoice }}</td>
                    </tr>
                    <tr>
                        <td class="detail-label-cell">Return Date :</td>
                        <td class="detail-value-cell">{{ \Carbon\Carbon::parse($salesReturn->date)->format('d-M-y') }}</td>
                    </tr>
                    <tr>
                        <td class="detail-label-cell">Salesman :</td>
                        <td class="detail-value-cell">{{ $salesReturn->salesman->name ?? 'Direct' }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="items-section">
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 40px;">Box</th>
                        <th style="width: 40px;">Pcs</th>
                        <th class="text-left" style="width: 45%;">Description of Goods Returned</th>
                        <th>Rate</th>
                        <th>Duty %</th>
                        <th>Dec %</th>
                        <th style="border-right: none;" class="text-right">Net Credit</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($salesReturn->items as $item)
                    <tr>
                        <td>{{ $item->qty_carton }}</td>
                        <td>{{ $item->qty_pcs }}</td>
                        <td class="text-left">{{ $item->item->title }}</td>
                        <td>{{ number_format($item->trade_price, 2) }}</td>
                        @php
                        $base = $item->subtotal - $item->gst_amount;
                        $taxPer = ($base > 0) ? ($item->gst_amount / $base) * 100 : 0;
                        $discBase = $base + $item->discount;
                        $discPer = ($discBase > 0) ? ($item->discount / $discBase) * 100 : 0;
                        @endphp
                        <td>{{ number_format($taxPer, 2) }}</td>
                        <td>{{ number_format($discPer, 2) }}</td>
                        <td class="text-right" style="border-right: none;">{{ number_format($item->subtotal, 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="footer-section clearfix">
            <div class="footer-left">
                <div style="font-weight: bold; margin-bottom: 25px; font-size: 10px;">
                    Items Reclaimed : &nbsp; {{ $salesReturn->items->count() }}
                </div>
                <div class="auth-sign-line">Authorized Signature</div>
            </div>

            <div class="footer-center">
                @if($salesReturn->remarks)
                <div style="font-size: 9px; color: #666; font-style: italic; margin-top: 5px;">
                    Remarks: {{ $salesReturn->remarks }}
                </div>
                @endif
            </div>

            <div class="footer-right">
                <table class="footer-totals-table" align="right">
                    <tr>
                        <td class="label">Gross Reversal :-</td>
                        <td class="value">{{ number_format($salesReturn->gross_total, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="label">Tax Adjustment :-</td>
                        <td class="value">{{ number_format($salesReturn->tax_total, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="label">Discount Reclaim :-</td>
                        <td class="value">- {{ number_format($salesReturn->discount_total, 2) }}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="border-bottom: 1px dashed #000;"></td>
                    </tr>
                    <tr style="font-size: 12px;">
                        <td class="label">NET CREDIT :-</td>
                        <td class="value">{{ number_format($salesReturn->net_total, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="label">Cash Refunded :-</td>
                        <td class="value">{{ number_format($salesReturn->paid_amount, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="label">Balance Adjusted :-</td>
                        <td class="value">{{ number_format($salesReturn->remaining_amount, 2) }}</td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</body>

</html>