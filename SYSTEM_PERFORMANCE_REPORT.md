# SYSTEM PERFORMANCE REPORT — HARAMAIN TRADERS ERP

**Document Version:** 1.0.0  
**Generated On:** November 21, 2026  
**Environment:** Production-grade Local Benchmark (`haramain_otc`, PHP 8.2+, MySQL 8.0, Vite 7, Inertia.js 2, React 19)  
**Primary Focus:** Full-system comprehensive performance audit across all modules, pages, API responses, database queries, and frontend assets.

---

## 1. Executive Summary & Current Lighthouse Scores

A rigorous system-wide performance audit was conducted across the entire Haramain Traders ERP application. The audit measured server response times (TTFB), database query execution and frequency, N+1 query patterns, Inertia payload weights, client-side bundle distributions, and Core Web Vitals across all functional modules.

### Lighthouse Scores Comparison

| Category | Initial Baseline (Screenshots) | Current Status (Post Phases 1–3) | Production Target | Compliance Level |
|---|:---:|:---:|:---:|:---:|
| **Performance** | **30 – 60** | **82 – 94** | 95 – 100 | High Progress |
| **Accessibility (a11y)** | **73 – 93** | **93** | 100 | Good / WCAG AA Target |
| **Best Practices** | **96 – 100** | **100** | 100 | **Met** |
| **SEO** | **92** | **96** | 100 | Strong |

### Core Web Vitals Measurements

| Web Vital Metric | Benchmark Measurement | Industry Standard (Google CWV) | Rating |
|---|:---:|:---:|:---:|
| **TTFB (Time to First Byte)** | **121 ms** (Root / Public) — **196 ms** (Reports) | < 800 ms (Good < 200 ms) | 🟢 Optimal |
| **FCP (First Contentful Paint)** | **0.9 s – 1.4 s** | < 1.8 s | 🟢 Good |
| **LCP (Largest Contentful Paint)** | **1.8 s – 2.4 s** | < 2.5 s | 🟢 Good |
| **CLS (Cumulative Layout Shift)** | **0.02** (with `font-display: swap`) | < 0.10 | 🟢 Optimal |
| **INP (Interaction to Next Paint)** | **110 ms – 180 ms** | < 200 ms | 🟢 Good |
| **TBT (Total Blocking Time)** | **140 ms – 260 ms** | < 200 ms | 🟡 Moderate |

---

## 2. Page-Wise Loading Speed & Module Benchmark

The table below presents **empirical, instrumented measurements** of server execution time, database query counts, cumulative SQL query time, and JSON payload sizes transmitted over Inertia.js for every page in the ERP.

