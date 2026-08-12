<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Purchase Return Debit Note (Small)</title>
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
@php
    $firm = $firm ?? (isset($purchaseReturn->firm) ? $purchaseReturn->firm : null) ?? (isset($purchaseReturn->firm_id) ? \App\Models\Firm::find($purchaseReturn->firm_id) : null) ?? \App\Models\Firm::where('defult', 1)->first() ?? \App\Models\Firm::first();
@endphp

        <!-- Header -->
        <div class="header text-center">
            <div class="brand-name">{{ strtoupper($firm->name ?? 'HARMAIN TRADERS') }}</div>
            <div class="contact-info">
                Phone No. : {{ $firm->phone ?? '' }} @if(!empty($firm->fax)) &nbsp; Fax No. : {{ $firm->fax }} @endif
            </div>
        </div>

        <!-- Invoice Bar -->
        <div class="invoice-bar">PURCHASE RETURN</div>

        <!-- Return Info -->
        <div class="info-section">
            <div class="info-row">
                <span class="info-label">Supplier:</span>
                <span class="info-value">{{ $purchaseReturn->supplier->title }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Address:</span>
                <span class="info-value">{{ $purchaseReturn->supplier->address1 ?? 'N/A' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Voucher No:</span>
                <span class="info-value">{{ $purchaseReturn->invoice }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Ref Invoice:</span>
                <span class="info-value">{{ $purchaseReturn->original_invoice }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date/Time:</span>
                <span class="info-value">{{ \Carbon\Carbon::parse($purchaseReturn->date)->format('l F d Y h:i A') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Officer:</span>
                <span class="info-value">{{ $purchaseReturn->salesman->name ?? 'Standard' }}</span>
            </div>
        </div>

        <!-- Table -->
        @php
        $hasBonus = $purchaseReturn->items->sum('bonus_qty_carton') > 0 || $purchaseReturn->items->sum('bonus_qty_pcs') > 0;
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
                @foreach($purchaseReturn->items as $item)
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
                <span class="total-label">Net Return Amount :-</span>
                <span class="total-value">{{ number_format($purchaseReturn->net_total - $purchaseReturn->extra_discount, 0) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Previous Balance :-</span>
                <span class="total-value">{{ number_format($purchaseReturn->previous_balance, 0) }}</span>
            </div>

            <div class="dashed-bottom" style="margin: 2px 0;"></div>

            <div class="total-row clearfix bold">
                <span class="total-label">Total Balance :-</span>
                <span class="total-value">{{ number_format($purchaseReturn->previous_balance - ($purchaseReturn->net_total - $purchaseReturn->extra_discount), 2) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Cash Received :-</span>
                <span class="total-value">{{ number_format($purchaseReturn->paid_amount, 0) }}</span>
            </div>

            <div class="dashed-bottom" style="margin: 2px 0;"></div>

            <div class="total-row clearfix bold">
                <span class="total-label">Net Outstanding :</span>
                <span class="total-value">{{ number_format($purchaseReturn->previous_balance - ($purchaseReturn->net_total - $purchaseReturn->extra_discount) + $purchaseReturn->paid_amount, 2) }}</span>
            </div>
        </div>

        @if($purchaseReturn->remarks)
        <div class="dashed-bottom" style="margin: 2px 0;"></div>
        <div style="font-size: 8px; color: #444; font-style: italic; margin-top: 2px;">
            Remarks: {{ $purchaseReturn->remarks }}
        </div>
        @endif

        <!-- Footer -->
        <div class="footer-text text-center">
            <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
            <div style="font-size: 9px; color: #000; margin-bottom: 2px;">
                Phone: {{ $firm->phone ?? '' }} &nbsp;&middot;&nbsp; Email: {{ $firm->email ?? '' }}
            </div>
            <div style="font-size: 9px; font-weight: bold; color: #000; margin-bottom: 2px;">
                This is a computer-generated receipt.
            </div>
            <div style="font-size: 9px; font-weight: bold; color: #000;">
                Thank you for choosing Haramain Traders.
            </div>
            <div style="font-size: 7.5px; color: #555; margin-top: 4px; letter-spacing: 0.3px;">
                Design &amp; Develop by <strong>Aishtycoons</strong> <span style="font-family: DejaVu Sans, serif; font-size: 10px;">&#9829;</span>
            </div>
        </div>
    </div>
</body>

</html>
