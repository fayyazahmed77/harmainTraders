<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AccountHistoryController;
use App\Http\Controllers\FirmController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionCatController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\ProvinceController;
use App\Http\Controllers\CityController;
use App\Http\Controllers\AreasController;
use App\Http\Controllers\SubareaController;
use App\Http\Controllers\ItemsController;
use App\Http\Controllers\MessageLineController;
use App\Http\Controllers\ChequebookController;
use App\Http\Controllers\BankController;
use App\Http\Controllers\SalemanController;
use App\Http\Controllers\BookerController;
use App\Http\Controllers\AccountTypeController;
use App\Http\Controllers\OfferListController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SalesReturnController;
use App\Http\Controllers\PurchaseReturnController;
use App\Http\Controllers\ClearingChequeController;
use App\Http\Controllers\ItemCategoryController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\PurchaseReportsController;
use App\Http\Controllers\SalesMapReportController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\AccountCategoryController;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\ProfitReportsController;
use App\Http\Controllers\Admin\EmailSettingsController;
use App\Http\Controllers\Admin\EmailTemplateController;
use App\Http\Controllers\Investor\DashboardController as InvestorDashboardController;
use App\Http\Controllers\Investor\RequestController as InvestorRequestController;
use App\Http\Controllers\Investor\ForecastController as InvestorForecastController;
use App\Http\Controllers\Admin\InvestorManagementController;
use App\Http\Controllers\Admin\ProfitDistributionController;
use App\Http\Controllers\PurchaseReturnReportsController;
use App\Http\Controllers\SalesReportsController;   
use App\Http\Controllers\StockReportsController;
use App\Http\Controllers\JournalVoucherController;


// API Routes
Route::post('/api/check-email', [AuthController::class, 'checkEmail']);
Route::get('/api/purchase/last-purchase-info', [PurchaseController::class, 'getLastPurchaseInfo']);



