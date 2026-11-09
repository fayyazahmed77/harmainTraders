<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\CustomerUser;
use App\Services\PhoneNormalizer;
use App\Models\User;
use App\Models\Notification;

class CustomerAuthController extends Controller
{
    /**
     * Handle Customer Login (via username, mobile, or email)
     */
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        $throttleKey = 'customer_login:' . Str::lower($request->input('login')) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            throw ValidationException::withMessages([
                'login' => ["Too many login attempts. Please try again in {$seconds} seconds."],
            ]);
        }

        $loginInput = trim($request->input('login'));
        $normalizedMobile = PhoneNormalizer::normalizeLocal($loginInput);

        // Find customer by username, mobile, or email
        $customer = CustomerUser::where('username', $loginInput)
            ->orWhere('email', $loginInput)
            ->when($normalizedMobile, function ($q) use ($normalizedMobile) {
                $q->orWhere('mobile', $normalizedMobile);
            })
            ->first();

        if (!$customer || !Hash::check($request->password, $customer->password)) {
            RateLimiter::hit($throttleKey, 60);
            throw ValidationException::withMessages([
                'login' => ['Invalid login credentials. Please check your username/mobile and password.'],
            ]);
        }

        RateLimiter::clear($throttleKey);

        Auth::guard('customer')->login($customer, $request->boolean('remember'));
        $request->session()->regenerate();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Logged in successfully.',
                'csrf_token' => csrf_token(),
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'username' => $customer->username,
                    'mobile' => $customer->mobile,
                    'email' => $customer->email,
                    'business_name' => $customer->business_name,
                    'address' => $customer->address,
                    'approval_status' => $customer->approval_status,
                ],
            ]);
        }

        return redirect()->intended('/live-offers');
    }

    /**
     * Handle New Customer Registration
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|alpha_dash|min:3|max:50|unique:customer_users,username',
            'mobile' => 'required|string|max:30',
            'email' => 'nullable|email|max:255',
            'password' => 'required|string|min:6|confirmed',
            'business_name' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
        ]);

        $normalizedMobile = PhoneNormalizer::normalizeLocal($request->mobile);
        if (!$normalizedMobile) {
            throw ValidationException::withMessages([
                'mobile' => ['Please enter a valid mobile number (e.g., 03323228684).'],
            ]);
        }

        if (CustomerUser::where('mobile', $normalizedMobile)->exists()) {
            throw ValidationException::withMessages([
                'mobile' => ['This mobile number is already registered. Please log in instead.'],
            ]);
        }

        $customer = CustomerUser::create([
            'name' => trim($request->name),
            'username' => strtolower(trim($request->username)),
            'mobile' => $normalizedMobile,
            'email' => $request->email ? strtolower(trim($request->email)) : null,
            'password' => $request->password, // automatically hashed via cast 'password' => 'hashed'
            'approval_status' => 'pending',
            'business_name' => $request->business_name ? trim($request->business_name) : null,
            'address' => $request->address ? trim($request->address) : null,
        ]);

        Auth::guard('customer')->login($customer);
        $request->session()->regenerate();

        // Dispatch in-system notification to all admins about new customer registration
        try {
            $admins = User::all();
            foreach ($admins as $admin) {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'type' => 'App\Notifications\NewCustomerRegistrationNotification',
                    'notifiable_type' => User::class,
                    'notifiable_id' => $admin->id,
                    'priority' => 'high',
                    'category' => 'Customers',
                    'data' => [
                        'customer_user_id' => $customer->id,
                        'name' => $customer->name,
                        'username' => $customer->username,
                        'mobile' => $customer->mobile,
                        'business_name' => $customer->business_name,
                        'message' => "New customer registration: {$customer->name} ({$customer->mobile}) is awaiting approval.",
                        'action_url' => '/customers/approvals',
                    ],
                    'created_at' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to dispatch admin notification for customer registration: " . $e->getMessage());
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Registration successful! Your account is currently Pending Approval.',
                'csrf_token' => csrf_token(),
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'username' => $customer->username,
                    'mobile' => $customer->mobile,
                    'email' => $customer->email,
                    'business_name' => $customer->business_name,
                    'address' => $customer->address,
                    'approval_status' => $customer->approval_status,
                ],
            ]);
        }

        return redirect()->intended('/live-offers');
    }

    /**
     * Customer Logout
     */
    public function logout(Request $request)
    {
        Auth::guard('customer')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully.',
                'csrf_token' => csrf_token(),
            ]);
        }

        return redirect('/live-offers');
    }

    /**
     * Get Current Authenticated Customer Profile
     */
    public function me(Request $request)
    {
        $customer = Auth::guard('customer')->user();

        if (!$customer) {
            return response()->json([
                'authenticated' => false,
                'customer' => null,
            ]);
        }

        $eligibilityService = app(\App\Services\CustomerOrderEligibilityService::class);
        [$canOrder, $eligibilityMessage, $reasonCode] = $eligibilityService->checkEligibility($customer);

        return response()->json([
            'authenticated' => true,
            'csrf_token' => csrf_token(),
            'customer' => [
                'id' => $customer->id,
                'account_id' => $customer->account_id,
                'name' => $customer->name,
                'username' => $customer->username,
                'mobile' => $customer->mobile,
                'email' => $customer->email,
                'business_name' => $customer->business_name,
                'address' => $customer->address,
                'approval_status' => $customer->approval_status,
                'rejection_reason' => $customer->rejection_reason,
                'can_place_order' => $canOrder,
                'eligibility_message' => $eligibilityMessage,
                'reason_code' => $reasonCode,
            ],
        ]);
    }
}

