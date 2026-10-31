# Task Plan: Unified Stock Architecture & Reconciler

## Goal
Establish a single source of truth for stock calculation across the entire ERP, reconcile discrepancies between dynamic transaction ledgers and cached item columns, and safely support transparent negative stock display in the Sales screen without breaking historical data.

## Selected Choices
- **Policy:** Option A (Unified & Transparent) — Display true negative stock (e.g. `-96 Units` or `-1F / -24P`) with red alert indicators and `DEFICIT` badges in Sales/Item Registry.
- **Scope:** Option A (Dry-Run First) — Run comprehensive audit across all items, display the discrepancy report, then attach real-time ledger balances directly to sales & purchase registry screens.

---

## Task Progress

- [x] **Task 1: Build Centralized Stock Engine (`app/Services/StockService.php`)**
  - Implement ledger-based balance calculation per item: `Opening (items.stock_1) + Purchases + Sales Returns - Sales - Purchase Returns`.
  - Added `getBatchBalances(?array $itemIds)`, `getItemBalance(int $itemId)`, and `attachRealtimeBalances($items)`.
  - Added `formatBreakdown(float $totalPcs, int $packingQty)` for accurate negative carton/piece arithmetic.

- [x] **Task 2: Create Artisan Audit & Reconciliation Command (`erp:reconcile-stock`)**
  - Added `--dry-run` flag to inspect discrepancies across all items without modifying database rows.
  - Added `--item_id` and `--limit` options.

- [x] **Task 3: Execute Dry-Run & Document Discrepant Items**
  - Executed `php artisan erp:reconcile-stock --dry-run` across all 1,216 items.
  - Exactly 255 items identified with negative ledger balances (matching the Stock Summary report's 255 analytic items).
  - Traced exact cause: `SalesController@create` and `PurchaseController@create` previously served static opening stock snapshots instead of real-time transactional balances.

- [x] **Task 4: Integrate Single Source of Truth into Sales & Purchase Controllers**
  - Integrated `StockService::attachRealtimeBalances($items)` into:
    - [`app/Http/Controllers/SalesController.php@create`](file:///d:/Haramain/app/Http/Controllers/SalesController.php#L175)
    - [`app/Http/Controllers/SalesController.php@edit`](file:///d:/Haramain/app/Http/Controllers/SalesController.php#L695)
    - [`app/Http/Controllers/PurchaseController.php@create`](file:///d:/Haramain/app/Http/Controllers/PurchaseController.php#L175)
    - [`app/Http/Controllers/PurchaseController.php@edit`](file:///d:/Haramain/app/Http/Controllers/PurchaseController.php#L630)

- [x] **Task 5: Update Item Model & Sales Item Registry Component for Transparent Negative Stock**
  - Updated [`app/Models/Items.php`](file:///d:/Haramain/app/Models/Items.php#L106-L125) to use `StockService::formatBreakdown()`.
  - Updated [`ItemRegistryDialog.tsx`](file:///d:/Haramain/resources/js/pages/daily/sales/components/ItemRegistryDialog.tsx#L507-L595) to cleanly display negative stock in red with a prominent `DEFICIT` badge, and an alert banner in the preview drawer.

- [x] **Task 6: Verification & Final Checks**
  - Verified `SalesController@create` outputs:
    - `TIBET SOAP 70GM` (ID 33): `-96 Units` (Matches Stock Summary: -96)
    - `DOVE 360ML DRYNESS` (ID 15): `-9 Units` (Matches Stock Summary: -9)
    - `TIBET POMADE` (ID 28): `-9 Units` (Matches Stock Summary: -9)
    - `CLEAR 185ML MEN` (ID 1): `102 Units` (Matches Stock Summary: 102)
  - Production Vite assets built cleanly with 0 errors.
