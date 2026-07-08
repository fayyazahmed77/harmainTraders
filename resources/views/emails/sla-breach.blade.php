@extends('emails.layouts.master')

@section('content')
    {{-- Critical Alert Banner --}}
    @component('emails.components.alert', ['type' => 'danger'])
        <strong>🚨 SLA Breach:</strong> This request has exceeded the 24-hour resolution deadline.
    @endcomponent

    <h2 style="color: #111827; margin-top: 20px; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">SLA Breach Warning</h2>
    <p style="color: #4B5563; line-height: 1.6; font-size: 15px; margin-top: 8px;">
        Hello <strong style="color: #111827;">Administrator</strong>,<br>
        An access privilege request has breached the 24-hour SLA resolution limit and requires <strong style="color: #DC2626;">immediate attention</strong>.
    </p>

    {{-- Breach Details Card --}}
    @component('emails.components.card', ['padding' => '20px', 'margin' => '24px 0'])
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.9;">
            <tr>
                <td style="width: 155px; color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Requester:</td>
                <td style="color: #111827; font-weight: 700; vertical-align: top; padding: 4px 0;">{{ $accessRequest->user->name ?? 'User' }}</td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Module / Resource:</td>
                <td style="color: #111827; font-weight: 600; vertical-align: top; padding: 4px 0;">{{ $accessRequest->resource_type }}</td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">Privilege Level:</td>
                <td style="vertical-align: top; padding: 4px 0;">
                    <span style="font-family: monospace; background-color: #F3F4F6; padding: 2px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase; font-size: 13px; color: #374151;">{{ $accessRequest->action_type }}</span>
                </td>
            </tr>
            <tr><td colspan="2" style="border-top: 1px solid #E5E7EB; padding: 0;"></td></tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 8px 0 4px 0;">Requested At:</td>
                <td style="color: #374151; font-weight: 600; vertical-align: top; padding: 8px 0 4px 0;">{{ $accessRequest->created_at->format('d M Y H:i') }}</td>
            </tr>
            <tr>
                <td style="color: #6B7280; font-weight: 600; vertical-align: top; padding: 4px 0;">SLA Deadline:</td>
                <td style="color: #DC2626; font-weight: 800; vertical-align: top; padding: 4px 0;">
                    {{ $accessRequest->sla_due_at->format('d M Y H:i') }}
                    <span style="font-size: 11px; font-weight: 600; background-color: #FEE2E2; color: #991B1B; padding: 2px 6px; border-radius: 4px; margin-left: 6px; text-transform: uppercase; letter-spacing: 0.5px;">BREACHED</span>
                </td>
            </tr>
        </table>
    @endcomponent

    <p style="color: #4B5563; font-size: 14px; line-height: 1.5; margin-top: 8px;">
        Please review and resolve the privilege request immediately to maintain SLA compliance.
    </p>

    @component('emails.components.button', ['url' => url('/admin/access-requests'), 'text' => 'GO TO PRIVILEGES DASHBOARD', 'variant' => 'primary', 'align' => 'left'])
    @endcomponent
@endsection
