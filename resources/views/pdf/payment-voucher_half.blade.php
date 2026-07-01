<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $payment->voucher_no }} (Thermal)</title>
    <style>
        * {
            box-sizing: border-box;
        }

        @page {
            margin: 1mm;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #000;
            font-size: 9px;
            margin: 0;
            padding: 0;
            line-height: 1.3;
        }

        .receipt-wrapper {
            width: 64mm;
            margin: 0 auto;
            padding-right: 2mm; /* Prevent side cut-off */
        }

        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-left {
            text-align: left;
        }

        .bold {
            font-weight: bold;
        }

        .header {
            margin-bottom: 5px;
        }

        .brand-name {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .contact-info {
            font-size: 8px;
            margin-bottom: 3px;
        }

        .voucher-bar {
            border: 1px dashed #000;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 0;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .info-section {
            margin-bottom: 5px;
            font-size: 8.5px;
        }

        .info-row {
            margin-bottom: 2px;
        }

        .info-label {
            display: inline-block;
            width: 60px;
            color: #333;
        }

        .info-value {
            font-weight: bold;
        }

        .divider {
            border-bottom: 1px dashed #000;
            margin: 4px 0;
        }

        .amount-section {
            margin: 6px 0;
            padding: 4px 0;
        }

        .amount-value {
            font-size: 13px;
            font-weight: bold;
        }

        .amount-words {
            font-size: 8px;
            font-style: italic;
            margin-top: 2px;
            color: #444;
        }

        .alloc-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
            margin-top: 3px;
        }

        .alloc-table th {
            border-bottom: 1px solid #000;
            padding: 2px 0;
            font-size: 8px;
            text-align: left;
            font-weight: bold;
        }

        .alloc-table td {
            padding: 2px 0;
            font-size: 8px;
            vertical-align: top;
        }

        .remarks-section {
            margin-top: 5px;
            font-size: 8px;
            background-color: #f9f9f9;
            padding: 3px;
            border: 0.5px solid #ddd;
        }

        .remarks-title {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 7.5px;
            margin-bottom: 1px;
        }

        .signatures {
            margin-top: 15px;
            margin-bottom: 10px;
        }

        .sig-row {
            display: table;
            width: 100%;
        }

        .sig-col {
            display: table-cell;
            width: 50%;
            text-align: center;
            vertical-align: bottom;
            font-size: 7.5px;
        }

        .sig-line {
            border-top: 0.5px solid #000;
            width: 80%;
            margin: 0 auto 3px auto;
        }

        .footer-note {
            font-size: 7.5px;
            color: #666;
            margin-top: 8px;
        }

        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
    </style>
</head>

