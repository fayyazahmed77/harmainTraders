# Plan: Supplier Order Dynamic Real-Time Available Stock Integration

## 1. Problem Statement & Root Cause
In `SupplierOrderController.php`, both `getItems()` (auto-loading items) and `getAllItems()` (feeding the "Select Items Manually" dialog) read `items.stock_1` and `items.stock_2` directly from the raw database columns:
```php
$stock1 = (int) ($item->stock_1 ?? 0);
$stock2 = (int) ($item->stock_2 ?? 0);
```
Since our recent unification, `items.stock_1` and `stock_2` in the database represent the **immutable Opening Stock baseline**. They do not reflect transaction movements (Purchases, Sales, Sales Returns, Purchase Returns).
As a result:
- The **"Select Items Manually"** dialog displays outdated opening stock rather than true on-hand inventory.
- The **"Item Intelligence Panel"** displays outdated opening stock.
- The **"Reorder Wise"** filter compares Opening Stock against Reorder Level, causing items with high sales to be missed and items with recent purchases to be falsely flagged.

---

## 2. Principle & Constraints
- **Preserve Business Logic**: Do NOT alter order calculation logic (`shortage = Math.max(0, reorderLevel - availableFull)`), order submission payloads, discounts, pricing, or intelligence metrics.
- **Single Source of Truth**: Leverage `StockService::attachRealtimeBalances()` to provide the exact real-time balance:
  $$\text{Available Stock} = (\text{Opening Cartons} \times \text{Packing} + \text{Opening Pcs}) + \text{Purchases} + \text{Sales Returns} - \text{Sales} - \text{Purchase Returns}$$

---

## 3. Implementation Steps

### Step 1: Update `SupplierOrderController@getAllItems`
- Call `StockService::attachRealtimeBalances($items)` on the queried catalog.
- Pass the attached live available cartons (`$item->stock_1`), loose pieces (`$item->stock_2`), and total available pieces (`$item->total_stock_pcs`) to the JSON response.
- This immediately updates the **"Select Items Manually"** dialog with 100% accurate, live inventory.

### Step 2: Update `SupplierOrderController@getItems`
- Query the candidate items for the selected supplier/company.
- Call `StockService::attachRealtimeBalances($items)`.
- If `mode === 'reorder'`:
  Filter dynamically where $\text{Available Pcs} \le \text{reorder\_level} \times \text{packing\_qty}$.
- If `mode === 'sales'`:
  Filter where `sales_15_days > 0`, ordered descending.
- Map the resulting items with live `stock_1` (available full cartons) and `stock_2` (available loose pcs).

### Step 3: Frontend Audit (`resources/js/pages/admin/supplier-order/index.tsx`)
- Verify that `manualDialogFilteredItems` correctly displays the live available quantities (`item.stock_1` Full, `item.stock_2` Pcs) and NEG badges for deficits.
- Verify that the bottom Intelligence Panel reflects the live available quantity without touching any rates, suppliers, or history.

### Step 4: Verification & Build
- Verify syntax with `php -l`.
- Run test scripts comparing Supplier Order API outputs against `StockService`.
- Run `npm run build` to ensure assets compile cleanly.

