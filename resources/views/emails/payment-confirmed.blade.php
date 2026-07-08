@extends('emails.layouts.master')

@section('content')
    <h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Payment Voucher Confirmed</h2>
    <p style="color: #4B5563; line-height: 1.6; font-size: 15px; margin-top: 8px;">
        Hello <strong style="color: #111827;">{{ $payment->salesman->name ?? 'Team' }}</strong>,<br>
        A customer payment receipt voucher has been successfully created and allocated in the system.
    </p>

    {{-- Payment Summary Card --}}
    @component('emails.components.card', ['padding' => '20px', 'margin' => '24px 0'])
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.9;">
            <tr>
                <td style="width: 155px; color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Voucher No:</td>
                <td style="color: #111827; font-weight: 800; font-size: 15px; vertical-align: top; padding: 4px 0; font-family: monospace;">{{ $payment->voucher_no }}</td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Payment Date:</td>
                <td style="color: #111827; font-weight: 600; vertical-align: top; padding: 4px 0;">{{ \Carbon\Carbon::parse($payment->date)->format('d M Y') }}</td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Customer Account:</td>
                <td style="color: #111827; font-weight: 600; vertical-align: top; padding: 4px 0;">
                    {{ $payment->account->title ?? 'N/A' }}
                    <span style="color: #9CA3AF; font-size: 12px; margin-left: 4px;">({{ $payment->account->code ?? 'N/A' }})</span>
                </td>
            </tr>
            <tr><td colspan="2" style="border-top: 1px solid #E5E7EB; padding: 0;"></td></tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 8px 0 4px 0;">Amount Collected:</td>
                <td style="color: #111827; font-weight: 800; font-size: 18px; vertical-align: top; padding: 8px 0 4px 0; color: #059669;">Rs {{ number_format($payment->amount) }}</td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Payment Method:</td>
                <td style="vertical-align: top; padding: 4px 0;">
                    @component('emails.components.badge', ['status' => strtolower($payment->payment_method)])
                    @endcomponent
                </td>
            </tr>
            @if ($payment->cheque_no)
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Cheque No:</td>
                <td style="color: #111827; font-weight: 600; vertical-align: top; padding: 4px 0; font-family: monospace;">
                    {{ $payment->cheque_no }}
                    <span style="color: #9CA3AF; font-size: 12px; font-family: inherit; font-weight: 400; margin-left: 4px;">(Due: {{ \Carbon\Carbon::parse($payment->cheque_date)->format('d M Y') }})</span>
                </td>
            </tr>
            @endif
        </table>
    @endcomponent

    @if($payment->remarks)
        <h4 style="color: #374151; font-size: 13px; font-weight: 700; margin-top: 20px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Remarks / Description</h4>
        @component('emails.components.alert', ['type' => 'info'])
            <span style="font-style: italic; color: #1F2937;">"{{ $payment->remarks }}"</span>
        @endcomponent
    @endif

    <p style="color: #4B5563; font-size: 14px; line-height: 1.5; margin-top: 24px;">
        This payment has been applied to the customer ledger balance. No further action is required.
    </p>
@endsection
