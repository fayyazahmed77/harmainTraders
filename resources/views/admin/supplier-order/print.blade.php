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
    <title>Print Order #{{ $order->id }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0 0 5px 0;
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .info-box {
            width: 48%;
        }
        .info-box strong {
            display: inline-block;
            width: 100px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table, th, td {
            border: 1px solid #000;
        }
        th, td {
            padding: 8px 6px;
            text-align: right;
        }
        th {
            background-color: #e5e7eb;
            color: #000;
            text-align: center;
            font-weight: bold;
            border: 1px solid #000;
            border-bottom: 2px solid #000;
        }
        td.text-left {
            text-align: left;
        }
        .totals {
            width: 40%;
            float: right;
        }
        .totals table, .totals th, .totals td {
            border: none;
        }
        .totals td {
            padding: 5px;
            border-bottom: 1px solid #ddd;
        }
        .totals strong {
            font-size: 14px;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body onload="window.print()">

    <div class="header">
        <div style="text-align: left; display: flex; align-items: center; gap: 10px;">
            @if($logo_base64)
                <img src="{{ $logo_base64 }}" alt="Logo" style="height: 35px; width: auto; object-fit: contain; vertical-align: middle;">
            @endif
            <div style="display: inline-block; vertical-align: middle; text-align: left; line-height: 1.2;">
                <div style="font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">
                    <span style="color: #000;">Harmain</span> <span style="color: #f97316;">Traders</span>
                </div>
                <div style="font-size: 11px; font-weight: normal; color: #666; margin-top: 2px;">
                    Wholesale <span style="color: #f97316; font-weight: bold;">&</span> Supply Chain
                </div>
            </div>
        </div>
        <div style="text-align: right;">
            <h1>Supplier Order</h1>
            <p>Order Reference: <strong>#{{ str_pad($order->id, 5, '0', STR_PAD_LEFT) }}</strong></p>
        </div>
    </div>

    <div class="info-section">
        <div class="info-box">
            <p><strong>Supplier:</strong> {{ $order->supplier->title ?? 'N/A' }}</p>
            @if($order->supplier->phone)
            <p><strong>Phone:</strong> {{ $order->supplier->phone }}</p>
            @endif
        </div>
        <div class="info-box" style="text-align: right;">
            <p><strong>Date:</strong> {{ \Carbon\Carbon::parse($order->order_date)->format('d-m-Y') }}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th class="text-left" style="width: 35%;">Item Description</th>
                <th style="width: 10%;">Full</th>
                <th style="width: 10%;">Pcs</th>
                <th style="width: 10%;">Rate</th>
                <th style="width: 10%;">Disc %</th>
                <th style="width: 10%;">Net Rate</th>
                <th style="width: 10%;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $index => $item)
            <tr>
                <td style="text-align: center;">{{ $index + 1 }}</td>
                <td class="text-left">{{ $item->item->title ?? 'Unknown Item' }}</td>
                <td>{{ $item->qty_full }}</td>
                <td>{{ $item->qty_pcs }}</td>
                <td>{{ number_format($item->rate, 2) }}</td>
                <td>{{ number_format($item->discount_percent, 2) }}</td>
                <td>{{ number_format($item->net_rate, 2) }}</td>
                <td><strong>{{ number_format($item->subtotal, 2) }}</strong></td>
            </tr>
            @endforeach
            @if($order->items->isEmpty())
            <tr>
                <td colspan="8" style="text-align: center;">No items found in this order.</td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="totals">
        <table style="width: 100%;">
            <tr>
                <td class="text-left">Total Items:</td>
                <td>{{ $order->items->count() }}</td>
            </tr>
            <tr>
                <td class="text-left">Total Discount:</td>
                <td>Rs {{ number_format($order->total_discount, 2) }}</td>
            </tr>
            <tr>
                <td class="text-left"><strong>Total Amount:</strong></td>
                <td><strong>Rs {{ number_format($order->total_amount, 2) }}</strong></td>
            </tr>
        </table>
    </div>
    
    <div style="clear: both; margin-top: 50px; text-align: center; color: #666; font-size: 10px;">
        <p>This is a computer generated document and requires no signature.</p>
        <p>Printed on: {{ now()->format('d-m-Y h:i A') }}</p>
    </div>

</body>
</html>
