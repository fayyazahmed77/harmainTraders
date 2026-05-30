<?php

namespace App\Mail;

use App\Models\AccessRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AccessRequestStatusMail extends Mailable implements ShouldQueue
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
        $statusLabel = match ($this->accessRequest->status) {
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            'more_info_requested' => 'Clarification Requested',
            default => ucfirst($this->accessRequest->status),
        };

        return $this->subject("Access Request {$statusLabel} - Harmain Traders")
                    ->view('emails.access-request-status');
    }
}
