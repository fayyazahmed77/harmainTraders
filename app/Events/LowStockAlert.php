<?php

namespace App\Events;

use App\Models\Items;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LowStockAlert
{
    use Dispatchable, SerializesModels;

    /**
     * @var Items
     */
    public Items $item;

    /**
     * Create a new event instance.
     *
     * @param Items $item
     */
    public function __construct(Items $item)
    {
        $this->item = $item;
    }
}
