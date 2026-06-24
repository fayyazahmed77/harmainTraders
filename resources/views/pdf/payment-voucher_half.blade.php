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

    <div class="receipt-wrapper">
        <!-- Brand Header -->
        <div class="header text-center">
            <div class="brand-name">Harmain Traders</div>
            <div class="contact-info">Wholesale &amp; Supply Chain</div>
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

        <!-- Amount Band -->
        <div class="amount-section text-center">
            <div style="font-size: 8px; text-transform: uppercase; color: #555;">Total Settlement Amount</div>
            <div class="amount-value">
                Rs. 
                @if(isset($isCombined) && $isCombined)
                    {{ number_format($groupPayments->sum('amount'), 2) }}
                @else
                    {{ number_format($payment->amount, 2) }}
                @endif
            </div>
            <div class="amount-words">
                @if($payment->amount_in_words)
                    {{ $payment->amount_in_words }}
                @else
                    {{ \NumberFormatter::create('en', \NumberFormatter::SPELLOUT)->format(isset($isCombined) && $isCombined ? $groupPayments->sum('amount') : $payment->amount) }} rupees only
                @endif
            </div>
        </div>

        <!-- Allocations Section -->
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

        <!-- Remarks -->
        @if($payment->remarks || $payment->message_line)
            <div class="remarks-section">
                @if($payment->remarks)
                    <div class="remarks-title">Remarks:</div>
                    <div style="margin-bottom: 3px;">{{ $payment->remarks }}</div>
                @endif
                @if($payment->message_line)
                    <div class="remarks-title">Message:</div>
                    <div>"{{ $payment->message_line->messageline ?? $payment->message_line }}"</div>
                @endif
            </div>
        @endif

        <!-- Signature Section -->
        <div class="signatures">
            <div class="sig-row">
                <div class="sig-col">
                    <div style="height: 15px;">&nbsp;</div>
                    <div class="sig-line"></div>
                    <div>Prepared By</div>
                    <div style="font-size: 6px; color: #555;">{{ $payment->created_by_user->name ?? 'Fayyaz Ahmed' }}</div>
                </div>
                <div class="sig-col">
                    <div style="height: 15px;">&nbsp;</div>
                    <div class="sig-line"></div>
                    <div>Authorised / Receiver</div>
                </div>
            </div>
        </div>

        <div class="divider"></div>

        <!-- Footer Note -->
        <div class="footer-note text-center">
            This is a computer-generated receipt.<br>
            Thank you for choosing Harmain Traders.
        </div>
    </div>
</body>

</html>
