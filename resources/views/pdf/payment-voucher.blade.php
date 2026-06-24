<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $payment->voucher_no }}</title>
    <style>
        @page {
            size: A5 landscape;
            margin: 6mm 8mm 4mm 8mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            color: #000000;
            line-height: 1.4;
            background: #ffffff;
            padding: 12px 12px 0 12px;
        }

        /* ── VOUCHER WRAPPER ── */
        .voucher {
            width: 100%;
            background: #ffffff;
        }

        /* ── HEADER ── */
        .header {
            display: table;
            width: 100%;
            border-bottom: 2px solid #000000;
            padding-bottom: 6px;
            margin-bottom: 6px;
        }

        .header-left {
            display: table-cell;
            vertical-align: top;
            width: 55%;
        }

        .header-right {
            display: table-cell;
            vertical-align: top;
            text-align: right;
            width: 45%;
        }

        .company-name {
            font-size: 16px;
            font-weight: 700;
            color: #000000;
            letter-spacing: 0.5px;
            line-height: 1.1;
        }

        .company-sub {
            font-size: 9px;
            color: #333333;
            margin-top: 1px;
        }

        .voucher-title {
            font-size: 14px;
            font-weight: 700;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .voucher-meta {
            font-size: 10px;
            color: #222222;
            margin-top: 2px;
        }

        .voucher-meta strong {
            font-weight: 700;
        }

        /* ── INFO ROW (party + payment details) ── */
        .info-row {
            display: table;
            width: 100%;
            border: 1px solid #bbbbbb;
            margin-bottom: 6px;
        }

        .info-cell {
            display: table-cell;
            vertical-align: top;
            padding: 5px 8px;
            width: 50%;
        }

        .info-cell-right {
            border-left: 1px solid #bbbbbb;
        }

        .info-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #555555;
            margin-bottom: 2px;
        }

        .info-value {
            font-size: 12px;
            font-weight: 700;
            color: #000000;
        }

        .info-value-sm {
            font-size: 10px;
            font-weight: 400;
            color: #111111;
        }

        /* ── AMOUNT BOX ── */
        .amount-box {
            display: table;
            width: 100%;
            border: 1.5px solid #000000;
            margin-bottom: 6px;
        }

        .amount-label-cell {
            display: table-cell;
            vertical-align: middle;
            padding: 5px 8px;
            width: 55%;
            border-right: 1px solid #000000;
        }

        .amount-label-title {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #555555;
        }

        .amount-words {
            font-size: 10px;
            font-weight: 400;
            color: #111111;
            font-style: italic;
            margin-top: 1px;
        }

        .amount-value-cell {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            padding: 5px 10px;
            width: 45%;
        }

        .amount-currency {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            color: #444444;
        }

        .amount-number {
            font-size: 22px;
            font-weight: 700;
            color: #000000;
            line-height: 1;
        }

        /* ── ALLOCATION TABLE ── */
        .alloc-section-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #333333;
            margin-bottom: 3px;
        }

        .alloc-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 6px;
        }

        .alloc-table thead th {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #000000;
            background-color: #eeeeee;
            padding: 4px 6px;
            text-align: left;
            border: 0.5px solid #aaaaaa;
        }

        .alloc-table thead th.text-right {
            text-align: right;
        }

        .alloc-table tbody td {
            padding: 4px 6px;
            border: 0.5px solid #cccccc;
            font-size: 10px;
            color: #000000;
        }

        .alloc-table tbody td.text-right {
            text-align: right;
        }

        .alloc-table tfoot td {
            padding: 4px 6px;
            border: 0.5px solid #aaaaaa;
            background-color: #eeeeee;
            font-size: 10px;
            font-weight: 700;
            color: #000000;
        }

        .alloc-table tfoot td.text-right {
            text-align: right;
        }

        /* ── REMARKS ── */
        .remarks-row {
            display: table;
            width: 100%;
            border: 1px solid #bbbbbb;
            margin-bottom: 6px;
        }

        .remarks-label-cell {
            display: table-cell;
            vertical-align: middle;
            padding: 4px 8px;
            width: 20%;
            border-right: 1px solid #bbbbbb;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #444444;
        }

        .remarks-value-cell {
            display: table-cell;
            vertical-align: middle;
            padding: 4px 8px;
            width: 80%;
            font-size: 10px;
            color: #111111;
        }

        /* ── SIGNATURES ── */
        .signatures-grid {
            display: table;
            width: 100%;
            margin-top: 4px;
            margin-bottom: 6px;
        }

        .sig-cell {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            vertical-align: bottom;
            padding: 0 8px;
        }

        .sig-space {
            height: 28px;
        }

        .sig-line {
            width: 100%;
            height: 1px;
            background-color: #000000;
        }

        .sig-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #333333;
            margin-top: 3px;
        }

        .sig-name {
            font-size: 9px;
            color: #333333;
            margin-top: 1px;
        }

        /* ── FOOTER ── */
        .voucher-footer {
            border-top: 1px solid #aaaaaa;
            padding-top: 4px;
            display: table;
            width: 100%;
        }

        .footer-left {
            display: table-cell;
            vertical-align: middle;
            width: 65%;
            font-size: 8px;
            color: #555555;
        }

        .footer-right {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            width: 35%;
            font-size: 8px;
            color: #555555;
        }

        /* ── STATUS BADGE (B&W friendly) ── */
        .status-badge {
            display: inline-block;
            padding: 1px 6px;
            border: 1px solid #555555;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #000000;
        }
    </style>
