<?php

namespace App\Mail;

use App\Models\OnlineOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewOnlineOrderAdminMail extends Mailable
{
    use Queueable, SerializesModels;

    public OnlineOrder $order;

    /**
     * Create a new message instance.
     */
    public function __construct(OnlineOrder $order)
    {
        $this->order = $order->loadMissing(['items', 'customerUser']);
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $customerName = $this->order->customerUser->name ?? 'Customer';

        return $this->subject("New Online Order #{$this->order->order_no} from {$customerName} - Haramain Traders")
                    ->view('emails.admin-new-online-order', [
                        'order' => $this->order,
                        'customer' => $this->order->customerUser,
                        'items' => $this->order->items,
                        'reviewUrl' => url('/online-orders/' . $this->order->order_no),
                    ]);
    }
}

