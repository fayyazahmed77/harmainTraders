@extends('emails.layouts.master')

@section('content')
    <h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Access Privilege Update</h2>
    <p style="color: #4B5563; line-height: 1.6; font-size: 15px; margin-top: 8px; margin-bottom: 20px;">
        Hello <strong>{{ $accessRequest->user->name ?? 'User' }}</strong>,<br>
        Your request for privilege escalation has been processed by the administrator.
    </p>

    <!-- Status Badge Display -->
    <div style="margin-bottom: 24px;">
        <span style="font-weight: 600; font-size: 14px; color: #4B5563; margin-right: 12px; vertical-align: middle;">Current Status:</span>
        @component('emails.components.badge', ['status' => $accessRequest->status])
        @endcomponent
    </div>

    <!-- Request Details Card -->
    @component('emails.components.card', ['padding' => '20px', 'margin' => '24px 0'])
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6; color: #4B5563;">
            <tr>
                <td style="padding: 6px 0; font-weight: 600; color: #374151; width: 120px; vertical-align: top;">Privilege Type:</td>
                <td style="padding: 6px 0; color: #111827; vertical-align: top; font-family: monospace; text-transform: uppercase;">{{ $accessRequest->action_type }}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; font-weight: 600; color: #374151; vertical-align: top;">Resource/Module:</td>
                <td style="padding: 6px 0; color: #111827; vertical-align: top; font-weight: 600;">{{ $accessRequest->resource_type }}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; font-weight: 600; color: #374151; vertical-align: top;">Justification:</td>
                <td style="padding: 6px 0; color: #4B5563; vertical-align: top; font-style: italic;">"{{ $accessRequest->justification }}"</td>
            </tr>
        </table>
    @endcomponent

    <p style="color: #4B5563; font-size: 14px; line-height: 1.5; margin-top: 24px;">
        For further details or next steps, you can view your notifications on the portal.
    </p>

    <!-- Action Button -->
    @component('emails.components.button', ['url' => url('/notifications'), 'text' => 'VIEW NOTIFICATIONS', 'variant' => 'primary', 'align' => 'left'])
    @endcomponent
@endsection
