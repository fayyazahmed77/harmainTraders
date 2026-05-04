<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\TwoFactorAuthMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Carbon\Carbon;

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

            if ($user->hasRole('investor')) {
                return redirect()->intended('/investor/dashboard');
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
