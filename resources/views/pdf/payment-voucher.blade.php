<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $payment->voucher_no }}</title>
    <style>
        /* ── RESET & BASE ── */
        @page {
            margin: 0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 13px;
            font-weight: 400;
            color: #1a1a2e;
            line-height: 1.5;
            background: #ffffff;
        }

        /* ── COLOR TOKENS ── */
        /* Page bg: #f0f0ed (not used in PDF — white base) */
        /* Voucher bg: #ffffff */
        /* Header bg: #1a2b4a */
        /* Header text: #ffffff */
        /* Header muted: #8fa3c0 */
        /* Accent orange: #e07b1a */
        /* Body text: #1a1a2e */
        /* Muted text: #666666 */
        /* Label text: #aaaaaa */
        /* Divider: #eeeeee */
        /* Surface bg: #f8f9fc */
        /* Border light: #e5eaf5 */
        /* Status bar bg: #f0f4fa */

        /* ── VOUCHER CONTAINER ── */
        .voucher {
            width: 100%;
            margin: 0;
            padding: 0;
            background: #ffffff;
            overflow: hidden;
        }

        /* ── HEADER BAND ── */
        .header-band {
            background-color: #1a2b4a;
            padding: 28px 36px;
            display: table;
            width: 100%;
        }

        .header-left {
            display: table-cell;
            vertical-align: top;
            width: 50%;
        }

        .header-right {
            display: table-cell;
            vertical-align: top;
            text-align: right;
            width: 50%;
        }

        .logo-row {
            display: table;
        }

        .logo-tile {
            display: table-cell;
            vertical-align: middle;
            width: 44px;
            height: 44px;
            background-color: #e07b1a;
            border-radius: 8px;
            text-align: center;
            color: #ffffff;
            font-size: 18px;
            font-weight: 500;
            line-height: 44px;
        }

        .logo-text {
            display: table-cell;
            vertical-align: middle;
            padding-left: 12px;
        }

        .company-name {
            font-size: 15px;
            font-weight: 500;
            color: #ffffff;
            line-height: 1.2;
        }

        .company-tagline {
            font-size: 11px;
            color: #8fa3c0;
            font-weight: 400;
            margin-top: 2px;
        }

        .voucher-title {
            font-size: 20px;
            font-weight: 500;
            color: #ffffff;
            line-height: 1;
        }

        .voucher-subtitle {
            font-size: 11px;
            color: #8fa3c0;
            font-weight: 400;
            margin-top: 2px;
        }

        .voucher-number {
            font-size: 13px;
            font-weight: 500;
            color: #e07b1a;
            margin-top: 6px;
        }

        .voucher-date {
            font-size: 11px;
            color: #8fa3c0;
            font-weight: 400;
            margin-top: 2px;
        }

        /* ── STATUS BAR ── */
        .status-bar {
            background-color: #f0f4fa;
            border-bottom: 0.5px solid #e0e8f0;
            padding: 10px 36px;
            display: table;
            width: 100%;
        }

        .status-left {
            display: table-cell;
            vertical-align: middle;
            width: 50%;
        }

        .status-right {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            width: 50%;
            font-size: 11px;
            color: #888888;
            font-weight: 400;
        }

        .status-pill {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
        }

        .status-pending {
            background-color: #fef3c7;
            color: #92400e;
        }

        .status-received {
            background-color: #d1fae5;
            color: #065f46;
        }

        .status-bounced {
            background-color: #fee2e2;
            color: #991b1b;
        }

        .status-dot {
            display: inline-block;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            margin-right: 5px;
            vertical-align: middle;
        }

        .dot-pending { background-color: #f59e0b; }
        .dot-received { background-color: #10b981; }
        .dot-bounced { background-color: #ef4444; }

        /* ── VOUCHER BODY ── */
        .voucher-body {
            padding: 32px 36px;
        }

        /* ── SECTION LABEL ── */
        .section-label {
            font-size: 10px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #888888;
            border-bottom: 0.5px solid #eeeeee;
            padding-bottom: 6px;
            margin-bottom: 10px;
        }

        /* ── FIELD LABEL + VALUE ── */
        .field-label {
            font-size: 10px;
            font-weight: 400;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #aaaaaa;
            margin-bottom: 1px;
        }

        .field-value {
            font-size: 13px;
            font-weight: 500;
            color: #1a1a2e;
        }

        .field-value-muted {
            font-size: 13px;
            font-weight: 400;
            color: #666666;
        }

        .field-value-placeholder {
            font-size: 13px;
            font-weight: 400;
            color: #aaaaaa;
            font-style: italic;
        }

        .field-value-primary {
            font-size: 16px;
            font-weight: 500;
            color: #1a2b4a;
        }

        .field-group {
            margin-bottom: 10px;
        }

        /* ── TWO-COLUMN DETAILS GRID ── */
        .details-grid {
            display: table;
            width: 100%;
            margin-bottom: 24px;
        }

        .details-col {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }

        .details-col-right {
            padding-left: 24px;
        }

        .payment-fields {
            display: table;
            width: 100%;
        }

        .payment-field-row {
            display: table-row;
        }

        .payment-field-cell {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-bottom: 10px;
        }

        /* ── AMOUNT BAND ── */
        .amount-band {
            background-color: #f8f9fc;
            border: 0.5px solid #e5eaf5;
            border-radius: 8px;
            padding: 18px 24px;
            margin-bottom: 24px;
            display: table;
            width: 100%;
            position: relative;
        }

        .amount-left {
            display: table-cell;
            vertical-align: middle;
            width: 60%;
        }

        .amount-right {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            width: 40%;
        }

        .amount-heading {
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888888;
        }

        .amount-words {
            font-size: 11px;
            color: #aaaaaa;
            font-style: italic;
            font-weight: 400;
            margin-top: 4px;
        }

        .amount-currency {
            font-size: 11px;
            color: #aaaaaa;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 400;
            margin-bottom: 4px;
        }

        .amount-number {
            font-size: 28px;
            font-weight: 500;
            color: #1a2b4a;
            line-height: 1;
        }

        /* ── ALLOCATION TABLE ── */
        .alloc-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 24px;
        }

        .alloc-table thead th {
            font-size: 10px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888888;
            background-color: #f5f7fb;
            padding: 8px 12px;
            text-align: left;
            border: none;
        }

        .alloc-table thead th.text-right {
            text-align: right;
        }

        .alloc-table tbody td {
            padding: 10px 12px;
            border-bottom: 0.5px solid #f0f0f0;
            font-size: 12px;
            font-weight: 400;
            color: #888888;
        }

        .alloc-table tbody td.col-num {
            color: #aaaaaa;
            font-size: 11px;
            width: 40px;
        }

        .alloc-table tbody td.col-ref-primary {
            font-weight: 500;
            color: #1a2b4a;
            font-size: 12px;
        }

        .alloc-table tbody td.col-ref-secondary {
            color: #aaaaaa;
            font-size: 10px;
            font-weight: 400;
        }

        .alloc-table tbody td.col-amount {
            text-align: right;
            color: #555555;
        }

        .alloc-table tbody td.col-applied {
            text-align: right;
            font-weight: 500;
            color: #1a2b4a;
        }

        .alloc-table tfoot td {
            padding: 10px 12px;
            background-color: #f5f7fb;
            border-top: 0.5px solid #dde3f0;
            font-size: 11px;
            color: #888888;
            font-weight: 400;
        }

        .alloc-table tfoot td.total-value {
            text-align: right;
            font-size: 12px;
            font-weight: 500;
            color: #1a2b4a;
        }

        /* ── REMARKS BOX ── */
        .remarks-box {
            background-color: #f8f9fc;
            border: 0.5px solid #eeeeee;
            border-radius: 6px;
            padding: 10px 14px;
            min-height: 44px;
            margin-bottom: 24px;
        }

        .remarks-text {
            font-size: 12px;
            color: #1a1a2e;
            font-weight: 400;
        }

        .remarks-placeholder {
            font-size: 12px;
            color: #aaaaaa;
            font-style: italic;
            font-weight: 400;
        }

        /* ── SIGNATURES ── */
        .signatures-grid {
            display: table;
            width: 100%;
            margin-top: 8px;
            margin-bottom: 24px;
        }

        .sig-cell {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            vertical-align: bottom;
            padding: 0 12px;
        }

        .sig-name {
            font-size: 11px;
            color: #555555;
            font-weight: 400;
            padding-bottom: 4px;
            height: 36px;
            line-height: 36px;
        }

        .sig-line {
            width: 100%;
            height: 1px;
            background-color: #dddddd;
        }

        .sig-label {
            font-size: 10px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #aaaaaa;
            margin-top: 6px;
        }

        /* ── FOOTER ── */
        .voucher-footer {
            background-color: #f8f9fc;
            border-top: 0.5px solid #e8ecf5;
            padding: 18px 36px;
            display: table;
            width: 100%;
        }

        .footer-left {
            display: table-cell;
            vertical-align: middle;
            width: 65%;
        }

        .footer-right {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            width: 35%;
        }

        .contact-item {
            display: inline-block;
            margin-right: 18px;
            font-size: 11px;
            color: #888888;
            font-weight: 400;
        }

        .contact-icon {
            display: inline-block;
            width: 12px;
            height: 12px;
            margin-right: 4px;
            vertical-align: middle;
            fill: none;
            stroke: #1a2b4a;
            stroke-width: 1.5;
        }

        .footer-note {
            font-size: 10px;
            color: #bbbbbb;
            font-weight: 400;
            line-height: 1.5;
        }

        /* ── WATERMARK ── */
        .watermark-container {
            position: fixed;
            top: 40%;
            left: 15%;
            width: 70%;
            text-align: center;
            z-index: 0;
            pointer-events: none;
        }

        .watermark-text {
            font-size: 72px;
            font-weight: 500;
            letter-spacing: 8px;
            color: rgba(0, 80, 0, 0.03);
            text-transform: uppercase;
            transform: rotate(-30deg);
            -webkit-transform: rotate(-30deg);
        }
    </style>
</head>

<body>
    {{-- Watermark --}}
    <div class="watermark-container">
        <div class="watermark-text">
            @if(strtolower($payment->status ?? 'pending') === 'received')
                RECEIVED
            @elseif(strtolower($payment->status ?? 'pending') === 'bounced')
                BOUNCED
            @else
                PENDING
            @endif
        </div>
    </div>

    <div class="voucher">
        {{-- ═══ HEADER BAND ═══ --}}
        <div class="header-band">
            <div class="header-left">
                <div class="logo-row">
                    <div class="logo-tile">H</div>
                    <div class="logo-text">
                        <div class="company-name">Harmain Traders</div>
                        <div class="company-tagline">Wholesale &amp; Supply Chain</div>
                    </div>
                </div>
            </div>
            <div class="header-right">
                <div class="voucher-title">Payment Voucher</div>
                <div class="voucher-subtitle">{{ $payment->type === 'RECEIPT' ? 'Receipt Voucher' : 'Payment Voucher' }}</div>
                <div class="voucher-number">{{ $payment->voucher_no }}</div>
                <div class="voucher-date">Date: {{ \Carbon\Carbon::parse($payment->date)->format('d M Y') }}</div>
            </div>
        </div>

        {{-- ═══ STATUS BAR ═══ --}}
        <div class="status-bar">
            <div class="status-left">
                @php $statusLower = strtolower($payment->status ?? 'pending'); @endphp
                @if($statusLower === 'pending')
                    <span class="status-pill status-pending">
                        <span class="status-dot dot-pending"></span>Pending clearance
                    </span>
                @elseif($statusLower === 'received')
                    <span class="status-pill status-received">
                        <span class="status-dot dot-received"></span>Received
                    </span>
                @elseif($statusLower === 'bounced')
                    <span class="status-pill status-bounced">
                        <span class="status-dot dot-bounced"></span>Bounced
                    </span>
                @else
                    <span class="status-pill status-pending">
                        <span class="status-dot dot-pending"></span>{{ ucfirst($payment->status ?? 'Pending') }}
                    </span>
                @endif
            </div>
            <div class="status-right">
                {{ $payment->payment_method ?: 'Cash' }}
                &middot;
                {{ $payment->cheque_no ?: 'N/A' }}
                &middot;
                {{ $payment->paymentAccount ? $payment->paymentAccount->title : 'Cash' }} Account
            </div>
        </div>

        {{-- ═══ VOUCHER BODY ═══ --}}
        <div class="voucher-body">

            {{-- ── SECTION A: RECEIVED FROM + PAYMENT DETAILS ── --}}
            <div class="details-grid">
                {{-- Left Column --}}
                <div class="details-col">
                    <div class="section-label">{{ $payment->type === 'RECEIPT' ? 'Received From' : 'Paid To' }}</div>
                    <div class="field-group">
                        <div class="field-label">Party Name</div>
                        <div class="field-value-primary">{{ $payment->account->title }}</div>
                    </div>
                    <div class="field-group">
                        <div class="field-label">Customer Type</div>
                        <div class="field-value-muted">Trade Customer</div>
                    </div>
                </div>

                {{-- Right Column --}}
                <div class="details-col details-col-right">
                    @if(isset($isCombined) && $isCombined)
                        <div class="section-label">Liquidity Distribution</div>
                        @foreach($groupPayments as $gp)
                            <div class="field-group" style="border-bottom: 0.5px solid #f0f0f0; padding-bottom: 6px;">
                                <div class="field-label">{{ $gp->paymentAccount->title ?? 'Cash' }} ({{ $gp->payment_method ?: 'Cash' }})</div>
                                <div class="field-value">{{ number_format($gp->amount, 2) }}</div>
                            </div>
                        @endforeach
                    @else
                        <div class="section-label">Payment Details</div>
                        <div class="payment-fields">
                            <div class="payment-field-row">
                                <div class="payment-field-cell">
                                    <div class="field-label">Method</div>
                                    <div class="field-value" style="color: #1a2b4a;">{{ $payment->payment_method ?: 'Cash' }}</div>
                                </div>
                                <div class="payment-field-cell">
                                    <div class="field-label">Cheque #</div>
                                    <div class="field-value-muted">{{ $payment->cheque_no ?: '—' }}</div>
                                </div>
                            </div>
                            <div class="payment-field-row">
                                <div class="payment-field-cell">
                                    <div class="field-label">Cheque Date</div>
                                    @if($payment->cheque_date)
                                        <div class="field-value">{{ \Carbon\Carbon::parse($payment->cheque_date)->format('d M Y') }}</div>
                                    @else
                                        <div class="field-value-placeholder">— not specified —</div>
                                    @endif
                                </div>
                                <div class="payment-field-cell">
                                    <div class="field-label">Account</div>
                                    <div class="field-value" style="color: #1a2b4a;">{{ $payment->paymentAccount ? $payment->paymentAccount->title : 'Cash' }}</div>
                                </div>
                            </div>
                        </div>
                    @endif
                </div>
            </div>

            {{-- ── SECTION B: AMOUNT BAND ── --}}
            <div class="amount-band">
                <div class="amount-left">
                    <div class="amount-heading">Total Amount {{ $payment->type === 'RECEIPT' ? 'Received' : 'Paid' }}</div>
                    <div class="amount-words">
                        @if($payment->amount_in_words)
                            {{ $payment->amount_in_words }}
                        @else
                            {{ \NumberFormatter::create('en', \NumberFormatter::SPELLOUT)->format(isset($isCombined) && $isCombined ? $groupPayments->sum('amount') : $payment->amount) }} rupees only
                        @endif
                    </div>
                </div>
                <div class="amount-right">
                    <div class="amount-currency">PKR</div>
                    <div class="amount-number">
                        @if(isset($isCombined) && $isCombined)
                            {{ number_format($groupPayments->sum('amount'), 2) }}
                        @else
                            {{ number_format($payment->amount, 2) }}
                        @endif
                    </div>
                </div>
            </div>

            {{-- ── SECTION C: PAYMENT ALLOCATION TABLE ── --}}
            @php
                $displayAllocations = isset($isCombined) && $isCombined
                    ? $groupPayments->flatMap->allocations
                    : $payment->allocations;

                $mergedAllocations = $displayAllocations->groupBy(function($a) {
                    return $a->bill_type . $a->bill_id;
                });

                $totalAmount = isset($isCombined) && $isCombined
                    ? $groupPayments->sum('amount')
                    : $payment->amount;
            @endphp

            @if($displayAllocations->count() > 0)
                <div class="section-label">Payment Allocation</div>
                <table class="alloc-table">
                    <thead>
                        <tr>
                            <th style="width: 40px;">#</th>
                            <th>Bill Type / Reference</th>
                            <th>Invoice Date</th>
                            <th class="text-right">Invoice Total</th>
                            <th class="text-right">Amount Applied</th>
                        </tr>
                    </thead>
                    <tbody>
                        @php $idx = 0; @endphp
                        @foreach($mergedAllocations as $group)
                            @php
                                $first = $group->first();
                                $idx++;
                                $refLabel = $first->bill->invoice ?? ($first->bill->invoice_no ?? class_basename($first->bill_type) . ' #' . $first->bill_id);
                                $invoiceRef = 'INV-' . str_pad($first->bill_id, 4, '0', STR_PAD_LEFT);
                                $invoiceDate = $first->bill ? \Carbon\Carbon::parse($first->bill->date)->format('d M Y') : '-';
                                $invoiceTotal = $first->bill ? ($first->bill->net_total ?? $first->bill->total ?? $group->sum('amount')) : $group->sum('amount');
                                $amountApplied = $group->sum('amount');
                            @endphp
                            <tr>
                                <td class="col-num">{{ str_pad($idx, 2, '0', STR_PAD_LEFT) }}</td>
                                <td>
                                    <div class="col-ref-primary">{{ $refLabel }}</div>
                                    <div class="col-ref-secondary" style="font-size: 10px; color: #aaaaaa; margin-top: 2px;">{{ $invoiceRef }}</div>
                                </td>
                                <td>{{ $invoiceDate }}</td>
                                <td class="col-amount">{{ number_format($invoiceTotal, 2) }}</td>
                                <td class="col-applied">{{ number_format($amountApplied, 2) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3">Total Allocated</td>
                            <td></td>
                            <td class="total-value">PKR {{ number_format($totalAmount, 2) }}</td>
                        </tr>
                    </tfoot>
                </table>
            @endif

            {{-- ── SECTION D: REMARKS ── --}}
            <div class="section-label">Remarks</div>
            <div class="remarks-box">
                @if($payment->remarks)
                    <div class="remarks-text">{{ $payment->remarks }}</div>
                @else
                    <div class="remarks-placeholder">No remarks added.</div>
                @endif
            </div>

            {{-- Message Line / Instruction (if exists) --}}
            @if($payment->message_line)
                <div class="section-label">Message Line / Instruction</div>
                <div class="remarks-box" style="border-left: 3px solid #e07b1a;">
                    <div class="remarks-text" style="font-style: italic;">
                        "{{ $payment->message_line->messageline ?? $payment->message_line }}"
                    </div>
                </div>
            @endif

            {{-- ── SECTION E: SIGNATURES ── --}}
            <div class="section-label">Authorisation</div>
            <div class="signatures-grid">
                <div class="sig-cell">
                    <div class="sig-name">{{ $payment->created_by_user->name ?? 'Fayyaz Ahmed' }}</div>
                    <div class="sig-line"></div>
                    <div class="sig-label">Prepared By</div>
                </div>
                <div class="sig-cell">
                    <div class="sig-name">&nbsp;</div>
                    <div class="sig-line"></div>
                    <div class="sig-label">Authorised Signature</div>
                </div>
                <div class="sig-cell">
                    <div class="sig-name">&nbsp;</div>
                    <div class="sig-line"></div>
                    <div class="sig-label">Receiver Signature</div>
                </div>
            </div>
        </div>

        {{-- ═══ FOOTER ═══ --}}
        <div class="voucher-footer">
            <div class="footer-left">
                <span class="contact-item">
                    📍 Karachi, Pakistan
                </span>
                <span class="contact-item">
                    📞 +92 300 0000000
                </span>
                <span class="contact-item">
                    ✉ info@harmaintraders.com
                </span>
                <span class="contact-item">
                    🌐 aishtycoons.agency
                </span>
            </div>
            <div class="footer-right">
                <div class="footer-note">This is a computer-generated document.</div>
                <div class="footer-note">{{ $payment->voucher_no }} &middot; {{ \Carbon\Carbon::parse($payment->date)->format('d M Y') }}</div>
            </div>
        </div>
    </div>
</body>

</html>