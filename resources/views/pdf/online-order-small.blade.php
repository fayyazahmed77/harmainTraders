<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Order Invoice (Small) - {{ $order->order_no }}</title>
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
            width: 66mm;
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
            font-size: 15px;
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
            font-size: 10px;
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

        .items-table thead {
            display: table-header-group;
        }

        .items-table tr {
            page-break-inside: avoid;
        }

        .items-table th {
            border-bottom: 1px solid #000;
            padding: 2px 0;
            font-size: 8.5px;
            text-align: left;
        }

        .items-table td {
            padding: 2px 0;
            font-size: 8.5px;
            vertical-align: top;
            word-wrap: break-word;
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
            font-size: 9.5px;
            page-break-inside: avoid;
        }

        .total-row {
            margin-bottom: 2px;
        }

        .total-label {
            float: left;
            width: 63%;
            text-align: right;
            padding-right: 5px;
        }

        .total-value {
            float: right;
            width: 35%;
            text-align: right;
            padding-right: 2mm;
        }

        .footer-text {
            font-size: 8.5px;
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
            $firm = $firm ?? \App\Models\Firm::where('defult', 1)->first() ?? \App\Models\Firm::first();
            $submittedDate = \Carbon\Carbon::parse($order->submitted_at ?? $order->created_at)->setTimezone('Asia/Karachi');
        @endphp

        <!-- Header -->
        <div class="header text-center">
            <div class="brand-name">{{ strtoupper($firm->name ?? 'HARAMAIN TRADERS') }}</div>
            <div class="contact-info">
                WhatsApp / Phone : {{ $firm->phone ?? '0331 8102001' }}
            </div>
        </div>

        <!-- Invoice Bar -->
        <div class="invoice-bar">
            @if($order->status === 'confirmed' && $order->sale)
                SALE INVOICE ({{ $order->sale->invoice }})
            @else
                ONLINE ORDER ESTIMATE
            @endif
        </div>

        <!-- Customer Info -->
        <div class="info-section">
            <div class="info-row">
                <span class="info-label">Customer:</span>
                <span class="info-value">{{ $order->customerUser?->name ?? 'Customer' }}</span>
            </div>
            @if($order->customerUser?->mobile)
            <div class="info-row">
                <span class="info-label">Mobile:</span>
                <span class="info-value">{{ $order->customerUser->mobile }}</span>
            </div>
            @endif
            <div class="info-row">
                <span class="info-label">Address:</span>
                <span class="info-value">{{ $order->customerUser?->address ?? ($order->customerUser?->account?->address1 ?? 'N/A') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">{{ strtoupper($submittedDate->format('d M Y')) }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Time:</span>
                <span class="info-value">{{ $submittedDate->format('h:i A') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Order #:</span>
                <span class="info-value">{{ $order->order_no }}</span>
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr class="border-top border-bottom">
                    <th style="width: 8%; text-align: center; border-left: 1px solid #000;">Box</th>
                    <th style="width: 8%; text-align: center; border-left: 1px solid #000;">Pcs</th>
                    <th style="width: 44%; border-left: 1px solid #000; padding-left: 1mm;">Item(s)</th>
                    <th style="width: 18%; text-align: right; border-left: 1px solid #000; padding-right: 1mm;">Rate</th>
                    <th style="width: 22%; text-align: right; border-left: 1px solid #000; padding-right: 1mm; border-right: 1px solid #000;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $sumTotalPcs = 0;
                @endphp
                @foreach($order->items as $it)
                    @php
                        $packing = (float)($it->packing_qty_snapshot ?: ($it->item?->packing_size ?: ($it->item?->packing_qty ?: 1)));
                        if ($packing <= 0) $packing = 1;
                        $totalPcs = (float)($it->total_pcs ?: $it->quantity ?: 0);
                        $sumTotalPcs += $totalPcs;
                        $unitPrice = (float)($it->price_piece ?: $it->unit_price ?: 0);
                        $subtotal = (float)($it->line_subtotal ?: $it->subtotal ?: ($totalPcs * $unitPrice));
                        $cartons = (int)($it->qty_carton ?? floor($totalPcs / $packing));
                        $loosePcs = (int)($it->qty_pcs ?? fmod($totalPcs, $packing));
                    @endphp
                    <tr>
                        <td class="text-center" style="border-left: 1px solid #000;">{{ $cartons }}</td>
                        <td class="text-center" style="border-left: 1px solid #000;">{{ $loosePcs }}</td>
                        <td style="border-left: 1px solid #000; padding-left: 1mm;">{{ $it->item_name_snapshot ?: $it->item_name ?: $it->item?->title }}</td>
                        <td class="text-right" style="border-left: 1px solid #000; padding-right: 1mm;">{{ number_format($unitPrice, 2) }}</td>
                        <td class="text-right" style="border-left: 1px solid #000; padding-right: 1mm; border-right: 1px solid #000;">{{ number_format($subtotal, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals -->
        @php
            $grossSubtotal = (float)($order->current_subtotal ?: $order->original_subtotal ?: $order->final_total);
            $extraDiscount = (float)($order->discount_amount ?? 0);
            $courierCharges = (float)($order->delivery_charges ?? 0);
            $finalPayable = (float)($order->final_total ?? max(0, $grossSubtotal - $extraDiscount + $courierCharges));
            $prevBalance = (float)($previousBalance ?? 0);
            $cashReceived = (float)($order->sale?->paid_amount ?? 0);
            $totalBalance = $finalPayable + $prevBalance;
            $totalReceivable = max(0, $totalBalance - $cashReceived);
        @endphp
        <div class="totals-section border-top">
            <div class="total-row clearfix bold">
                <span class="total-label text-left">Total Items / Quantity :</span>
                <span class="total-value">{{ $order->items->count() }} / {{ number_format($sumTotalPcs) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Courier Charges :-</span>
                <span class="total-value">{{ number_format($courierCharges, 2) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Extra Discount :-</span>
                <span class="total-value">-{{ number_format($extraDiscount, 2) }}</span>
            </div>

            <div class="total-row clearfix bold">
                <span class="total-label">Total Rs. :-</span>
                <span class="total-value">{{ number_format($finalPayable, 2) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Previous Balance :-</span>
                <span class="total-value">{{ number_format($prevBalance, 2) }}</span>
            </div>

            <div class="dashed-bottom" style="margin: 2px 0;"></div>

            <div class="total-row clearfix bold">
                <span class="total-label">Total Balance :-</span>
                <span class="total-value">{{ number_format($totalBalance, 2) }}</span>
            </div>

            <div class="total-row clearfix">
                <span class="total-label">Cash Received :-</span>
                <span class="total-value">{{ number_format($cashReceived, 2) }}</span>
            </div>

            <div class="dashed-bottom" style="margin: 2px 0;"></div>

            <div class="total-row clearfix bold">
                <span class="total-label">Total Receivable :</span>
                <span class="total-value">{{ number_format($totalReceivable, 2) }}</span>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer-text text-center">
            <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
            <div style="font-size: 9px; font-weight: bold; color: #000;">
                Thank you for choosing {{ $firm->name ?? 'Haramain Traders' }}.
            </div>
        </div>
    </div>
</body>

</html>
