<?php

namespace App\Mail;

use App\Models\FinancialRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class FinancialRequestStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public $finRequest;
    public $status;
    public $adminNote;

    /**
     * Create a new message instance.
     */
    public function __construct(FinancialRequest $finRequest, string $status, ?string $adminNote = null)
    {
        $this->finRequest = $finRequest;
        $this->status = $status;
        $this->adminNote = $adminNote;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $subject = 'Financial Request ' . ucfirst($this->status) . ' - Harmain Traders';
        
        return $this->subject($subject)
                    ->view('emails.financial-request-status');
    }
}