Route::get('/', function () {
    return Inertia::render('auth/login', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

use App\Http\Controllers\DashboardController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('dashboard/sales', [DashboardController::class, 'salesOverview'])->name('dashboard.sales');
});

// ============================================================================
// PROTECTED ROUTES - Require Authentication
// ============================================================================
Route::middleware(['auth'])->group(function () {
    //------------------------Permission Crud --------------------------------------------------------
    Route::prefix('permissions')->group(function () {
        Route::get('/', [PermissionController::class, 'index'])->name('permissions.index');
        Route::post('/', [PermissionController::class, 'store'])->name('permissions.store');
        Route::put('/{id}', [PermissionController::class, 'update'])->name('permissions.update');
        Route::delete('/{id}', [PermissionController::class, 'destroy'])->name('permissions.destroy');
    });
    //------------------------Permission Category --------------------------------------------------------
    Route::prefix('permissions/category')->group(function () {
        Route::get('/', [PermissionCatController::class, 'index'])->name('category.index');
        Route::post('/', [PermissionCatController::class, 'store'])->name('category.store');
        Route::put('/{id}', [PermissionCatController::class, 'update'])->name('category.update');
        Route::delete('/{id}', [PermissionCatController::class, 'destroy'])->name('category.destroy');
    });
    //---------------------Users Rols and Permission----------------------------------------------------
    Route::prefix('/roles/permissions')->group(function () {
        Route::get('/list', [RoleController::class, 'list'])->name('roles.list');
        Route::get('/', [RoleController::class, 'index'])->name('roles.index');
        Route::post('/', [RoleController::class, 'store'])->name('roles.store');
        Route::get('/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
        Route::put('/{id}', [RoleController::class, 'update'])->name('roles.update');
        Route::delete('/{id}', [RoleController::class, 'destroy'])->name('roles.destroy');
    });
    Route::prefix('/account')->group(function () {
        Route::get('/', [AccountController::class, 'index'])->name('account.index');
        Route::get('/create', [AccountController::class, 'create'])->name('account.create');
        Route::post('/', [AccountController::class, 'store'])->name('account.store');
        Route::get('/{account}/show', [AccountController::class, 'show'])->name('account.show');
        Route::get('/{account}/edit', [AccountController::class, 'edit'])->name('account.edit');
        Route::put('/{account}', [AccountController::class, 'update'])->name('account.update');
        Route::delete('/{account}', [AccountController::class, 'destroy'])->name('account.destroy');
        Route::get('/{id}/balance', [AccountController::class, 'getBalance'])->name('account.balance');
        Route::get('/next-code', [AccountController::class, 'getNextCode'])->name('account.next-code');
        Route::patch('/{account}/toggle-status', [AccountController::class, 'toggleStatus'])->name('account.toggle-status');
        Route::post('/{id}/reset-guest-token', [GuestController::class, 'resetToken'])->name('account.reset-guest-token');

        // History Data Routes
        Route::get('/{account}/history/sales', [AccountHistoryController::class, 'getSales'])->name('account.history.sales');
        Route::get('/{account}/history/purchases', [AccountHistoryController::class, 'getPurchases'])->name('account.history.purchases');
        Route::get('/{account}/history/payments', [AccountHistoryController::class, 'getPayments'])->name('account.history.payments');
        Route::get('/{account}/history/bank-statement', [AccountHistoryController::class, 'getBankStatement'])->name('account.history.bank-statement');
        Route::get('/{account}/history/cheques', [AccountHistoryController::class, 'getCheques'])->name('account.history.cheques');
    });
    Route::prefix('/firms')->group(function () {
        Route::get('/', [FirmController::class, 'index'])->name('firms.index');
        Route::get('/create', [FirmController::class, 'create'])->name('firms.create');
        Route::post('/', [FirmController::class, 'store'])->name('firms.store');
        Route::get('/{firm}', [FirmController::class, 'show'])->name('firms.show');
        Route::get('/{firm}/edit', [FirmController::class, 'edit'])->name('firms.edit');
        Route::get('/{firm}/show', [FirmController::class, 'show'])->name('firms.show');
        Route::put('/{firm}', [FirmController::class, 'update'])->name('firms.update');
        Route::delete('/{firm}', [FirmController::class, 'destroy'])->name('firms.destroy');
    });
    //---------------------Account Type------------------------------------------------------------------
    Route::prefix('/account-types')->group(function () {
        Route::get('/', [AccountTypeController::class, 'index'])->name('account-types.index');
        Route::post('/', [AccountTypeController::class, 'store'])->name('account-types.store');
        Route::put('/{accountType}', [AccountTypeController::class, 'update'])->name('account-types.update');
        Route::delete('/{id}', [AccountTypeController::class, 'destroy'])->name('account-types.destroy');
    });
    //---------------------Account Category------------------------------------------------------------------
    Route::prefix('/account-category')->group(function () {
        Route::get('/', [AccountCategoryController::class, 'index'])->name('account-categories.index');
        Route::post('/', [AccountCategoryController::class, 'store'])->name('account-categories.store');
        Route::put('/{accountCategory}', [AccountCategoryController::class, 'update'])->name('account-categories.update');
        Route::delete('/{accountCategory}', [AccountCategoryController::class, 'destroy'])->name('account-categories.destroy');
    });

    //---------------------Staff Management--------------------------------------------------------------
    Route::prefix('/staff')->group(function () {
        Route::get('/', [StaffController::class, 'index'])->name('staff.index');
        Route::get('/create', [StaffController::class, 'create'])->name('staff.create');
        Route::post('/', [StaffController::class, 'store'])->name('staff.store');
        Route::get('/{id}', [StaffController::class, 'show'])->name('staff.show');
        Route::get('/{id}/edit', [StaffController::class, 'edit'])->name('staff.edit');
        Route::put('/{id}', [StaffController::class, 'update'])->name('staff.update');
        Route::delete('/{id}', [StaffController::class, 'destroy'])->name('staff.destroy');
    });
    //---------------------salemen------------------------------------------------------------------
    Route::prefix('/salemen')->group(function () {
        Route::get('/', [SalemanController::class, 'index'])->name('salemen.index');
        Route::get('/next-code', [SalemanController::class, 'getNextCode'])->name('salemen.next-code');
        Route::post('/', [SalemanController::class, 'store'])->name('salemen.store');
        Route::put('/{saleman}', [SalemanController::class, 'update'])->name('salemen.update');
        Route::delete('/{saleman}', [SalemanController::class, 'destroy'])->name('salemen.destroy');

        // Wallet Routes
        Route::get('/{id}/wallet', [WalletController::class, 'index'])->name('salemen.wallet');
        Route::post('/{id}/wallet/transaction', [WalletController::class, 'store'])->name('salemen.wallet.store');
        Route::put('/wallet/transactions/{id}/pay', [WalletController::class, 'markPaid'])->name('salemen.wallet.pay');
    });
    //---------------------Booker------------------------------------------------------------------
    Route::prefix('/bookers')->group(function () {
        Route::get('/', [BookerController::class, 'index'])->name('bookers.index');
        Route::post('/', [BookerController::class, 'store'])->name('bookers.store');
        Route::put('/{booker}', [BookerController::class, 'update'])->name('bookers.update');
        Route::delete('/{booker}', [BookerController::class, 'destroy'])->name('bookers.destroy');
    });
    //---------------------Country------------------------------------------------------------------
    Route::prefix('/countries')->group(function () {
        Route::get('/', [CountryController::class, 'index'])->name('countries.index');
        Route::post('/', [CountryController::class, 'store'])->name('countries.store');
        Route::put('/{country}', [CountryController::class, 'update'])->name('countries.update');
        Route::delete('/{id}', [CountryController::class, 'destroy'])->name('countries.destroy');
    });
    //---------------------Provinces------------------------------------------------------------------
    Route::prefix('/provinces')->group(function () {
        Route::get('/', [ProvinceController::class, 'index'])->name('provinces.index');
        Route::post('/', [ProvinceController::class, 'store'])->name('provinces.store');
        Route::put('/{province}', [ProvinceController::class, 'update'])->name('provinces.update');
        Route::delete('/{id}', [ProvinceController::class, 'destroy'])->name('provinces.destroy');
    });
    //---------------------Cities------------------------------------------------------------------
    Route::prefix('/cities')->group(function () {
        Route::get('/', [CityController::class, 'index'])->name('cities.index');
        Route::get('/create', [CityController::class, 'create'])->name('cities.create');
        Route::post('/', [CityController::class, 'store'])->name('cities.store');
        Route::get('/{cities}/edit', [CityController::class, 'edit'])->name('cities.edit');
        Route::put('/{city}', [CityController::class, 'update'])->name('cities.update');
        Route::delete('/{id}', [CityController::class, 'destroy'])->name('cities.destroy');
        Route::get('/countries/{country}/provinces', [ProvinceController::class, 'getByCountry']);
    });
    //---------------------Areas------------------------------------------------------------------
    Route::prefix('/areas')->group(function () {
        Route::get('/', [AreasController::class, 'index'])->name('areas.index');
        Route::get('/create', [AreasController::class, 'create'])->name('areas.create');
        Route::post('/', [AreasController::class, 'store'])->name('areas.store');
        Route::get('/{areas}/edit', [AreasController::class, 'edit'])->name('areas.edit');
        Route::put('/{area}', [AreasController::class, 'update'])->name('areas.update');
        Route::delete('/{id}', [AreasController::class, 'destroy'])->name('areas.destroy');
        Route::get('countries/{country}/provinces', [ProvinceController::class, 'getByCountry']);
        Route::get('/provinces/{province}/cities', [ProvinceController::class, 'getByProvince']);
    });
    //---------------------Sub Areas------------------------------------------------------------------
    Route::prefix('/subareas')->group(function () {
        Route::get('/', [SubareaController::class, 'index'])->name('subareas.index');
        Route::post('/', [SubareaController::class, 'store'])->name('subareas.store');
        Route::put('/{subareas}', [SubareaController::class, 'update'])->name('subareas.update');
        Route::delete('/{id}', [SubareaController::class, 'destroy'])->name('subareas.destroy');
        Route::get('countries/{country}/provinces', [ProvinceController::class, 'getByCountry']);
        Route::get('/provinces/{province}/cities', [ProvinceController::class, 'getByProvince']);
        Route::get('/cities/{city}/areas', [AreasController::class, 'getByCity']);
        Route::get('areas/{area}/subareas', [AreasController::class, 'getByArea']);
    });
    //---------------------Items Category------------------------------------------------------------------
    Route::prefix('/item-categories')->group(function () {
        Route::get('/', [ItemCategoryController::class, 'index'])->name('item-categories.index');
        Route::get('/create', [ItemCategoryController::class, 'create'])->name('item-categories.create');
        Route::post('/', [ItemCategoryController::class, 'store'])->name('item-categories.store');
        Route::get('/{itemCategory}/edit', [ItemCategoryController::class, 'edit'])->name('item-categories.edit');
        Route::put('/{itemCategory}', [ItemCategoryController::class, 'update'])->name('item-categories.update');
        Route::delete('/{id}', [ItemCategoryController::class, 'destroy'])->name('item-categories.destroy');
    });
    //---------------------Items------------------------------------------------------------------
    Route::prefix('/items')->group(function () {
        Route::get('/', [ItemsController::class, 'index'])->name('items.index');
        Route::get('/create', [ItemsController::class, 'create'])->name('items.create');
        Route::post('/', [ItemsController::class, 'store'])->name('items.store');
        Route::get('/next-code', [ItemsController::class, 'getNextCode'])->name('items.next-code');
        Route::get('/{items}/edit', [ItemsController::class, 'edit'])->name('items.edit');
        Route::get('/{items}/show', [ItemsController::class, 'show'])->name('items.show');
        Route::put('/{items}', [ItemsController::class, 'update'])->name('items.update');
        Route::patch('/{items}/toggle-active', [ItemsController::class, 'toggleActive'])->name('items.toggle-active');
        Route::delete('/{id}', [ItemsController::class, 'destroy'])->name('items.destroy');
    });
    // ---------------------Message Lines------------------------------------------------------------------
    Route::prefix('/message-lines')->group(function () {
        Route::get('/', [MessageLineController::class, 'index'])->name('message_lines.index');
        Route::post('/', [MessageLineController::class, 'store'])->name('message_lines.store');
        Route::put('/{messageLine}', [MessageLineController::class, 'update'])->name('message_lines.update');
        Route::delete('/{id}', [MessageLineController::class, 'destroy'])->name('message_lines.destroy');
    });
    //---------------------Banks------------------------------------------------------------------
    Route::prefix('/banks')->group(function () {
        Route::get('/', [BankController::class, 'index'])->name('banks.index');
        Route::get('/create', [BankController::class, 'create'])->name('banks.create');
        Route::post('/', [BankController::class, 'store'])->name('banks.store');
        Route::get('/{bank}/edit', [BankController::class, 'edit'])->name('banks.edit');
        Route::put('/{bank}', [BankController::class, 'update'])->name('banks.update');
        Route::delete('/{id}', [BankController::class, 'destroy'])->name('banks.destroy');
    });
    //---------------------Cheque------------------------------------------------------------------
    Route::prefix('/cheque')->group(function () {
        Route::get('/', [ChequebookController::class, 'index'])->name('cheque.index');
        Route::get('/create', [ChequebookController::class, 'create'])->name('cheque.create');
        Route::post('/', [ChequebookController::class, 'store'])->name('cheque.store');
        Route::get('/{cheque}/edit', [ChequebookController::class, 'edit'])->name('cheque.edit');
        Route::put('/{cheque}', [ChequebookController::class, 'update'])->name('cheque.update');
        Route::get('/{cheque}/view', [ChequebookController::class, 'show'])->name('cheque.show');
        Route::delete('/{id}', [ChequebookController::class, 'destroy'])->name('cheque.destroy');
    });
    //--------------------------------------------Offer List-----------------------------------------------
    Route::prefix('/offer-list')->group(function () {
        Route::get('/', [OfferListController::class, 'index'])->name('offer-list.index');
        Route::get('/create', [OfferListController::class, 'create'])->name('offer-list.create');
        Route::post('/', [OfferListController::class, 'store'])->name('offer-list.store');
        Route::get('/{offerlist}/edit', [OfferListController::class, 'edit'])->name('offerlist.edit');
        Route::get('/{offerlist}/view', [OfferListController::class, 'view'])->name('offerlist.view');
        Route::get('/{offerlist}/pdf', [OfferListController::class, 'pdf'])->name('offerlist.pdf');
        Route::get('/{offerlist}/download', [OfferListController::class, 'download'])->name('offerlist.download');
        Route::put('/{offerlist}', [OfferListController::class, 'update'])->name('offerlist.update');
        Route::post('/{id}/toggle-live', [OfferListController::class, 'toggleLive'])->name('offer-list.toggle-live');
        Route::delete('/{id}', [OfferListController::class, 'destroy'])->name('offerlist.destroy');
    });
    //--------------------------------------------Sales-----------------------------------------------
    Route::prefix('/sales')->group(function () {
        Route::get('/', [SalesController::class, 'index'])->name('sale.index');
        Route::get('/create', [SalesController::class, 'create'])->name('sale.create');
        Route::post('/', [SalesController::class, 'store'])->name('sale.store');
        Route::get('/{sale}/edit', [SalesController::class, 'edit'])->name('sale.edit');
        Route::get('/{sale}/view', [SalesController::class, 'view'])->name('sale.view');
        Route::get('/{sale}/pdf', [SalesController::class, 'pdf'])->name('sale.pdf');
        Route::post('/{sale}/confirm', [SalesController::class, 'confirm'])->name('sale.confirm');
        Route::post('/{sale}/cancel', [SalesController::class, 'cancel'])->name('sale.cancel');
        Route::get('/{sale}/download', [SalesController::class, 'download'])->name('sale.download');
        Route::put('/{sale}', [SalesController::class, 'update'])->name('sale.update');
        Route::delete('/{id}/delete', [SalesController::class, 'destroy'])->name('sale.destroy');
    });

    //--------------------------------------------Sales Return-----------------------------------------------
    Route::prefix('/sales-return')->group(function () {
        Route::get('/', [SalesReturnController::class, 'index'])->name('sales_return.index');
        Route::get('/create', [SalesReturnController::class, 'create'])->name('sales_return.create');
        Route::post('/', [SalesReturnController::class, 'store'])->name('sales_return.store');
        Route::get('/{salesReturn}/show', [SalesReturnController::class, 'show'])->name('sales_return.show');
        Route::get('/{salesReturn}/edit', [SalesReturnController::class, 'edit'])->name('sales_return.edit');
        Route::put('/{salesReturn}', [SalesReturnController::class, 'update'])->name('sales_return.update');
        Route::delete('/{id}', [SalesReturnController::class, 'destroy'])->name('sales_return.destroy');
        Route::get('/{id}/pdf', [SalesReturnController::class, 'pdf'])->name('sales_return.pdf');
        Route::get('/customer/{customerId}/purchased-items', [SalesReturnController::class, 'getCustomerPurchasedItems'])->name('sales_return.customer_items');
        Route::get('/customer/{customerId}/invoices', [SalesReturnController::class, 'getCustomerInvoices'])->name('sales_return.customer_invoices');
        Route::get('/invoice/{invoiceId}/items', [SalesReturnController::class, 'getInvoiceItems'])->name('sales_return.invoice_items');
    });
    //--------------------------------------------Purchase-----------------------------------------------
    Route::prefix('/purchase')->group(function () {
        Route::get('/', [PurchaseController::class, 'index'])->name('purchase.index');
        Route::get('/create', [PurchaseController::class, 'create'])->name('purchase.create');
        Route::post('/', [PurchaseController::class, 'store'])->name('purchase.store');
        Route::get('/{purchas}/edit', [PurchaseController::class, 'edit'])->name('purchase.edit');
        Route::get('/{purchas}/view', [PurchaseController::class, 'view'])->name('purchase.view');
        Route::put('/{purchas}', [PurchaseController::class, 'update'])->name('purchase.update');
        Route::delete('/{id}', [PurchaseController::class, 'destroy'])->name('purchase.destroy');
        // Purchase PDF
        Route::get('/{id}/pdf', [PurchaseController::class, 'pdf'])->name('purchase.pdf');
        Route::get('/{id}/download', [PurchaseController::class, 'download'])->name('purchase.download');
    });
    //--------------------------------------------Purchase Return-----------------------------------------------
    Route::prefix('/purchase-return')->group(function () {
        Route::get('/', [PurchaseReturnController::class, 'index'])->name('purchase_return.index');
        Route::get('/create', [PurchaseReturnController::class, 'create'])->name('purchase_return.create');
        Route::post('/', [PurchaseReturnController::class, 'store'])->name('purchase_return.store');
        Route::get('/{purchaseReturn}/edit', [PurchaseReturnController::class, 'edit'])->name('purchase_return.edit');
        Route::put('/{purchaseReturn}', [PurchaseReturnController::class, 'update'])->name('purchase_return.update');
        Route::get('/{purchaseReturn}/show', [PurchaseReturnController::class, 'show'])->name('purchase_return.show');
        Route::get('/{id}/pdf', [PurchaseReturnController::class, 'pdf'])->name('purchase_return.pdf');
        Route::delete('/{id}', [PurchaseReturnController::class, 'destroy'])->name('purchase_return.destroy');
        Route::get('/supplier/{supplierId}/purchased-items', [PurchaseReturnController::class, 'getSupplierPurchasedItems'])->name('purchase_return.supplier_items');
        Route::get('/supplier/{supplierId}/invoices', [PurchaseReturnController::class, 'getSupplierInvoices'])->name('purchase_return.supplier_invoices');
        Route::get('/invoice/{invoiceId}/items', [PurchaseReturnController::class, 'getInvoiceItems'])->name('purchase_return.invoice_items');
    });
    //--------------------------------------------Payments-----------------------------------------------
    Route::prefix('/payments')->group(function () {
        Route::get('/', [PaymentController::class, 'index'])->name('payments.index');
        Route::get('/create', [PaymentController::class, 'create'])->name('payments.create');
        Route::post('/', [PaymentController::class, 'store'])->name('payments.store');
        Route::get('/{payment}/edit', [PaymentController::class, 'edit'])->name('payments.edit');
        Route::put('/{payment}', [PaymentController::class, 'update'])->name('payments.update');
        Route::get('/{payment}/view', [PaymentController::class, 'show'])->name('payments.view');
        Route::get('/{payment}/pdf', [PaymentController::class, 'pdf'])->name('payments.pdf');
        Route::delete('/{id}', [PaymentController::class, 'destroy'])->name('payments.destroy');
    });
    //--------------------------------------------Clearing Cheque ------------------------------------------------
    Route::prefix('/clearing-cheque')->group(function () {
        Route::get('/', [ClearingChequeController::class, 'index'])->name('clearing_cheque.index');
        Route::get('/create', [ClearingChequeController::class, 'create'])->name('clearing_cheque.create');
        Route::post('/', [ClearingChequeController::class, 'store'])->name('clearing_cheque.store');
        Route::get('/{clearingCheque}/edit', [ClearingChequeController::class, 'edit'])->name('clearing_cheque.edit');
        Route::put('/{clearingCheque}', [ClearingChequeController::class, 'update'])->name('clearing_cheque.update');
        Route::delete('/{id}', [ClearingChequeController::class, 'destroy'])->name('clearing_cheque.destroy');
        Route::put('/{id}/clear', [ClearingChequeController::class, 'clear'])->name('clearing_cheque.clear');
        Route::put('/{id}/cancel', [ClearingChequeController::class, 'cancel'])->name('clearing_cheque.cancel');
    });

    //--------------------------------------------Journal Vouchers------------------------------------------------
    Route::prefix('/journal-vouchers')->group(function () {
        Route::get('/', [JournalVoucherController::class, 'index'])->name('journal-vouchers.index');
        Route::get('/create', [JournalVoucherController::class, 'create'])->name('journal-vouchers.create');
        Route::post('/', [JournalVoucherController::class, 'store'])->name('journal-vouchers.store');
        Route::delete('/{id}', [JournalVoucherController::class, 'destroy'])->name('journal-vouchers.destroy');
    });


    //--------------------------------------------Reports------------------------------------------------
    Route::prefix('/reports')->group(function () {
        Route::get('/', [ReportsController::class, 'index'])->name('reports.index');
        Route::get('/accounts/ledger', [ReportsController::class, 'accountLedger'])->name('reports.accounts.ledger');
        Route::get('/accounts/ledger/export/pdf', [ReportsController::class, 'accountLedgerExportPdf'])->name('reports.accounts.ledger.export.pdf');
        Route::get('/accounts/ledger/print', [ReportsController::class, 'accountLedgerPrint'])->name('reports.accounts.ledger.print');
        Route::get('/accounts/aging/export/pdf', [ReportsController::class, 'accountAgingExportPdf'])->name('reports.accounts.aging.export.pdf');
        Route::get('/accounts/aging/print', [ReportsController::class, 'accountAgingPrint'])->name('reports.accounts.aging.print');
        Route::get('/accounts/due-bills/export/pdf', [ReportsController::class, 'dueBillsExportPdf'])->name('reports.accounts.due_bills.export.pdf');
        Route::get('/accounts/due-bills/print', [ReportsController::class, 'dueBillsPrint'])->name('reports.accounts.due_bills.print');
        Route::get('/accounts/outstanding-billwise/export/pdf', [ReportsController::class, 'outstandingBillWiseExportPdf'])->name('reports.accounts.outstanding_billwise.export.pdf');
        Route::get('/accounts/outstanding-billwise/print', [ReportsController::class, 'outstandingBillWisePrint'])->name('reports.accounts.outstanding_billwise.print');
        Route::get('/accounts/day-book/export/pdf', [ReportsController::class, 'dayBookExportPdf'])->name('reports.accounts.day_book.export.pdf');
        Route::get('/accounts/day-book/print', [ReportsController::class, 'dayBookPrint'])->name('reports.accounts.day_book.print');
        Route::get('/accounts/payment-detail/export/pdf', [ReportsController::class, 'paymentDetailExportPdf'])->name('reports.accounts.payment_detail.export.pdf');
        Route::get('/accounts/payment-detail/print', [ReportsController::class, 'paymentDetailPrint'])->name('reports.accounts.payment_detail.print');
        Route::get('/accounts/receiving-detail/export/pdf', [ReportsController::class, 'receivingDetailExportPdf'])->name('reports.accounts.receiving_detail.export.pdf');
        Route::get('/accounts/receiving-detail/print', [ReportsController::class, 'receivingDetailPrint'])->name('reports.accounts.receiving_detail.print');
        
        Route::get('/accounts/receivable/export/pdf', [ReportsController::class, 'receivableExportPdf'])->name('reports.accounts.receivable.export.pdf');
        Route::get('/accounts/receivable/print', [ReportsController::class, 'receivablePrint'])->name('reports.accounts.receivable.print');
        
        Route::get('/accounts/payable/export/pdf', [ReportsController::class, 'payableExportPdf'])->name('reports.accounts.payable.export.pdf');
        Route::get('/accounts/payable/print', [ReportsController::class, 'payablePrint'])->name('reports.accounts.payable.print');
        
        Route::get('/accounts/roznamcha/export/pdf', [ReportsController::class, 'roznamchaExportPdf'])->name('reports.accounts.roznamcha.export.pdf');
        Route::get('/accounts/roznamcha/print', [ReportsController::class, 'roznamchaPrint'])->name('reports.accounts.roznamcha.print');
        
        Route::get('/accounts/summary/export/pdf', [ReportsController::class, 'summaryExportPdf'])->name('reports.accounts.summary.export.pdf');
        Route::get('/accounts/summary/print', [ReportsController::class, 'summaryPrint'])->name('reports.accounts.summary.print');
        
        Route::get('/accounts/trial-balance-2col/export/pdf', [ReportsController::class, 'trialBalance2ColExportPdf'])->name('reports.accounts.trial_balance_2col.export.pdf');
        Route::get('/accounts/trial-balance-2col/print', [ReportsController::class, 'trialBalance2ColPrint'])->name('reports.accounts.trial_balance_2col.print');
        
        Route::get('/accounts/trial-balance-6col/export/pdf', [ReportsController::class, 'trialBalance6ColExportPdf'])->name('reports.accounts.trial_balance_6col.export.pdf');
        Route::get('/accounts/trial-balance-6col/print', [ReportsController::class, 'trialBalance6ColPrint'])->name('reports.accounts.trial_balance_6col.print');
        
        // Stock Reports (Modularized Playground)
        Route::prefix('/stock')->group(function () {
            Route::get('/', [StockReportsController::class, 'index'])->name('reports.stock.index');
            Route::get('/data', [StockReportsController::class, 'data'])->name('reports.stock.data');
            Route::get('/export', [StockReportsController::class, 'exportPdf'])->name('reports.stock.export');
            Route::get('/excel', [StockReportsController::class, 'exportExcel'])->name('reports.stock.excel');
            Route::get('/print', [StockReportsController::class, 'exportPdf'])->name('reports.stock.print');
        });

        Route::get('/stock/status', [ReportsController::class, 'stockStatus'])->name('reports.stock.status');
        Route::get('/stock/ledger', [ReportsController::class, 'stockLedger'])->name('reports.stock.ledger');
        Route::get('/audit', [ReportsController::class, 'audit'])->name('reports.audit');
        Route::get('/purchase', [ReportsController::class, 'purchase'])->name('reports.purchase');
        Route::get('/purchase/export/pdf', [ReportsController::class, 'purchaseExportPdf'])->name('reports.purchase.export.pdf');
        Route::get('/purchase/export/excel', [ReportsController::class, 'purchaseExportExcel'])->name('reports.purchase.export.excel');
        // Purchase Return Reports (Modularized)
        Route::prefix('/purchase-return')->group(function () {
            Route::get('/', [PurchaseReturnReportsController::class, 'index'])->name('reports.purchase-return.index');
            Route::get('/data', [PurchaseReturnReportsController::class, 'getData'])->name('reports.purchase-return.data');
            Route::get('/export', [PurchaseReturnReportsController::class, 'exportPdf'])->name('reports.purchase-return.export');
            Route::get('/excel', [PurchaseReturnReportsController::class, 'exportExcel'])->name('reports.purchase-return.excel');
            Route::get('/print', [PurchaseReturnReportsController::class, 'print'])->name('reports.purchase-return.print');
        });

        // Old sales routes removed
        Route::get('/sales-return', [ReportsController::class, 'salesReturn'])->name('reports.sales-return');
        Route::get('/sales-return/export/pdf', [ReportsController::class, 'salesReturnExportPdf'])->name('reports.sales-return.export.pdf');
        Route::get('/sales-return/export/excel', [ReportsController::class, 'salesReturnExportExcel'])->name('reports.sales-return.export.excel');
        Route::get('/sales-map', [SalesMapReportController::class, 'index'])->name('reports.sales-map');
        Route::get('/sales-map/data', [SalesMapReportController::class, 'getData'])->name('reports.sales-map.data');
         // Purchase Reports (Modularized Playground)
         Route::prefix('/purchase')->group(function () {
              Route::get('/', [PurchaseReportsController::class, 'index'])->name('reports.purchase.index');
              Route::get('/data', [PurchaseReportsController::class, 'getData'])->name('reports.purchase.data');
              Route::get('/export', [PurchaseReportsController::class, 'exportPdf'])->name('reports.purchase.export');
              Route::get('/print', [PurchaseReportsController::class, 'print'])->name('reports.purchase.print');
              Route::get('/excel', [PurchaseReportsController::class, 'exportExcel'])->name('reports.purchase.excel');
         });

         // Profit Reports (Modularized)
         Route::prefix('/profit')->group(function () {
             Route::get('/', [ProfitReportsController::class, 'index'])->name('reports.profit.index');
             Route::get('/data', [ProfitReportsController::class, 'getData'])->name('reports.profit.data');
             Route::get('/export', [ProfitReportsController::class, 'exportPdf'])->name('reports.profit.export');
             Route::get('/print', [ProfitReportsController::class, 'print'])->name('reports.profit.print');
             Route::get('/excel', [ProfitReportsController::class, 'exportExcel'])->name('reports.profit.excel');
        });

        // Sales Reports (Modularized)
        Route::prefix('/sales')->group(function () {
            Route::get('/', [SalesReportsController::class, 'index'])->name('reports.sales');
            Route::get('/data', [SalesReportsController::class, 'getData'])->name('reports.sales.data');
            Route::get('/export', [SalesReportsController::class, 'exportPdf'])->name('reports.sales.export');
            Route::get('/excel', [SalesReportsController::class, 'exportExcel'])->name('reports.sales.excel');
            Route::get('/print', [SalesReportsController::class, 'exportPdf'])->name('reports.sales.print');
        });
    });

    // Payment Routes (Additional)
    Route::get('/payment', [App\Http\Controllers\PaymentController::class, 'index'])->name('payments.index');
    Route::get('/payment/create', [App\Http\Controllers\PaymentController::class, 'create'])->name('payment.create');
    Route::post('/payment/store', [App\Http\Controllers\PaymentController::class, 'store'])->name('payment.store');
    Route::get('/payment/unpaid-bills', [App\Http\Controllers\PaymentController::class, 'getUnpaidBills'])->name('payment.unpaid-bills');
    Route::get('/payment/next-cheque', [App\Http\Controllers\PaymentController::class, 'getNextCheque'])->name('payment.next-cheque');
    Route::get('/payment/available-cheques', [App\Http\Controllers\PaymentController::class, 'getAvailableCheques'])->name('payment.available-cheques');
    Route::get('/payment/available-customer-cheques', [App\Http\Controllers\PaymentController::class, 'getAvailableCustomerCheques'])->name('payment.available-customer-cheques');
    Route::get('/payment/bill-items', [App\Http\Controllers\PaymentController::class, 'getBillItems'])->name('payment.bill-items');

    // ============================================================================
    // INVESTOR PANEL ROUTES
    // ============================================================================
    Route::middleware(['role:investor'])->prefix('investor')->group(function () {
        Route::get('/dashboard', [InvestorDashboardController::class, 'index'])->name('investor.dashboard');
        Route::get('/profit/history', [InvestorDashboardController::class, 'profitHistory'])->name('investor.profit.history');
        Route::get('/transactions', [InvestorDashboardController::class, 'transactions'])->name('investor.transactions');
        Route::get('/requests', [InvestorRequestController::class, 'index'])->name('investor.requests');
        Route::get('/forecast', [InvestorForecastController::class, 'data'])->name('investor.forecast');
        
        Route::post('/requests/reinvest', [InvestorRequestController::class, 'reinvest'])->name('investor.requests.reinvest');
        Route::post('/requests/withdraw-profit', [InvestorRequestController::class, 'withdrawProfit'])->name('investor.requests.withdraw-profit');
        Route::post('/requests/withdraw-capital', [InvestorRequestController::class, 'withdrawCapital'])->name('investor.requests.withdraw-capital');
        Route::delete('/requests/{id}', [InvestorRequestController::class, 'cancel'])->name('investor.requests.cancel');
        Route::get('/transactions/export-pdf', [InvestorDashboardController::class, 'exportPdf'])->name('investor.transactions.export-pdf');
    });

    Route::middleware(['role:Admin'])->prefix('admin')->group(function () {
        Route::get('/investors', [InvestorManagementController::class, 'index'])->name('admin.investors.index');
        Route::post('/investors', [InvestorManagementController::class, 'store'])->name('admin.investors.store');
        Route::get('/investors/export-excel', [InvestorManagementController::class, 'exportExcel'])->name('admin.investors.export-excel');
        Route::get('/investors/{id}', [InvestorManagementController::class, 'show'])->name('admin.investors.show');
        Route::get('/investors/{id}/export-pdf', [InvestorManagementController::class, 'exportPdf'])->name('admin.investors.export-pdf');
        Route::post('/investors/{id}/adjust-capital', [InvestorManagementController::class, 'adjustCapital'])->name('admin.investors.adjust-capital');
        Route::post('/recalculate-ownership', [InvestorManagementController::class, 'recalculateOwnership'])->name('admin.recalculate-ownership');
        
        Route::post('/requests/{id}/approve', [InvestorManagementController::class, 'approveRequest'])->name('admin.requests.approve');
        Route::post('/requests/{id}/reject', [InvestorManagementController::class, 'rejectRequest'])->name('admin.requests.reject');
        
        Route::get('/profit/distribute', [ProfitDistributionController::class, 'index'])->name('admin.profit.distribute.index');
        Route::post('/profit/distribute/preview', [ProfitDistributionController::class, 'preview'])->name('admin.profit.distribute.preview');
        Route::post('/profit/distribute', [ProfitDistributionController::class, 'distribute'])->name('admin.profit.distribute.store');

        // Email Settings & Templates
        Route::prefix('settings')->group(function () {
            Route::get('/email', [EmailSettingsController::class, 'index'])->name('admin.settings.email');
            Route::post('/email', [EmailSettingsController::class, 'update'])->name('admin.settings.email.update');

            Route::get('/templates', [EmailTemplateController::class, 'index'])->name('admin.settings.templates.index');
            Route::get('/templates/{template}/edit', [EmailTemplateController::class, 'edit'])->name('admin.settings.templates.edit');
            Route::put('/templates/{template}', [EmailTemplateController::class, 'update'])->name('admin.settings.templates.update');
            Route::get('/templates/{template}/preview', [EmailTemplateController::class, 'preview'])->name('admin.settings.templates.preview');
        });
    });
});


// ============================================================================
// PUBLIC GUEST ROUTES
// ============================================================================
Route::prefix('g')->group(function () {
    Route::get('/{token}', [GuestController::class, 'dashboard'])->name('guest.dashboard');
    Route::get('/{token}/catalog', [GuestController::class, 'catalog'])->name('guest.catalog');
    Route::post('/{token}/order', [GuestController::class, 'placeOrder'])->name('guest.order');
    
    // Details & Slips
    Route::get('/{token}/invoice/{invoice}', [GuestController::class, 'orderDetail'])->name('guest.order-detail');
    Route::get('/{token}/receipt/{voucher}', [GuestController::class, 'paymentDetail'])->name('guest.payment-detail');
    Route::get('/{token}/invoice/{invoice}/pdf', [GuestController::class, 'invoicePdf'])->name('guest.invoice-pdf');
    Route::get('/{token}/receipt/{voucher}/pdf', [GuestController::class, 'receiptPdf'])->name('guest.payment-pdf');
});

// ============================================================================
// LIVE OFFER PUBLIC ROUTES
// ============================================================================
Route::get('/live-offers', [App\Http\Controllers\PublicOfferController::class, 'index'])->name('public.live-offers');
Route::post('/api/access-my-offer', [App\Http\Controllers\PublicOfferController::class, 'accessMyOffer'])->name('public.access-my-offer');

require __DIR__ . '/settings.php';
