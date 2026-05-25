<?php

namespace App\Listeners;

use App\Events\AccessRequestCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendAdminApprovalEmail implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The name of the queue the job should be sent to.
     *
     * @var string|null
     */
    public $queue = 'emails';

    /**
     * Handle the event.
     *
     * @param AccessRequestCreated $event
     * @return void
     */
    public function handle(AccessRequestCreated $event): void
    {
        $request = $event->accessRequest;

        // Fetch all administrator users safely by checking existing roles first
        $existingRoles = \Spatie\Permission\Models\Role::pluck('name')->toArray();
        $adminRoles = array_intersect(['Admin', 'Super Admin'], $existingRoles);
        $admins = !empty($adminRoles) ? \App\Models\User::role($adminRoles)->get() : collect();

        // If no roles are defined (e.g. in test envs), notify all users as a fallback
        if ($admins->isEmpty()) {
            $admins = \App\Models\User::all();
        }

        foreach ($admins as $admin) {
            // Generate temporary signed URL to approve (valid for 24 hours)
            $approveUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'signed.approve',
                now()->addHours(24),
                [
                    'id'       => $request->id,
                    'actor_id' => $admin->id,
                ]
            );

            // Generate temporary signed URL to reject (valid for 24 hours)
            $rejectUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'signed.reject',
                now()->addHours(24),
                [
                    'id'       => $request->id,
                    'actor_id' => $admin->id,
                ]
            );

            // Dispatch Mailable
            \Illuminate\Support\Facades\Mail::to($admin->email)->send(
                new \App\Mail\AccessRequestMail($request, $approveUrl, $rejectUrl)
            );
        }
    }
}
