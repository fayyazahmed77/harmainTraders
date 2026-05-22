# 🔐 HARMAIN TRADERS — ROLE & PERMISSION AUDIT REPORT

## Executive Summary
This report presents the findings of a comprehensive security audit of the **Harmain Traders** ERP system, focusing on its Role and Permission implementation. The system is built using Laravel 11, Spatie Laravel-Permission, Inertia.js, and React. 

The audit reveals a **high-risk, fragmented authorization model** with severe security vulnerabilities. While Spatie's permission package is installed, it is only partially integrated. The application is highly vulnerable to authorization bypass, privilege escalation, and unauthorized data modification due to a reliance on front-end restrictions without corresponding back-end enforcement.

### Key Stats
*   **Total Controllers Audited**: 44
*   **Controllers with Backend Authorization (HasMiddleware/Gate/Policy)**: 8 / 44 (18.1%)
*   **Controllers with Routing-Level Role Protection**: 15 / 44 (34.1%)
*   **Vulnerable / Open Controllers (Only require 'auth')**: 29 / 44 (65.9%)
*   **Critical Authorization Mismatches Found**: 1 (Payment deletion completely blocked due to naming conflicts)

---

## 🏗️ Architecture Overview

The system uses three disjointed authorization patterns:
1.  **Modern Spatie Controller Middleware**: Controllers implementing `HasMiddleware` to assign permissions dynamically (e.g., `SalesController`, `PurchaseController`, `JournalVoucherController`).
2.  **Routing-Layer Middleware**: Route groups in `routes/web.php` wrapped in `role:Admin` or `role:investor` middleware.
3.  **Ad-hoc Gate / Policy Checks**: In-method checks using `Gate::allows()` or Laravel policies (e.g., `ShiftController` with `ShiftPolicy`, `PaymentController` with custom Gate calls).

### The "Front-End Only Security" (FES) Flaw
The React frontend (via `HandleInertiaRequests.php`) receives user roles and permissions as props. UI elements (e.g., "Create Bank", "Edit Account") are hidden using `permissions.includes(...)` or `roles.includes(...)`. 
However, for 29 modules, **the corresponding backend routes only require a valid login (`auth` middleware)**. An authenticated user (e.g., a Salesman or Booker) can easily bypass the UI and make direct HTTP requests (POST, PUT, DELETE) to read, create, update, or delete sensitive data across Accounts, Banks, Chequebooks, and Reports.

---

## 📊 Backend Security Matrix

| Controller | Route Prefix | Route-Level Middleware | Controller-Level Checks | Security Rating |
| :--- | :--- | :--- | :--- | :--- |
| `PermissionController` | `/permissions` | `role:Admin` | `HasMiddleware` (`can:view_permissions`, etc.) | ✅ SECURE |
| `PermissionCatController` | `/permissions/category` | `role:Admin` | None | ✅ SECURE (via routing) |
| `RoleController` | `/roles/permissions` | `role:Admin` | `HasMiddleware` (`can:view_roles`, etc.) | ✅ SECURE |
| `StaffController` | `/staff` | `role:Admin` | `HasMiddleware` (`role:Admin`) | ✅ SECURE |
| `ShiftController` | `/admin/shifts` | `role:Admin` | `ShiftPolicy` (`Gate::authorize`) | ✅ SECURE |
| `InvestorManagementController` | `/admin/investors` | `role:Admin` | None | ✅ SECURE (via routing) |
| `ProfitDistributionController` | `/admin/profit/distribute` | `role:Admin` | None | ✅ SECURE (via routing) |
| `EmailSettingsController` | `/admin/settings/email` | `role:Admin` | None | ✅ SECURE (via routing) |
| `EmailTemplateController` | `/admin/settings/templates` | `role:Admin` | None | ✅ SECURE (via routing) |
| `ActivityLogController` | `/admin/activity-logs` | `role:Admin` | None | ✅ SECURE (via routing) |
| `SupplierCompanyController` | `/admin/supplier-companies` | `role:Admin` | None | ✅ SECURE (via routing) |
| `SupplierOrderController` | `/admin/supplier-order` | `role:Admin` | None | ✅ SECURE (via routing) |
| `Investor\*` | `/investor/*` | `role:investor` | None | ✅ SECURE (via routing) |
| `SalesController` | `/sales` | `auth` | `HasMiddleware` (`can:view_sales`, etc.) | ✅ SECURE |
| `PurchaseController` | `/purchase` | `auth` | `HasMiddleware` (`can:view_purchases`, etc.) | ✅ SECURE |
| `JournalVoucherController` | `/journal-vouchers` | `auth` | `HasMiddleware` (`can:view_journal_vouchers`, etc.) | ✅ SECURE |
| `PaymentController` | `/payments` | `auth` | `HasMiddleware` (with mismatch check) | ⚠️ PARTIALLY SECURE |
| `AccountController` | `/account` | `auth` | None | ❌ VULNERABLE |
| `BankController` | `/banks` | `auth` | None | ❌ VULNERABLE |
| `ChequebookController` | `/cheque` | `auth` | None | ❌ VULNERABLE |
| `FirmController` | `/firms` | `auth` | None | ❌ VULNERABLE |
| `AreasController` | `/areas` | `auth` | None | ❌ VULNERABLE |
| `SubareaController` | `/subareas` | `auth` | None | ❌ VULNERABLE |
| `CityController` | `/cities` | `auth` | None | ❌ VULNERABLE |
| `ProvinceController` | `/provinces` | `auth` | None | ❌ VULNERABLE |
| `CountryController` | `/countries` | `auth` | None | ❌ VULNERABLE |
| `SalemanController` | `/salemen` | `auth` | None | ❌ VULNERABLE |
| `BookerController` | `/bookers` | `auth` | None | ❌ VULNERABLE |
| `AccountTypeController` | `/account-types` | `auth` | None | ❌ VULNERABLE |
| `AccountCategoryController` | `/account-category` | `auth` | None | ❌ VULNERABLE |
| `ItemCategoryController` | `/item-categories` | `auth` | None | ❌ VULNERABLE |
| `ItemsController` | `/items` | `auth` | None | ❌ VULNERABLE |
| `MessageLineController` | `/message-lines` | `auth` | None | ❌ VULNERABLE |
| `OfferListController` | `/offer-list` | `auth` | None | ❌ VULNERABLE |
| `SalesReturnController` | `/sales-return` | `auth` | None | ❌ VULNERABLE |
| `PurchaseReturnController` | `/purchase-return` | `auth` | None | ❌ VULNERABLE |
| `ClearingChequeController` | `/clearing-cheque` | `auth` | None | ❌ VULNERABLE |
| `WalletController` | `/salemen/{id}/wallet` | `auth` | None | ❌ VULNERABLE |
| `ReportsController` | `/reports` | `auth` | None | ❌ VULNERABLE |
| `StockReportsController` | `/reports/stock` | `auth` | None | ❌ VULNERABLE |
| `PurchaseReportsController` | `/reports/purchase` | `auth` | None | ❌ VULNERABLE |
| `PurchaseReturnReportsController` | `/reports/purchase-return` | `auth` | None | ❌ VULNERABLE |
| `SalesReportsController` | `/reports/sales` | `auth` | None | ❌ VULNERABLE |
| `SalesReturnReportsController` | `/reports/sales-return` | `auth` | None | ❌ VULNERABLE |
| `SalesMapReportController` | `/reports/sales-map` | `auth` | None | ❌ VULNERABLE |
| `ProfitReportsController` | `/reports/profit` | `auth` | None | ❌ VULNERABLE |

