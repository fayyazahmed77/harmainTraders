<?php

namespace App\Listeners;

use App\Events\AccessRequestCreated;
use App\Services\ComplianceAuditService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class WriteAuditLedger implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The name of the queue the job should be sent to.
     *
     * @var string|null
     */
    public $queue = 'audit';

    /**
     * The compliance audit logger service.
     *
     * @var ComplianceAuditService
     */
    protected ComplianceAuditService $auditService;

    /**
     * Create the event listener.
     */
    public function __construct(ComplianceAuditService $auditService)
    {
        $this->auditService = $auditService;
    }

    /**
     * Handle the event.
     *
     * @param AccessRequestCreated $event
     * @return void
     */
    public function handle(AccessRequestCreated $event): void
    {
        $request = $event->accessRequest;

        // Log the creation state in the chained cryptographic audit ledger
        $this->auditService->log(
            'access_request.submitted',
            $request,
            null,
            $request->getAttributes(),
            $request->user
        );
    }
}
