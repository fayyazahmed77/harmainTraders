@extends('emails.layout')

@section('content')
    <div class="content">
        <h2>Hello {{ $finRequest->investor->full_name }},</h2>
        
        <p>Your financial request has been reviewed by our administration team.</p>

        <div style="display: inline-block; padding: 6px 16px; border-radius: 50px; font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; background-color: {{ $status === 'approved' ? '#d1fae5' : '#fee2e2' }}; color: {{ $status === 'approved' ? '#065f46' : '#991b1b' }};">
            Request {{ ucfirst($status) }}
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 25px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
                <span style="color: #64748b; font-weight: 500;">Request Type:</span>
                <span style="color: #1e293b; font-weight: 700;">{{ ucwords(str_replace('_', ' ', $finRequest->request_type)) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
                <span style="color: #64748b; font-weight: 500;">Amount:</span>
                <span style="color: #1e293b; font-weight: 700;">PKR {{ number_format($finRequest->amount, 2) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
                <span style="color: #64748b; font-weight: 500;">Requested On:</span>
                <span style="color: #1e293b; font-weight: 700;">{{ $finRequest->created_at->format('d M Y, h:i A') }}</span>
            </div>
        </div>

        @if($adminNote)
        <div style="margin-top: 20px;">
            <p style="font-weight: bold; margin-bottom: 5px;">Admin Note:</p>
            <p style="color: #475569; font-style: italic; background: #fffbeb; padding: 15px; border-left: 4px solid #f59e0b;">
                "{{ $adminNote }}"
            </p>
        </div>
        @endif

        <p>You can view the full details of your transaction history and current balance by logging into your investor dashboard.</p>
        
        <div style="text-align: center;">
            <a href="{{ config('app.url') }}/investor/dashboard" class="button">Go to Dashboard</a>
        </div>
    </div>
@endsection
