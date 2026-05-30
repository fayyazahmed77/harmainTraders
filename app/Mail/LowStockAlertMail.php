<?php

namespace App\Mail;

use App\Models\Items;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LowStockAlertMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @var Items
     */
    public Items $item;

    /**
     * Create a new message instance.
     *
     * @param Items $item
     */
    public function __construct(Items $item)
    {
        $this->item = $item;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject("Low Stock Alert: {$this->item->title} - Harmain Traders")
                    ->view('emails.low-stock-alert');
    }
}
