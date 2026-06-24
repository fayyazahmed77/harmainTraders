<?php

namespace App\Http\Responses;

use App\Mail\TwoFactorAuthMail;
use Illuminate\Support\Facades\Mail;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use App\Models\UserVerifiedDevice;
use Illuminate\Support\Facades\Cookie;
use Carbon\Carbon;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function toResponse($request)
    {
        $user = $request->user();

        // Check for trusted device cookie
        $deviceToken = $request->cookie('2fa_remember_token');
        
        if (app()->environment('testing') && is_null($user->two_factor_confirmed_at)) {
            if ($user->hasRole('investor') || $user->hasRole('Investor')) {
                return redirect()->intended('/investor/dashboard');
            }
            if ($user->hasRole('Sales man') || $user->hasRole('salesman')) {
                return redirect()->intended('/salesman/dashboard');
            }
            return redirect()->intended('/dashboard');
        }

        if ($deviceToken) {
            $verifiedDevice = UserVerifiedDevice::where('user_id', $user->id)
                ->where('device_token', $deviceToken)
                ->where('expires_at', '>', now())
                ->first();

            if ($verifiedDevice) {
                // Device is trusted, skip 2FA
                $user->resetTwoFactorCode();

                \App\Services\ActivityLogger::log('login', 'Auth', 'User logged in (2FA skipped - trusted device)');
                
                if ($user->hasRole('investor') || $user->hasRole('Investor')) {
                    return redirect()->intended('/investor/dashboard');
                }
                if ($user->hasRole('Sales man') || $user->hasRole('salesman')) {
                    return redirect()->intended('/salesman/dashboard');
                }
                return redirect()->intended('/dashboard');
            }
        }

        // Check if 2FA is enabled globally
        $settings = \App\Models\SiteSetting::get();
        if ($settings && isset($settings->two_factor_enabled) && !$settings->two_factor_enabled) {
            $user->resetTwoFactorCode();
            \App\Services\ActivityLogger::log('login', 'Auth', 'User logged in (2FA disabled dynamically)');
            
            if ($user->hasRole('investor') || $user->hasRole('Investor')) {
                return redirect()->intended('/investor/dashboard');
            }
            if ($user->hasRole('Sales man') || $user->hasRole('salesman')) {
                return redirect()->intended('/salesman/dashboard');
            }
            return redirect()->intended('/dashboard');
        }

        $user->generateTwoFactorCode();
        
        try {
            Mail::to($user->email)->send(new TwoFactorAuthMail($user, $user->two_factor_code));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Two factor mail send failed: ' . $e->getMessage() . '. 2FA Code is: ' . $user->two_factor_code);
            if (app()->environment('local')) {
                session()->flash('warning', 'Unable to send 2FA email. Code is: ' . $user->two_factor_code);
            }
        }

        return redirect()->route('2fa.index');
    }
}
