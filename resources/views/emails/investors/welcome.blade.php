@extends('emails.layouts.master')

@section('content')
    <h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Welcome to Harmain Traders</h2>
    <p style="color: #4B5563; line-height: 1.6; font-size: 15px; margin-top: 8px;">
        Hello {{ $user->name }},<br>
        We are pleased to inform you that your Investor Portal account has been successfully created. You can now track your investments, monitor profits, and manage financial requests directly from our secure platform.
    </p>

    <!-- Credentials Card -->
    @component('emails.components.card', ['padding' => '20px', 'margin' => '24px 0'])
        <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Your Access Credentials</h4>
        <div style="font-size: 14px; line-height: 1.6; color: #4B5563;">
            <div style="margin-bottom: 6px;"><strong style="color: #111827;">Email:</strong> {{ $user->email }}</div>
            <div><strong style="color: #111827;">Temporary Password:</strong> <code style="background-color: #F3F4F6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 14px;">{{ $password }}</code></div>
        </div>
    @endcomponent

    <!-- Action Button -->
    @component('emails.components.button', ['url' => $loginUrl, 'text' => 'Access Investor Dashboard', 'variant' => 'primary', 'align' => 'left'])
    @endcomponent

    <!-- Portal Features Section -->
    <h3 style="color: #111827; font-size: 16px; font-weight: 700; margin-top: 32px; margin-bottom: 12px;">What you can do in the portal:</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 28px;">
                <span style="color: #10B981; font-weight: bold; font-size: 16px;">✓</span>
            </td>
            <td style="padding: 8px 0; color: #4B5563; font-size: 14px; line-height: 1.5;">
                <strong style="color: #111827;">Real-time Ledger:</strong> View your investment history and rolling balance.
            </td>
        </tr>
        <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 28px;">
                <span style="color: #10B981; font-weight: bold; font-size: 16px;">✓</span>
            </td>
            <td style="padding: 8px 0; color: #4B5563; font-size: 14px; line-height: 1.5;">
                <strong style="color: #111827;">Profit Tracking:</strong> Monitor monthly profit distributions.
            </td>
        </tr>
        <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 28px;">
                <span style="color: #10B981; font-weight: bold; font-size: 16px;">✓</span>
            </td>
            <td style="padding: 8px 0; color: #4B5563; font-size: 14px; line-height: 1.5;">
                <strong style="color: #111827;">Quick Requests:</strong> Submit withdrawal or reinvestment requests with one click.
            </td>
        </tr>
        <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 28px;">
                <span style="color: #10B981; font-weight: bold; font-size: 16px;">✓</span>
            </td>
            <td style="padding: 8px 0; color: #4B5563; font-size: 14px; line-height: 1.5;">
                <strong style="color: #111827;">Financial Reports:</strong> Download audit-ready statements.
            </td>
        </tr>
    </table>

    @component('emails.components.alert', ['type' => 'warning'])
        <strong>Security Notice:</strong> For security reasons, we strongly recommend changing your password immediately after your first login.
    @endcomponent

    <p style="color: #4B5563; line-height: 1.6; font-size: 14px; margin-top: 24px;">
        If you have any questions or require assistance, please do not hesitate to contact our support team.
    </p>
@endsection