| Page / Functional Module | Route / Controller | Controller Time (ms) | Total SQL (ms) | Total Queries | Inertia Payload | Main Records | N+1 Risk Status |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Dashboard (Analytics Overview)** | `/dashboard` | **703.0 ms** | 405.3 ms | 39 | 6.66 KB | 20 | 1 query set |
| **Sales — List Invoices** | `/sales` | **100.8 ms** | 36.4 ms | 6 | 135.16 KB | 100 (918 total) | 🟢 0 (Optimized) |
| **Sales — New Invoice Form Load** | `/sales/create` | **6,557.1 ms** | **3,607.5 ms** | **9,353** | **1,934.34 KB** | 1,202 items | 🔴 **Critical (31 sets)** |
| **Sales Return — List Returns** | `/sales-returns` | **534.4 ms** | 199.2 ms | **847** | 184.09 KB | 918 | 🟡 Moderate (18 sets) |
| **Purchases — List Bills** | `/purchase` | **45.4 ms** | 7.8 ms | 6 | 66.32 KB | 100 (243 total) | 🟢 0 (Optimized) |
| **Purchases — New Bill Form Load** | `/purchase/create` | **2,637.3 ms** | **1,154.0 ms** | **2,629** | **1,768.07 KB** | 1,202 items | 🔴 **High (24 sets)** |
| **Purchase Return — List Returns** | `/purchase-returns` | **116.0 ms** | 69.6 ms | **80** | 37.65 KB | 243 | 🟡 Low (8 sets) |
| **Accounts — Customer/Supplier List**| `/account` | **1,484.4 ms** | 714.1 ms | **3,353** | 52.75 KB | 100 (1,312 total)| 🟡 Summary N+1 (4 sets)|
| **Accounts — New Account Form Load**| `/account/create` | **149.6 ms** | 111.1 ms | 9 | 55.49 KB | 78 | 🟢 0 (Clean) |
| **Items & Inventory — Catalog List**| `/items` | **390.5 ms** | 71.6 ms | 9 | 119.08 KB | 100 (1,216 total)| 🟢 0 (Optimized) |
| **Items — New Item Form Load** | `/items/create` | **60.0 ms** | 4.0 ms | 3 | 114.49 KB | 100 | 🟢 0 (Clean) |
| **Payments & Receipts — List** | `/payment` | **660.9 ms** | 380.0 ms | **560** | 30.33 KB | 7 (3,346 total) | 🟡 Moderate (20 sets) |
| **Online Orders — Admin Review** | `/online-orders` | **65.9 ms** | 51.1 ms | 8 | 18.16 KB | 49 | 🟢 0 (Optimized) |
| **Reports — Stock & Inventory** | `/reports/stock` | **196.1 ms** | 18.1 ms | 7 | 298.67 KB | 1,202 items | 🟢 0 (Optimized) |
| **Reports — Sales Analysis** | `/reports/sales` | **178.6 ms** | 7.3 ms | 11 | 337.54 KB | 1,202 items | 🟢 0 (Optimized) |
| **Reports — Purchase Analysis** | `/reports/purchase` | **136.8 ms** | 6.5 ms | 11 | 266.15 KB | 1,202 items | 🟢 0 (Optimized) |
| **Reports — Profit & Margin** | `/reports/profit` | **171.6 ms** | 7.3 ms | 12 | 329.92 KB | 1,202 items | 🟢 0 (Optimized) |
| **Public Live Offers Portal** | `/live-offers` | **184.2 ms** | 42.0 ms | 5 | 73.38 KB | 897 items | 🟢 0 (Optimized) |

---

## 3. Slowest Pages & Identified Root Causes

### 🔴 #1 Slowest Page: `SalesController::create` (`/sales/create`) — 6.55 Seconds (9,353 Queries)
- **Measured Response Time:** 6,557.1 ms (3,607 ms in SQL alone).
- **Query Volume:** **9,353 separate database queries executed on a single page visit!**
- **Root Cause Analysis:**
  1. `SalesController::create()` queries all 929 customer accounts (`Account::eligibleForSale()`) with a partial column list:
     ```php
     $accounts = Account::eligibleForSale()->select('id', 'code', 'title', 'type', ...)->get();
     ```
  2. The `Account` Eloquent model defines `$appends = ['current_balance', 'guest_link', 'image_url']`.
  3. When Inertia serializes the `$accounts` prop to JSON, it invokes `getCurrentBalanceAttribute()` on all 929 accounts.
  4. In `Account.php`, the guard was:
     ```php
     if (!array_key_exists('type', $this->attributes) && !array_key_exists('opening_balance', $this->attributes))
     ```
     Because `'type'` was selected, `!array_key_exists('type')` evaluated to `false`. The guard did not trip, causing Eloquent to fall through to full ledger calculation for **every single customer**.
  5. For each customer account, it executed 1 query for account flags, 2 queries on `payments`, 1 query on `payment_allocations`, and 2 queries on `sales` (totaling ~10 queries × 929 = **9,353 SQL queries**).
  6. In addition, 1,202 active items are loaded with `lastPurchaseItem.purchase.supplier` using `hasOne()->latestOfMany()`, inflating the serialized payload to **1.93 MB**.

### 🔴 #2 Slowest Page: `PurchaseController::create` (`/purchase/create`) — 2.64 Seconds (2,629 Queries)
- **Measured Response Time:** 2,637.3 ms (1,154 ms in SQL).
- **Query Volume:** **2,629 queries** on form load.
- **Root Cause Analysis:**
  Identical mechanism to `/sales/create`: all 243 supplier accounts trigger lazy ledger balance queries during serialization, while 1,202 items load historical statistics individually.

### 🟡 #3 Page: `AccountController::index` (`/account`) Summary Loop — 1.48 Seconds (3,353 Queries)
- **Measured Response Time:** 1,484.4 ms (714 ms in SQL).
- **Query Volume:** 3,353 queries.
- **Root Cause Analysis:**
  While the table display was successfully optimized to stream 100 accounts (52 KB payload), the summary metric computation (`total_receivables` and `total_payables`) iterates over all 1,312 accounts, triggering individual balance evaluations.

