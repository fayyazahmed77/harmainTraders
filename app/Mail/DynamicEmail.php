<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\SiteSetting;

class DynamicEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $subject;
    public $content;
    public $settings;

    /**
     * Create a new message instance.
     */
    public function __construct(string $subject, string $content)
    {
        $this->subject = $subject;
        $this->content = $content;
        $this->settings = SiteSetting::get();
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subject,
            from: new \Illuminate\Mail\Mailables\Address(
                $this->settings->mail_from_address ?? config('mail.from.address'),
                $this->settings->mail_from_name ?? config('mail.from.name')
            )
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.dynamic',
        );
    }
}
