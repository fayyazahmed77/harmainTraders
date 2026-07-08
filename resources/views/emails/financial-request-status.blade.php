@extends('emails.layouts.master')

@section('content')
    <h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Financial Request Update</h2>
    <p style="color: #4B5563; line-height: 1.6; font-size: 15px; margin-top: 8px; margin-bottom: 20px;">
        Hello <strong style="color: #111827;">{{ $finRequest->investor->full_name }}</strong>,<br>
        Your financial request has been reviewed by our administration team.
    </p>

    {{-- Status Badge --}}
    <div style="margin-bottom: 24px;">
        <span style="font-weight: 600; font-size: 14px; color: #4B5563; margin-right: 10px; vertical-align: middle;">Request Status:</span>
        @component('emails.components.badge', ['status' => $status === 'approved' ? 'approved' : 'rejected'])
        @endcomponent
    </div>

    {{-- Request Details Card (email-safe table layout, no flexbox) --}}
    @component('emails.components.card', ['padding' => '20px', 'margin' => '24px 0'])
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.8;">
            <tr>
                <td style="width: 140px; color: #6B7280; font-weight: 600; vertical-align: top; padding: 5px 0; white-space: nowrap;">Request Type:</td>
                <td style="color: #111827; font-weight: 700; vertical-align: top; padding: 5px 0;">{{ ucwords(str_replace('_', ' ', $finRequest->request_type)) }}</td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 5px 0;">Amount:</td>
                <td style="color: #111827; font-weight: 700; vertical-align: top; padding: 5px 0; font-size: 16px;">PKR {{ number_format($finRequest->amount, 2) }}</td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 5px 0;">Requested On:</td>
                <td style="color: #111827; font-weight: 600; vertical-align: top; padding: 5px 0;">{{ $finRequest->created_at->format('d M Y, h:i A') }}</td>
            </tr>
        </table>
    @endcomponent

    @if($adminNote)
        <h4 style="color: #374151; font-size: 14px; font-weight: 700; margin-top: 24px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Admin Note</h4>
        @component('emails.components.alert', ['type' => 'warning'])
            <span style="font-style: italic; color: #92400E;">"{{ $adminNote }}"</span>
        @endcomponent
    @endif

    <p style="color: #4B5563; font-size: 14px; line-height: 1.5; margin-top: 24px;">
        You can view the full details of your transaction history and current balance by logging into your investor dashboard.
    </p>

    @component('emails.components.button', ['url' => config('app.url') . '/investor/dashboard', 'text' => 'Go to Dashboard', 'variant' => 'primary', 'align' => 'left'])
    @endcomponent
@endsection
