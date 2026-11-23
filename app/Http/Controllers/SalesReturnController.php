<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Items;
use App\Models\SalesReturn;
use App\Models\Account;
use App\Models\Saleman;
use App\Models\SalesReturnItem;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Sales;
use App\Models\SalesItem;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\MessageLine;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class SalesReturnController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view returns', only: ['index', 'show']),
            new Middleware('permission:create returns', only: ['create', 'store']),
            new Middleware('permission:edit returns', only: ['edit', 'update']),
            new Middleware('permission:delete returns', only: ['destroy']),
        ];
    }
    //index
    public function index(Request $request)
    {
        $query = SalesReturn::with(['customer:id,title,code', 'salesman:id,name']);

        // Search by Return Invoice, Original Invoice, Remarks, or Customer Title/Code
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('invoice', 'like', "%{$search}%")
                  ->orWhere('original_invoice', 'like', "%{$search}%")
                  ->orWhere('remarks', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($sub) use ($search) {
                      $sub->where('title', 'like', "%{$search}%")
                          ->orWhere('code', 'like', "%{$search}%");
                  });
            });
        }

        // Date Range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        } elseif ($request->filled('start_date')) {
            $query->where('date', '>=', $request->start_date);
        } elseif ($request->filled('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }

        // Customer / Account Filter
        if ($request->filled('customer_id') && $request->customer_id !== 'all') {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->filled('account_id') && $request->account_id !== 'all') {
            $query->where('customer_id', $request->account_id);
        }

        // Salesman Filter
        if ($request->filled('salesman_id') && $request->salesman_id !== 'all') {
            $query->where('salesman_id', $request->salesman_id);
        }

        // Firm Filter
        if ($request->filled('firm_id') && $request->firm_id !== 'all') {
            $query->where('firm_id', $request->firm_id);
        }

        // Min & Max Amount Filter
        if ($request->filled('min_amount')) {
            $query->where('net_total', '>=', (float) $request->min_amount);
        }
        if ($request->filled('max_amount')) {
            $query->where('net_total', '<=', (float) $request->max_amount);
        }

        // Summary KPI statistics reflecting active filters
        $summary = [
            'total_volume' => (int) (clone $query)->count(),
            'total_amount' => (float) (clone $query)->sum('net_total'),
            'total_items'  => (int) (clone $query)->sum('no_of_items'),
        ];

        // Pagination (Default 50 rows, matching Journal Vouchers)
        $perPage = in_array((int) $request->input('per_page'), [15, 25, 50, 100]) ? (int) $request->input('per_page') : 50;
        $returns = $query->orderBy('date', 'desc')
                         ->orderBy('id', 'desc')
                         ->paginate($perPage)
                         ->withQueryString();

        // Dropdown data for filter controls
        $customers = Account::eligibleForSale()
            ->select('id', 'title', 'code')
            ->orderBy('title')
            ->get();
        if ($customers->isEmpty()) {
            $customers = Account::where('sale', 1)->select('id', 'title', 'code')->orderBy('title')->get();
        }

        $salesmen = Saleman::select('id', 'name')->orderBy('name')->get();
        $firms = \App\Models\Firm::select('id', 'name')->get();

        return Inertia::render("daily/sales_return/index", [
            'returns'   => $returns,
            'summary'   => $summary,
            'customers' => $customers,
            'salesmen'  => $salesmen,
            'firms'     => $firms,
            'filters'   => $request->all(['search', 'start_date', 'end_date', 'customer_id', 'account_id', 'salesman_id', 'firm_id', 'min_amount', 'max_amount', 'per_page']),
        ]);
    }

    //create
    public function create(Request $request)
    {
        // Accounts are loaded on-demand via /account/picker?context=sales_return
        $accounts = [];

        $salemans = Saleman::get();
        $messageLines = MessageLine::get(['id', 'messageline']);

        // Suggest next return invoice number (final sequential ID is generated at save time)
        $nextInvoiceNo = $this->generateNextReturnInvoice();

        // Payment accounts for refunds
        $paymentAccounts = Account::active()->whereHas('accountType', function($q) {
            $q->whereIn('name', ['Cash', 'Bank', 'Cheque In Hand']);
        })->get(['id', 'title', 'code']);

        $firms = \App\Models\Firm::select('id', 'name', 'defult')->get();

        return Inertia::render("daily/sales_return/create", [
            'accounts'        => $accounts,
            'salemans'        => $salemans,
            'messageLines'    => $messageLines,
            'nextInvoiceNo'   => $nextInvoiceNo,
            'paymentAccounts' => $paymentAccounts,
            'firms'           => $firms,
        ]);
    }

    //store
    public function store(Request $request)
    {
        try {
            $request->validate([
                'date'            => 'required|date',
                'invoice'         => 'nullable|string',
                'original_invoice' => 'required|string|exists:sales,invoice',
                'customer_id'     => 'required|integer',
                'firm_id'         => 'nullable|integer',
                'no_of_items'     => 'required|integer',
                'gross_total'     => 'required|numeric',
                'discount_total'  => 'required|numeric',
                'tax_total'       => 'required|numeric',
                'net_total'       => 'required|numeric',
                'extra_discount'  => 'nullable|numeric|min:0',
                'paid_amount'     => 'required|numeric',
                'remaining_amount' => 'required|numeric',
                'payment_account_id' => 'nullable|integer|exists:accounts,id',
                'sale_id'         => 'nullable|integer|exists:sales,id',

                // items array validation
                'items'                   => 'required|array',
                'items.*.item_id'         => 'required|integer',
                'items.*.qty_carton'      => 'required|numeric',
                'items.*.qty_pcs'         => 'required|numeric',
                'items.*.total_pcs'       => 'required|numeric',
                'items.*.trade_price'     => 'required|numeric',
                'items.*.discount'        => 'required|numeric',
                'items.*.gst_amount'      => 'required|numeric',
                'items.*.subtotal'        => 'required|numeric',
                'idempotency_key'         => 'nullable|string|max:64',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('SalesReturn validation failed', [
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);
            throw $e;
        }

        $sale = null;
        if ($request->filled('sale_id')) {
            $sale = Sales::find($request->sale_id);
        }
        if (!$sale) {
            $sale = Sales::where('invoice', $request->original_invoice)
                ->where('customer_id', $request->customer_id)
                ->first();
        }
        if (!$sale) {
            $sale = Sales::where('invoice', $request->original_invoice)->first();
        }

        if (!$sale) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'original_invoice' => 'The selected original invoice does not exist.'
            ]);
        }
        if ($sale->customer_id != $request->customer_id) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'original_invoice' => 'The original invoice does not belong to the selected customer.'
            ]);
        }
        if ($sale->status === 'Canceled') {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'original_invoice' => 'The selected original invoice has been canceled and cannot be returned.'
            ]);
        }

        // Validate item quantities first (grouped across any duplicate rows of the same item)
        $requestedPcsByItem = [];
        foreach ($request->items as $it) {
            if ($it['qty_carton'] < 0 || $it['qty_pcs'] < 0 || $it['total_pcs'] < 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Return quantities cannot be negative.'
                ]);
            }

            $itemId = (int) $it['item_id'];
            $item = Items::find($itemId);
            if (!$item) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Selected item does not exist.'
                ]);
            }
            $packing = $item->packing_qty ?: 1;
            // Note: frontend total_pcs already includes bonus_qty_carton and bonus_qty_pcs; calculate authoritatively here without double-counting
            $rowTotalPcs = (((float) ($it['qty_carton'] ?? 0) + (float) ($it['bonus_qty_carton'] ?? 0)) * $packing)
                + (float) ($it['qty_pcs'] ?? 0)
                + (float) ($it['bonus_qty_pcs'] ?? 0);

            $requestedPcsByItem[$itemId] = ($requestedPcsByItem[$itemId] ?? 0.0) + $rowTotalPcs;
        }

        foreach ($requestedPcsByItem as $itemId => $totalToReturn) {
            // Fetch original sales items (summed across any duplicate lines of the same item)
            $saleItemsQuery = \App\Models\SalesItem::where('sale_id', $sale->id)
                ->where('item_id', $itemId);
            if (!$saleItemsQuery->exists()) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Item was not purchased on the original invoice.'
                ]);
            }
            $originalSoldTotalPcs = (float) $saleItemsQuery->sum('total_pcs');

            // Calculate already returned pieces for this item on this sale
            $alreadyReturnedPcs = (float) \App\Models\SalesReturnItem::join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
                ->where('sales_returns.sale_id', $sale->id)
                ->where('sales_return_items.item_id', $itemId)
                ->sum('sales_return_items.total_pcs');

            $maxReturnableQty = $originalSoldTotalPcs - $alreadyReturnedPcs;

            if ($totalToReturn > $maxReturnableQty + 0.001) {
                $item = Items::find($itemId);
                $itemTitle = $item ? $item->title : ('#' . $itemId);
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Return quantity for item ' . $itemTitle . ' (' . $totalToReturn . ' Pcs) exceeds returnable limit (' . $maxReturnableQty . ' Pcs).'
                ]);
            }
        }

        $liveReturned = (float) SalesReturn::where('sale_id', $sale->id)->sum('net_total');
        $maxReturnable = max(0, (float) $sale->net_total - $liveReturned);

        // Auto-clamp rounding/discount-derivation differences when item quantities are verified within returnable limits
        $diff = round($request->net_total, 2) - round($maxReturnable, 2);
        $totalSoldOnSale = (float) \App\Models\SalesItem::where('sale_id', $sale->id)->sum('total_pcs');
        $totalAlreadyReturnedOnSale = (float) \App\Models\SalesReturnItem::join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->where('sales_returns.sale_id', $sale->id)
            ->sum('sales_return_items.total_pcs');
        $totalReturningNow = array_sum($requestedPcsByItem);
        $isFullRemainingReturn = ($totalSoldOnSale > 0) && (($totalAlreadyReturnedOnSale + $totalReturningNow) >= ($totalSoldOnSale - 0.001));

        if ($diff > 0 && ($diff <= 50.00 || $isFullRemainingReturn)) {
            $request->merge([
                'net_total' => $maxReturnable,
                'remaining_amount' => max(0, $maxReturnable - (float)($request->extra_discount ?? 0) - (float)($request->paid_amount ?? 0)),
            ]);
        }

        if (round($request->net_total, 2) > round($maxReturnable, 2) + 0.01) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'net_total' => 'Return amount (' . number_format($request->net_total, 2) . ') cannot exceed returnable balance (' . number_format($maxReturnable, 2) . '). Already returned: ' . number_format($liveReturned, 2) . '.'
            ]);
        }

        $idempotencyService = app(\App\Services\IdempotencyService::class);

        try {
            return $idempotencyService->execute(
                idempotencyKey: $request->input('idempotency_key'),
                routeName: 'sales_return.store',
                payload: $request->except(['_token']),
                userId: \Illuminate\Support\Facades\Auth::id(),
                callback: function () use ($request, $sale) {
                    // Generate sequential invoice number inside the transaction to prevent duplicates
                    $finalInvoice = $request->invoice ?? $this->generateNextReturnInvoice();

                    $customer = Account::findOrFail($request->customer_id);
                    $previousBalance = (float)$customer->current_balance;

                    $extraDiscount = (float)($request->extra_discount ?? 0);
                    if ($extraDiscount > $request->net_total) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'extra_discount' => 'Extra discount cannot exceed return total.'
                        ]);
                    }

                    $return = SalesReturn::create([
                        'date'            => $request->date,
                        'invoice'         => $finalInvoice,
                        'original_invoice' => $request->original_invoice,
                        'sale_id'         => $sale->id,
                        'customer_id'     => $request->customer_id,
                        'previous_balance' => $previousBalance,
                        'salesman_id'     => $request->salesman_id ?? 0,
                        'firm_id'         => $request->firm_id ?? null,
                        'no_of_items'     => $request->no_of_items,
                        'gross_total'     => $request->gross_total,
                        'discount_total'  => $request->discount_total,
                        'tax_total'       => $request->tax_total,
                        'net_total'       => $request->net_total,
                        'extra_discount'  => $extraDiscount,
                        'paid_amount'     => $request->paid_amount,
                        'remaining_amount' => $request->remaining_amount,
                        'remarks'         => $request->remarks,
                    ]);

                    foreach ($request->items as $it) {
                        SalesReturnItem::create([
                            'sales_return_id' => $return->id,
                            'item_id'     => $it['item_id'],
                            'qty_carton'  => $it['qty_carton'],
                            'qty_pcs'     => $it['qty_pcs'],
                            'total_pcs'   => $it['total_pcs'],
                            'bonus_qty_carton' => $it['bonus_qty_carton'] ?? 0,
                            'bonus_qty_pcs'    => $it['bonus_qty_pcs'] ?? 0,
                            'trade_price' => $it['trade_price'],
                            'discount'    => $it['discount'] ?? 0,
                            'gst_amount'  => $it['gst_amount'] ?? 0,
                            'subtotal'    => $it['subtotal'],
                        ]);

                        // INCREASE Stock for Returns (total_pcs already includes bonus units)
                        $item = Items::where('id', $it['item_id'])->lockForUpdate()->first();
                        if ($item) {
                            $totalToReturn = (int)$it['total_pcs'];
                            // Inward stock recorded transactionally in sales_return_items
                        }
                    }

                    // Allocate return value using the FIFO Allocation engine
                    $allocationService = new \App\Services\FIFOAllocationService();
                    $allocationService->allocate($return, (float)($return->net_total - $return->extra_discount));

                    // Log activity
                    \App\Services\ActivityLogger::log('created', 'Sales Return', "Created sales return {$finalInvoice} for customer ID {$request->customer_id}");

                    // Recalculate status and balance of the source invoice
                    $this->updateSaleStatusAndBalance($sale->invoice, $sale->id);

                    $return->load(['customer', 'items']);
                    $successDialogData = [
                        'customerName'  => $return->customer->title ?? 'Customer',
                        'totalAmount'   => (float) max(0, $return->net_total - ($return->extra_discount ?? 0)),
                        'countItems'    => $return->items->count(),
                        'countFull'     => (int) $return->items->sum('qty_carton'),
                        'countPcs'      => (int) $return->items->sum('qty_pcs'),
                        'totalDiscount' => (float) ($return->discount_total + ($return->extra_discount ?? 0)),
                        'saleId'        => $return->id,
                        'invoiceNo'     => $return->invoice,
                        'type'          => 'create',
                    ];

                    $finalResponse = redirect()->route('sales_return.index')
                        ->with('success', 'Sales Return saved successfully!')
                        ->with('id', $return->id)
                        ->with('success_dialog', $successDialogData);

                    return [
                        'model'    => $return,
                        'response' => $finalResponse,
                        'cache'    => [
                            'redirect_route' => 'sales_return.index',
                            'id'             => $return->id,
                            'flash'          => [
                                'success' => 'Sales Return saved successfully!',
                                'id'      => $return->id,
                            ],
                            'success_dialog' => $successDialogData,
                        ],
                    ];
                }
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('SalesReturnController@store error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    // Get customer's sales invoices
    
public function getCustomerInvoices($customerId)
{
    try {
        $sales = Sales::where('customer_id', $customerId)
            ->select(
                'id',
                'invoice',
                'date',
                'net_total',
                'remaining_amount',
                'status',
                'firm_id'
            )
            ->orderByDesc('created_at')
            ->get()
            ->unique('invoice')
            ->values();

        $saleIds = $sales->pluck('id');

        $soldQuantities = \App\Models\SalesItem::query()
            ->whereIn('sale_id', $saleIds)
            ->selectRaw('sale_id, SUM(total_pcs) as total_pcs')
            ->groupBy('sale_id')
            ->pluck('total_pcs', 'sale_id');

        $returns = SalesReturn::query()
            ->whereIn('sale_id', $saleIds)
            ->selectRaw('sale_id, SUM(net_total) as returned_amount')
            ->selectRaw('COUNT(*) as return_count')
            ->groupBy('sale_id')
            ->get()
            ->keyBy('sale_id');

        $returnIds = SalesReturn::whereIn('sale_id', $saleIds)
            ->pluck('id');

        $returnedQuantities = \App\Models\SalesReturnItem::query()
            ->whereIn('sales_return_id', $returnIds)
            ->join(
                'sales_returns',
                'sales_returns.id',
                '=',
                'sales_return_items.sales_return_id'
            )
            ->selectRaw(
                'sales_returns.sale_id, SUM(sales_return_items.total_pcs) as total_pcs'
            )
            ->groupBy('sales_returns.sale_id')
            ->pluck('total_pcs', 'sales_returns.sale_id');

        $invoices = $sales->map(function ($sale) use (
            $soldQuantities,
            $returnedQuantities,
            $returns
        ) {
            $totalSoldPcs = (float) ($soldQuantities[$sale->id] ?? 0);
            $totalReturnedPcs = (float) ($returnedQuantities[$sale->id] ?? 0);

            $returnedAmount = (float) (
                $returns[$sale->id]->returned_amount ?? 0
            );

            $isFullyReturned =
                ($totalSoldPcs > 0 && $totalReturnedPcs >= $totalSoldPcs)
                || $sale->status === 'Returned';

            $isPartialReturn =
                !$isFullyReturned
                && (
                    $totalReturnedPcs > 0
                    || $sale->status === 'Partial Return'
                );

            $status = $isFullyReturned
                ? 'Returned'
                : ($isPartialReturn
                    ? 'Partial Return'
                    : ($sale->status ?? 'Completed'));

            return [
                'id' => $sale->id,
                'invoice' => $sale->invoice,
                'date' => $sale->date,
                'net_total' => $sale->net_total,

                'returnable_amount' => round(
                    max(0, (float) $sale->net_total - $returnedAmount),
                    2
                ),

                'remaining_amount' => $isFullyReturned
                    ? 0.0
                    : max(0.0, (float) $sale->remaining_amount),

                'status' => $status,
                'firm_id' => $sale->firm_id,
                'is_fully_returned' => $isFullyReturned,

                'returnable_pcs' => max(
                    0,
                    (int) ($totalSoldPcs - $totalReturnedPcs)
                ),
            ];
        });

        return response()->json($invoices);

    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\Log::error(
            'Customer invoice retrieval failed',
            [
                'customer_id' => $customerId,
                'error' => $e->getMessage(),
            ]
        );

        return response()->json([
            'error' => 'Unable to retrieve customer invoices.'
        ], 500);
    }
}


    // Get items for a specific invoice
    public function getInvoiceItems($invoiceId)
    {
        try {
            /** @var \App\Models\Sales|null $sale */
            $sale = Sales::with('items.item')->find($invoiceId);
            if (!$sale) {
                return response()->json(['error' => 'Invoice not found'], 404);
            }

            if ($sale->items) {
                \App\Services\StockService::attachRealtimeBalances($sale->items->pluck('item')->filter());
            }

            // Pre-aggregate already returned pieces per item on this invoice so duplicate rows of the same item share the returned pool accurately
            $returnedPoolByItem = \App\Models\SalesReturnItem::join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
                ->where('sales_returns.sale_id', $sale->id)
                ->selectRaw('sales_return_items.item_id, SUM(sales_return_items.total_pcs) as returned_pcs')
                ->groupBy('sales_return_items.item_id')
                ->pluck('returned_pcs', 'item_id')
                ->map(fn($v) => (float) $v)
                ->all();

            $items = $sale->items->map(function ($saleItem) use (&$returnedPoolByItem) {
                $itemId = $saleItem->item_id;
                $remPool = $returnedPoolByItem[$itemId] ?? 0.0;
                $lineSoldPcs = (float) $saleItem->total_pcs;
                $allocatedReturned = min($lineSoldPcs, $remPool);
                $returnedPoolByItem[$itemId] = max(0.0, $remPool - $allocatedReturned);

                return [
                    'item_id'              => $saleItem->item_id,
                    'item'                 => $saleItem->item,
                    'qty_carton'           => $saleItem->qty_carton,
                    'qty_pcs'              => $saleItem->qty_pcs,
                    'total_pcs'            => $saleItem->total_pcs,
                    'already_returned_pcs' => (int) round($allocatedReturned),
                    'returnable_pcs'       => max(0, (int) round($lineSoldPcs - $allocatedReturned)),
                    'trade_price'          => $saleItem->trade_price, // exact price from sale
                    'discount'             => $saleItem->discount,
                    'gst_amount'           => $saleItem->gst_amount,
                    'subtotal'             => $saleItem->subtotal,
                    'bonus_carton'         => $saleItem->bonus_qty_carton,
                    'bonus_pcs'            => $saleItem->bonus_qty_pcs,
                ];
            });

            $liveReturned = (float) SalesReturn::where('sale_id', $sale->id)->sum('net_total');
            $maxReturnable = max(0, (float) $sale->net_total - $liveReturned);

            return response()->json([
                'invoice'           => $sale->invoice,
                'date'              => $sale->date,
                'net_total'         => $sale->net_total,
                'returnable_amount' => $maxReturnable,
                'items'             => $items,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Get customer's purchased items (for manual mode)
    public function getCustomerPurchasedItems($customerId)
    {
        try {
            $sales = Sales::where('customer_id', $customerId)->pluck('id');

            $rawPurchasedItems = SalesItem::select('sales_items.*')
                ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
                ->whereIn('sales_items.sale_id', $sales)
                ->orderBy('sales.date', 'desc')
                ->orderBy('sales.id', 'desc')
                ->with(['item', 'sale:id,invoice,date'])
                ->get();

            \App\Services\StockService::attachRealtimeBalances($rawPurchasedItems->pluck('item')->filter());

            // Pre-aggregate returned pieces per (sale_id, item_id) so duplicate lines on the same invoice distribute returned quantities accurately
            $returnedBySaleAndItem = \App\Models\SalesReturnItem::join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
                ->whereIn('sales_returns.sale_id', $sales)
                ->selectRaw('sales_returns.sale_id, sales_return_items.item_id, SUM(sales_return_items.total_pcs) as returned_pcs')
                ->groupBy('sales_returns.sale_id', 'sales_return_items.item_id')
                ->get()
                ->mapWithKeys(fn($r) => [($r->sale_id . '_' . $r->item_id) => (float) $r->returned_pcs])
                ->all();

            $purchasedItems = $rawPurchasedItems->map(function ($si) use (&$returnedBySaleAndItem) {
                    $poolKey = $si->sale_id . '_' . $si->item_id;
                    $remPool = $returnedBySaleAndItem[$poolKey] ?? 0.0;
                    $lineSoldPcs = (float) $si->total_pcs;
                    $allocatedReturned = min($lineSoldPcs, $remPool);
                    $returnedBySaleAndItem[$poolKey] = max(0.0, $remPool - $allocatedReturned);

                    return [
                        'id'               => $si->id,
                        'sale_id'          => $si->sale_id,
                        'item_id'          => $si->item_id,
                        'item'             => $si->item,
                        'invoice_no'       => $si->sale->invoice ?? 'N/A',
                        'date'             => $si->sale->date ?? 'N/A',
                        'qty_carton'       => $si->qty_carton,
                        'qty_pcs'          => $si->qty_pcs,
                        'total_pcs'        => $si->total_pcs,
                        'already_returned_pcs' => (int) round($allocatedReturned),
                        'returnable_pcs'       => max(0, (int) round($lineSoldPcs - $allocatedReturned)),
                        'last_trade_price' => $si->trade_price,
                        'gst_amount'       => $si->gst_amount,
                        'discount'         => $si->discount,
                        'subtotal'         => $si->subtotal,
                        'bonus_carton'     => $si->bonus_qty_carton,
                        'bonus_pcs'        => $si->bonus_qty_pcs,
                    ];
                });

            return response()->json($purchasedItems);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    //show
    public function show($id)
    {
        $return = SalesReturn::with(['customer', 'salesman', 'items.item', 'firm'])->findOrFail($id);
        return Inertia::render("daily/sales_return/view", [
            'returnData' => $return,
        ]);
    }

    //edit
    public function edit($id)
    {
        $return = SalesReturn::with(['customer', 'salesman', 'items.item', 'firm'])->findOrFail($id);
        if ($return && $return->items) {
            \App\Services\StockService::attachRealtimeBalances($return->items->pluck('item')->filter());
        }

        // Load ONLY the currently assigned customer (others fetched on-demand via /account/picker?context=sales_return)
        $accounts = AccountController::loadSingleForPicker($return->customer_id ? (int) $return->customer_id : null, 'sales_return');

        $salemans = Saleman::get();
        $messageLines = MessageLine::get(['id', 'messageline']);

        // Payment accounts for refunds
        $paymentAccounts = Account::whereHas('accountType', function($q) {
            $q->whereIn('name', ['Cash', 'Bank', 'Cheque In Hand']);
        })->get(['id', 'title', 'code']);

        $firms = \App\Models\Firm::select('id', 'name', 'defult')->get();

        return Inertia::render("daily/sales_return/edit", [
            'returnData'    => $return,
            'accounts'      => $accounts,
            'salemans'      => $salemans,
            'messageLines'  => $messageLines,
            'paymentAccounts' => $paymentAccounts,
            'firms'         => $firms,
        ]);
    }

    //update
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'date'            => 'required|date',
                'invoice'         => 'required|string',
                'original_invoice' => 'required|string|exists:sales,invoice',
                'customer_id'     => 'required|integer',
                'firm_id'         => 'nullable|integer',
                'no_of_items'     => 'required|integer',
                'gross_total'     => 'required|numeric',
                'discount_total'  => 'required|numeric',
                'tax_total'       => 'required|numeric',
                'net_total'       => 'required|numeric',
                'extra_discount'  => 'nullable|numeric|min:0',
                'items'           => 'required|array',
                'sale_id'         => 'nullable|integer|exists:sales,id',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('SalesReturn update validation failed', [
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);
            throw $e;
        }

        $newSale = null;
        if ($request->filled('sale_id')) {
            $newSale = Sales::find($request->sale_id);
        }
        if (!$newSale) {
            $newSale = Sales::where('invoice', $request->original_invoice)
                ->where('customer_id', $request->customer_id)
                ->first();
        }
        if (!$newSale) {
            $newSale = Sales::where('invoice', $request->original_invoice)->first();
        }

        if (!$newSale) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'original_invoice' => 'The selected original invoice does not exist.'
            ]);
        }
        if ($newSale->customer_id != $request->customer_id) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'original_invoice' => 'The original invoice does not belong to the selected customer.'
            ]);
        }

        $return = SalesReturn::findOrFail($id);
        $oldOriginalInvoice = $return->original_invoice;
        $oldSaleId = $return->sale_id;

        if ($newSale->status === 'Canceled') {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'original_invoice' => 'The selected original invoice has been canceled and cannot be returned.'
            ]);
        }

        // Validate item quantities first (grouped across any duplicate rows of the same item)
        $requestedPcsByItem = [];
        foreach ($request->items as $it) {
            if ($it['qty_carton'] < 0 || $it['qty_pcs'] < 0 || $it['total_pcs'] < 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Return quantities cannot be negative.'
                ]);
            }

            $itemId = (int) $it['item_id'];
            $item = Items::find($itemId);
            if (!$item) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Selected item does not exist.'
                ]);
            }
            $packing = $item->packing_qty ?: 1;
            $rowTotalPcs = (((float) ($it['qty_carton'] ?? 0) + (float) ($it['bonus_qty_carton'] ?? 0)) * $packing)
                + (float) ($it['qty_pcs'] ?? 0)
                + (float) ($it['bonus_qty_pcs'] ?? 0);

            $requestedPcsByItem[$itemId] = ($requestedPcsByItem[$itemId] ?? 0.0) + $rowTotalPcs;
        }

        foreach ($requestedPcsByItem as $itemId => $totalToReturn) {
            // Fetch original sales items (summed across any duplicate lines of the same item)
            $saleItemsQuery = \App\Models\SalesItem::where('sale_id', $newSale->id)
                ->where('item_id', $itemId);
            if (!$saleItemsQuery->exists()) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Item was not purchased on the original invoice.'
                ]);
            }
            $originalSoldTotalPcs = (float) $saleItemsQuery->sum('total_pcs');

            // Calculate already returned pieces for this item on this sale (excluding current return)
            $alreadyReturnedPcs = (float) \App\Models\SalesReturnItem::join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
                ->where('sales_returns.sale_id', $newSale->id)
                ->where('sales_return_items.sales_return_id', '!=', $id)
                ->where('sales_return_items.item_id', $itemId)
                ->sum('sales_return_items.total_pcs');

            $maxReturnableQty = $originalSoldTotalPcs - $alreadyReturnedPcs;

            if ($totalToReturn > $maxReturnableQty + 0.001) {
                $item = Items::find($itemId);
                $itemTitle = $item ? $item->title : ('#' . $itemId);
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => 'Return quantity for item ' . $itemTitle . ' (' . $totalToReturn . ' Pcs) exceeds returnable limit (' . $maxReturnableQty . ' Pcs).'
                ]);
            }
        }

        $liveReturned = (float) SalesReturn::where('sale_id', $newSale->id)->where('id', '!=', $id)->sum('net_total');
        $maxReturnable = max(0, (float) $newSale->net_total - $liveReturned);

        // Auto-clamp rounding/discount-derivation differences when item quantities are verified within returnable limits
        $diff = round($request->net_total, 2) - round($maxReturnable, 2);
        $totalSoldOnSale = (float) \App\Models\SalesItem::where('sale_id', $newSale->id)->sum('total_pcs');
        $totalAlreadyReturnedOnSale = (float) \App\Models\SalesReturnItem::join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
            ->where('sales_returns.sale_id', $newSale->id)
            ->where('sales_return_items.sales_return_id', '!=', $id)
            ->sum('sales_return_items.total_pcs');
        $totalReturningNow = array_sum($requestedPcsByItem);
        $isFullRemainingReturn = ($totalSoldOnSale > 0) && (($totalAlreadyReturnedOnSale + $totalReturningNow) >= ($totalSoldOnSale - 0.001));

        if ($diff > 0 && ($diff <= 50.00 || $isFullRemainingReturn)) {
            $request->merge([
                'net_total' => $maxReturnable,
                'remaining_amount' => max(0, $maxReturnable - (float)($request->extra_discount ?? 0) - (float)($request->paid_amount ?? 0)),
            ]);
        }

        if (round($request->net_total, 2) > round($maxReturnable, 2) + 0.01) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'net_total' => 'Return amount (' . number_format($request->net_total, 2) . ') cannot exceed returnable balance (' . number_format($maxReturnable, 2) . ').'
            ]);
        }

        DB::beginTransaction();

        try {
            $allocationService = new \App\Services\FIFOAllocationService();
            // Rollback old allocations and credit notes
            $allocationService->rollback($return);

            // 1. Revert Stock for Old Items (total_pcs already includes bonus units)
            $oldItems = SalesReturnItem::where('sales_return_id', $id)->get();
            foreach ($oldItems as $oldItem) {
                $item = Items::where('id', $oldItem->item_id)->lockForUpdate()->first();
                if ($item) {
                    $totalToRevert = (int)$oldItem->total_pcs;
                    // Reverting items handled automatically via ledger
                }
            }

            $customer = Account::findOrFail($request->customer_id);
            $previousBalance = (float)$customer->current_balance + (float)($return->net_total - $return->extra_discount);

            $extraDiscount = (float)($request->extra_discount ?? 0);
            if ($extraDiscount > $request->net_total) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'extra_discount' => 'Extra discount cannot exceed return total.'
                ]);
            }

            // 2. Update Return Record
            $return->update([
                'date'            => $request->date,
                'invoice'         => $request->invoice,
                'original_invoice' => $request->original_invoice,
                'sale_id'         => $newSale->id,
                'customer_id'     => $request->customer_id,
                'previous_balance' => $previousBalance,
                'salesman_id'     => $request->salesman_id ?? 0,
                'firm_id'         => $request->firm_id ?? null,
                'no_of_items'     => $request->no_of_items,
                'gross_total'     => $request->gross_total,
                'discount_total'  => $request->discount_total,
                'tax_total'       => $request->tax_total,
                'net_total'       => $request->net_total,
                'extra_discount'  => $extraDiscount,
                'remarks'         => $request->remarks,
            ]);

            // 3. Delete Old Items & Insert New Ones
            SalesReturnItem::where('sales_return_id', $id)->delete();

            foreach ($request->items as $it) {
                $return->items()->create([
                    'item_id'     => $it['item_id'],
                    'qty_carton'  => $it['qty_carton'],
                    'qty_pcs'     => $it['qty_pcs'],
                    'bonus_qty_carton' => $it['bonus_qty_carton'] ?? 0,
                    'bonus_qty_pcs'    => $it['bonus_qty_pcs'] ?? 0,
                    'total_pcs'   => $it['total_pcs'],
                    'trade_price' => $it['trade_price'],
                    'discount'    => $it['discount'] ?? 0,
                    'gst_amount'  => $it['gst_amount'] ?? 0,
                    'subtotal'    => $it['subtotal'],
                ]);

                // Update Stock (Increase for Return, total_pcs already includes bonus units)
                $item = Items::where('id', $it['item_id'])->lockForUpdate()->first();
                if ($item) {
                    $totalToAdd = (int)$it['total_pcs'];
                    // Inward stock recorded transactionally in sales_return_items
                }
            }

            // 4. Run FIFO allocation again
            $allocationService->allocate($return, (float)($return->net_total - $return->extra_discount));

            // Log activity
            \App\Services\ActivityLogger::log('updated', 'Sales Return', "Updated sales return {$return->invoice}");

            // Recalculate status and balance of the source invoice
            $this->updateSaleStatusAndBalance($return->original_invoice, $return->sale_id);

            DB::commit();

            $return->load(['customer', 'items']);
            $successDialogData = [
                'customerName'  => $return->customer->title ?? 'Customer',
                'totalAmount'   => (float) max(0, $return->net_total - ($return->extra_discount ?? 0)),
                'countItems'    => $return->items->count(),
                'countFull'     => (int) $return->items->sum('qty_carton'),
                'countPcs'      => (int) $return->items->sum('qty_pcs'),
                'totalDiscount' => (float) ($return->discount_total + ($return->extra_discount ?? 0)),
                'saleId'        => $return->id,
                'invoiceNo'     => $return->invoice,
                'type'          => 'edit',
            ];

            return redirect()->route('sales_return.index')
                ->with('success', 'Sales Return updated successfully!')
                ->with('id', $return->id)
                ->with('success_dialog', $successDialogData);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    //destroy
    public function destroy($id)
    {
        DB::beginTransaction();

        try {
            $return = SalesReturn::findOrFail($id);
            $originalInvoice = $return->original_invoice;
            $saleId = $return->sale_id;

            $allocationService = new \App\Services\FIFOAllocationService();
            // Rollback return allocations and credit notes
            $allocationService->rollback($return);

            // 1. Revert Stock (Decrease because return added stock, total_pcs already includes bonus units)
            $items = SalesReturnItem::where('sales_return_id', $id)->get();
            foreach ($items as $si) {
                $product = Items::where('id', $si->item_id)->lockForUpdate()->first();
                if ($product) {
                    $totalToRevert = (int)$si->total_pcs;
                    // Inward stock automatically removed when return items are deleted
                }
            }

            // 2. Delete Return Items & Return record
            SalesReturnItem::where('sales_return_id', $id)->delete();
            $return->delete();

            // Log activity
            \App\Services\ActivityLogger::log('deleted', 'Sales Return', "Deleted sales return {$return->invoice}");

            // 3. Recalculate Balance and Status for the Invoice
            $this->updateSaleStatusAndBalance($originalInvoice, $saleId);

            DB::commit();
            return redirect()->back()->with('success', 'Sales Return deleted and stock/balances reverted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    public function pdf(Request $request, $id)
    {
        $salesReturn = SalesReturn::with(['customer', 'salesman', 'items.item'])->findOrFail($id);
        $format = $request->get('format', 'big');
        $view = $format === 'small' ? 'pdf.sales_return_half' : 'pdf.sales_return';

        $firm = \App\Models\Firm::find($salesReturn->firm_id) ?? \App\Models\Firm::where('defult', 1)->first() ?? \App\Models\Firm::first();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, compact('salesReturn', 'firm'));

        if ($format === 'small') {
            $itemCount = count($salesReturn->items);
            $height = 320 + ($itemCount * 16);
            $height = max(280, $height);
            $pdf->setPaper([0, 0, 226.77, $height], 'portrait');
        } else {
            $pdf->setPaper('A4', 'portrait');
        }

        return $pdf->stream("Sales-Return-{$salesReturn->invoice}.pdf");
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Private Helpers
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * B5 Fix: Generate a sequential return invoice number using MySQL advisory lock
     * to prevent race conditions when multiple users create returns simultaneously.
     */
    private function generateNextReturnInvoice(): string
    {
        $lastReturn = SalesReturn::orderByDesc('id')->lockForUpdate()->first();
        $nextId = $lastReturn ? ($lastReturn->id + 1) : 1;
        return 'RET-' . str_pad($nextId, 6, '0', STR_PAD_LEFT);
    }

    /**
     * B4 Fix: Generate a sequential voucher number using SELECT MAX(id) inside
     * the current DB transaction. lockForUpdate() on Payment table ensures
     * no two concurrent requests can generate the same voucher number.
     *
     * @param string $prefix e.g. 'CPV' → CPV-0001
     */
    private function generateNextVoucherNo(string $prefix): string
    {
        // Lock the latest payment for this prefix within the current transaction
        $last = Payment::where('voucher_no', 'LIKE', $prefix . '-%')
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('voucher_no');

        $nextNum = 1;
        if ($last && preg_match('/' . preg_quote($prefix, '/') . '-(\d+)/', $last, $matches)) {
            $nextNum = (int)$matches[1] + 1;
        }

        return $prefix . '-' . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Recalculate Sale Remaining Amount and Status based on all allocations and returns
     */
    private function updateSaleStatusAndBalance($invoiceNo, ?int $saleId = null)
    {
        if (!$invoiceNo && !$saleId) return;

        $sale = $saleId ? Sales::find($saleId) : Sales::where('invoice', $invoiceNo)->first();
        if ($sale) {
            // Calculate Total Returns for this invoice (both allocated and direct returns)
            $allocatedReturns = (float) \App\Models\SalesReturnAllocation::where('sale_id', $sale->id)->sum('amount');
            $directReturns = (float) SalesReturn::where(function($q) use ($sale) {
                $q->where('sale_id', $sale->id)
                  ->orWhere(function($sub) use ($sale) {
                      $sub->whereNull('sale_id')
                          ->where('original_invoice', $sale->invoice)
                          ->where('customer_id', $sale->customer_id);
                  });
            })->whereNotIn('id', function($sub) {
                $sub->select('sales_return_id')->from('sales_return_allocations');
            })->sum(DB::raw('net_total - extra_discount'));

            $totalReturns = $allocatedReturns + $directReturns;

            // Calculate Total Payments for this invoice
            $totalPayments = \App\Models\PaymentAllocation::where('bill_id', $sale->id)
                ->where('bill_type', 'App\Models\Sales')
                ->sum('amount');

            // Recalculate remaining balance (Net - Extra Discount - (Payments + Returns))
            $sale->remaining_amount = max(0, $sale->net_total - (float)($sale->extra_discount ?? 0) - ($totalPayments + $totalReturns));

            // Determine status based on returned quantity vs sold quantity
            $totalSoldQty = (float) \App\Models\SalesItem::where('sale_id', $sale->id)->sum('total_pcs');
            $allReturnIds = SalesReturn::where('sale_id', $sale->id)
                ->orWhere('original_invoice', $sale->invoice)
                ->pluck('id');
            $totalReturnedQty = (float) \App\Models\SalesReturnItem::whereIn('sales_return_id', $allReturnIds)->sum('total_pcs');

            if ($totalReturnedQty >= $totalSoldQty && $totalSoldQty > 0) {
                $sale->status = 'Returned';
                $sale->remaining_amount = 0;
            } elseif ($totalReturnedQty > 0) {
                if ($sale->remaining_amount <= 0) {
                    $sale->status = ($totalReturns >= $sale->net_total) ? 'Returned' : 'Paid';
                } else {
                    $sale->status = 'Partial Return';
                }
            } elseif ($sale->remaining_amount <= 0) {
                $sale->status = 'Paid';
            } elseif ($totalPayments > 0 || $allocatedReturns > 0) {
                $sale->status = 'Partial';
            } else {
                $sale->status = 'Completed';
            }

            $sale->save();
        }
    }
}

