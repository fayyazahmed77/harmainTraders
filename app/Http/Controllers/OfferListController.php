<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Items;
use App\Models\ItemCategory;
use App\Models\Account;
use App\Models\OfferList;
use App\Models\PriceOfferTo;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class OfferListController extends Controller
{
    //index
    public function index()
    {
        $offers = PriceOfferTo::with(['account', 'user'])->orderBy('id', 'desc')->get();
        return inertia('daily/offerlist/index', [
            'offers' => $offers
        ]);
    }
    //create
    public function create()
    {
        $items = Items::get();
        $categories = ItemCategory::where('status', 'active')->get();
        $accounts = Account::select('id', 'title')->whereHas('accountType', function ($q) {
            $q->whereIn('name', ['Customers', 'Supplier']);
        })
            ->get();

        return Inertia::render("daily/offerlist/create", [
            'items' => $items,
            'categories' => $categories,
            'accounts' => $accounts,
        ]);
    }

    //store
    public function store(Request $request)
    {
        $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'date' => 'required|date',
            'price_type' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.price' => 'required|numeric',
        ]);

        DB::beginTransaction();
        try {
            // Create main offer
            $offer = PriceOfferTo::create([
                'account_id' => $request->account_id,
                'date' => $request->date,
                'offertype' => $request->price_type,
                'created_by' => Auth::id() ?? 1, // default 1 if no auth
            ]);

            // Create offer items
            foreach ($request->items as $item) {
                OfferList::create([
                    'offer_id' => $offer->id,
                    'item_id' => $item['item_id'],
                    'pack_ctn' => $item['pack_ctn'] ?? 0,
                    'loos_ctn' => $item['loos_ctn'] ?? 0,
                    'price_type' => $item['price_type'] ?? 'trade',
                    'mrp' => $item['mrp'] ?? null,
                    'price' => $item['price'],
                    'scheme' => $item['scheme'] ?? null,
                    'status' => $item['status'] ?? 'active',
                    'created_by' => Auth::id() ?? 1,
                ]);
            }

            DB::commit();

            return redirect()->back()->with('success', 'Offer created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to create offer: ' . $e->getMessage());
        }
    }

    public function view($id)
    {
        $offer = PriceOfferTo::with(['account', 'items.items.category'])->findOrFail($id);
        return inertia('daily/offerlist/view', [
            'offer' => $offer
        ]);
    }

    public function pdf($id)
    {
        $offer = PriceOfferTo::with(['account', 'items.items.category'])->findOrFail($id);
        $pdf = Pdf::loadView('pdf.offerlist', compact('offer'));
        return $pdf->stream('offer-list-' . $offer->id . '.pdf');
    }

    public function download($id)
    {
        $offer = PriceOfferTo::with(['account', 'items.items.category'])->findOrFail($id);
        $pdf = Pdf::loadView('pdf.offerlist', compact('offer'));
        return $pdf->download('offer-list-' . $offer->id . '.pdf');
    }

    public function destroy($id)
    {
        $offer = PriceOfferTo::findOrFail($id);
        $offer->items()->delete();
        $offer->delete();
        return redirect()->back()->with('success', 'Offer deleted successfully');
    }
}