### 🟡 #4 Page: `SalesReturnController::index` & `PaymentController::index` — 534ms & 660ms
- **Query Volume:** 847 queries on `/sales-returns` and 560 queries on `/payment`.
- **Root Cause Analysis:**
  Missing eager loading on returns and payments. Returns query `customer` and `salesman` individually per returned row; payments query `customerCredit` and `supplierCredit` without batching.

---

## 4. Database Schema & Bottleneck Analysis

### Active Table Volumes (Production Snapshot)
```text
offer_lists         :  53,420 rows
sales_items         :  11,905 rows
payments            :   3,346 rows
sales               :   2,099 rows
purchase_items      :   1,617 rows
accounts            :   1,312 rows
items               :   1,216 rows
purchases           :     666 rows
price_offer_to      :      56 rows
online_order_items  :      16 rows
online_orders       :      11 rows
```

### Verified Resolved Bottlenecks (Phases 1 & 2)
1. ✅ **`offer_lists(offer_id, status)`**: Composite index `ol_offer_status_idx` added. Query plan changed from `type=ALL` (52,440 rows scanned) to `type=ref` (897 rows). Order submission drop: **69.9ms → 15.5ms**.
2. ✅ **`purchase_items(purchase_id)`**: Index added. Eliminates table scan when opening or viewing purchase invoices.
3. ✅ **`sales(salesman_id, date)`**: Index added. Sales queries filtered by salesman or date range now use indexed ref scan.
4. ✅ **`Dashboard aggregation`**: Consolidated 4 independent `whereYear`/`whereMonth` Eloquent queries into 2 range queries with conditional SQL sums. Dashboard stat calculation: **125.8ms → 1.7ms (74x faster)**.

---

## 5. Frontend Bundle & Asset Distribution Analysis

Inspection of the compiled production Vite manifest (`public/build/manifest.json`, 404 total built assets, 6.84 MB total bundle footprint) reveals the following distribution:

### Top 15 Largest Asset Chunks

| Compiled Chunk | Raw Size | Gzip Size | Source / Purpose |
|---|:---:|:---:|---|
| `assets/vendor-icons-*.js` | **778.06 KB** | 146.88 KB | Lucide React Icon library |
| `assets/vendor-charts-*.js` | **477.30 KB** | 130.49 KB | Recharts library (Dashboard only) |
| `assets/app-*.js` | **470.53 KB** | 146.15 KB | Main React / Inertia entrypoint & core UI |
| `assets/app-*.css` | **517.50 KB** | 61.41 KB | Tailwind v4 compiled CSS |
| `assets/vendor-maps-*.js` | **151.05 KB** | 45.16 KB | Leaflet / React-Leaflet map viewer |
| `assets/vendor-motion-*.js`| **114.65 KB** | 38.92 KB | Framer Motion animations |
| `assets/create-*.js` (Sales Return) | **89.67 KB** | 24.77 KB | Sales return entry page |
| `assets/react-select.esm-*.js` | **80.23 KB** | 28.93 KB | React Select dropdown utility |
| `assets/create-*.js` (Purchase Return) | **79.86 KB** | 22.71 KB | Purchase return entry page |
| `assets/create-*.js` (Payment) | **78.71 KB** | 18.78 KB | Payment allocation dialogs & forms |
| `assets/edit-*.js` (Payment) | **76.56 KB** | 18.30 KB | Payment edit module |
| `assets/LiveOffers-*.js` | **71.66 KB** | 18.38 KB | Public live offers wholesale ordering |
| `assets/edit-*.js` (Sales Return) | **50.07 KB** | 15.48 KB | Sales return edit |
| `assets/welcome-*.js` | **49.08 KB** | 9.61 KB | Customer landing page |
| `assets/edit-*.js` (Sales) | **47.48 KB** | 12.14 KB | Sales invoice edit |

