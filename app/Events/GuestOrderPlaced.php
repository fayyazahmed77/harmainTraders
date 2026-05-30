<?php

namespace App\Events;

use App\Models\Sales;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GuestOrderPlaced
{
    use Dispatchable, SerializesModels;

    /**
     * @var Sales
     */
    public Sales $sale;

    /**
     * Create a new event instance.
     *
     * @param Sales $sale
     */
    public function __construct(Sales $sale)
    {
        $this->sale = $sale;
    }
}
