<?php

namespace App\Http\Controllers;

use App\Models\Chequebook;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Bank;
use App\Models\Account;
use Carbon\Carbon;

class ChequebookController extends Controller
{
    //index
    public function index()
    {
        $chequebook = Chequebook::with(['creator', 'bank'])
            ->orderBy('cheque_no', 'asc')
            ->get()
            ->map(function ($item) {
                // ✅ Creator info
                $item->created_by_name = $item->creator?->name ?? 'Unknown';
                $item->created_by_avatar = $item->creator?->image
                    ? asset('storage/' . $item->creator->image)
                    : asset('images/default-avatar.png');

                // ✅ Bank logo (from related bank model)
                $item->logo_url = $item->bank?->logo
                    ? asset('storage/' . $item->bank->logo)
                    : asset('images/default-bank.png');

                // ✅ Bank name for convenience
                $item->bank_name = $item->bank?->name ?? 'Unknown Bank';

                return $item;
            });


        return Inertia::render("setup/cheque/index", [
            'chequebook' => $chequebook,
        ]);
    }

    // show
    public function show($id)
    {
        $chequebook = Chequebook::with(['creator', 'bank', 'payment', 'payment.paymentAccount'])
            ->findOrFail($id);

        // ✅ Enhance with mapped attributes if needed, or rely on frontend to access relations
        $chequebook->bank_name = $chequebook->bank?->title ?? 'Unknown Bank';
        $chequebook->created_by_name = $chequebook->creator?->name ?? 'Unknown';

        // If used, attach payment details more clearly if derived
        if ($chequebook->payment) {
            $chequebook->payment_amount = $chequebook->payment->amount;
            $chequebook->payment_date = $chequebook->payment->date;
            // The payee is typically the 'account' or 'paymentAccount' depending on transaction direction, usually 'account' for payment to someone
            $chequebook->assigned_to = $chequebook->payment->account?->title ?? 'N/A';
            $chequebook->payment_voucher_no = $chequebook->payment->voucher_no;
            $chequebook->payment_cheque_status = $chequebook->payment->cheque_status;
            $chequebook->payment_clear_date = $chequebook->payment->clear_date;
            $chequebook->payment_method = $chequebook->payment->payment_method;
        }
        return Inertia::render("setup/cheque/show", [
            'chequebook' => $chequebook,
        ]);
    }

    public function create()
    {
        $banks = Account::select('id', 'title as name')->with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['bank']);
            })
            ->get();
        return Inertia::render("setup/cheque/create", [
            'banks' => $banks,

        ]);
    }
    public function store(Request $request)
    {
        // ✅ Validate according to the actual structure of your data
        $request->validate([
            'bank_id' => 'required|exists:accounts,id',
            'entry_date' => 'required|date',
            'voucher_code' => 'nullable|string|max:255',
            'prefix' => 'nullable|string|max:255',
            'remarks' => 'nullable|string|max:255',
            'cheques' => 'required|array|min:1',
            'cheques.*' => 'string|max:10', // each cheque number
        ]);

        // ✅ Convert date safely (handles ISO string from JS)
        $entryDate = Carbon::parse($request->entry_date)->format('Y-m-d');

        // ✅ Fetch existing cheque numbers for this bank
        $existingNumbers = Chequebook::where('bank_id', $request->bank_id)
            ->whereIn('cheque_no', $request->cheques)
            ->pluck('cheque_no')
            ->map(fn($num) => (string)$num)
            ->toArray();

        $newCheques = [];

        // ✅ Prepare new cheque rows
        foreach ($request->cheques as $num) {
            if (!in_array($num, $existingNumbers)) {
                $newCheques[] = [
                    'bank_id' => $request->bank_id,
                    'cheque_no' => $num,
                    'entry_date' => $entryDate,
                    'voucher_code' => $request->voucher_code ?? null,
                    'prefix' => $request->prefix,
                    'remarks' => $request->remarks,
                    'status' => 'unused',
                    'created_by' => Auth::id(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // ✅ Insert all new cheques (each cheque = 1 row)
        if (count($newCheques) > 0) {
            Chequebook::insert($newCheques);

            return redirect()->route('cheque.index')->with('success', count($newCheques) . ' cheques generated successfully!');
        }

        return back()->with('warning', 'No new cheques were created — all already exist.');
    }
    //update
    public function update() {}
    //destory
    public function destory() {}
}
