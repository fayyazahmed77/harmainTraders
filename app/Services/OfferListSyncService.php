<?php

namespace App\Services;

use App\Models\Items;
use App\Models\OfferList;
use App\Models\PriceOfferTo;
use Illuminate\Support\Facades\Log;

class OfferListSyncService
{
    /**
     * Synchronize price changes of a single item across active live offers.
     *
     * @param Items $item
     * @param bool $activeOnly Only sync active live offers (default: true)
     * @return int Number of updated offer list items
     */
    public function syncItemPricesForActiveOffers(Items $item, bool $activeOnly = false): int
    {
        $query = OfferList::where('item_id', $item->id);

        if ($activeOnly) {
            $query->whereHas('priceOfferTo', function ($q) {
                $q->where('is_live', true);
            });
        }

        $offerItems = $query->with('priceOfferTo')->get();
        $updatedCount = 0;

        foreach ($offerItems as $offerItem) {
            $this->updateOfferItemPrices($offerItem, $item);
            $updatedCount++;
        }

        Log::info("OfferListSyncService: Synced price changes for Item ID {$item->id} across {$updatedCount} offer items.");

        return $updatedCount;
    }

    /**
     * Synchronize all items within a specific offer list using current Item Master prices.
     *
     * @param int $offerId
     * @return int Number of updated items
     */
    public function syncEntireOffer(int $offerId): int
    {
        $offer = PriceOfferTo::with('items.items')->findOrFail($offerId);
        $updatedCount = 0;

        foreach ($offer->items as $offerItem) {
            if ($offerItem->items) {
                $this->updateOfferItemPrices($offerItem, $offerItem->items);
                $updatedCount++;
            }
        }

        Log::info("OfferListSyncService: Synced entire Offer ID {$offerId} with current Item Master prices ({$updatedCount} items).");

        return $updatedCount;
    }

    /**
     * Recalculate static prices on an OfferList record based on the item master prices.
     */
    private function updateOfferItemPrices(OfferList $offerItem, Items $item): void
    {
        $tradePrice = (float)($item->trade_price ?? 0);
        $retailPrice = (float)($item->retail ?? 0);
        $offerType = (string)($offerItem->priceOfferTo->offertype ?? '1');

        // Always update MRP from Retail
        $offerItem->mrp = $retailPrice;

        // Helper function to calculate tier price based on percentage
        $calculateTierPrice = function($percentage) use ($tradePrice) {
            $pct = (float)$percentage;
            return $pct > 0 ? round($tradePrice * (1 + $pct / 100), 2) : $tradePrice;
        };

        if ($offerType === '1') {
            // Customer Offer (Group Offer)
            // pack_ctn = T.P.1 (Trade Price)
            // loos_ctn = T.P.2 (Trade Price + pt2 %)
            $tp1Price = $tradePrice;
            $tp2Price = $calculateTierPrice($item->pt2);

            $offerItem->pack_ctn = $tp1Price;
            $offerItem->loos_ctn = $tp2Price;
            $offerItem->price = $tp2Price;
        } else {
            // Market Offer (Tiered/PT Pricing)
            // Uses pt7, pt6, or pt5
            $pt7 = (float)($item->pt7 ?? 0);
            $pt6 = (float)($item->pt6 ?? 0);
            $pt5 = (float)($item->pt5 ?? 0);

            $selectedPt = $pt7 > 0 ? $pt7 : ($pt6 > 0 ? $pt6 : $pt5);
            $marketPrice = $calculateTierPrice($selectedPt);

            $offerItem->pack_ctn = 0;
            $offerItem->loos_ctn = $marketPrice;
            $offerItem->price = $marketPrice;
        }

        $offerItem->save();
    }
}
