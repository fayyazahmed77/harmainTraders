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
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Supplier Order #ORD-{{ str_pad($order->id, 5, '0', STR_PAD_LEFT) }} (Thermal)</title>
    <style>
        @page {
            size: 80mm auto;
            margin: 2mm;
        }
        * {
            box-sizing: border-box;
            font-family: 'Courier New', Courier, monospace, sans-serif;
        }
        body {
            font-size: 10px;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 4px;
            width: 76mm;
            margin: 0 auto;
            line-height: 1.2;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }

        .brand-header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 6px;
            margin-bottom: 6px;
        }
        .brand-title {
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 1px;
        }
        .brand-subtitle {
            font-size: 9px;
            margin-top: 2px;
        }

        .order-title-box {
            border: 1px solid #000;
            padding: 3px;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 6px;
        }

        .meta-info {
            font-size: 9.5px;
            margin-bottom: 6px;
            border-bottom: 1px dashed #000;
            padding-bottom: 4px;
        }
        .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
        }

        table.items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-bottom: 6px;
        }
        table.items-table th {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 4px 1px;
            font-size: 9px;
        }
        table.items-table td {
            padding: 3px 1px;
            border-bottom: 1px dotted #ccc;
            vertical-align: top;
        }

        .totals-section {
            border-top: 1px dashed #000;
            padding-top: 4px;
            font-size: 10px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
        }

        .footer {
            margin-top: 10px;
            text-align: center;
            font-size: 8.5px;
            border-top: 1px dashed #000;
            padding-top: 6px;
        }

        @media print {
            body { width: 100%; padding: 0; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body onload="window.print()">

    <div class="no-print" style="margin-bottom: 10px; text-align: center;">
        <button onclick="window.print()" style="padding: 6px 16px; background: #ea580c; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
            🖨️ Print Receipt
        </button>
    </div>

    <div class="brand-header">
        @if($logo_base64)
            <img src="{{ $logo_base64 }}" alt="Logo" style="height: 28px; width: auto; margin-bottom: 3px;">
        @endif
        <div class="brand-title">HARMAIN TRADERS</div>
        <div class="brand-subtitle">Wholesale & Supply Chain</div>
    </div>

    <div class="order-title-box uppercase">
        SUPPLIER ORDER
    </div>

    <div class="meta-info">
        <div class="meta-row">
            <span>Order #: <strong>ORD-{{ str_pad($order->id, 5, '0', STR_PAD_LEFT) }}</strong></span>
            <span>Date: <strong>{{ \Carbon\Carbon::parse($order->order_date)->format('d-m-Y') }}</strong></span>
        </div>
        <div class="meta-row" style="margin-top: 2px;">
            <span>{{ (isset($order->supplier) && $order->supplier->type == 5) ? 'Company:' : 'Supplier:' }}</span>
            <span class="bold">{{ $order->supplier->title ?? 'N/A' }}</span>
        </div>
        @if($order->supplier && $order->supplier->phone)
        <div class="meta-row">
            <span>Phone:</span>
            <span>{{ $order->supplier->phone }}</span>
        </div>
        @endif
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th class="text-left" style="width: 45%;">Item</th>
                <th class="text-center" style="width: 15%;">Qty</th>
                <th class="text-right" style="width: 20%;">Rate</th>
                <th class="text-right" style="width: 20%;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td class="text-left bold">
                    {{ $item->item->title ?? 'Unknown Item' }}
                </td>
                <td class="text-center">
                    {{ $item->qty_full > 0 ? $item->qty_full . 'F' : '' }}{{ $item->qty_full > 0 && $item->qty_pcs > 0 ? '+' : '' }}{{ $item->qty_pcs > 0 ? $item->qty_pcs . 'P' : '' }}
                </td>
                <td class="text-right">
                    {{ number_format($item->net_rate, 1) }}
                </td>
                <td class="text-right bold">
                    {{ number_format($item->subtotal, 1) }}
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

    <div class="totals-section">
        <div class="totals-row">
            <span>Total Items:</span>
            <span class="bold">{{ $order->items->count() }}</span>
        </div>
        @if($order->total_discount > 0)
        <div class="totals-row">
            <span>Total Discount:</span>
            <span>Rs {{ number_format($order->total_discount, 2) }}</span>
        </div>
        @endif
        <div class="totals-row" style="font-size: 11px; margin-top: 3px; border-top: 1px solid #000; padding-top: 3px;">
            <span class="bold">NET AMOUNT:</span>
            <span class="bold">Rs {{ number_format($order->total_amount, 2) }}</span>
        </div>
    </div>

    <div class="footer">
        <div>Software by AishTycoons (0300-2086828)</div>
        <div style="margin-top: 2px;">Printed: {{ now()->format('d-m-Y h:i A') }}</div>
    </div>

</body>
</html>
