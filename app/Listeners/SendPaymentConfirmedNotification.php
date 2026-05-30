<?php

namespace App\Listeners;

use App\Events\PaymentConfirmed;
use App\Mail\PaymentConfirmedMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendPaymentConfirmedNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * @var string
     */
    public string $queue = 'emails';

    /**
     * Handle the event.
     *
     * @param PaymentConfirmed $event
     * @return void
     */
    public function handle(PaymentConfirmed $event): void
    {
        $payment = $event->payment;
        $customer = $payment->account; // customer account

        if ($customer && $customer->saleman) {
            $salesmanEmail = $customer->saleman->getEmail();
            if ($salesmanEmail) {
                Mail::to($salesmanEmail)->send(new PaymentConfirmedMail($payment));
            }
        }
    }
}
