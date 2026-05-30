<?php

namespace App\Listeners;

use App\Events\GuestOrderPlaced;
use App\Mail\GuestOrderPlacedMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendGuestOrderPlacedEmail implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * @var string
     */
    public string $queue = 'emails';

    /**
     * Handle the event.
     *
     * @param GuestOrderPlaced $event
     * @return void
     */
    public function handle(GuestOrderPlaced $event): void
    {
        $sale = $event->sale;
        $customer = $sale->customer;

        if ($customer && $customer->email) {
            Mail::to($customer->email)->send(new GuestOrderPlacedMail($sale));
        }
    }
}
