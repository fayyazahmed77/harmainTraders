@php
    $fmtNum = function($num) {
        return fmod((float)$num, 1) == 0 ? number_format((float)$num, 0) : number_format((float)$num, 2);
    };

    $supplier_type_label = (isset($order->supplier) && $order->supplier->type == 5) ? 'Company:' : 'Supplier:';
@endphp
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Supplier Order #ORD-{{ str_pad($order->id, 5, '0', STR_PAD_LEFT) }} (Thermal)</title>
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
            font-size: 9px;
            margin: 0;
            padding: 0;
            line-height: 1.3;
        }

        .receipt-wrapper {
            width: 64mm;
            margin: 0 auto;
            padding-right: 2mm; /* Prevent side cut-off */
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
        }

        .brand-name {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .contact-info {
            font-size: 8px;
            margin-bottom: 3px;
        }

        .voucher-bar {
            border: 1px dashed #000;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 0;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .info-section {
            margin-bottom: 5px;
            font-size: 8.5px;
        }

        .info-row {
            margin-bottom: 2px;
        }

        .info-label {
            display: inline-block;
            width: 65px;
            color: #000;
            font-weight: bold;
        }

        .info-value {
            font-weight: bold;
        }

        .divider {
            border-bottom: 1px dashed #000;
            margin: 4px 0;
        }

        .alloc-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
            margin-top: 3px;
        }

        .alloc-table th {
            border-bottom: 1px solid #000;
            padding: 2px 0;
            font-size: 8px;
            text-align: left;
            font-weight: bold;
        }

        .alloc-table td {
            padding: 2px 0;
            font-size: 8px;
            vertical-align: top;
            border-bottom: 1px solid #000;
        }

        .totals-section {
            width: 100%;
            font-size: 9px;
            margin-top: 5px;
        }

        .total-row {
            margin-bottom: 2px;
        }

        .total-label {
            float: left;
            width: 65%;
            text-align: right;
            padding-right: 5px;
            font-weight: bold;
        }

        .total-value {
            float: right;
            width: 35%;
            text-align: right;
            font-weight: bold;
        }

        .footer-note {
            font-size: 7.5px;
            color: #000;
            font-weight: bold;
            margin-top: 8px;
            text-align: center;
        }

        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }

        @media print {
            body {
                width: 100%;
                padding: 0;
            }
            .no-print {
                display: none !important;
            }
        }
    </style>
</head>

<body onload="window.print()">

    <div class="no-print" style="margin-bottom: 10px; text-align: center;">
        <button onclick="window.print()" style="padding: 6px 16px; background: #ea580c; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
            🖨️ Print Receipt
        </button>
    </div>

    <div class="receipt-wrapper">
        <!-- Brand Header -->
        <div class="header text-center">
            <div class="brand-name">HARMAIN TRADERS</div>
            <div class="contact-info">Wholesale & Supply Chain</div>
        </div>

        <!-- Order Bar -->
        <div class="voucher-bar">
            SUPPLIER ORDER
        </div>

        <!-- Meta Info -->
        <div class="info-section">
            <div class="info-row">
                <span class="info-label">Order #:</span>
                <span class="info-value">ORD-{{ str_pad($order->id, 5, '0', STR_PAD_LEFT) }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">{{ \Carbon\Carbon::parse($order->order_date)->format('d M Y') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">{{ $supplier_type_label }}</span>
                <span class="info-value">{{ $order->supplier->title ?? 'N/A' }}</span>
            </div>
            @if($order->supplier && $order->supplier->phone)
            <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">{{ $order->supplier->phone }}</span>
            </div>
            @endif
        </div>

        <div class="divider"></div>

        <!-- Items Table -->
        <table class="alloc-table">
            <thead>
                <tr>
                    <th style="width: 45%;">Item</th>
                    <th class="text-center" style="width: 18%;">Qty</th>
                    <th class="text-right" style="width: 18%;">Rate</th>
                    <th class="text-right" style="width: 19%;">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->items as $item)
                <tr>
                    <td class="bold">
                        {{ $item->item->title ?? 'Unknown Item' }}
                    </td>
                    <td class="text-center">
                        {{ $item->qty_full > 0 ? $item->qty_full . 'F' : '' }}{{ $item->qty_full > 0 && $item->qty_pcs > 0 ? '+' : '' }}{{ $item->qty_pcs > 0 ? $item->qty_pcs . 'P' : '' }}
                    </td>
                    <td class="text-right">
                        {{ $fmtNum($item->net_rate) }}
                    </td>
                    <td class="text-right bold">
                        {{ $fmtNum($item->subtotal) }}
                    </td>
                </tr>
                @endforeach
                @if($order->items->isEmpty())
                <tr>
                    <td colspan="4" class="text-center">No items found.</td>
                </tr>
                @endif
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
            <div class="total-row clearfix">
                <div class="total-label">Total Items:</div>
                <div class="total-value">{{ $order->items->count() }}</div>
            </div>
            @if($order->total_discount > 0)
            <div class="total-row clearfix">
                <div class="total-label">Total Discount:</div>
                <div class="total-value">Rs {{ $fmtNum($order->total_discount) }}</div>
            </div>
            @endif
            <div class="divider"></div>
            <div class="total-row clearfix" style="font-size: 11px;">
                <div class="total-label">NET AMOUNT:</div>
                <div class="total-value">Rs {{ $fmtNum($order->total_amount) }}</div>
            </div>
        </div>

        <div class="divider"></div>

        <!-- Footer -->
        <div class="footer-note">
            <div>Software by AishTycoons (0300-2086828)</div>
            <div style="margin-top: 2px;">Printed: {{ now()->format('d-m-Y h:i A') }}</div>
        </div>
    </div>

</body>
</html>
