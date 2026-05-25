<?php

namespace App\Events;

use App\Models\AccessRequest;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AccessRequestCreated
{
    use Dispatchable, SerializesModels;

    /**
     * The access request instance that was created.
     *
     * @var AccessRequest
     */
    public AccessRequest $accessRequest;

    /**
     * Create a new event instance.
     *
     * @param AccessRequest $accessRequest
     */
    public function __construct(AccessRequest $accessRequest)
    {
        $this->accessRequest = $accessRequest;
    }
}
