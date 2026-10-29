# Clearing Cheque Filters Feature Plan

## Goal
Implement comprehensive server-side filtering on `/clearing-cheque` for:
- Voucher No (`voucher_no`)
- Party Name dropdown (`party_id` -> `account_id`)
- Bank / Payment Account dropdown (`bank_account_id` -> `payment_account_id`)
- Cheque No (`cheque_no`)
- Amount (`amount`)
- Date Range (`start_date`, `end_date`, `date_type` defaulting to `cheque_date`)

## Tasks
1. **Controller Query Updates**: Update `ClearingChequeController@index` to:
   - Accept `voucher_no`, `party_id`, `bank_account_id`, `cheque_no`, `amount`, `start_date`, `end_date`, `date_type`.
   - Fetch party accounts (`parties`) alongside bank accounts (`accounts`) to populate dropdowns.
   - Apply query filters cleanly to `$query` (preserving `cheque_status` tabs).
   - Return active `filters`, `parties`, and `accounts` in Inertia props.
2. **Filter Bar Component**: Create `resources/js/pages/daily/clearingcheque/components/ClearingChequeFilters.tsx`:
   - Searchable Party Name dropdown.
   - Bank Account dropdown.
   - Voucher # input (debounced).
   - Cheque # input (debounced).
   - Amount input (debounced).
   - Date Range picker with presets & date type toggle (`Cheque Date` vs `Voucher Date`).
   - Reset / Clear Filters button.
3. **Page & Layout Integration**:
   - Integrate `ClearingChequeFilters` in `resources/js/pages/daily/clearingcheque/index.tsx` right above the tabs/table.
   - Remove redundant standalone bank dropdown in the header to unify filtering.
   - Ensure tab counts and amounts dynamically reflect filtered results.
4. **Verification**:
   - Run type checks / tests.
   - Verify filter URL queries and database query responses.

