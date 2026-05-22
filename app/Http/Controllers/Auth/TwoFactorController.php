<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\TwoFactorAuthMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\UserVerifiedDevice;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cookie;

class TwoFactorController extends Controller
{
    public function index()
    {
        return Inertia::render('auth/verify-2fa');
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|numeric',
        ]);

        $user = $request->user();

        if ($request->code == $user->two_factor_code) {
            if (Carbon::parse($user->two_factor_expires_at)->isPast()) {
                return back()->withErrors(['code' => 'Verification code has expired.']);
            }

            $user->resetTwoFactorCode();

            // Store in session that 2FA is verified for this session
            $request->session()->put('2fa_verified', true);

            // Trust this device for 24 hours
            $deviceToken = Str::random(64);
            UserVerifiedDevice::create([
                'user_id' => $user->id,
                'device_token' => $deviceToken,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'last_verified_at' => now(),
                'expires_at' => now()->addHours(24),
            ]);

            // Set cookie for 24 hours
            Cookie::queue('2fa_remember_token', $deviceToken, 24 * 60);

            \App\Services\ActivityLogger::log('login', 'Auth', 'User logged in after 2FA verification');

            if ($user->hasRole('investor') || $user->hasRole('Investor')) {
                return redirect()->intended('/investor/dashboard');
            }
            if ($user->hasRole('Sales man') || $user->hasRole('salesman')) {
                return redirect()->intended('/salesman/dashboard');
            }
            return redirect()->intended('/dashboard');
        }

        return back()->withErrors(['code' => 'The provided code is incorrect.']);
    }

    public function resend(Request $request)
    {
        $user = $request->user();
        $user->generateTwoFactorCode();
        
        Mail::to($user->email)->send(new TwoFactorAuthMail($user, $user->two_factor_code));

        return back()->with('status', 'Verification code has been resent to your email.');
    }
}
