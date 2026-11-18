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

// Firm Logo Base64 if available
$firm_logo_base64 = "";
if (isset($firm) && $firm->logo) {
    $f_path = storage_path('app/public/' . $firm->logo);
    if (file_exists($f_path)) {
        $f_data = file_get_contents($f_path);
        $f_type = pathinfo($f_path, PATHINFO_EXTENSION);
        $firm_logo_base64 = 'data:image/' . $f_type . ';base64,' . base64_encode($f_data);
    }
}
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Invoice - {{ $order->order_no }}</title>
    <style>
        * {
            box-sizing: border-box;
        }

        @page {
            margin: 0.35cm;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #111;
            font-size: 10px;
            margin: 0;
            padding: 0;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }

        .header-table td {
            vertical-align: top;
        }

        .brand-name {
            font-size: 15px;
            font-weight: bold;
            color: #ea580c;
            line-height: 1.1;
        }

        .brand-sub {
            font-size: 8px;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .order-badge-title {
            font-size: 16px;
            font-weight: bold;
            color: #111;
            text-transform: uppercase;
            text-align: right;
            margin: 0;
            line-height: 1;
        }

        .watermark-banner {
            background-color: #fff7ed;
            border: 1px dashed #ea580c;
            color: #c2410c;
            font-size: 9px;
            font-weight: bold;
            text-align: center;
            padding: 4px;
            margin-bottom: 8px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            border: 1px solid #e5e7eb;
            background-color: #fafafa;
        }

        .info-table td {
            padding: 5px 8px;
            font-size: 9.5px;
            vertical-align: top;
        }

        .info-label {
            font-weight: bold;
            color: #6b7280;
            font-size: 8px;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        .items-table th {
            background-color: #f97316;
            color: #ffffff;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 5px 6px;
            text-align: left;
            border: 1px solid #ea580c;
        }

        .items-table td {
            padding: 4px 6px;
            font-size: 9px;
            border-bottom: 1px solid #e5e7eb;
            border-left: 1px solid #e5e7eb;
            border-right: 1px solid #e5e7eb;
        }

        .items-table tr:nth-child(even) td {
            background-color: #fdfdfd;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-mono { font-family: 'Courier', monospace; font-size: 9.5px; }
        .font-bold { font-weight: bold; }

        .summary-container {
            width: 100%;
            margin-top: 6px;
        }

        .summary-table {
            width: 45%;
            float: right;
            border-collapse: collapse;
            font-size: 9.5px;
        }

        .summary-table td {
            padding: 3px 6px;
        }

        .total-row {
            background-color: #ea580c;
            color: #ffffff;
            font-weight: bold;
            font-size: 11px;
        }

        .footer-note {
            width: 50%;
            float: left;
            font-size: 8.5px;
            color: #6b7280;
            line-height: 1.4;
            padding-top: 10px;
        }

        .clearfix {
            clear: both;
        }
    </style>
</head>
<body>

    <!-- Header Section -->
    <table class="header-table">
        <tr>
            <td style="width: 55%;">
                <div class="brand-name">HARAMAIN TRADERS</div>
                <div class="brand-sub">Wholesale Distribution & Online Orders Management</div>
                <div style="font-size: 8.5px; color: #444; margin-top: 3px;">
                    Support / WhatsApp: 0331 8102001 | Karachi, Pakistan
                </div>
            </td>
            <td style="width: 45%; text-align: right;">
                <div class="order-badge-title">ORDER INVOICE</div>
                <div style="font-size: 10px; font-weight: bold; color: #ea580c; margin-top: 2px;">
                    #{{ $order->order_no }}
                </div>
                <div style="font-size: 8.5px; color: #6b7280; margin-top: 2px;">
                    Date: {{ \Carbon\Carbon::parse($order->submitted_at ?? $order->created_at)->format('d-M-Y h:i A') }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Watermark / Notice Banner -->
    <div class="watermark-banner">
        @if($order->status === 'confirmed' && $order->sale)
            Official Confirmed ERP Sale Invoice #{{ $order->sale->invoice }}
        @else
            Provisional Online Order Invoice &bull; Status: {{ strtoupper(str_replace('_', ' ', $order->status)) }}
        @endif
    </div>

    <!-- Customer & Order Meta Table -->
    <table class="info-table">
        <tr>
            <td style="width: 50%;">
                <div class="info-label">Customer / Billing Details</div>
                <div style="font-weight: bold; font-size: 11px; color: #111;">
                    {{ $order->customerUser?->name ?? 'Customer' }}
                    @if($order->customerUser?->business_name)
                        <span style="font-size: 9px; color: #6b7280; font-weight: normal;">
                            ({{ $order->customerUser->business_name }})
                        </span>
                    @endif
                </div>
                <div style="color: #374151; margin-top: 2px;">
                    Mobile: <strong>{{ $order->customerUser?->mobile ?? 'N/A' }}</strong>
                </div>
                @if($order->customerUser?->address)
                    <div style="color: #4b5563; font-size: 8.5px; margin-top: 2px;">
                        Address: {{ $order->customerUser->address }}
                    </div>
                @endif
            </td>
            <td style="width: 50%;">
                <div class="info-label">Order Metadata</div>
                <div style="color: #374151;">
                    Order No: <strong>{{ $order->order_no }}</strong>
                </div>
                <div style="color: #374151; margin-top: 2px;">
                    Channel: <strong>Online Web Order</strong>
                </div>
                <div style="color: #374151; margin-top: 2px;">
                    Status: <strong style="color: #c2410c;">{{ strtoupper(str_replace('_', ' ', $order->status)) }}</strong>
                </div>
                @if($order->revision_number > 0)
                    <div style="color: #4b5563; font-size: 8.5px; margin-top: 2px;">
                        Revision Iteration: #{{ $order->revision_number }}
                    </div>
                @endif
            </td>
        </tr>
    </table>

    <!-- Line Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%; text-align: center;">#</th>
                <th style="width: 45%;">Item Description</th>
                <th style="width: 8%; text-align: center;">Packing</th>
                <th style="width: 8%; text-align: center;">Cartons</th>
                <th style="width: 8%; text-align: center;">Pieces</th>
                <th style="width: 8%; text-align: center;">Total Pcs</th>
                <th style="width: 9%; text-align: right;">Rate (Rs)</th>
                <th style="width: 9%; text-align: right;">Subtotal (Rs)</th>
            </tr>
        </thead>
        <tbody>
            @php
                $itemIndex = 1;
                $sumTotalPcs = 0;
            @endphp
            @foreach($order->items as $it)
                @php
                    $packing = (float)($it->packing_qty_snapshot ?: ($it->item?->packing_size ?: ($it->item?->packing ?: 1)));
                    if ($packing <= 0) $packing = 1;
                    $totalPcs = (float)($it->total_pcs ?: $it->quantity ?: 0);
                    $sumTotalPcs += $totalPcs;
                    $unitPrice = (float)($it->price_piece ?: $it->unit_price ?: 0);
                    $subtotal = (float)($it->line_subtotal ?: $it->subtotal ?: ($totalPcs * $unitPrice));
                    $cartons = (float)($it->qty_carton ?: floor($totalPcs / $packing));
                    $loosePcs = (float)($it->qty_pcs ?: fmod($totalPcs, $packing));
                @endphp
                <tr>
                    <td class="text-center font-mono">{{ $itemIndex++ }}</td>
                    <td>
                        <div class="font-bold">{{ $it->item_name_snapshot ?: $it->item_name ?: $it->item?->title }}</div>
                        @if($it->item_code_snapshot ?: $it->item?->code)
                            <div style="font-size: 7.5px; color: #6b7280; font-family: monospace;">
                                Code: {{ $it->item_code_snapshot ?: $it->item?->code }}
                            </div>
                        @endif
                    </td>
                    <td class="text-center font-mono">{{ $packing }}</td>
                    <td class="text-center font-mono font-bold">{{ $cartons > 0 ? $cartons : '-' }}</td>
                    <td class="text-center font-mono">{{ $loosePcs > 0 ? $loosePcs : '-' }}</td>
                    <td class="text-center font-mono font-bold">{{ number_format($totalPcs) }}</td>
                    <td class="text-right font-mono">{{ number_format($unitPrice, 2) }}</td>
                    <td class="text-right font-mono font-bold">{{ number_format($subtotal, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Summary & Footer -->
    <div class="summary-container">
        <div class="footer-note">
            <div style="font-weight: bold; color: #374151; margin-bottom: 2px;">Instructions / Notes:</div>
            <div>{{ $order->customer_remarks ?: ($order->customer_notes ?: 'Standard delivery and wholesale handling terms apply.') }}</div>
            <div style="margin-top: 8px; font-size: 8px; color: #9ca3af;">
                * This document is generated for online wholesale review and order verification.
            </div>
        </div>

        <table class="summary-table">
            <tr>
                <td style="color: #4b5563;">Total Line Items:</td>
                <td class="text-right font-mono font-bold">{{ $order->items->count() }}</td>
            </tr>
            <tr>
                <td style="color: #4b5563;">Total Quantity (Pieces):</td>
                <td class="text-right font-mono font-bold">{{ number_format($sumTotalPcs) }} pcs</td>
            </tr>
            <tr style="border-top: 1px solid #e5e7eb;">
                <td style="color: #4b5563;">Gross Subtotal:</td>
                <td class="text-right font-mono font-bold">
                    Rs. {{ number_format((float)($order->current_subtotal ?: $order->original_subtotal ?: $order->final_total), 2) }}
                </td>
            </tr>
            @if((float)$order->discount_amount > 0)
                <tr>
                    <td style="color: #dc2626;">Extra Discount:</td>
                    <td class="text-right font-mono font-bold" style="color: #dc2626;">
                        -Rs. {{ number_format((float)$order->discount_amount, 2) }}
                    </td>
                </tr>
            @endif
            @if((float)$order->delivery_charges > 0)
                <tr>
                    <td style="color: #4b5563;">Delivery / Courier Charges:</td>
                    <td class="text-right font-mono font-bold">
                        +Rs. {{ number_format((float)$order->delivery_charges, 2) }}
                    </td>
                </tr>
            @endif
            <tr class="total-row">
                <td style="padding: 6px;">FINAL NET PAYABLE:</td>
                <td class="text-right font-mono" style="padding: 6px;">
                    Rs. {{ number_format((float)$order->final_total, 2) }}
                </td>
            </tr>
        </table>
        <div class="clearfix"></div>
    </div>

</body>
</html>
