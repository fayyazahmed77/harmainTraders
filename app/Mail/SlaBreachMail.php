<?php

namespace App\Mail;

use App\Models\AccessRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SlaBreachMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @var AccessRequest
     */
    public AccessRequest $accessRequest;

    /**
     * Create a new message instance.
     *
     * @param AccessRequest $accessRequest
     */
    public function __construct(AccessRequest $accessRequest)
    {
        $this->accessRequest = $accessRequest;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject("SLA Breach Alert: Access Request Pending > 24 Hours - Harmain Traders")
                    ->view('emails.sla-breach');
    }
}
