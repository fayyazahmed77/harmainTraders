<?php

namespace App\Mail;

use App\Models\Sales;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class GuestOrderPlacedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @var Sales
     */
    public Sales $sale;

    /**
     * Create a new message instance.
     *
     * @param Sales $sale
     */
    public function __construct(Sales $sale)
    {
        $this->sale = $sale;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject("Order #{$this->sale->invoice} Received - Harmain Traders")
                    ->view('emails.guest-order-placed');
    }
}
