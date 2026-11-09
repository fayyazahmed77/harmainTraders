@extends('emails.layouts.master')

@section('content')
    <h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
        New Online Order Submitted
    </h2>
    <p style="color: #4B5563; line-height: 1.6; font-size: 15px; margin-top: 8px;">
        Hello Administrator,<br>
        A new online wholesale order has been submitted by <strong style="color: #111827;">{{ $customer->name ?? 'Customer' }}</strong> and is awaiting your review in the ERP.
    </p>

    {{-- Order & Customer Summary Card --}}
    @component('emails.components.card', ['padding' => '20px', 'margin' => '24px 0'])
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.8;">
            <tr>
                <td style="width: 150px; color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Order Reference:</td>
                <td style="color: #111827; font-weight: 800; font-size: 15px; vertical-align: top; padding: 4px 0;">#{{ $order->order_no }}</td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Submitted At:</td>
                <td style="color: #111827; font-weight: 600; vertical-align: top; padding: 4px 0;">
                    {{ $order->submitted_at ? \Carbon\Carbon::parse($order->submitted_at)->format('d M Y, h:i A') : now()->format('d M Y, h:i A') }}
                </td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Customer Name:</td>
                <td style="color: #111827; font-weight: 700; vertical-align: top; padding: 4px 0;">
                    {{ $customer->name ?? 'N/A' }}
                    @if (!empty($customer->username))
                        <span style="color: #6B7280; font-weight: 500; font-size: 12px;">({{ '@' . $customer->username }})</span>
                    @endif
                </td>
            </tr>
            @if (!empty($customer->business_name))
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Business / Shop:</td>
                <td style="color: #111827; font-weight: 600; vertical-align: top; padding: 4px 0;">{{ $customer->business_name }}</td>
            </tr>
            @endif
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Mobile Number:</td>
                <td style="color: #111827; font-weight: 600; vertical-align: top; padding: 4px 0;">{{ $customer->mobile ?? 'N/A' }}</td>
            </tr>
            @if (!empty($customer->address) || !empty($customer->city))
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Delivery Address:</td>
                <td style="color: #374151; vertical-align: top; padding: 4px 0;">
                    {{ collect([$customer->address, $customer->city])->filter()->implode(', ') }}
                </td>
            </tr>
            @endif
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Account Status:</td>
                <td style="vertical-align: top; padding: 4px 0;">
                    @php
                        $approvalStatus = strtolower($customer->approval_status ?? 'pending');
                        $badgeBg = $approvalStatus === 'approved' ? '#D1FAE5' : '#FEF3C7';
                        $badgeColor = $approvalStatus === 'approved' ? '#065F46' : '#92400E';
                    @endphp
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; background-color: {{ $badgeBg }}; color: {{ $badgeColor }};">
                        {{ ucfirst($approvalStatus) }}
                    </span>
                </td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 6px 0 0 0;">Order Total:</td>
                <td style="color: #047857; font-weight: 800; font-size: 17px; vertical-align: top; padding: 6px 0 0 0;">
                    Rs. {{ number_format((float)$order->final_total, 2) }}
                </td>
            </tr>
        </table>
    @endcomponent

    {{-- Customer Remarks (if provided) --}}
    @if (!empty($order->customer_notes))
        <h3 style="color: #111827; font-size: 13px; font-weight: 700; margin-top: 20px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            Customer Remarks / Instructions
        </h3>
        @component('emails.components.alert', ['type' => 'info'])
            <span style="font-style: italic; color: #1F2937;">"{{ $order->customer_notes }}"</span>
        @endcomponent
    @endif

    {{-- Itemized Order Table --}}
    <h3 style="color: #111827; font-size: 15px; font-weight: 700; margin-top: 28px; margin-bottom: 12px;">
        Order Items ({{ $items->count() }})
    </h3>

    @component('emails.components.table')
        <thead>
            <tr style="background-color: #F9FAFB;">
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E5E7EB;">Item</th>
                <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E5E7EB;">Qty</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E5E7EB;">Rate</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E5E7EB;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($items as $index => $item)
                <tr style="background-color: {{ $index % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }};">
                    <td style="padding: 10px 12px; font-size: 13px; color: #111827; border-bottom: 1px solid #F3F4F6;">
                        <div style="font-weight: 700;">{{ $item->item_name_snapshot }}</div>
                        @if (!empty($item->item_code_snapshot))
                            <div style="font-size: 11px; color: #6B7280;">Code: {{ $item->item_code_snapshot }} | Packing: {{ (float)$item->packing_qty_snapshot }} pcs</div>
                        @endif
                    </td>
                    <td style="padding: 10px 12px; font-size: 13px; color: #374151; text-align: center; border-bottom: 1px solid #F3F4F6; white-space: nowrap;">
                        <div style="font-weight: 700;">{{ (float)$item->total_pcs }} pcs</div>
                        @if ((float)$item->qty_carton > 0 || (float)$item->qty_pcs > 0)
                            <div style="font-size: 11px; color: #6B7280;">
                                ({{ (float)$item->qty_carton }} ctn + {{ (float)$item->qty_pcs }} pcs)
                            </div>
                        @endif
                    </td>
                    <td style="padding: 10px 12px; font-size: 13px; color: #374151; text-align: right; border-bottom: 1px solid #F3F4F6; white-space: nowrap;">
                        Rs. {{ number_format((float)$item->price_piece, 2) }}
                    </td>
                    <td style="padding: 10px 12px; font-size: 13px; color: #111827; font-weight: 700; text-align: right; border-bottom: 1px solid #F3F4F6; white-space: nowrap;">
                        Rs. {{ number_format((float)$item->line_subtotal, 2) }}
                    </td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3" style="padding: 12px; text-align: right; font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; border-top: 2px solid #E5E7EB;">
                    Total Payable:
                </td>
                <td style="padding: 12px; text-align: right; font-size: 16px; font-weight: 800; color: #047857; border-top: 2px solid #E5E7EB; white-space: nowrap;">
                    Rs. {{ number_format((float)$order->final_total, 2) }}
                </td>
            </tr>
        </tfoot>
    @endcomponent

    <p style="color: #4B5563; font-size: 14px; line-height: 1.5; margin-top: 24px; margin-bottom: 20px;">
        Click the button below to review warehouse stock availability, propose revisions, or confirm this order into an ERP sale:
    </p>

    @component('emails.components.button', ['url' => $reviewUrl, 'text' => 'REVIEW ORDER IN ERP', 'variant' => 'primary', 'align' => 'left'])
    @endcomponent
@endsection