</head>

<body>
    <div class="voucher">

        {{-- ═══ HEADER ═══ --}}
        <div class="header">
            <div class="header-left">
                <div class="company-name">Harmain Traders</div>
                <div class="company-sub">Wholesale &amp; Supply Chain · Karachi, Pakistan</div>
            </div>
            <div class="header-right">
                <div class="voucher-title">{{ $payment->type === 'RECEIPT' ? 'Receipt Voucher' : 'Payment Voucher' }}</div>
                <div class="voucher-meta">
                    <strong>{{ $payment->voucher_no }}</strong>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    Date: <strong>{{ \Carbon\Carbon::parse($payment->date)->format('d M Y') }}</strong>
                    &nbsp;&nbsp;
                    @php $statusLower = strtolower($payment->status ?? 'pending'); @endphp
                    <span class="status-badge">PAID</span>
                </div>
            </div>
        </div>

        {{-- ═══ PARTY + PAYMENT DETAILS ROW ═══ --}}
        <div class="info-row">
            <div class="info-cell">
                <div class="info-label">{{ $payment->type === 'RECEIPT' ? 'Received From' : 'Paid To' }}</div>
                <div class="info-value">{{ $payment->account->title }}</div>
            </div>
            <div class="info-cell info-cell-right">
                @if(isset($isCombined) && $isCombined)
                    <div class="info-label">Payment Distribution</div>
                    @foreach($groupPayments as $gp)
                        <div class="info-value-sm">{{ $gp->paymentAccount->title ?? 'Cash' }} ({{ $gp->payment_method ?: 'Cash' }}): PKR {{ number_format($gp->amount, 2) }}</div>
                    @endforeach
                @else
                    <div style="display:table;width:100%;">
                        <div style="display:table-cell;width:50%;">
                            <div class="info-label">Method</div>
                            <div class="info-value-sm">{{ $payment->payment_method ?: 'Cash' }}</div>
                            @if($payment->cheque_no)
                                <div class="info-label" style="margin-top:3px;">Cheque #</div>
                                <div class="info-value-sm">{{ $payment->cheque_no }}</div>
                            @endif
                        </div>
                        <div style="display:table-cell;width:50%;">
                            <div class="info-label">Account</div>
                            <div class="info-value-sm">{{ $payment->paymentAccount ? $payment->paymentAccount->title : 'Cash' }}</div>
                            @if($payment->cheque_date)
                                <div class="info-label" style="margin-top:3px;">Cheque Date</div>
                                <div class="info-value-sm">{{ \Carbon\Carbon::parse($payment->cheque_date)->format('d M Y') }}</div>
                            @endif
                        </div>
                    </div>
                @endif
            </div>
        </div>

        {{-- ═══ AMOUNT BOX ═══ --}}
        <div class="amount-box">
            <div class="amount-label-cell">
                <div class="amount-label-title">Total Amount {{ $payment->type === 'RECEIPT' ? 'Received' : 'Paid' }}</div>
                <div class="amount-words">
                    @if($payment->amount_in_words)
                        {{ $payment->amount_in_words }}
                    @else
                        {{ \NumberFormatter::create('en', \NumberFormatter::SPELLOUT)->format(isset($isCombined) && $isCombined ? $groupPayments->sum('amount') : $payment->amount) }} rupees only
                    @endif
                </div>
            </div>
            <div class="amount-value-cell">
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

        {{-- ═══ PAYMENT ALLOCATION TABLE ═══ --}}
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
            <div class="alloc-section-label">Payment Allocation</div>
            <table class="alloc-table">
                <thead>
                    <tr>
                        <th style="width:30px;">#</th>
                        <th>Invoice / Reference</th>
                        <th>Date</th>
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
                            $invoiceDate = $first->bill ? \Carbon\Carbon::parse($first->bill->date)->format('d M Y') : '-';
                            $invoiceTotal = $first->bill ? ($first->bill->net_total ?? $first->bill->total ?? $group->sum('amount')) : $group->sum('amount');
                            $amountApplied = $group->sum('amount');
                        @endphp
                        <tr>
                            <td>{{ $idx }}</td>
                            <td><strong>{{ $refLabel }}</strong></td>
                            <td>{{ $invoiceDate }}</td>
                            <td class="text-right">{{ number_format($invoiceTotal, 2) }}</td>
                            <td class="text-right"><strong>{{ number_format($amountApplied, 2) }}</strong></td>
                        </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4">Total Allocated</td>
                        <td class="text-right">PKR {{ number_format($totalAmount, 2) }}</td>
                    </tr>
                </tfoot>
            </table>
        @endif

        {{-- ═══ REMARKS ═══ --}}
        @if($payment->remarks || $payment->message_line)
            <div class="remarks-row">
                <div class="remarks-label-cell">Remarks</div>
                <div class="remarks-value-cell">
                    @if($payment->remarks)
                        {{ $payment->remarks }}
                    @endif
                    @if($payment->message_line)
                        &nbsp;—&nbsp;"{{ $payment->message_line->messageline ?? $payment->message_line }}"
                    @endif
                </div>
            </div>
        @endif

        {{-- ═══ SIGNATURES ═══ --}}
        <div class="signatures-grid">
            <div class="sig-cell">
                <div class="sig-space"></div>
                <div class="sig-line"></div>
                <div class="sig-label">Prepared By</div>
                <div class="sig-name">{{ $payment->created_by_user->name ?? 'Fayyaz Ahmed' }}</div>
            </div>
            <div class="sig-cell">
                <div class="sig-space"></div>
                <div class="sig-line"></div>
                <div class="sig-label">Authorised By</div>
            </div>
            <div class="sig-cell">
                <div class="sig-space"></div>
                <div class="sig-line"></div>
                <div class="sig-label">Received By</div>
            </div>
        </div>

        {{-- ═══ FOOTER ═══ --}}
        <div class="voucher-footer">
            <div class="footer-left">
                📞 +92 300 0000000 &nbsp;·&nbsp; ✉ info@harmaintraders.com &nbsp;·&nbsp; Karachi, Pakistan
            </div>
            <div class="footer-right">
                Computer-generated · {{ $payment->voucher_no }} · {{ \Carbon\Carbon::parse($payment->date)->format('d M Y') }}
            </div>
        </div>

    </div>
</body>

</html>