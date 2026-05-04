<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TwoFactorMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (auth()->check() && $user->two_factor_code) {
            if (!$request->is('verify-2fa*') && !$request->is('logout')) {
                return redirect()->route('2fa.index');
            }
        }

        return $next($request);
    }
}
