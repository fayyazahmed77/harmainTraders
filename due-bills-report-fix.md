# Due Bills Report Analysis & Fix

## Goal
Fix Due Bills report (`http://127.0.0.1:8000/reports/accounts/ledger` with `reportId=due_bills`) so that:
1. Unpaid opening balances are displayed as their own distinct row (Voucher: `OPENING-BAL`), showing their actual unpaid remaining amount. If fully paid by customer/supplier receipts/payments, omit the opening balance completely.
2. Regular bill rows retain their own genuine remaining amount (never corrupted by adding opening balance to bill remaining).
3. Fully allocated returns (remaining_amount = 0) are excluded; only returns with actual unallocated remaining credit are included to prevent double deductions.
4. Both Customer (Sales/Sales Returns) and Supplier (Purchases/Purchase Returns) accounts are dynamically supported based on selection and filters.
5. All unpaid bills are displayed, with summary footer properly reporting Due Amount and Un-Due Amount.

## Tasks
- [x] Refactor `dueBills()` in `app/Services/ReportBuilder.php`
  - [x] Determine account scope (Customers vs Suppliers vs Both)
  - [x] Query active unpaid bills (`remaining_amount > 0.005`)
  - [x] Query unallocated returns (`remaining_amount > 0.005`)
  - [x] Group by party and precalculate balances using `PaymentAccountingService::attachBulkBalances`
  - [x] Compute unpaid opening balance (`excessOverBills = currentBal - billsRemaining`)
  - [x] Synthesize `OPENING-BAL` row only if unpaid balance remains
  - [x] Maintain clean bill remaining and running balance
  - [x] Calculate party summaries for due vs un-due amounts
- [x] Update `resources/js/pages/reports/accounts/components/reports/DueBillsReportView.tsx`
  - [x] Support `OPENING` badge and clean opening balance display
- [x] Update `resources/views/pdf/due-bills.blade.php`
  - [x] Match React view rendering for PDF export and print mode
- [x] Verify calculations and edge cases

## Outstanding Payment Bill Wise Fix
- [x] Refactor `outstandingBillWise()` in `app/Services/ReportBuilder.php`:
  - [x] Strictly focus on Supplier Payables (Purchases, unallocated Purchase Returns, Supplier Opening Balance).
  - [x] Preload accurate supplier balances using `PaymentAccountingService::attachBulkBalances($accounts)` (previously missing, which caused current_balance to evaluate to 0.0 and wiped out opening balance).
  - [x] Fetch `PurchaseReturn::where('remaining_amount', '>', 0.005)` to handle unallocated purchase return credits.
  - [x] Accurately determine unpaid supplier opening balance: if paid, omit completely; if unpaid, show as `OPENING-BAL (CR)` or `(DR)` with actual remaining amount.
  - [x] Bill rows maintain their genuine bill amounts and remaining balances without inflation.
  - [x] Group bills by supplier and calculate running balance and party summary (un-due vs critical due).
- [x] Updated `OutstandingBillWiseView.tsx` with formatted totals.
- [x] Aligned with `pdf/outstanding-billwise.blade.php`.
