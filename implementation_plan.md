# Payment Module Implementation Plan

## Goal

Implement a comprehensive payment system to handle "Payment IN" (from Customers for Sales) and "Payment OUT" (to Suppliers for Purchases). The system will allow selecting an account, viewing unpaid invoices, and allocating payments to them.

## User Review Required

> [!IMPORTANT]
> **Payment Allocation Strategy**: We will create a `payment_allocations` table to link a single payment voucher to multiple invoices (Sales or Purchases). This allows for partial payments and precise tracking of which bill is paid.

## Proposed Changes

### Database Schema

#### [NEW] `database/migrations/xxxx_create_payments_table.php`

- `date`: Date of payment
- `voucher_no`: Unique voucher number
- `account_id`: The party (Customer or Supplier)
- `payment_account_id`: The account used for payment (Cash, Bank, etc.)
- `amount`: Total amount paid/received
- `discount`: Discount given/taken
- `net_amount`: Final amount
- `type`: 'RECEIPT' (IN) or 'PAYMENT' (OUT)
- `cheque_no`, `cheque_date`, `clear_date`: Cheque details
- `remarks`: Notes

#### [NEW] `database/migrations/xxxx_create_payment_allocations_table.php`

- `payment_id`: Link to parent payment
- `bill_id`: ID of the Sale or Purchase
- `bill_type`: 'App\Models\Sales' or 'App\Models\Purchase'
- `amount`: Amount allocated to this specific bill

### Backend

#### [MODIFY] `app/Http/Controllers/PaymentController.php`

- `create()`: Fetch Accounts (Customers/Suppliers) and Payment Accounts (Cash/Bank).
- `getUnpaidBills(Request $request)`: New API endpoint.
    - Input: `account_id`
    - Logic: Check account type. If Customer -> fetch unpaid Sales. If Supplier -> fetch unpaid Purchases.
    - Output: List of bills with `id`, `invoice_no`, `date`, `net_total`, `remaining_amount`.
- `store(Request $request)`:
    - Validate input.
    - Create `Payment` record.
    - Loop through `allocations`:
        - Update `Sales` or `Purchase` record (`paid_amount` += amount, `remaining_amount` -= amount).
        - Create `payment_allocations` record.
    - DB Transaction to ensure data integrity.

#### [NEW] `app/Models/Payment.php`

- Define relationships (`account`, `paymentAccount`, `allocations`).

#### [NEW] `app/Models/PaymentAllocation.php`

- Define relationships (`payment`, `bill`).

### Frontend

#### [MODIFY] `resources/js/pages/daily/payment/create.tsx`

- **Account Selection**: Use a proper `Select` component.
- **Unpaid Bills List**:
    - Fetch on account selection.
    - Display in a table with Checkboxes.
    - "Auto-allocate" feature: If user enters total amount, auto-check bills until amount is exhausted? OR User checks bills and total is calculated? **Decision: User checks bills, total is calculated.**
- **Payment Details**:
    - Payment Mode (Cash/Bank) selection.
    - Cheque details.
- **Submission**: Send payload with `payment_details` and `allocations`.

## Verification Plan

### Automated Tests

- Test `getUnpaidBills` returns correct data.
- Test `store` correctly updates `remaining_amount` on invoices.
- Test `store` creates `Payment` and `PaymentAllocation` records.

### Manual Verification

1. Create a Sale (Credit).
2. Go to Payment > Create.
3. Select Customer. Verify Sale appears in list.
4. Select Sale, enter amount. Save.
5. Verify Sale `remaining_amount` is updated.
6. Verify Payment record exists.
