<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Items;
use App\Models\ItemCategory;
use App\Models\Sales;
use App\Models\SalesItem;
use App\Models\Payment;
use App\Models\Firm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

class GuestController extends Controller
{
    /**
     * Show guest dashboard
     */
    public function dashboard($token)
    {
        $account = Account::where('guest_token', $token)->firstOrFail();
        
        $unpaidBills = Sales::where('customer_id', $account->id)
            ->where('remaining_amount', '>', 0)
            ->orderBy('date', 'desc')
            ->get();
            
        $paidBills = Sales::where('customer_id', $account->id)
            ->where('remaining_amount', '<=', 0)
            ->orderBy('date', 'desc')
            ->take(10)
            ->get();
            
        $recentPayments = Payment::where('account_id', $account->id)
            ->where('type', 'RECEIPT')
            ->orderBy('date', 'desc')
            ->take(10)
            ->get();

        return Inertia::render('guest/Dashboard', [
            'account' => $account,
            'summary' => [
                'current_balance' => $account->current_balance,
                'unpaid_count' => $unpaidBills->count(),
                'total_unpaid' => $unpaidBills->sum('remaining_amount'),
            ],
            'unpaidBills' => $unpaidBills,
            'paidBills' => $paidBills,
            'recentPayments' => $recentPayments,
            'token' => $token,
        ]);
    }

    /**
     * Show catalog with specific prices
     */
    public function catalog($token)
    {
        $account = Account::where('guest_token', $token)->firstOrFail();
        $categories = ItemCategory::where('status', 'active')->orderBy('name')->get();
        $items = Items::where('is_active', true)->with(['images', 'companyAccount'])->get();
        
        $customerCategory = (string) $account->item_category;
        
        $itemsWithPrice = $items->map(function ($item) use ($customerCategory) {
            $tradePrice = (float) $item->trade_price;
            $percentage = 0;
            
            switch ($customerCategory) {
                case '2': $percentage = (float) $item->pt2; break;
                case '3': $percentage = (float) $item->pt3; break;
                case '4': $percentage = (float) $item->pt4; break;
                case '5': $percentage = (float) $item->pt5; break;
                case '6': $percentage = (float) $item->pt6; break;
                case '7': $percentage = (float) $item->pt7; break;
                default: $percentage = 0; break;
            }
            
            $guestPrice = $tradePrice;
            if ($customerCategory === '1') {
                $packingSize = (float) $item->packing_size ?: 1;
                $priceCarton = $tradePrice * $packingSize;
                $priceLooseCarton = $tradePrice * (1 + ((float) $item->pt2 / 100));
                $pricePiece = $priceLooseCarton;
            } else {
                if ($percentage > 0) {
                    $guestPrice = $percentage;
                } elseif ($item->retail > 0) {
                    $guestPrice = (float) $item->retail;
                }
                $priceCarton = $guestPrice;
                $priceLooseCarton = $guestPrice;
                $pricePiece = round($guestPrice / ($item->packing_qty ?: 1));
            }

            return [
                'id' => $item->id,
                'title' => $item->title,
                'short_name' => $item->short_name,
                'code' => $item->code,
                'packing_qty' => $item->packing_qty,
                'packing_size' => (int) $item->packing_size,
                'price' => $customerCategory === '1' ? $tradePrice : $guestPrice,
                'company' => $item->companyAccount->title ?? '',
                'company_image' => $item->companyAccount->image_url ?? null,
                'stock' => $item->total_stock_pcs,
                'category_id' => $item->category,
                'image' => $item->primary_image_url,
                'images' => $item->images->map(fn($img) => asset($img->image_path)),
                'price_carton' => $priceCarton,
                'price_loose_carton' => $priceLooseCarton,
                'price_piece' => $pricePiece,
                'retail' => $item->retail,
            ];
        });

        return Inertia::render('guest/Catalog', [
            'account' => $account,
            'items' => $itemsWithPrice,
            'categories' => $categories,
            'token' => $token,
        ]);
    }

