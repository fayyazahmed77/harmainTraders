<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AccountController;
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
        Route::post('/', [SalemanController::class, 'store'])->name('salemen.store');
        Route::put('/{salemen}', [SalemanController::class, 'update'])->name('salemen.update');
        Route::delete('/{id}', [SalemanController::class, 'destroy'])->name('salemen.destroy');
    });
    //---------------------Booker------------------------------------------------------------------
    Route::prefix('/bookers')->group(function () {
        Route::get('/', [BookerController::class, 'index'])->name('bookers.index');
        Route::post('/', [BookerController::class, 'store'])->name('bookers.store');
        Route::put('/{booker}', [BookerController::class, 'update'])->name('bookers.update');
        Route::delete('/{id}', [BookerController::class, 'destroy'])->name('bookers.destroy');
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
        Route::get('/{items}/edit', [ItemsController::class, 'edit'])->name('items.edit');
        Route::get('/{items}/show', [ItemsController::class, 'show'])->name('items.show');
        Route::put('/{items}', [ItemsController::class, 'update'])->name('items.update');
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
        Route::get('/{sale}/download', [SalesController::class, 'download'])->name('sale.download');
        Route::put('/{sale}', [SalesController::class, 'update'])->name('sale.update');
        Route::delete('/{id}', [SalesController::class, 'destroy'])->name('sale.destroy');
    });

    //--------------------------------------------Sales Return-----------------------------------------------
    Route::prefix('/sales-return')->group(function () {
        Route::get('/', [SalesReturnController::class, 'index'])->name('sales_return.index');
        Route::get('/create', [SalesReturnController::class, 'create'])->name('sales_return.create');
        Route::post('/', [SalesReturnController::class, 'store'])->name('sales_return.store');
        Route::get('/{salesReturn}/edit', [SalesReturnController::class, 'edit'])->name('sales_return.edit');
        Route::put('/{salesReturn}', [SalesReturnController::class, 'update'])->name('sales_return.update');
        Route::delete('/{id}', [SalesReturnController::class, 'destroy'])->name('sales_return.destroy');
        Route::get('/customer/{customerId}/purchased-items', [SalesReturnController::class, 'getCustomerPurchasedItems'])->name('sales_return.customer_items');
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
        Route::delete('/{id}', [PurchaseReturnController::class, 'destroy'])->name('purchase_return.destroy');
        Route::get('/supplier/{supplierId}/purchased-items', [PurchaseReturnController::class, 'getSupplierPurchasedItems'])->name('purchase_return.supplier_items');
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

    //--------------------------------------------Reports------------------------------------------------
    Route::prefix('/reports')->group(function () {
        Route::get('/', [ReportsController::class, 'index'])->name('reports.index');
        Route::get('/accounts/ledger', [ReportsController::class, 'accountLedger'])->name('reports.accounts.ledger');
        Route::get('/accounts/ledger/export/pdf', [ReportsController::class, 'accountLedgerExportPdf'])->name('reports.accounts.ledger.export.pdf');
        Route::get('/accounts/ledger/print', [ReportsController::class, 'accountLedgerPrint'])->name('reports.accounts.ledger.print');
        Route::get('/stock/status', [ReportsController::class, 'stockStatus'])->name('reports.stock.status');
        Route::get('/stock/ledger', [ReportsController::class, 'stockLedger'])->name('reports.stock.ledger');
        Route::get('/profit', [ReportsController::class, 'profit'])->name('reports.profit');
        Route::get('/audit', [ReportsController::class, 'audit'])->name('reports.audit');
        Route::get('/purchase', [ReportsController::class, 'purchase'])->name('reports.purchase');
        Route::get('/purchase/export/pdf', [ReportsController::class, 'purchaseExportPdf'])->name('reports.purchase.export.pdf');
        Route::get('/purchase/export/excel', [ReportsController::class, 'purchaseExportExcel'])->name('reports.purchase.export.excel');
        Route::get('/purchase-return', [ReportsController::class, 'purchaseReturn'])->name('reports.purchase-return');
        Route::get('/purchase-return/export/pdf', [ReportsController::class, 'purchaseReturnExportPdf'])->name('reports.purchase-return.export.pdf');
        Route::get('/purchase-return/export/excel', [ReportsController::class, 'purchaseReturnExportExcel'])->name('reports.purchase-return.export.excel');
        Route::get('/sales', [ReportsController::class, 'sales'])->name('reports.sales');
        Route::get('/sales/export/pdf', [ReportsController::class, 'salesExportPdf'])->name('reports.sales.export.pdf');
        Route::get('/sales/export/excel', [ReportsController::class, 'salesExportExcel'])->name('reports.sales.export.excel');
        Route::get('/sales-return', [ReportsController::class, 'salesReturn'])->name('reports.sales-return');
        Route::get('/sales-return/export/pdf', [ReportsController::class, 'salesReturnExportPdf'])->name('reports.sales-return.export.pdf');
        Route::get('/sales-return/export/excel', [ReportsController::class, 'salesReturnExportExcel'])->name('reports.sales-return.export.excel');
    });

    // Payment Routes (Additional)
    Route::get('/payment', [App\Http\Controllers\PaymentController::class, 'index'])->name('payments.index');
    Route::get('/payment/create', [App\Http\Controllers\PaymentController::class, 'create'])->name('payment.create');
    Route::post('/payment/store', [App\Http\Controllers\PaymentController::class, 'store'])->name('payment.store');
    Route::get('/payment/unpaid-bills', [App\Http\Controllers\PaymentController::class, 'getUnpaidBills'])->name('payment.unpaid-bills');
    Route::get('/payment/next-cheque', [App\Http\Controllers\PaymentController::class, 'getNextCheque'])->name('payment.next-cheque');
});

require __DIR__ . '/settings.php';
