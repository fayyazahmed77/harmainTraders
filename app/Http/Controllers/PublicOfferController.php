<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PriceOfferTo;
use App\Models\Account;
use Inertia\Inertia;
use Illuminate\Support\Str;

class PublicOfferController extends Controller
{
    /**
     * Show live public offers
     */
    public function index(Request $request)
    {
        $offerId = $request->get('id');

        $customerOffer = null;
        $marketOffer = null;

        if ($offerId) {
            $specificOffer = PriceOfferTo::with(['items.items.category', 'items.items.companyAccount', 'firm'])
                ->where('id', $offerId)
                ->where('is_live', true)
                ->first();
                
            if ($specificOffer) {
                if ($specificOffer->offertype == '1') {
                    $customerOffer = $specificOffer;
                } else if ($specificOffer->offertype == '2') {
                    $marketOffer = $specificOffer;
                } else {
                    $customerOffer = $specificOffer; // default
                }
            }
        } else {
            // Fetch the latest live offer for Customer Group (1) and Market Offer (2)
            $customerOffer = PriceOfferTo::with(['items.items.category', 'items.items.companyAccount', 'firm'])
                ->where('offertype', '1')
                ->where('is_live', true)
                ->orderBy('date', 'desc')
                ->first();

            $marketOffer = PriceOfferTo::with(['items.items.category', 'items.items.companyAccount', 'firm'])
                ->where('offertype', '2')
                ->where('is_live', true)
                ->orderBy('date', 'desc')
                ->first();
        }

        return Inertia::render('public/LiveOffers', [
            'customerOffer' => $customerOffer,
            'marketOffer' => $marketOffer,
            'sharedOfferId' => $offerId,
        ]);
    }

    /**
     * Validate Customer ID and redirect to guest portal
     */
    public function accessMyOffer(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|string',
        ]);

        $account = Account::where('code', $request->customer_id)
            ->whereHas('accountType', function ($q) {
                $q->where('name', 'Customers');
            })
            ->first();

        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid Customer ID. Please double check your code.',
            ], 404);
        }

        // Generate UUID if missing
        if (!$account->guest_token) {
            $account->guest_token = (string) Str::uuid();
            $account->save();
        }

        return response()->json([
            'success' => true,
            'redirect_url' => route('guest.dashboard', ['token' => $account->guest_token]),
        ]);
    }
}
