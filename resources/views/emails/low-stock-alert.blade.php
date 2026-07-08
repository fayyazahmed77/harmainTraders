@extends('emails.layouts.master')

@section('content')
    {{-- Urgency Alert Banner --}}
    @component('emails.components.alert', ['type' => 'danger'])
        <strong>⚠ Inventory Alert:</strong> Stock level has dropped below the minimum reorder threshold and requires immediate action.
    @endcomponent

    <h2 style="color: #111827; margin-top: 20px; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Low Stock Alert</h2>
    <p style="color: #4B5563; line-height: 1.6; font-size: 15px; margin-top: 8px;">
        Hello <strong style="color: #111827;">Administrator</strong>,<br>
        This is an automated system notification. The following inventory item has dropped below its minimum reorder level.
    </p>

    {{-- Item Details Card --}}
    @component('emails.components.card', ['padding' => '20px', 'margin' => '24px 0'])
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.9;">
            <tr>
                <td style="width: 155px; color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Product Title:</td>
                <td style="color: #111827; font-weight: 700; vertical-align: top; padding: 4px 0;">{{ $item->title }}</td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">SKU / Code:</td>
                <td style="color: #111827; font-weight: 600; vertical-align: top; padding: 4px 0; font-family: monospace; background-color: transparent;">{{ $item->code }}</td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Category:</td>
                <td style="color: #111827; font-weight: 600; vertical-align: top; padding: 4px 0;">{{ $item->category->name ?? 'N/A' }}</td>
            </tr>
            <tr><td colspan="2" style="border-top: 1px solid #E5E7EB; padding: 0;"></td></tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 8px 0 4px 0;">Current Stock:</td>
                <td style="vertical-align: top; padding: 8px 0 4px 0;">
                    <span style="color: #DC2626; font-weight: 800; font-size: 16px;">{{ $item->total_stock_pcs }}</span>
                    <span style="color: #9CA3AF; font-size: 13px; margin-left: 4px;">pieces ({{ $item->stock_breakdown }})</span>
                </td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Reorder Level:</td>
                <td style="color: #374151; font-weight: 700; vertical-align: top; padding: 4px 0;">{{ $item->reorder_level }} pieces (minimum)</td>
            </tr>
        </table>
    @endcomponent

    <p style="color: #4B5563; font-size: 14px; line-height: 1.5; margin-top: 8px;">
        Please place a supplier purchase order to replenish stock levels before operations are impacted.
    </p>

    @component('emails.components.button', ['url' => url('/items/' . $item->id . '/show'), 'text' => 'VIEW ITEM STOCK', 'variant' => 'primary', 'align' => 'left'])
    @endcomponent
@endsection
