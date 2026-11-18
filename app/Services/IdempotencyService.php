<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdempotencyService
{
    /**
     * Execute a database transaction protected by an idempotency key.
     *
     * @param string|null $idempotencyKey Client-supplied UUID token
     * @param string $routeName Transaction identifier / route name
     * @param array $payload Request data (for auditing/hashing)
     * @param int|null $userId Authenticated user ID
     * @param callable $callback Transaction callback: returns ['model' => $model, 'response' => $redirect, 'cache' => array, 'after_commit' => callable|null]
     * @return mixed
     * @throws \Throwable
     */
    public function execute(
        ?string $idempotencyKey,
        string $routeName,
        array $payload,
        ?int $userId,
        callable $callback
    ): mixed {
        // If no idempotency key supplied, run callback directly inside DB transaction for basic atomicity
        if (empty($idempotencyKey)) {
            DB::beginTransaction();
            try {
                $result = $callback();
                DB::commit();
                if (isset($result['after_commit']) && is_callable($result['after_commit'])) {
                    $result['after_commit']();
                }
                return $result['response'] ?? $result;
            } catch (\Throwable $e) {
                DB::rollBack();
                throw $e;
            }
        }

        $idempotencyKey = trim($idempotencyKey);
        $requestHash = hash('sha256', json_encode($payload));
        $lockKey = "idempotency_lock_" . preg_replace('/[^A-Za-z0-9_\-]/', '', $idempotencyKey);
        $lock = Cache::lock($lockKey, 15); // 15-second atomic mutex

        if (!$lock->get()) {
            return redirect()->back()->withErrors([
                'idempotency' => 'This transaction is currently being processed. Please wait a moment.'
            ])->with('error', 'This transaction is currently being processed. Please wait a moment.');
        }

        try {
            // Check existing idempotency key in DB
            $existing = DB::table('idempotency_keys')
                ->where('key', $idempotencyKey)
                ->first();

            if ($existing) {
                if ($existing->status === 'completed') {
                    Log::info("Idempotent replay triggered for key: {$idempotencyKey} on route: {$routeName}");
                    $cached = json_decode($existing->response_payload ?? '{}', true) ?: [];
                    return $this->reconstructResponse($cached, $existing->target_id);
                }

                if ($existing->status === 'processing') {
                    return redirect()->back()->withErrors([
                        'idempotency' => 'This transaction is already being processed.'
                    ])->with('error', 'This transaction is already being processed.');
                }
            } else {
                // Register new key in 'processing' state
                DB::table('idempotency_keys')->insert([
                    'key'              => $idempotencyKey,
                    'user_id'          => $userId,
                    'route_name'       => $routeName,
                    'request_hash'     => $requestHash,
                    'status'           => 'processing',
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ]);
            }

            // Execute the actual business transaction
            DB::beginTransaction();
            try {
                $result = $callback();

                $targetModel = $result['model'] ?? null;
                $responseCache = $result['cache'] ?? [];
                $finalResponse = $result['response'] ?? redirect()->back();

                DB::table('idempotency_keys')
                    ->where('key', $idempotencyKey)
                    ->update([
                        'status'           => 'completed',
                        'target_type'      => $targetModel ? get_class($targetModel) : null,
                        'target_id'        => $targetModel?->id,
                        'response_payload' => json_encode($responseCache),
                        'updated_at'       => now(),
                    ]);

                DB::commit();

                // Run side-effects (e.g. notifications, events) safely after commit
                if (isset($result['after_commit']) && is_callable($result['after_commit'])) {
                    try {
                        $result['after_commit']();
                    } catch (\Throwable $evtErr) {
                        Log::error("Post-commit callback exception: " . $evtErr->getMessage());
                    }
                }

                return $finalResponse;
            } catch (\Throwable $e) {
                DB::rollBack();

                // Mark failed so user can correct any validation/stock errors and retry without permanent lock
                DB::table('idempotency_keys')
                    ->where('key', $idempotencyKey)
                    ->update([
                        'status'     => 'failed',
                        'updated_at' => now(),
                    ]);

                throw $e;
            }
        } finally {
            optional($lock)->release();
        }
    }

    /**
     * Reconstruct an Inertia redirect or JSON response from cached idempotency data.
     */
    protected function reconstructResponse(array $cached, ?int $targetId): Response
    {
        $redirectRoute = $cached['redirect_route'] ?? null;
        $flash = $cached['flash'] ?? [];

        $redirect = $redirectRoute ? redirect()->route($redirectRoute) : redirect()->back();

        foreach ($flash as $k => $v) {
            $redirect->with($k, $v);
        }

        if (!empty($cached['success_dialog'])) {
            $redirect->with('success_dialog', $cached['success_dialog']);
        }
        if (!empty($cached['pdf_url'])) {
            $redirect->with('pdf_url', $cached['pdf_url']);
        }
        if (!empty($cached['id'])) {
            $redirect->with('id', $cached['id']);
        }

        return $redirect;
    }
}
