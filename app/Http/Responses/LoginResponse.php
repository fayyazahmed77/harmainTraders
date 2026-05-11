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
        
        if ($deviceToken) {
            $verifiedDevice = UserVerifiedDevice::where('user_id', $user->id)
                ->where('device_token', $deviceToken)
                ->where('expires_at', '>', now())
                ->first();

            if ($verifiedDevice) {
                // Device is trusted, skip 2FA
                $user->resetTwoFactorCode();

                \App\Services\ActivityLogger::log('login', 'Auth', 'User logged in (2FA skipped - trusted device)');
                
                if ($user->hasRole('investor')) {
                    return redirect()->intended('/investor/dashboard');
                }
                return redirect()->intended('/dashboard');
            }
        }

        // Check if 2FA is enabled or if we want it for everyone (let's do everyone for now as per "Elite" request)
        // or just for Admins? Let's do it for all for maximum security.
        
        $user->generateTwoFactorCode();
        
        Mail::to($user->email)->send(new TwoFactorAuthMail($user, $user->two_factor_code));

        return redirect()->route('2fa.index');
    }
}
