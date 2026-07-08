@extends('emails.layouts.master')

@section('content')
    <h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Order Received Successfully</h2>
    <p style="color: #4B5563; line-height: 1.6; font-size: 15px; margin-top: 8px;">
        Hello <strong style="color: #111827;">{{ $sale->customer->title ?? 'Customer' }}</strong>,<br>
        Thank you for shopping with us! We have received your order and it is currently being processed.
    </p>

    {{-- Order Summary Card --}}
    @component('emails.components.card', ['padding' => '20px', 'margin' => '24px 0'])
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.8;">
            <tr>
                <td style="width: 140px; color: #6B7280; font-weight: 600; vertical-align: top; padding: 5px 0;">Invoice ID:</td>
                <td style="color: #111827; font-weight: 800; font-size: 15px; vertical-align: top; padding: 5px 0;">{{ $sale->invoice }}</td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 5px 0;">Order Date:</td>
                <td style="color: #111827; font-weight: 600; vertical-align: top; padding: 5px 0;">{{ \Carbon\Carbon::parse($sale->date)->format('d M Y') }}</td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 5px 0;">Net Total:</td>
                <td style="color: #111827; font-weight: 800; font-size: 16px; vertical-align: top; padding: 5px 0;">Rs {{ number_format($sale->net_total) }}</td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 5px 0;">Status:</td>
                <td style="vertical-align: top; padding: 5px 0;">
                    @component('emails.components.badge', ['status' => strtolower($sale->status)])
                    @endcomponent
                </td>
            </tr>
        </table>
    @endcomponent

    {{-- Items Ordered Table --}}
    <h3 style="color: #111827; font-size: 15px; font-weight: 700; margin-top: 28px; margin-bottom: 12px;">Items Ordered</h3>

    @component('emails.components.table')
        <thead>
            <tr style="background-color: #F9FAFB;">
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E5E7EB;">Item Description</th>
                <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E5E7EB;">Qty</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E5E7EB;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($sale->items as $index => $item)
                <tr style="background-color: {{ $index % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }};">
                    <td style="padding: 10px 12px; font-size: 14px; color: #374151; border-bottom: 1px solid #F3F4F6;">{{ $item->item->title ?? 'Product' }}</td>
                    <td style="padding: 10px 12px; font-size: 14px; color: #4B5563; text-align: center; border-bottom: 1px solid #F3F4F6; white-space: nowrap;">
                        @if ($item->qty_carton > 0){{ (int)$item->qty_carton }} Ctn @endif
                        @if ($item->qty_pcs > 0){{ (int)$item->qty_pcs }} Pcs @endif
                    </td>
                    <td style="padding: 10px 12px; font-size: 14px; color: #111827; font-weight: 600; text-align: right; border-bottom: 1px solid #F3F4F6; white-space: nowrap;">Rs {{ number_format($item->subtotal) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="2" style="padding: 12px; text-align: right; font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; border-top: 2px solid #E5E7EB;">Total:</td>
                <td style="padding: 12px; text-align: right; font-size: 16px; font-weight: 800; color: #111827; border-top: 2px solid #E5E7EB; white-space: nowrap;">Rs {{ number_format($sale->net_total) }}</td>
            </tr>
        </tfoot>
    @endcomponent

    <p style="color: #4B5563; font-size: 14px; line-height: 1.5; margin-top: 24px;">
        You can view the real-time status or download your invoice PDF directly using the secure link below:
    </p>

    @component('emails.components.button', ['url' => url('/g/' . ($sale->customer->guest_token ?? '') . '/invoice/' . $sale->invoice), 'text' => 'VIEW ORDER DETAILS', 'variant' => 'primary', 'align' => 'left'])
    @endcomponent
@endsection
