<?php

namespace App\Events;

use App\Models\AccessRequest;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AccessRequestStatusChanged
{
    use Dispatchable, SerializesModels;

    /**
     * The access request instance.
     *
     * @var AccessRequest
     */
    public AccessRequest $accessRequest;

    /**
     * The status before the transition.
     *
     * @var string
     */
    public string $previousStatus;

    /**
     * Create a new event instance.
     *
     * @param AccessRequest $accessRequest
     * @param string $previousStatus
     */
    public function __construct(AccessRequest $accessRequest, string $previousStatus)
    {
        $this->accessRequest = $accessRequest;
        $this->previousStatus = $previousStatus;
    }
}
