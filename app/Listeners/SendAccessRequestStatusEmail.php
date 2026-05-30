<?php

namespace App\Listeners;

use App\Events\AccessRequestStatusChanged;
use App\Mail\AccessRequestStatusMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendAccessRequestStatusEmail implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * @var string
     */
    public string $queue = 'emails';

    /**
     * Handle the event.
     *
     * @param AccessRequestStatusChanged $event
     * @return void
     */
    public function handle(AccessRequestStatusChanged $event): void
    {
        $request = $event->accessRequest;
        $recipient = $request->user;

        if ($recipient && $recipient->email) {
            Mail::to($recipient->email)->send(new AccessRequestStatusMail($request));
        }
    }
}
