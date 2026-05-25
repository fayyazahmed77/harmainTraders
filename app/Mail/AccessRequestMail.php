<?php

namespace App\Mail;

use App\Models\AccessRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccessRequestMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * The access request instance.
     *
     * @var AccessRequest
     */
    public $accessRequest;

    /**
     * The signed URL to approve the request.
     *
     * @var string
     */
    public $approveUrl;

    /**
     * The signed URL to reject the request.
     *
     * @var string
     */
    public $rejectUrl;

    /**
     * Create a new message instance.
     *
     * @param AccessRequest $accessRequest
     * @param string $approveUrl
     * @param string $rejectUrl
     */
    public function __construct(AccessRequest $accessRequest, string $approveUrl, string $rejectUrl)
    {
        $this->accessRequest = $accessRequest;
        $this->approveUrl = $approveUrl;
        $this->rejectUrl = $rejectUrl;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $userName = $this->accessRequest->user->name ?? 'A user';

        return new Envelope(
            subject: "Access Privilege Request - {$userName}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.access-request',
            with: [
                'userName'      => $this->accessRequest->user->name ?? 'A user',
                'resourceType'  => $this->accessRequest->resource_type,
                'actionType'    => $this->accessRequest->action_type,
                'justification' => $this->accessRequest->justification,
                'approveUrl'    => $this->approveUrl,
                'rejectUrl'     => $this->rejectUrl,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
