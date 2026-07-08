@extends('emails.layouts.master')

@section('content')
    <h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Access Privilege Request</h2>
    <p style="color: #4B5563; line-height: 1.6; font-size: 15px; margin-top: 8px;">
        Hello Administrator,<br>
        A user has requested privilege escalation on the platform:
    </p>

    <!-- Request Details Card -->
    @component('emails.components.card', ['padding' => '20px', 'margin' => '24px 0'])
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6; color: #4B5563;">
            <tr>
                <td style="padding: 6px 0; font-weight: 600; color: #374151; width: 120px; vertical-align: top;">Requester:</td>
                <td style="padding: 6px 0; color: #111827; vertical-align: top;">{{ $userName }}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; font-weight: 600; color: #374151; vertical-align: top;">Privilege Type:</td>
                <td style="padding: 6px 0; color: #111827; vertical-align: top;"><span style="font-family: monospace; background-color: #F3F4F6; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">{{ $actionType }}</span></td>
            </tr>
            <tr>
                <td style="padding: 6px 0; font-weight: 600; color: #374151; vertical-align: top;">Resource/Module:</td>
                <td style="padding: 6px 0; color: #111827; vertical-align: top; font-weight: 600;">{{ $resourceType }}</td>
            </tr>
        </table>
    @endcomponent

    <!-- Justification Box -->
    <h3 style="color: #111827; font-size: 14px; font-weight: 700; margin-top: 24px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Reason / Justification</h3>
    @component('emails.components.alert', ['type' => 'info'])
        <span style="font-style: italic; color: #1F2937;">"{{ $justification }}"</span>
    @endcomponent

    <p style="color: #4B5563; font-size: 14px; line-height: 1.5; margin-top: 24px; margin-bottom: 24px;">
        Please review this request and perform the action using the secure links below (valid for 24 hours):
    </p>

    <!-- Secure Action Buttons side-by-side or stacked -->
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="width: 50%; padding-right: 12px; vertical-align: top;">
                @component('emails.components.button', ['url' => $approveUrl, 'text' => 'APPROVE ACCESS', 'variant' => 'primary', 'align' => 'center'])
                @endcomponent
            </td>
            <td style="width: 50%; padding-left: 12px; vertical-align: top;">
                @component('emails.components.button', ['url' => $rejectUrl, 'text' => 'REJECT REQUEST', 'variant' => 'outline', 'align' => 'center'])
                @endcomponent
            </td>
        </tr>
    </table>
@endsection