---

## 🔍 Critical Vulnerability Details

### 1. The Salesman & Booker Privilege Escalation (CRITICAL)
A standard Salesman or Booker account should only perform entry operations (Sales, Payments). However:
*   They can send HTTP `POST` requests to `/banks` to create malicious banks.
*   They can send HTTP `POST` requests to `/cheque` to create or hijack chequebooks.
*   They can request `/reports/profit/*` or `/reports/accounts/ledger` to view sensitive financial performance, margins, and proprietary data.
*   There are **no checks** in the backend controllers to restrict these actions to the `Admin` role or appropriate permissions.

### 2. Broken Object Level Authorization (BOLA) in Accounts & Firms
*   Routes like `/account/{account}/edit` and `/account/{account}` (PUT/DELETE) do not check if the user has permission to edit/delete accounts.
*   Any logged-in user can modify account titles, credit limits, or delete vital accounts directly by calling the API endpoints.

### 3. Payment Deletion Mismatch Bug (Functional & Security Flaw)
In `PaymentController.php`:
*   The controller class implements Spatie's middleware matching permission names:
    ```php
    new Middleware('can:delete_payments', only: ['destroy'])
    ```
*   However, inside the `destroy` method, it checks:
    ```php
    if (! \Illuminate\Support\Facades\Gate::allows('delete-payment')) {
        abort(403);
    }
    ```
*   **Result**: 
    - If a user has the `delete_payments` permission, they pass the middleware but get blocked by the internal method check because the permission name is singular (`delete-payment`).
    - If a user has the `delete-payment` permission, they get blocked by the middleware before even reaching the controller method.
    - Payment deletion is **effectively broken** for all users, including Administrators.

### 4. Open Financial Reports (High Leakage Risk)
All reports controllers (`ReportsController`, `StockReportsController`, etc.) are under the base `/reports` prefix which only requires `auth` middleware.
*   An unauthorized employee can download PDF ledgers, view profit charts, and analyze purchase prices, which must be restricted to management/admin.

---

## 🛠️ Proposed Remediation Strategy

To resolve these vulnerabilities and establish a robust security posture, we recommend the following changes:

### Phase 1: Controller-Level Middleware Enforcement
Implement the `HasMiddleware` interface on all vulnerable controllers and enforce permissions:
*   **AccountController**: `view_accounts`, `create_accounts`, `edit_accounts`, `delete_accounts`
*   **BankController**: `view_banks`, `create_banks`, `edit_banks`, `delete_banks`
*   **ChequebookController**: `view_chequebooks`, `create_chequebooks`, `edit_chequebooks`, `delete_chequebooks`
*   **FirmController**: `view_firms`, `create_firms`, `edit_firms`, `delete_firms`

### Phase 2: Route-Layer Grouping for Reports
Group all reports under a new route middleware block in `routes/web.php` to restrict access:
```php
Route::middleware(['role:Admin'])->prefix('/reports')->group(function () {
    // Move all reports routes here
});
```

### Phase 3: Naming Consistency Fixes
Correct the gate check in `PaymentController@destroy` to match the Spatie permission name:
```diff
- if (! \Illuminate\Support\Facades\Gate::allows('delete-payment')) {
+ if (! \Illuminate\Support\Facades\Gate::allows('delete_payments')) {
```
