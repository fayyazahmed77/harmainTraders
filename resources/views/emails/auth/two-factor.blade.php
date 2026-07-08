@extends('emails.layouts.master')

@section('content')
    <div style="text-align: center;">
        <h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Verify Your Identity</h2>
        <p style="color: #4B5563; line-height: 1.6; font-size: 15px; margin-top: 12px; margin-bottom: 24px;">
            Hello {{ $user->name }},<br>
            A login attempt was made for your account. Please use the following verification code to complete your sign-in:
        </p>
        
        <div style="background-color: #FFFBEB; border: 2px dashed #F9A11B; border-radius: 10px; padding: 18px 24px; margin: 24px auto; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #111827; max-width: 280px; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);">
            {{ $code }}
        </div>
        
        <p style="color: #9CA3AF; font-size: 13px; line-height: 1.5; margin-top: 24px;">
            This code will expire in 10 minutes. If you did not attempt to log in, please ignore this email or contact support to secure your account.
        </p>
    </div>
@endsection