<body>

    @php
        $f_name = $payment->firm ? $payment->firm->name : 'Harmain Traders';
        $f_sub = $payment->firm ? $payment->firm->business : 'Wholesale & Supply Chain';
        $f_addr = $payment->firm ? trim($payment->firm->address1 . ' ' . $payment->firm->address2) : 'Karachi, Pakistan';
        $f_phone = $payment->firm ? $payment->firm->phone : '+92 300 0000000';
        $f_email = $payment->firm ? $payment->firm->email : 'info@harmaintraders.com';
        $f_website = $payment->firm ? $payment->firm->website : 'aishtycoons.agency';

        // Allocations
        $displayAllocations = isset($isCombined) && $isCombined
            ? $groupPayments->flatMap->allocations
            : $payment->allocations;

        $mergedAllocations = $displayAllocations->groupBy(function($a) {
            return $a->bill_type . $a->bill_id;
        });

        $totalAmount = isset($isCombined) && $isCombined
            ? $groupPayments->sum('net_amount')
            : $payment->net_amount;

        $totalDiscount = isset($isCombined) && $isCombined
            ? $groupPayments->sum('discount')
            : $payment->discount;

        $totalActualPaid = isset($isCombined) && $isCombined
            ? $groupPayments->sum('amount')
            : $payment->amount;

        // Invoice Total Sum
        $invoiceTotalSum = 0;
        foreach($mergedAllocations as $group) {
            $first = $group->first();
            $invoiceTotalSum += $first->bill ? ($first->bill->net_total ?? $first->bill->total ?? $group->sum('amount')) : $group->sum('amount');
        }

        // Balances
        $current_balance = (float) $payment->account->current_balance;
        $previous_balance = $current_balance - $invoiceTotalSum + $totalAmount;
        $net_balance = $current_balance;
        $orientation = $payment->account->purchase == 1 ? 'CR' : 'DR';
    @endphp

    <div class="receipt-wrapper">
        <!-- Brand Header -->
        <div class="header text-center">
            <div class="brand-name">{{ $f_name }}</div>
            <div class="contact-info">{{ $f_sub }}</div>
            @if($payment->firm)
                <div style="font-size: 7px; color: #555555; margin-bottom: 2px;">{{ $f_addr }}</div>
            @endif
        </div>

        <!-- Voucher Title Bar -->
        <div class="voucher-bar">
            {{ $payment->type === 'RECEIPT' ? 'RECEIPT VOUCHER' : 'PAYMENT VOUCHER' }}
        </div>

        <!-- Voucher Meta Info -->
        <div class="info-section">
            <div class="info-row">
                <span class="info-label">Voucher No:</span>
                <span class="info-value">{{ $payment->voucher_no }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">{{ \Carbon\Carbon::parse($payment->date)->format('d M Y') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">{{ $payment->type === 'RECEIPT' ? 'Received From:' : 'Paid To:' }}</span>
                <span class="info-value">{{ $payment->account->title }}</span>
            </div>
        </div>

        <div class="divider"></div>

        <!-- Method/Account Details -->
        <div class="info-section">
            @if(isset($isCombined) && $isCombined)
                <div class="bold" style="font-size: 8px; margin-bottom: 2px; text-transform: uppercase;">Liquidity Distribution:</div>
                @foreach($groupPayments as $gp)
                    <div class="info-row">
                        <span class="info-label" style="width: 80px;">{{ $gp->paymentAccount->title ?? 'Cash' }} ({{ $gp->payment_method ?: 'Cash' }}):</span>
                        <span class="info-value">{{ number_format($gp->amount, 2) }}</span>
                    </div>
                @endforeach
            @else
                <div class="info-row">
                    <span class="info-label">Method:</span>
                    <span class="info-value">{{ $payment->payment_method ?: 'Cash' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Paid Via:</span>
                    <span class="info-value">{{ $payment->paymentAccount ? $payment->paymentAccount->title : 'Cash Account' }}</span>
                </div>
                @if($payment->cheque_no)
                    <div class="info-row">
                        <span class="info-label">Cheque No:</span>
                        <span class="info-value">{{ $payment->cheque_no }}</span>
                    </div>
                @endif
                @if($payment->cheque_date)
                    <div class="info-row">
                        <span class="info-label">Cheque Date:</span>
                        <span class="info-value">{{ \Carbon\Carbon::parse($payment->cheque_date)->format('d M Y') }}</span>
                    </div>
                @endif
            @endif
        </div>

        <div class="divider"></div>

        <!-- Amount & Ledger Summary Band (Redesigned) -->
        <div class="amount-section" style="margin: 6px 0;  padding: 5px;">
            <div style="display: table; width: 100%; font-size: 8.5px; line-height: 1.4;">
                <div style="display: table-row;">
                    <div style="display: table-cell; text-align: left; color: #555;">Previous Balance:</div>
                    <div style="display: table-cell; text-align: right; font-weight: bold;">PKR {{ number_format(abs($previous_balance), 2) }} {{ $previous_balance < 0 ? '' : $orientation }}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; text-align: left; color: #555;">Gross Settlement:</div>
                    <div style="display: table-cell; text-align: right; font-weight: bold;">PKR {{ number_format($totalAmount, 2) }}</div>
                </div>
                @if($totalDiscount > 0)
                    <div style="display: table-row; color: #131212ff;">
                        <div style="display: table-cell; text-align: left;">Discount (Adj):</div>
                        <div style="display: table-cell; text-align: right; font-weight: bold;">PKR {{ number_format($totalDiscount, 2) }}</div>
                    </div>
                @endif
                <div style="display: table-row; color: #121312ff; font-size: 9px; font-weight: bold;">
                    <div style="display: table-cell; text-align: left; padding-top: 2px; border-top: 1px dashed #aaaaaa;">Amount Received/Paid:</div>
                    <div style="display: table-cell; text-align: right; padding-top: 2px; border-top: 1px dashed #aaaaaa;">PKR {{ number_format($totalActualPaid, 2) }}</div>
                </div>
                <div style="display: table-row; font-size: 9px;">
                    <div style="display: table-cell; text-align: left; padding-top: 2px; border-top: 1.5px solid #000000; font-weight: bold;">Net Balance:</div>
                    <div style="display: table-cell; text-align: right; padding-top: 2px; border-top: 1.5px solid #000000; font-weight: bold;">PKR {{ number_format(abs($net_balance), 2) }} {{ $net_balance < 0 ? '' : $orientation }}</div>
                </div>
            </div>
            
            <div class="amount-words text-center" style="font-size: 8px; font-style: italic; margin-top: 5px; color: #000000; border-top: 1px dashed #dddddd; padding-top: 3px; font-weight: bold; line-height: 1.2;">
                "{{ $payment->amount_in_words ?: \NumberFormatter::create('en', \NumberFormatter::SPELLOUT)->format($totalAmount) . ' rupees only' }}"
            </div>
        </div>

        <!-- Allocations Section -->
        @if($displayAllocations->count() > 0)
            <div class="divider"></div>
            <div class="bold" style="font-size: 8px; text-transform: uppercase; margin-bottom: 2px;">Invoice Allocations:</div>
            <table class="alloc-table">
                <thead>
                    <tr>
                        <th>Invoice Ref</th>
                        <th>Inv Date</th>
                        <th class="text-right" style="padding-right: 1mm;">Applied</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($mergedAllocations as $group)
                        @php
                            $first = $group->first();
                            $refLabel = $first->bill->invoice ?? ($first->bill->invoice_no ?? class_basename($first->bill_type) . ' #' . $first->bill_id);
                            $invoiceDate = $first->bill ? \Carbon\Carbon::parse($first->bill->date)->format('d M Y') : '-';
                            $amountApplied = $group->sum('amount');
                        @endphp
                        <tr>
                            <td>{{ $refLabel }}</td>
                            <td>{{ $invoiceDate }}</td>
                            <td class="text-right" style="padding-right: 1mm; font-weight: bold;">{{ number_format($amountApplied, 0) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif

        <!-- Remarks & Communication -->
        @php
            $msgLine = $payment->messageLine ?? $payment->message_line ?? null;
        @endphp
        @if($payment->remarks || $msgLine)
            <div class="remarks-section">
                @if($payment->remarks)
                    <div class="remarks-title">Remarks:</div>
                    <div style="margin-bottom: 3px;">{{ $payment->remarks }}</div>
                @endif
                @if($msgLine)
                    <div class="remarks-title">Message:</div>
                    <div style="font-weight: bold; font-style: italic;">"{{ $msgLine->messageline ?? (is_string($msgLine) ? $msgLine : '') }}"</div>
                @endif
            </div>
        @endif

        <!-- Signature Section -->
        <div class="signatures">
            <div class="sig-row">
                <div class="sig-col">
                    <div style="height: 12px; font-weight: bold; font-size: 7.5px; text-align: center; width: 100%;">
                        {{ $payment->created_by_user->name ?? 'Fayyaz Ahmed' }}
                    </div>
                    <div class="sig-line"></div>
                    <div>Prepared By</div>
                </div>
                <div class="sig-col">
                    <div style="height: 12px;">&nbsp;</div>
                    <div class="sig-line"></div>
                    <div>Authorised / Receiver</div>
                </div>
            </div>
        </div>

        <div class="divider"></div>

        <!-- Footer Note -->
        <div class="footer-note text-center">
            Phone: {{ $f_phone }} &nbsp;·&nbsp; Email: {{ $f_email }}<br>
            This is a computer-generated receipt.<br>
            Thank you for choosing {{ $f_name }}.
        </div>
    </div>
</body>

</html>
