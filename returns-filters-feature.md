# Returns Filters Feature Plan (Journal Vouchers UI Parity)

## Goal
Implement server-side filtering, dynamic summary KPI cards, and pagination for `/sales-return` and `/purchase-return` matching the `/journal-vouchers` UI reference.

## Tasks
1. **Sales Return Controller**: Add multi-field filtering (`search`, `start_date`, `end_date`, `customer_id`, `salesman_id`, `firm_id`, `min_amount`, `max_amount`, `per_page`), dynamic summary KPIs, and pagination in `SalesReturnController@index`.
2. **Purchase Return Controller**: Add multi-field filtering (`search`, `start_date`, `end_date`, `supplier_id`, `salesman_id`, `firm_id`, `min_amount`, `max_amount`, `per_page`), dynamic summary KPIs, and pagination in `PurchaseReturnController@index`.
3. **Sales Return Filter Component**: Create `resources/js/pages/daily/sales_return/components/SalesReturnFilters.tsx` replicating `JournalVoucherFilters.tsx` (Search, Date presets popover, Customer popover, Advanced drawer for Salesman, Firm, Min/Max amount, active filter pills, reset button).
4. **Purchase Return Filter Component**: Create `resources/js/pages/daily/purchase_return/components/PurchaseReturnFilters.tsx` replicating `JournalVoucherFilters.tsx` (Search, Date presets popover, Supplier popover, Advanced drawer for Salesman, Firm, Min/Max amount, active filter pills, reset button).
5. **Sales Return Index & Table Integration**: Update `sales_return/index.tsx` and `DataTable.tsx` to use `SalesReturnFilters`, dynamic summary cards, and server pagination controls (rows per page + page buttons).
6. **Purchase Return Index & Table Integration**: Update `purchase_return/index.tsx` and `DataTable.tsx` to use `PurchaseReturnFilters`, dynamic summary cards, and server pagination controls (rows per page + page buttons).
7. **Verification**: Verify both routes return proper JSON/Inertia props and no syntax/type errors.
