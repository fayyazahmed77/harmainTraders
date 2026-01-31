<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Purchase Invoice (Small)</title>
    <style>
        * {
            box-sizing: border-box;
        }

        @page {
            margin: 2mm;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #000;
            font-size: 10px;
            margin: 0;
            padding: 0;
            line-height: 1.3;
        }

        .receipt-wrapper {
            width: 75mm;
            /* Reduced width for safety on 80mm paper */
            margin: 0;
        }

        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-left {
            text-align: left;
        }

        .bold {
            font-weight: bold;
        }

        .header {
            margin-bottom: 5px;
            padding-right: 2mm;
        }

        .brand-name {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .contact-info {
            font-size: 9px;
            margin-bottom: 5px;
        }

        .invoice-bar {
            border: 1px dashed #000;
            color: #000;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            padding: 2px 0;
            text-transform: uppercase;
            margin-bottom: 5px;
            width: 100%;
        }

        .info-section {
            margin-bottom: 5px;
            font-size: 9px;
        }

        .info-row {
            margin-bottom: 2px;
        }

        .info-label {
            display: inline-block;
            width: 60px;
            color: #333;
        }

        .info-value {
            font-weight: bold;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }

        .items-table th {
            border-bottom: 1px solid #000;
            padding: 2px 0;
            font-size: 9px;
            text-align: left;
        }

        .items-table td {
            padding: 2px 0;
            font-size: 9px;
            vertical-align: top;
        }

        .border-top {
            border-top: 1px solid #000;
        }

        .border-bottom {
            border-bottom: 1px solid #000;
        }

        .dashed-bottom {
            border-bottom: 1px dashed #000;
        }

        .totals-section {
            width: 100%;
            font-size: 10px;
        }

        .total-row {
            margin-bottom: 2px;
        }

        .total-label {
            float: left;
            width: 70%;
            text-align: right;
            padding-right: 5px;
        }

        .total-value {
            float: right;
            width: 25%;
            text-align: right;
        }

        .footer-text {
            font-size: 9px;
            margin-top: 10px;
            color: #444;
        }

        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
    </style>
</head>

<body>

    <div class="receipt-wrapper">
        <!-- Header -->
        <div class="header text-center">
            <div class="brand-name">HARMAIN TRADERS</div>
            <div class="contact-info">
                Phone No. : 0332 3218684 &nbsp; Fax No. : 0332 3218684
            </div>
        </div>

        <!-- Invoice Bar -->
        <div class="invoice-bar">PURCHASE ESTIMATE</div>

        <!-- Supplier Info -->
        <div class="info-section">
            <div class="info-row">
                <span class="info-label">Supplier:</span>
                <span class="info-value">{{ $purchase->supplier->title }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Address:</span>
                <span class="info-value">{{ $purchase->supplier->address1 ?? 'N/A' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date/Time:</span>
                <span class="info-value">{{ \Carbon\Carbon::parse($purchase->date)->format('l F d Y h:i A') }}</span>
            </div>
        </div>

        <!-- Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 10%; text-align: center;">F</th>
                    <th style="width: 10%; text-align: center; border-left: 1px solid #000;">P</th>
                    <th style="width: 40%">Item(s)</th>
                    <th style="width: 15%; text-align: right;">Rate</th>
                    <th style="width: 25%; text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($purchase->items as $item)
                <tr>
                    <td class="text-center">{{ (int)$item->qty_carton }}</td>
                    <td class="text-center" style="border-left: 1px solid #000;">{{ (int)$item->qty_pcs }}</td>
                    <td>{{ $item->item->title }}</td>
                    <td class="text-right">{{ number_format($item->trade_price, 2) }}</td>
                    <td class="text-right">{{ number_format($item->subtotal, 0) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section border-top">
            <div class="total-row clearfix bold">
                <span class="total-label text-left">Total Items / Quantity :</span>
                <span class="total-value">{{ $purchase->items->count() }} / {{ $purchase->items->sum('total_pcs') }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Gross Amount :-</span>
                <span class="total-value">{{ number_format($purchase->gross_total, 2) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Courier Charges :-</span>
                <span class="total-value">{{ number_format($purchase->courier_charges ?? 0, 2) }}</span>
            </div>

            @if($purchase->discount_total > 0)
            <div class="total-row clearfix">
                <span class="total-label">Discount :-</span>
                <span class="total-value">{{ number_format($purchase->discount_total, 2) }}</span>
            </div>
            @endif

            <div class="total-row clearfix bold">
                <span class="total-label">Total Rs. :-</span>
                <span class="total-value">{{ number_format($purchase->net_total, 2) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Previous Balance :-</span>
                <span class="total-value">{{ number_format($purchase->supplier->opening_balance ?? 0, 2) }}</span>
            </div>

            <div class="dashed-bottom" style="margin: 2px 0;"></div>

            <div class="total-row clearfix bold">
                <span class="total-label">Total Balance :-</span>
                <span class="total-value">{{ number_format($purchase->net_total + ($purchase->supplier->opening_balance ?? 0), 2) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Paid Amount :-</span>
                <span class="total-value">{{ number_format($purchase->paid_amount, 2) }}</span>
            </div>

            <div class="dashed-bottom" style="margin: 2px 0;"></div>

            <div class="total-row clearfix bold">
                <span class="total-label">Net Payable :</span>
                <span class="total-value">{{ number_format(($purchase->net_total + ($purchase->supplier->opening_balance ?? 0)) - $purchase->paid_amount, 2) }}</span>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer-text text-center">
            Thank You for coming to Harnain Traders
        </div>
    </div>
</body>

</html>