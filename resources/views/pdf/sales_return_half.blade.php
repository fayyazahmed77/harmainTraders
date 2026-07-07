<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Sales Return Credit Note (Small)</title>
    <style>
        * {
            box-sizing: border-box;
        }

        @page {
            margin: 1mm;
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
            width: 64mm;
            margin: 0 auto;
            padding-right: 3mm;
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

        .w-bonus {
            width: 34%;
        }

        .w-normal {
            width: 47%;
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
            width: 65%;
            text-align: right;
            padding-right: 5px;
        }

        .total-value {
            float: right;
            width: 33%;
            text-align: right;
            padding-right: 2mm;
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
                Phone No. : 0332-3228684 &nbsp; Fax No. : 0343-8772357
            </div>
        </div>

        <!-- Invoice Bar -->
        <div class="invoice-bar">SALES RETURN</div>

        <!-- Return Info -->
        <div class="info-section">
            <div class="info-row">
                <span class="info-label">Customer:</span>
                <span class="info-value">{{ $salesReturn->customer->title }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Address:</span>
                <span class="info-value">{{ $salesReturn->customer->address1 ?? 'N/A' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Voucher No:</span>
                <span class="info-value">{{ $salesReturn->invoice }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Ref Invoice:</span>
                <span class="info-value">{{ $salesReturn->original_invoice }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date/Time:</span>
                <span class="info-value">{{ \Carbon\Carbon::parse($salesReturn->date)->format('l F d Y h:i A') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Salesman:</span>
                <span class="info-value">{{ $salesReturn->salesman->name ?? 'Direct' }}</span>
            </div>
        </div>

        <!-- Table -->
        @php
        $hasBonus = $salesReturn->items->sum('bonus_qty_carton') > 0 || $salesReturn->items->sum('bonus_qty_pcs') > 0;
        @endphp
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 7%; text-align: center;">F</th>
                    <th style="width: 7%; text-align: center; border-left: 1px solid #000;">P</th>
                    @if($hasBonus)
                    <th style="width: 10%; text-align: center;">Bns</th>
                    @endif
                    <th class="{{ $hasBonus ? 'w-bonus' : 'w-normal' }}">Item(s)</th>
                    <th style="width: 13%; text-align: right; border-left: 1px solid #000; padding-right: 1mm;">Rate</th>
                    <th style="width: 9%; text-align: right; border-left: 1px solid #000; padding-right: 1mm;">Dis</th>
                    <th style="width: 17%; text-align: right; border-left: 1px solid #000; padding-right: 1mm;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($salesReturn->items as $item)
                @php
                $bonusText = '';
                if ($item->bonus_qty_carton > 0) $bonusText .= number_format($item->bonus_qty_carton,0).'B ';
                if ($item->bonus_qty_pcs > 0) $bonusText .= number_format($item->bonus_qty_pcs,0).'P';
                @endphp
                <tr>
                    <td class="text-center">{{ (int)$item->qty_carton }}</td>
                    <td class="text-center" style="border-left: 1px solid #000;">{{ (int)$item->qty_pcs }}</td>
                    @if($hasBonus)
                    <td class="text-center">{{ $bonusText ?: '-' }}</td>
                    @endif
                    <td>{{ $item->item->title }}</td>
                    <td class="text-right" style="border-left: 1px solid #000; padding-right: 1mm;">{{ number_format($item->trade_price, 0) }}</td>
                    <td class="text-right" style="border-left: 1px solid #000; padding-right: 1mm;">{{ number_format($item->discount, 0) }}</td>
                    <td class="text-right" style="border-left: 1px solid #000; padding-right: 1mm;">{{ number_format($item->subtotal, 0) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section border-top">
            <div class="total-row clearfix bold">
                <span class="total-label text-left">Items Reclaimed :</span>
                <span class="total-value">{{ $salesReturn->items->count() }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Gross Reversal :-</span>
                <span class="total-value">{{ number_format($salesReturn->gross_total, 2) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Tax Adjustment :-</span>
                <span class="total-value">{{ number_format($salesReturn->tax_total, 2) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Discount Reclaim :-</span>
                <span class="total-value">- {{ number_format($salesReturn->discount_total, 2) }}</span>
            </div>

            <div class="dashed-bottom" style="margin: 2px 0;"></div>

            <div class="total-row clearfix bold">
                <span class="total-label">Net Credit :-</span>
                <span class="total-value">{{ number_format($salesReturn->net_total, 2) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Extra Discount :-</span>
                <span class="total-value">- {{ number_format($salesReturn->extra_discount, 2) }}</span>
            </div>

            <div class="total-row clearfix bold">
                <span class="total-label">Net Return Amount :-</span>
                <span class="total-value">{{ number_format($salesReturn->net_total - $salesReturn->extra_discount, 2) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Previous Balance :-</span>
                <span class="total-value">{{ number_format($salesReturn->previous_balance, 2) }}</span>
            </div>

            <div class="dashed-bottom" style="margin: 2px 0;"></div>

            <div class="total-row clearfix bold">
                <span class="total-label">Total Balance :-</span>
                <span class="total-value">{{ number_format($salesReturn->previous_balance - ($salesReturn->net_total - $salesReturn->extra_discount), 2) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Cash Refunded :-</span>
                <span class="total-value">{{ number_format($salesReturn->paid_amount, 2) }}</span>
            </div>

            <div class="dashed-bottom" style="margin: 2px 0;"></div>

            <div class="total-row clearfix bold">
                <span class="total-label">Net Receivable :</span>
                <span class="total-value">{{ number_format($salesReturn->previous_balance - ($salesReturn->net_total - $salesReturn->extra_discount) + $salesReturn->paid_amount, 2) }}</span>
            </div>
        </div>

        @if($salesReturn->remarks)
        <div class="dashed-bottom" style="margin: 2px 0;"></div>
        <div style="font-size: 8px; color: #444; font-style: italic; margin-top: 2px;">
            Remarks: {{ $salesReturn->remarks }}
        </div>
        @endif

        <!-- Footer -->
        <div class="footer-text text-center">
            Sales Return Credit Note
        </div>
    </div>
</body>

</html>
