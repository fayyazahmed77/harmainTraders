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
    public function syncItemPricesForActiveOffers(Items $item, bool $activeOnly = true): int
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
        $packingQty = (int)($item->packing_qty ?: 1);
        $offerType = (string)($offerItem->priceOfferTo->offertype ?? '1');

        // Always update MRP from Retail
        $offerItem->mrp = $retailPrice;

        if ($offerType === '1') {
            // Customer Offer (Group Offer)
            $offerItem->price = $tradePrice;
            $offerItem->pack_ctn = $tradePrice;
            $offerItem->loos_ctn = $packingQty > 1 ? ceil($tradePrice / $packingQty) : $tradePrice;
        } else {
            // Market Offer (Tiered/PT Pricing, fallback to pt7 or trade_price)
            $marketPrice = (float)($item->pt7 ?? $item->pt6 ?? $item->pt5 ?? $tradePrice);
            if ($marketPrice <= 0) {
                $marketPrice = $tradePrice;
            }

            $offerItem->price = $marketPrice;
            $offerItem->loos_ctn = $packingQty > 1 ? round($marketPrice / $packingQty) : $marketPrice;
            $offerItem->pack_ctn = 0;
        }

        $offerItem->save();
    }
}
