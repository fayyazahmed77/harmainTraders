@extends('emails.layout')

@section('content')
    <div style="text-align: center;">
        <h2 style="color: #111318; margin-top: 0;">Verify Your Identity</h2>
        <p style="color: #4B5563; line-height: 1.6;">
            Hello {{ $user->name }},<br>
            A login attempt was made for your Harmain Traders account. Please use the following code to complete your verification:
        </p>
        
        <div style="background-color: #f3f4f6; border: 2px dashed #F9A11B; border-radius: 8px; padding: 20px; margin: 30px 0; font-size: 32px; font-weight: 900; letter-spacing: 10px; color: #111318;">
            {{ $code }}
        </div>
        
        <p style="color: #6B7280; font-size: 13px;">
            This code will expire in 10 minutes. If you did not attempt to log in, please secure your account immediately.
        </p>
    </div>
@endsection