    /**
     * Place an order from guest
     */
    public function placeOrder(Request $request, $token)
    {
        $account = Account::where('guest_token', $token)->firstOrFail();
        
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:items,id',
            'items.*.qty_carton' => 'required|numeric|min:0',
            'items.*.qty_pcs' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $invoiceNo = 'GST-' . strtoupper(Str::random(8));
            
            $grossTotal = 0;
            $orderItems = [];
            
            foreach ($request->items as $it) {
                $item = Items::findOrFail($it['id']);
                
                // Price logic repeated for safety
                $customerCategory = (string) $account->item_category;
                $tradePrice = (float) $item->trade_price;
                $percentage = 0;
                switch ($customerCategory) {
                    case '2': $percentage = (float) $item->pt2; break;
                    case '3': $percentage = (float) $item->pt3; break;
                    case '4': $percentage = (float) $item->pt4; break;
                    case '5': $percentage = (float) $item->pt5; break;
                    case '6': $percentage = (float) $item->pt6; break;
                    case '7': $percentage = (float) $item->pt7; break;
                }
                
                $price = $tradePrice;
                if ($customerCategory === '1') {
                    $price = $tradePrice;
                } else {
                    if ($percentage > 0) {
                        $price = $percentage;
                    } elseif ($item->retail > 0) {
                        $price = (float) $item->retail;
                    }
                }

                $packing = $item->packing_qty ?: 1;
                $packingSize = (float) $item->packing_size ?: 1;
                
                if ($customerCategory === '1') {
                    $totalPcs = (($it['qty_carton'] * $packingSize) + $it['qty_pcs']) * $packing;
                } else {
                    $totalPcs = ($it['qty_carton'] * $packing) + $it['qty_pcs'];
                }
                
                if ($totalPcs <= 0) continue;
                
                if ($customerCategory === '1') {
                    $priceCarton = $tradePrice * $packingSize;
                    $priceLooseCarton = $tradePrice * (1 + ((float) $item->pt2 / 100));
                    $pricePiece = $priceLooseCarton;
                    $fullCartonsFromPcs = floor($it['qty_pcs'] / $packingSize);
                    $remainingPcs = $it['qty_pcs'] % $packingSize;
                    $subtotal = ($it['qty_carton'] * $priceCarton) + ($fullCartonsFromPcs * $priceCarton) + ($remainingPcs * $pricePiece);
                } else {
                    $subtotal = ($it['qty_carton'] * $price) + ($it['qty_pcs'] * ($price / $packing));
                }
                $grossTotal += $subtotal;
                
                $orderItems[] = [
                    'item_id' => $item->id,
                    'qty_carton' => $it['qty_carton'],
                    'qty_pcs' => $it['qty_pcs'],
                    'total_pcs' => $totalPcs,
                    'trade_price' => $price,
                    'retail_price' => $item->retail,
                    'subtotal' => $subtotal,
                ];
            }

            if (empty($orderItems)) {
                throw new \Exception("Cart is empty");
            }

            // Get a default firm if exists
            $firm = Firm::first();

            $sale = Sales::create([
                'date' => now(),
                'invoice' => $invoiceNo,
                'customer_id' => $account->id,
                'salesman_id' => $account->saleman_id,
                'firm_id' => $firm?->id,
                'no_of_items' => count($orderItems),
                'gross_total' => $grossTotal,
                'discount_total' => 0,
                'tax_total' => 0,
                'courier_charges' => 0,
                'extra_discount' => 0,
                'net_total' => $grossTotal,
                'total_receivable' => $grossTotal + $account->current_balance,
                'paid_amount' => 0,
                'remaining_amount' => $grossTotal,
                'status' => 'Pending Order',
                'is_online' => true,
            ]);

            foreach ($orderItems as $oi) {
                $oi['sale_id'] = $sale->id;
                SalesItem::create($oi);
                
                // Optional: Stock deduction or reservation
                // $item = Items::find($oi['item_id']);
                // $item->updateStockFromPcs($item->total_stock_pcs - $oi['total_pcs']);
            }

            DB::commit();
            return response()->json(['success' => true, 'invoice' => $invoiceNo]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Generate or reset guest token
     */
    public function resetToken(Request $request, $id)
    {
        $account = Account::findOrFail($id);
        $account->guest_token = Str::uuid()->toString();
        $account->save();
        
        return redirect()->back()->with('success', 'Guest link generated/reset successfully!');
    }

    /**
     * Show order details for guest
     */
    public function orderDetail($token, $invoice)
    {
        $account = Account::where('guest_token', $token)->firstOrFail();
        $sale = Sales::with(['customer', 'salesman', 'items.item', 'messageLine'])
            ->where('customer_id', $account->id)
            ->where('invoice', $invoice)
            ->firstOrFail();

        // Get all returns for this sale
        $returns = \App\Models\SalesReturn::with(['items.item'])
            ->where('original_invoice', $sale->invoice)
            ->get();
        $sale->returns = $returns;

        return Inertia::render('guest/OrderDetail', [
            'account' => $account,
            'sale' => $sale,
            'token' => $token,
        ]);
    }

    /**
     * Show payment details for guest
     */
    public function paymentDetail($token, $voucher)
    {
        $account = Account::where('guest_token', $token)->firstOrFail();
        $payment = Payment::with(['account', 'paymentAccount', 'allocations.bill', 'cheque', 'messageLine'])
            ->where('account_id', $account->id)
            ->where('voucher_no', $voucher)
            ->firstOrFail();

        return Inertia::render('guest/PaymentDetail', [
            'account' => $account,
            'payment' => $payment,
            'token' => $token,
        ]);
    }

    /**
     * Generate Invoice PDF for guest
     */
    public function invoicePdf($token, $invoice)
    {
        $account = Account::where('guest_token', $token)->firstOrFail();
        $sale = Sales::with(['customer', 'salesman', 'items.item', 'messageLine'])
            ->where('customer_id', $account->id)
            ->where('invoice', $invoice)
            ->firstOrFail();

        $returns = \App\Models\SalesReturn::with(['items.item'])
            ->where('original_invoice', $sale->invoice)
            ->get();
        $sale->returns = $returns;

        $firm = Firm::find($sale->firm_id);

        $pdf = Pdf::loadView('pdf.sale', compact('sale', 'firm'));
        $pdf->setPaper('A4', 'portrait');

        return $pdf->stream("Invoice-{$invoice}.pdf");
    }

    /**
     * Generate Receipt PDF for guest
     */
    public function receiptPdf($token, $voucher)
    {
        $account = Account::where('guest_token', $token)->firstOrFail();
        $payment = Payment::with(['account', 'paymentAccount', 'allocations.bill', 'cheque', 'messageLine'])
            ->where('account_id', $account->id)
            ->where('voucher_no', $voucher)
            ->firstOrFail();

        $pdf = Pdf::loadView('pdf.payment-voucher', compact('payment'));
        $pdf->setPaper('A4', 'portrait');

        return $pdf->stream("Receipt-{$voucher}.pdf");
    }
}
