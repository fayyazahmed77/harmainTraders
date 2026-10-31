# Plan: Items Table Modernization & Smart Opening Stock Reconciliation

## 1. Problem Statement & Context
Due to previous controller behavior where sales subtracted directly from `items.stock_1`, many items now have an inaccurate or 0 baseline opening stock, leading to negative (Deficit) live balances.
Now that `items.stock_1` and `stock_2` are decoupled and immutable, the user needs:
1. **Remove the dedicated "Code" column** from the `/items` table to free up table width (placing the code as a subtitle under the item title).
2. **Add a searchable Company dropdown filter** in the filter bar alongside Categories, Stock Status, and Active Status.
3. **Smart Opening Stock Reconciliation Dialog** when clicking any item row:
   - Displays real-time transaction ledger history: Total Purchases, Sales Returns, Sales, Purchase Returns, and Net Transaction Movement.
   - Allows user to input/re-add Opening Stock: Cartons (`stock_1`) and Loose Pieces (`stock_2`).
   - Live calculates the resulting Available Stock.
   - Shows **"100% Reconciled"** badge when Available Stock $\ge 0$.
   - Quick one-click "Set Minimum Opening Stock to Break Even" button.
   - Persists the new Opening Stock via a dedicated patch endpoint (`/items/{id}/opening-stock`) and updates the table seamlessly.

---

## 2. Architecture & Data Flow

### A. Backend (`StockService` & `ItemsController`)
1. **`StockService::attachRealtimeBalances($items)`**:
   - In addition to `available_stock`, `available_full`, `available_pcs`, attach transaction breakdowns:
     - `purchase_pcs`: Total purchased pieces
     - `sale_pcs`: Total sold pieces
     - `sale_return_pcs`: Total sales returned pieces
     - `purchase_return_pcs`: Total purchase returned pieces
     - `net_movement_pcs`: `(purchase_pcs + sale_return_pcs) - (sale_pcs + purchase_return_pcs)`
2. **`ItemsController@index`**:
   - Fetch company accounts: `Account::whereHas('accountType', fn($q) => $q->whereIn('name', ['Company']))->orderBy('title')->get(['id', 'title'])`
   - Filter by `company_id` if selected: `$query->where('company', $request->company_id)`
   - Pass `companies` and `filters.company_id` to Inertia view.
3. **`ItemsController@updateOpeningStock`**:
   - Endpoint: `PATCH /items/{item}/opening-stock`
   - Validates `stock_1` (integer $\ge 0$) and `stock_2` (integer $\ge 0$).
   - Updates `items.stock_1` and `items.stock_2`.
   - Logs change with audit trace.
   - Returns JSON response with updated item balances.

### B. Frontend (`ItemsFilters.tsx`, `DataTable.tsx`, `index.tsx`)
1. **`ItemsFilters.tsx`**:
   - Add Searchable Company Popover (combobox) matching the Category Filter design.
   - Debounced URL update preserving other filters.
2. **`DataTable.tsx`**:
   - Remove dedicated "Code" column.
   - Display Item Code beneath Item Title in the Title column.
   - Make table rows clickable (`cursor-pointer hover:bg-amber-50/40 dark:hover:bg-zinc-800/50`).
   - Prevent modal trigger on interactive elements (`Switch`, `DropdownMenu` actions) via `e.stopPropagation()`.
3. **`OpeningStockReconciliationDialog.tsx`**:
   - Clean, professional modal dialog showing:
     - Header: Item Title, Code, Category, Company, Packing Size.
     - **Ledger In/Out Summary Cards**:
       - 📥 Inflow: Purchases + Sales Returns
       - 📤 Outflow: Sales + Purchase Returns
       - ⚖️ Net Transaction Impact: Inflow - Outflow
     - **Opening Stock Inputs**:
       - Full Cartons input (`stock_1`)
       - Loose Pieces input (`stock_2`)
       - Breakdown preview: e.g. `20 Cartons x 24 pcs + 5 pcs = 485 pcs`
     - **Live Reconciliation Status**:
       - Resulting Available Stock: `Opening Pcs + Net Movement`
       - If $\ge 0$: Green badge `✓ 100% Reconciled`
       - If $< 0$: Rose badge `⚠ Deficit of X pcs` + "Auto-fill Required Opening" shortcut button.
     - Save button saving changes and updating UI instantly with toast notification.

---

## 3. Implementation Steps

1. **Step 1**: Add transaction fields to `StockService::attachRealtimeBalances`.
2. **Step 2**: Add `company_id` filter and `companies` list to `ItemsController@index`.
3. **Step 3**: Create `updateOpeningStock` endpoint in `ItemsController.php` and `routes/web.php`.
4. **Step 4**: Update `ItemsFilters.tsx` with searchable Company combobox.
5. **Step 5**: Create `OpeningStockReconciliationDialog.tsx` component.
6. **Step 6**: Update `DataTable.tsx` to remove Code column, show code under title, and bind row-click to open dialog.
7. **Step 7**: Verify build (`npm run build`) and test all interactions.

