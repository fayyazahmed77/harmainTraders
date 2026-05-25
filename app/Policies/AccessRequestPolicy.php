<?php

namespace App\Policies;

use App\Models\AccessRequest;
use App\Models\User;

class AccessRequestPolicy
{
    /**
     * Determine whether the user can view any access requests.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('Admin') || $user->hasRole('Super Admin');
    }

    /**
     * Determine whether the user can view the access request.
     */
    public function view(User $user, AccessRequest $accessRequest): bool
    {
        return $user->id === $accessRequest->user_id || $user->hasRole('Admin') || $user->hasRole('Super Admin');
    }

    /**
     * Determine whether the user can create access requests.
     */
    public function create(User $user): bool
    {
        return true; // Any authenticated user can request access
    }

    /**
     * Determine whether the user can approve the access request.
     */
    public function approve(User $user, AccessRequest $accessRequest): bool
    {
        return $user->hasRole('Admin') || $user->hasRole('Super Admin');
    }

    /**
     * Determine whether the user can reject the access request.
     */
    public function reject(User $user, AccessRequest $accessRequest): bool
    {
        return $user->hasRole('Admin') || $user->hasRole('Super Admin');
    }

    /**
     * Determine whether the user can request more information for the access request.
     */
    public function requestMoreInfo(User $user, AccessRequest $accessRequest): bool
    {
        return $user->hasRole('Admin') || $user->hasRole('Super Admin');
    }
}
