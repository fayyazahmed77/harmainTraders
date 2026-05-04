<?php

namespace App\Http\Responses;

use App\Mail\TwoFactorAuthMail;
use Illuminate\Support\Facades\Mail;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

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

        // Check if 2FA is enabled or if we want it for everyone (let's do everyone for now as per "Elite" request)
        // or just for Admins? Let's do it for all for maximum security.
        
        $user->generateTwoFactorCode();
        
        Mail::to($user->email)->send(new TwoFactorAuthMail($user, $user->two_factor_code));

        return redirect()->route('2fa.index');
    }
}
