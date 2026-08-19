<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Supplier Order (Small)</title>
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
    $firm = $firm ?? (isset($order->firm) ? $order->firm : null) ?? (isset($order->firm_id) ? \App\Models\Firm::find($order->firm_id) : null) ?? \App\Models\Firm::where('defult', 1)->first() ?? \App\Models\Firm::first();
    $supplier_type_label = (isset($order->supplier) && $order->supplier->type == 5) ? 'Company:' : 'Supplier:';
    $fmtNum = function($num) {
        return fmod((float)$num, 1) == 0 ? number_format((float)$num, 0) : number_format((float)$num, 2);
    };
@endphp

        <!-- Header -->
        <div class="header text-center">
            <div class="brand-name">{{ strtoupper($firm->name ?? 'HARMAIN TRADERS') }}</div>
            <div class="contact-info">
                Phone No. : {{ $firm->phone ?? '' }} @if(!empty($firm->fax)) &nbsp; Fax No. : {{ $firm->fax }} @endif
            </div>
        </div>

        <!-- Invoice Bar -->
        <div class="invoice-bar">SUPPLIER ORDER</div>

        <!-- Order & Supplier Info -->
        <div class="info-section">
            <div class="info-row">
                <span class="info-label">{{ $supplier_type_label }}</span>
                <span class="info-value">{{ $order->supplier->title ?? 'N/A' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Order #:</span>
                <span class="info-value">ORD-{{ str_pad($order->id, 5, '0', STR_PAD_LEFT) }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">{{ strtoupper(\Carbon\Carbon::parse($order->order_date)->format('d M Y')) }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Time:</span>
                <span class="info-value">{{ $order->created_at ? \Carbon\Carbon::parse($order->created_at)->setTimezone('Asia/Karachi')->format('h:i A') : \Carbon\Carbon::now()->setTimezone('Asia/Karachi')->format('h:i A') }}</span>
            </div>
        </div>

        <!-- Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 8%; text-align: center;">F</th>
                    <th style="width: 8%; text-align: center; border-left: 1px solid #000;">P</th>
                    <th style="width: 45%;">Item(s)</th>
                    <th style="width: 17%; text-align: right; border-left: 1px solid #000; padding-right: 1mm;">Rate</th>
                    <th style="width: 22%; text-align: right; border-left: 1px solid #000; padding-right: 1mm;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->items as $item)
                <tr>
                    <td class="text-center">{{ (int)$item->qty_full }}</td>
                    <td class="text-center" style="border-left: 1px solid #000;">{{ (int)$item->qty_pcs }}</td>
                    <td>{{ $item->item->title ?? 'Unknown Item' }}</td>
                    <td class="text-right" style="border-left: 1px solid #000; padding-right: 1mm;">{{ $fmtNum($item->net_rate) }}</td>
                    <td class="text-right" style="border-left: 1px solid #000; padding-right: 1mm;">{{ $fmtNum($item->subtotal) }}</td>
                </tr>
                @endforeach
                @if($order->items->isEmpty())
                <tr>
                    <td colspan="5" class="text-center">No items found.</td>
                </tr>
                @endif
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section border-top">
            @php
            $totalF = $order->items->sum('qty_full');
            $totalP = $order->items->sum('qty_pcs');
            @endphp
            <div class="total-row clearfix bold">
                <span class="total-label text-left">Total Items / Qty :</span>
                <span class="total-value">{{ $order->items->count() }} / {{ $totalF }}F+{{ $totalP }}P</span>
            </div>

            @if($order->total_discount > 0)
            <div class="total-row clearfix">
                <span class="total-label">Total Discount :-</span>
                <span class="total-value">{{ $fmtNum($order->total_discount) }}</span>
            </div>
            @endif

            <div class="dashed-bottom" style="margin: 2px 0;"></div>

            <div class="total-row clearfix bold">
                <span class="total-label">Net Amount :-</span>
                <span class="total-value">Rs {{ $fmtNum($order->total_amount) }}</span>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer-text text-center">
            <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
            <div style="font-size: 9px; color: #000; margin-bottom: 2px;">
                Phone: {{ $firm->phone ?? '' }} &nbsp;&middot;&nbsp; Email: {{ $firm->email ?? '' }}
            </div>
            <div style="font-size: 9px; font-weight: bold; color: #000;">
                Thank you for choosing Haramain Traders.
            </div>
            <div style="font-size: 7.5px; color: #0a0a0aff; margin-top: 4px; letter-spacing: 0.3px;">
                Design &amp; Develop by <strong>Aishtycoons</strong> <span style="font-family: DejaVu Sans, serif; font-size: 10px;">&#9829;</span>
            </div>
        </div>
    </div>
</body>

</html>
