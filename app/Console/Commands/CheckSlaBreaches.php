<?php

namespace App\Console\Commands;

use App\Models\AccessRequest;
use App\Models\User;
use App\Mail\SlaBreachMail;
use App\Services\NotificationEngine;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;

class CheckSlaBreaches extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-sla-breaches';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for Access Privilege Requests that have breached the 24-hour SLA window and notify admins';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Checking for SLA breaches on pending access requests...');

        $breachedRequests = AccessRequest::where('status', 'pending')
            ->where('sla_due_at', '<', now())
            ->where('sla_breached', false)
            ->get();

        if ($breachedRequests->isEmpty()) {
            $this->info('No new SLA breaches detected.');
            return Command::SUCCESS;
        }

        $existingRoles = Role::pluck('name')->toArray();
        $adminRoles = array_intersect(['Admin', 'Super Admin'], $existingRoles);
        $admins = !empty($adminRoles) ? User::role($adminRoles)->get() : collect();

        if ($admins->isEmpty()) {
            $admins = User::all();
        }

        $notificationEngine = app(NotificationEngine::class);

        foreach ($breachedRequests as $request) {
            $this->warn("Request {$request->id} by " . ($request->user->name ?? 'Unknown') . " has breached SLA.");

            // 1. Mark as breached
            $request->update(['sla_breached' => true]);

            // 2. Prepare payload for real-time notification
            $payload = [
                'type' => 'App\Notifications\SlaBreachNotification',
                'title' => 'SLA Breach Warning',
                'message' => "Access request by " . ($request->user->name ?? 'Unknown') . " has been pending for over 24 hours.",
                'category' => 'workflow',
                'priority' => 'critical',
                'action_url' => '/admin/access-requests',
            ];

            // 3. Notify Admins via Pusher & Email
            foreach ($admins as $admin) {
                // Pusher / DB Notification
                $notificationEngine->send($admin, $payload);

                // Queue SLA Breach Mail
                if ($admin->email) {
                    Mail::to($admin->email)->send(new SlaBreachMail($request));
                }
            }
        }

        $this->info('SLA breach check completed.');
        return Command::SUCCESS;
    }
}
