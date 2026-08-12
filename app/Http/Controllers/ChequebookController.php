<?php

namespace App\Http\Controllers;

use App\Models\Chequebook;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Bank;
use App\Models\Account;
use Carbon\Carbon;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ChequebookController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:manage cheques'),
        ];
    }
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
    public function checkDuplicates(Request $request)
    {
        $request->validate([
            'bank_id' => 'required|exists:accounts,id',
            'cheques' => 'required|array|min:1',
            'prefix' => 'nullable|string',
        ]);

        $bank = Account::find($request->bank_id);
        $bankName = $bank ? $bank->title : 'Selected Bank';
        $prefix = $request->prefix ?? '';

        // Fetch existing cheque numbers for this bank and prefix
        $existingNumbers = Chequebook::where('bank_id', $request->bank_id)
            ->where('prefix', $prefix)
            ->whereIn('cheque_no', $request->cheques)
            ->pluck('cheque_no')
            ->map(fn($num) => (string)$num)
            ->toArray();

        $isDuplicate = !empty($existingNumbers);
        $sampleList = implode(', ', array_slice($existingNumbers, 0, 5));
        if (count($existingNumbers) > 5) {
            $sampleList .= '... (+ ' . (count($existingNumbers) - 5) . ' more)';
        }

        return response()->json([
            'exists' => $isDuplicate,
            'existing_cheques' => array_values(array_unique($existingNumbers)),
            'bank_name' => $bankName,
            'message' => $isDuplicate
                ? "Cheque book / number(s) [{$sampleList}] already exist for {$bankName}."
                : "All cheques are available for {$bankName}.",
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

        $bank = Account::find($request->bank_id);
        $bankName = $bank ? $bank->title : 'Selected Bank';
        $prefix = $request->prefix ?? '';

        // ✅ Check if ANY of the submitted cheque numbers already exist for this bank & prefix
        $existingNumbers = Chequebook::where('bank_id', $request->bank_id)
            ->where('prefix', $prefix)
            ->whereIn('cheque_no', $request->cheques)
            ->pluck('cheque_no')
            ->map(fn($num) => (string)$num)
            ->toArray();

        if (!empty($existingNumbers)) {
            $uniqueExisting = array_values(array_unique($existingNumbers));
            $sampleList = implode(', ', array_slice($uniqueExisting, 0, 5));
            if (count($uniqueExisting) > 5) {
                $sampleList .= '... (+ ' . (count($uniqueExisting) - 5) . ' more)';
            }
            $errorMsg = "Cheque book / number(s) [{$sampleList}] already exist for {$bankName}. Please use a different start/end sequence.";

            return back()->withErrors([
                'bank_id' => "Cheque number(s) already exist for {$bankName}.",
                'cheque_from' => $errorMsg,
                'cheque_to' => $errorMsg,
            ])->with('error', $errorMsg);
        }

        // ✅ Convert date safely (handles ISO string from JS)
        $entryDate = Carbon::parse($request->entry_date)->format('Y-m-d');

        $newCheques = [];

        // ✅ Prepare new cheque rows
        foreach ($request->cheques as $num) {
            $newCheques[] = [
                'bank_id' => $request->bank_id,
                'cheque_no' => $num,
                'entry_date' => $entryDate,
                'voucher_code' => $request->voucher_code ?? null,
                'prefix' => $prefix,
                'remarks' => $request->remarks,
                'status' => 'unused',
                'created_by' => Auth::id(),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // ✅ Insert all new cheques safely inside DB transaction
        if (count($newCheques) > 0) {
            try {
                \Illuminate\Support\Facades\DB::transaction(function () use ($newCheques) {
                    Chequebook::insert($newCheques);
                });

                return redirect()->route('cheque.index')->with('success', count($newCheques) . " cheques for {$bankName} generated successfully!");
            } catch (\Illuminate\Database\QueryException $e) {
                return back()->withErrors([
                    'cheque_from' => "Duplicate cheque number conflict detected at database level. Duplicate creation blocked.",
                ])->with('error', 'Duplicate cheque numbers detected for this bank. Please use a different sequence.');
            }
        }

        return back()->with('warning', 'No new cheques were created.');
    }
    //update
    public function update(Request $request, Chequebook $cheque) 
    {
        if ($request->has('status') && $request->status === 'cancelled') {
            if ($cheque->status === 'unused') {
                $cheque->status = 'cancelled';
                $cheque->save();
                return back()->with('success', 'Cheque ' . $cheque->cheque_no . ' cancelled successfully.');
            }
            return back()->with('error', 'Only unused cheques can be cancelled.');
        }

        return back();
    }
    //destory
    public function destory() {}
}