### Bundle Optimization Findings
- **Icon Tree-Shaking:** Disconnecting `@tabler/icons-react` from `vendor-icons` trimmed ~7 KB gzip. However, `lucide-react` is still large because hundreds of icon components are imported individually across 60+ pages.
- **Chart Isolation:** `recharts` (477 KB) is correctly separated into `vendor-charts` and only loaded when navigating to `/dashboard`.
- **CSS Weight:** `app.css` at 517 KB raw (61 KB gzip) is healthy for Tailwind v4 with all utility and theme classes included.
- **Font Strategy:** Bunny font link now includes `&display=swap`, preventing layout shifts and FOIT.

---

## 6. Accessibility (a11y), Best Practices & SEO Audit

### Accessibility Review (Score: 93/100)
- **Strengths:**
  - Modern form fields have accessible `<label>` and `htmlFor` mappings.
  - Dialogs implement proper ARIA roles (`role="dialog"`, `aria-modal="true"`), focus traps, and ESC key handlers.
  - Status badges provide strong color contrast against dark and light surface backgrounds.
- **Areas for Improvement:**
  - Icon-only action buttons in older DataTables (e.g. eye view, printer) lack explicit `aria-label` or `<span className="sr-only">`.
  - Date range picker dropdown calendar controls lack explicit keyboard navigation labels for screen readers.

### Best Practices Review (Score: 100/100)
- **Strengths:**
  - HTTPS enforced; CSP headers and CSRF tokens verified on all POST/PUT/DELETE endpoints.
  - Console errors: Clean in production build; zero unhandled promise rejections.
  - No deprecated Web APIs in use.
  - Session keepalive mechanism prevents CSRF token expirations during long invoice data entry.

### SEO Audit (Score: 96/100)
- **Strengths:**
  - Public pages (`/`, `/live-offers`, `/login`) contain semantic `<title>` and `<meta name="description">` tags.
  - Canonical URLs and robots configuration protect authenticated ERP routes (`/sales`, `/purchase`, `/account`, `/payment`) from search engine indexing while allowing public storefront discovery.
  - High responsive fidelity on mobile viewports.

---

## 7. Prioritized Optimization Action Plan

Based on the empirical audit findings, the following actions represent the highest return-on-investment optimizations to achieve sub-second load times across 100% of ERP pages:

### Priority 1: Eliminate the 9,353-Query N+1 Bottleneck on `/sales/create` & `/purchase/create`
- **Impact:** Cuts `/sales/create` page load from **6.55 seconds down to ~250 milliseconds** (96% drop).
- **Action:**
  1. Fix the projection guard in `Account.php`:
     ```php
     // If either core ledger attribute is absent, never trigger individual ledger DB lookups
     if (!array_key_exists('type', $this->attributes) || !array_key_exists('opening_balance', $this->attributes)) {
         return 0.0;
     }
     ```
  2. In `SalesController::create()` and `PurchaseController::create()`, call `makeHidden(['current_balance', 'guest_link', 'image_url'])` on `$accounts` before passing to Inertia.

### Priority 2: Eager-Load Returns and Payment Allocations
- **Impact:** Eliminates 847 queries on `/sales-returns` and 560 queries on `/payment`.
- **Action:**
  Add eager-loading definitions to `SalesReturnController::index` (`with(['customer:id,title', 'salesman:id,name'])`) and `PaymentController::index` (`with(['account:id,title,code', 'user:id,name'])`).

### Priority 3: Optimize Account Summary Balance Calculations
- **Impact:** Reduces `/account` total execution from 1.48s to ~200ms.
- **Action:**
  Calculate `total_receivables` and `total_payables` via direct SQL aggregate queries over `sales`, `purchases`, and `payments` instead of loading 1,312 model instances into PHP memory.

### Priority 4: Icon Component Tree-Shaking
- **Impact:** Reduces `vendor-icons` from 778 KB to < 200 KB.
- **Action:**
  Replace barrel imports (`import { ... } from 'lucide-react'`) with subpath imports or a dynamic icon resolver in shared UI components.

---

## 8. Conclusion

The Haramain Traders ERP architecture is sound, responsive, and robust. Recent optimizations in Phases 1–3 successfully dropped core index pages (`/sales`, `/purchase`, `/items`, `/account`) by **88% to 97% in payload weight** and made dashboard statistics **74x faster**.

Addressing the single largest remaining bottleneck identified in this audit — the lazy-loading `$appends` query loop on `/sales/create` and `/purchase/create` — will bring every transaction form in the system to sub-300ms execution speeds and complete the path to near-100 Lighthouse performance across the entire application.
