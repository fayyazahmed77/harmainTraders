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

        // Enforce account active status
        if (!$customer->isActive()) {
            throw ValidationException::withMessages([
                'login' => ['Your online customer portal access has been disabled by administration. Please contact customer support on WhatsApp at 0331 8102001.'],
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
                    'is_active' => $customer->isActive(),
                    'must_change_password' => $customer->mustChangePassword(),
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

        // Dispatch in-system notification to all Admin role users about new customer registration
        try {
            $existingRoles = \Spatie\Permission\Models\Role::whereIn('name', ['Admin', 'Super Admin', 'admin', 'super-admin'])
                ->pluck('name')
                ->toArray();
            $admins = !empty($existingRoles) ? User::role($existingRoles)->get()->unique('id')->values() : collect();
            if ($admins->isEmpty()) {
                $admins = User::all();
            }

            $notifTitle = "New Customer Registration: {$customer->name}";
            $bizSuffix = $customer->business_name ? " ({$customer->business_name})" : "";
            $notifMessage = "{$customer->name}{$bizSuffix} [{$customer->mobile}] registered on the wholesale portal and is awaiting approval.";
            $actionUrl = '/customers/approvals?tab=pending';
            $nowTimestamp = now();
            $broadcastPayloads = [];

            foreach ($admins as $admin) {
                $notifId = (string) Str::orderedUuid();
                Notification::create([
                    'id' => $notifId,
                    'type' => 'App\Notifications\NewCustomerRegistrationNotification',
                    'notifiable_type' => User::class,
                    'notifiable_id' => $admin->id,
                    'priority' => 'high',
                    'category' => 'customers',
                    'data' => [
                        'title' => $notifTitle,
                        'message' => $notifMessage,
                        'action_url' => $actionUrl,
                        'customer_user_id' => $customer->id,
                        'name' => $customer->name,
                        'username' => $customer->username,
                        'mobile' => $customer->mobile,
                        'business_name' => $customer->business_name,
                    ],
                    'created_at' => $nowTimestamp,
                ]);

                $broadcastPayloads[] = [
                    'recipient_id' => $admin->id,
                    'payload' => [
                        'id' => $notifId,
                        'title' => $notifTitle,
                        'message' => $notifMessage,
                        'actionUrl' => $actionUrl,
                        'category' => 'customers',
                        'priority' => 'high',
                        'read' => false,
                        'createdAt' => 'Just now',
                    ],
                ];
            }

            if (config('queue.default') !== 'sync') {
                foreach ($broadcastPayloads as $bp) {
                    try {
                        broadcast(new \App\Events\RealtimeNotificationEvent($bp['recipient_id'], $bp['payload']));
                    } catch (\Throwable $e) {
                        // Ignore if broadcast driver is offline
                    }
                }
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
                'is_active' => $customer->isActive(),
                'must_change_password' => $customer->mustChangePassword(),
                'can_place_order' => $canOrder,
                'eligibility_message' => $eligibilityMessage,
                'reason_code' => $reasonCode,
            ],
        ]);
    }

    /**
     * Customer Password Update (First login or self-service)
     */
    public function updatePassword(Request $request)
    {
        $customer = Auth::guard('customer')->user();
        if (!$customer) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($request->current_password, $customer->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Your current temporary password does not match.'],
            ]);
        }

        $customer->password = $request->new_password;
        $customer->must_change_password = false;
        $customer->save();

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully! You can now use all online ordering features.',
        ]);
    }
}

