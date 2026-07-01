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
        @php
            $f_name = $payment->firm ? $payment->firm->name : 'Harmain Traders';
            $f_sub = $payment->firm ? $payment->firm->business : 'Wholesale & Supply Chain';
            $f_addr = $payment->firm ? trim($payment->firm->address1 . ' ' . $payment->firm->address2) : 'Karachi, Pakistan';
            $f_phone = $payment->firm ? $payment->firm->phone : '+92 300 0000000';
            $f_email = $payment->firm ? $payment->firm->email : 'info@harmaintraders.com';
            $f_website = $payment->firm ? $payment->firm->website : 'aishtycoons.agency';
        @endphp
        <div class="header">
            <div class="header-left">
                <div class="company-name">{{ $f_name }}</div>
                <div class="company-sub">{{ $f_sub }} &middot; {{ $f_addr }}</div>
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
        @php
            $bal = (float) $payment->account->current_balance;
            $is_purchase = (bool) $payment->account->purchase;
            if ($bal < 0) {
                $top_balance_label = "Paid in Advance";
                $top_balance_value = "PKR " . number_format(abs($bal), 2);
            } else {
                $top_balance_label = "Balance";
                $top_balance_value = "PKR " . number_format($bal, 2) . " " . ($is_purchase ? 'CR' : 'DR');
            }
        @endphp
        <div class="info-row">
            <div class="info-cell">
                <div class="info-label">{{ $payment->type === 'RECEIPT' ? 'Received From' : 'Paid To' }}</div>
                <div class="info-value">{{ $payment->account->title }}</div>
               
            </div>
            <div class="info-cell info-cell-right">
                @if(isset($isCombined) && $isCombined)
                    <div class="info-label">Payment Distribution</div>
                    @foreach($groupPayments as $gp)
                        @php
                            $method_lbl = $gp->payment_method ?: 'Cash';
                            $details = '';
                            if (strtolower($method_lbl) === 'cheque') {
                                $details = ' (Chq #' . ($gp->cheque_no ?: '-') . ($gp->cheque_date ? ' · ' . \Carbon\Carbon::parse($gp->cheque_date)->format('d M Y') : '') . ')';
                            }
                        @endphp
                        <div class="info-value-sm">{{ $gp->paymentAccount->title ?? 'Cash' }} ({{ $method_lbl }}){{ $details }}</div>
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

        {{-- ═══ PAYMENT ALLOCATION TABLE ═══ --}}
        @php
            $displayAllocations = isset($isCombined) && $isCombined
                ? $groupPayments->flatMap->allocations
                : $payment->allocations;

            $mergedAllocations = $displayAllocations->groupBy(function($a) {
                return $a->bill_type . $a->bill_id;
            });

            $totalAmount = isset($isCombined) && $isCombined
                ? $groupPayments->sum('net_amount')
                : $payment->net_amount;

            // Compute allocated invoices total sum
            $invoiceTotalSum = 0;
            foreach($mergedAllocations as $group) {
                $first = $group->first();
                $invoiceTotalSum += $first->bill ? ($first->bill->net_total ?? $first->bill->total ?? $group->sum('amount')) : $group->sum('amount');
            }

            // Calculations for Financial Summary
            $current_balance = (float) $payment->account->current_balance;
            $amount_applied = $totalAmount;
            $is_receipt = $payment->type === 'RECEIPT';
            $orientation = $payment->account->purchase == 1 ? 'CR' : 'DR';

            // Previous Balance = Current Balance - Invoice Total + Payout/Receipt Gross
            $previous_balance = $current_balance - $invoiceTotalSum + $amount_applied;
            $net_balance = $current_balance;
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

        {{-- ═══ REDESIGNED SUMMARY & AMOUNT IN WORDS SECTION ═══ --}}
        <div class="summary-section" style="display: table; width: 100%; margin-top: 6px; margin-bottom: 8px; border: 1px solid #bbbbbb; border-collapse: collapse;">
            <div style="display: table-cell; width: 55%; padding: 6px 8px; vertical-align: top; border-right: 1px solid #bbbbbb;">
                <div class="amount-label-title" style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #555555; letter-spacing: 0.5px;">Amount in Words</div>
                <div class="amount-words" style="font-size: 11px; font-weight: 700; color: #000000; font-style: italic; margin-top: 4px; line-height: 1.3;">
                    @if($payment->amount_in_words)
                        {{ $payment->amount_in_words }}
                    @else
                        {{ \NumberFormatter::create('en', \NumberFormatter::SPELLOUT)->format($totalAmount) }} rupees only
                    @endif
                </div>
                @php
                    $totalDiscount = isset($isCombined) && $isCombined ? $groupPayments->sum('discount') : $payment->discount;
                    $totalAmountReceived = isset($isCombined) && $isCombined ? $groupPayments->sum('amount') : $payment->amount;
                @endphp
                @if($totalDiscount > 0)
                    <div style="font-size: 8px; color: #444444; margin-top: 8px; border-top: 0.5px solid #cccccc; padding-top: 4px;">
                        Amount {{ $payment->type === 'RECEIPT' ? 'Received' : 'Paid' }}: <strong>PKR {{ number_format($totalAmountReceived, 2) }}</strong> &nbsp;|&nbsp; 
                        Discount (Adj): <strong>PKR {{ number_format($totalDiscount, 2) }}</strong>
                    </div>
                @endif
            </div>
            <div style="display: table-cell; width: 45%; padding: 0; vertical-align: top;">
                <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                    <tr>
                        <td style="padding: 4px 6px; border-bottom: 1px solid #dddddd; font-weight: bold; color: #444444;">Total:</td>
                        <td style="padding: 4px 6px; border-bottom: 1px solid #dddddd; text-align: right; font-weight: bold;">PKR {{ number_format($invoiceTotalSum, 2) }}</td>
                    </tr>
                    @php
                        $prev_is_advance = $previous_balance < 0;
                        $prev_label = $prev_is_advance ? 'Prev Advance:' : 'Previous Balance:';
                        $prev_val_formatted = "PKR " . number_format(abs($previous_balance), 2);
                        if (!$prev_is_advance) {
                            $prev_val_formatted .= " " . $orientation;
                        }

                        $is_advance = $net_balance < 0;
                        $net_label = $is_advance ? 'Paid in Advance:' : 'Net Balance:';
                        $net_val_formatted = "PKR " . number_format(abs($net_balance), 2);
                        if (!$is_advance) {
                            $net_val_formatted .= " " . $orientation;
                        }

                        $totalDiscount = isset($isCombined) && $isCombined ? $groupPayments->sum('discount') : $payment->discount;
                        $totalActualPaid = isset($isCombined) && $isCombined ? $groupPayments->sum('amount') : $payment->amount;
                    @endphp
                    <tr>
                        <td style="padding: 4px 6px; border-bottom: 1px solid #dddddd; font-weight: bold; color: #444444;">{{ $prev_label }}</td>
                        <td style="padding: 4px 6px; border-bottom: 1px solid #dddddd; text-align: right; font-weight: bold;">{{ $prev_val_formatted }}</td>
                    </tr>
                    @if($totalDiscount > 0)
                        <tr>
                            <td style="padding: 4px 6px; border-bottom: 1px solid #dddddd; font-weight: bold; color: #444444;">Discount (Adj):</td>
                            <td style="padding: 4px 6px; border-bottom: 1px solid #dddddd; text-align: right; font-weight: bold; color: #111111ff;">PKR {{ number_format($totalDiscount, 2) }}</td>
                        </tr>
                    @endif
                    <tr>
                        <td style="padding: 4px 6px; border-bottom: 1px solid #dddddd; font-weight: bold; color: #444444;">{{ $payment->type === 'RECEIPT' ? 'Paid/Receipt (Cr):' : 'Paid/Receipt (Dr):' }}</td>
                        <td style="padding: 4px 6px; border-bottom: 1px solid #dddddd; text-align: right; font-weight: bold; color: #0d0f0eff;">PKR {{ number_format($totalActualPaid, 2) }}</td>
                    </tr>
                    <tr style="background-color: #f7f9fa;">
                        <td style="padding: 5px 6px; font-weight: 800; color: #000000; font-size: 11px; border-top: 1px solid #bbbbbb;">{{ $net_label }}</td>
                        <td style="padding: 5px 6px; text-align: right; font-weight: 900; font-size: 11px; color: #000000; border-top: 1px solid #bbbbbb;">{{ $net_val_formatted }}</td>
                    </tr>
                </table>
            </div>
        </div>

        {{-- ═══ REMARKS & COMMUNICATION ═══ --}}
        @php
            $msgLine = $payment->messageLine ?? $payment->message_line ?? null;
        @endphp
        @if($payment->remarks || $msgLine)
            <div class="remarks-row">
                <div class="remarks-label-cell">Remarks / Note</div>
                <div class="remarks-value-cell">
                    @if($payment->remarks)
                        <div style="margin-bottom: 2px;">{{ $payment->remarks }}</div>
                    @endif
                    @if($msgLine)
                        <div style="font-weight: bold; font-style: italic; color: #333333; {{ $payment->remarks ? 'margin-top: 3px; padding-top: 2px; border-top: 0.5px dashed #dddddd;' : '' }}">
                            "{{ $msgLine->messageline ?? (is_string($msgLine) ? $msgLine : '') }}"
                        </div>
                    @endif
                </div>
            </div>
        @endif

        {{-- ═══ SIGNATURES ═══ --}}
        <div class="signatures-grid">
            <div class="sig-cell">
                <div class="sig-space" style="font-size: 10px; font-weight: bold; padding-top: 12px; height: 28px;">
                    {{ $payment->created_by_user->name ?? 'Fayyaz Ahmed' }}
                </div>
                <div class="sig-line"></div>
                <div class="sig-label">Prepared By</div>
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
                Phone: {{ $f_phone }} &nbsp;·&nbsp; Email: {{ $f_email }} &nbsp;·&nbsp; Address: {{ $f_addr }}
            </div>
            <div class="footer-right">
                Computer-generated · {{ $payment->voucher_no }} · {{ \Carbon\Carbon::parse($payment->date)->format('d M Y') }}
            </div>
        </div>

    </div>
</body>

</html>