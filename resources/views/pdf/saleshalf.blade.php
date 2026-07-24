<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Sale Invoice (Small)</title>
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
            /* Further reduced width for maximum safety on 80mm/58mm printers */
            margin: 0 auto;
            padding-right: 3mm; /* Safe margin for printer head to prevent cut-off */
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
            color: #000;
            font-weight: bold;
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
            color: #000;
            font-weight: bold;
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
        @if($firm)
        <!-- Header -->
        <div class="header text-center">
            <div class="brand-name">{{ strtoupper($firm->name) }}</div>
            <div class="contact-info">
                Phone No. : {{ $firm->phone }} &nbsp; Fax No. : {{ $firm->fax }}
            </div>
        </div>
        @endif

        <!-- Invoice Bar -->
        <div class="invoice-bar">ESTIMATE</div>

        <!-- Customer Info -->
        <div class="info-section">
            <div class="info-row">
                <span class="info-label">Customer:</span>
                <span class="info-value">{{ $sale->customer->title }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Address:</span>
                <span class="info-value">{{ $sale->customer->address1 ?? 'N/A' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">{{ strtoupper(\Carbon\Carbon::parse($sale->date)->format('d M Y')) }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Time:</span>
                <span class="info-value">{{ $sale->created_at ? \Carbon\Carbon::parse($sale->created_at)->setTimezone('Asia/Karachi')->format('h:i A') : \Carbon\Carbon::now()->setTimezone('Asia/Karachi')->format('h:i A') }}</span>
            </div>
        </div>

        <!-- Table -->
        @php
        $hasBonus = $sale->items->sum('bonus_qty_carton') > 0 || $sale->items->sum('bonus_qty_pcs') > 0;
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
                @foreach($sale->items as $item)
                @php
                $subtotal_gross = $item->subtotal; 
                $disc_percent = $subtotal_gross > 0 ? ($item->discount / $subtotal_gross) * 100 : 0;
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
                <span class="total-label text-left">Total Items / Quantity :</span>
                <span class="total-value">{{ $sale->items->count() }} / {{ $sale->items->sum('total_pcs') }}</span>
            </div>

            

            <div class="total-row clearfix">
                <span class="total-label">Courier Charges :-</span>
                <span class="total-value">{{ number_format($sale->courier_charges ?? 0, 2) }}</span>
            </div>
           @if($sale->extra_discount > 0)
            <div class="total-row clearfix">
                <span class="total-label">Extra Discount :-</span>
                <span class="total-value">{{ number_format($sale->extra_discount, 2) }}</span>
            </div>
            @endif
            <div class="total-row clearfix bold">
                <span class="total-label">Total Rs. :-</span>
                <span class="total-value">{{ number_format($sale->net_total - $sale->extra_discount, 2) }}</span>
            </div>

            

            @php
            $total_receivable = (float)($sale->total_receivable ?? 0);
            $remaining_amount = (float)($sale->remaining_amount ?? 0);
            $paid_amount = (float)($sale->paid_amount ?? 0);
            $prev_balance = $total_receivable > 0 
                ? max(0, round($total_receivable - ($remaining_amount + $paid_amount))) 
                : 0;
            @endphp

            <div class="total-row clearfix">
                <span class="total-label">Previous Balance :-</span>
                <span class="total-value">{{ number_format($prev_balance, 2) }}</span>
            </div>

            <div class="dashed-bottom" style="margin: 2px 0;"></div>

            <div class="total-row clearfix bold">
                <span class="total-label">Total Balance :-</span>
                <span class="total-value">{{ number_format(($sale->net_total - $sale->extra_discount) + $prev_balance, 2) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Cash Received :-</span>
                <span class="total-value">{{ number_format($sale->paid_amount, 2) }}</span>
            </div>

            <div class="dashed-bottom" style="margin: 2px 0;"></div>

            <div class="total-row clearfix bold">
                <span class="total-label">Total Receivable :</span>
                <span class="total-value">{{ number_format((($sale->net_total - $sale->extra_discount) + $prev_balance) - $sale->paid_amount, 2) }}</span>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer-text text-center">
            Thank You for coming to Harnain Traders
        </div>
    </div>
</body>

</html>