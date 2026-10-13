<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Journal Voucher - {{ $voucher_no }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #0f172a;
            line-height: 1.4;
            background: #ffffff;
            padding: 6px;
        }

        .voucher {
            width: 100%;
            background: #ffffff;
        }

        /* ── HEADER ── */
        .header {
            display: table;
            width: 100%;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 12px;
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
            color: #0f172a;
            letter-spacing: 0.3px;
            line-height: 1.2;
        }

        .company-sub {
            font-size: 9px;
            color: #475569;
            margin-top: 2px;
        }

        .voucher-title {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .voucher-meta {
            font-size: 9.5px;
            color: #334155;
            margin-top: 3px;
        }

        .voucher-meta strong {
            font-weight: 700;
            color: #0f172a;
        }

        /* ── SECTION LABELS ── */
        .entry-section-label {
            font-size: 8.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #334155;
            margin-bottom: 4px;
            margin-top: 8px;
        }

        /* ── DOUBLE ENTRY TABLE ── */
        .entry-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
            margin-bottom: 12px;
        }

        .entry-table thead th {
            font-size: 8.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #0f172a;
            background-color: #f1f5f9;
            padding: 6px 8px;
            text-align: left;
            border: 0.5px solid #cbd5e1;
        }

        .entry-table thead th.text-right {
            text-align: right;
        }

        .entry-table tbody td {
            padding: 6px 8px;
            border: 0.5px solid #cbd5e1;
            font-size: 9.5px;
            color: #0f172a;
            vertical-align: middle;
        }

        .entry-table tbody td.text-right {
            text-align: right;
        }

        .entry-table tfoot td {
            padding: 6px 8px;
            border: 0.5px solid #94a3b8;
            background-color: #f8fafc;
            font-size: 9.5px;
            font-weight: 700;
            color: #0f172a;
        }

        .entry-table tfoot td.text-right {
            text-align: right;
        }

        /* ── SUMMARY SECTION ── */
        .summary-section {
            display: table;
            width: 100%;
            margin-top: 4px;
            margin-bottom: 12px;
            border: 0.5px solid #cbd5e1;
            border-collapse: collapse;
            background-color: #f8fafc;
            page-break-inside: avoid;
        }

        .amount-words-cell {
            display: table-cell;
            width: 100%;
            padding: 6px 10px;
            vertical-align: top;
        }

        .amount-label-title {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.4px;
        }

        .amount-words {
            font-size: 10.5px;
            font-weight: 700;
            color: #0f172a;
            font-style: italic;
            margin-top: 2px;
            line-height: 1.3;
        }

        /* ── REMARKS ── */
        .remarks-row {
            display: table;
            width: 100%;
            border: 0.5px solid #cbd5e1;
            margin-bottom: 12px;
            page-break-inside: avoid;
        }

        .remarks-label-cell {
            display: table-cell;
            vertical-align: middle;
            padding: 5px 8px;
            width: 18%;
            border-right: 0.5px solid #cbd5e1;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #475569;
            background-color: #f8fafc;
        }

        .remarks-value-cell {
            display: table-cell;
            vertical-align: middle;
            padding: 5px 8px;
            width: 82%;
            font-size: 9.5px;
            color: #0f172a;
        }

        /* ── ALLOCATION BLOCK ── */
        .alloc-block {
            display: table;
            width: 100%;
            margin-bottom: 12px;
            page-break-inside: avoid;
        }

        .alloc-column {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }

        .alloc-column:first-child {
            padding-right: 8px;
        }

        .alloc-column:last-child {
            padding-left: 8px;
            border-left: 0.5px dashed #cbd5e1;
        }

        .alloc-header-tag {
            font-size: 8.5px;
            font-weight: 700;
            text-transform: uppercase;
            color: #0f172a;
            display: inline-block;
            margin-bottom: 4px;
        }

        .alloc-mini-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5px;
            margin-top: 2px;
        }

        .alloc-mini-table th {
            font-size: 7.5px;
            font-weight: 700;
            text-transform: uppercase;
            color: #334155;
            background-color: #f1f5f9;
            border-bottom: 1px solid #94a3b8;
            padding: 3px 5px;
            text-align: left;
        }

        .alloc-mini-table th.text-right {
            text-align: right;
        }

        .alloc-mini-table td {
            padding: 3px 5px;
            border-bottom: 0.5px solid #e2e8f0;
            color: #0f172a;
        }

        .alloc-mini-table td.text-right {
            text-align: right;
        }

        /* ── SIGNATURES ── */
        .signatures-grid {
            display: table;
            width: 100%;
            margin-top: 30px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }

        .sig-cell {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            vertical-align: bottom;
            padding: 0 10px;
        }

        .sig-space {
            height: 38px;
            font-size: 9.5px;
            font-weight: 600;
            color: #334155;
            padding-top: 18px;
        }

        .sig-line {
            width: 100%;
            height: 1px;
            background-color: #0f172a;
        }

        .sig-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #475569;
            margin-top: 4px;
        }

        /* ── FOOTER ── */
        .voucher-footer {
            border-top: 0.5px solid #cbd5e1;
            padding-top: 5px;
            display: table;
            width: 100%;
            page-break-inside: avoid;
        }

        .footer-left {
            display: table-cell;
            vertical-align: middle;
            width: 65%;
            font-size: 7.5px;
            color: #64748b;
        }

        .footer-right {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            width: 35%;
            font-size: 7.5px;
            color: #64748b;
        }
    </style>
</head>

<body>
    <div class="voucher">

        {{-- ═══ HEADER ═══ --}}
        @php
            $f_name = $receipt->firm ? $receipt->firm->name : 'Haramain Traders';
            $f_sub = $receipt->firm ? $receipt->firm->business : 'Wholesale & Supply Chain';
            $f_addr = $receipt->firm ? trim($receipt->firm->address1 . ' ' . $receipt->firm->address2) : 'Karachi, Pakistan';
            $f_phone = $receipt->firm ? $receipt->firm->phone : '+92 300 0000000';
            $f_email = $receipt->firm ? $receipt->firm->email : 'info@haramaintraders.com';
        @endphp
        <div class="header">
            <div class="header-left">
                <div class="company-name">{{ $f_name }}</div>
                <div class="company-sub">{{ $f_sub }} &middot; {{ $f_addr }}</div>
            </div>
            <div class="header-right">
                <div class="voucher-title">Journal Voucher</div>
                <div class="voucher-meta">
                    Voucher #: <strong>{{ $voucher_no }}</strong>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    Date: <strong>{{ \Carbon\Carbon::parse($receipt->date)->format('d M Y') }}</strong>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    Time: <strong>{{ \Carbon\Carbon::parse($receipt->created_at)->setTimezone('Asia/Karachi')->format('h:i A') }}</strong>
                </div>
            </div>
        </div>

        {{-- ═══ JOURNAL ENTRIES TABLE ═══ --}}
        <div class="entry-section-label">Double Entry Transaction</div>
        <table class="entry-table">
            <thead>
                <tr>
                    <th style="width: 15%;">Entry Type</th>
                    <th style="width: 15%;">Account Code</th>
                    <th style="width: 40%;">Account Title</th>
                    <th style="width: 15%;" class="text-right">Debit (Dr)</th>
                    <th style="width: 15%;" class="text-right">Credit (Cr)</th>
                </tr>
            </thead>
            <tbody>
                <!-- Debit Entry -->
                <tr>
                    <td><strong>DEBIT (Dr)</strong></td>
                    <td>{{ $payment->account ? ($payment->account->code ?? '-') : '-' }}</td>
                    <td><strong>{{ $payment->account ? $payment->account->title : 'N/A' }}</strong></td>
                    <td class="text-right"><strong>PKR {{ number_format($payment->amount, 2) }}</strong></td>
                    <td class="text-right">-</td>
                </tr>
                <!-- Credit Entry -->
                <tr>
                    <td><strong>CREDIT (Cr)</strong></td>
                    <td>{{ $receipt->account ? ($receipt->account->code ?? '-') : '-' }}</td>
                    <td><strong>{{ $receipt->account ? $receipt->account->title : 'N/A' }}</strong></td>
                    <td class="text-right">-</td>
                    <td class="text-right"><strong>PKR {{ number_format($receipt->amount, 2) }}</strong></td>
                </tr>
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3"><strong>Total Balanced</strong></td>
                    <td class="text-right"><strong>PKR {{ number_format($payment->amount, 2) }}</strong></td>
                    <td class="text-right"><strong>PKR {{ number_format($receipt->amount, 2) }}</strong></td>
                </tr>
            </tfoot>
        </table>

        {{-- ═══ SUMMARY & AMOUNT IN WORDS ═══ --}}
        <div class="summary-section">
            <div class="amount-words-cell">
                <div class="amount-label-title">Amount in Words</div>
                <div class="amount-words">
                    @if(!empty($amount_in_words))
                        {{ $amount_in_words }}
                    @elseif($receipt->amount_in_words)
                        {{ $receipt->amount_in_words }}
                    @elseif(class_exists(\NumberFormatter::class))
                        {{ ucfirst(\NumberFormatter::create('en', \NumberFormatter::SPELLOUT)->format($receipt->amount)) }} Rupees Only
                    @else
                        PKR {{ number_format($receipt->amount, 2) }}
                    @endif
                </div>
            </div>
        </div>

        {{-- ═══ ALLOCATIONS DETAILS BLOCK ═══ --}}
        @if($receipt->allocations->count() > 0 || $payment->allocations->count() > 0)
            <div class="entry-section-label">Bill Settlement & Allocation Breakdown</div>
            <div class="alloc-block">
                <!-- Source Adjustments (Credit) -->
                <div class="alloc-column">
                    <span class="alloc-header-tag">Source Adjustments (Credit)</span>
                    @if($receipt->allocations->count() == 0)
                        <div style="font-size: 8.5px; color: #64748b; margin-top: 4px;">No individual bill allocations.</div>
                    @else
                        <table class="alloc-mini-table">
                            <thead>
                                <tr>
                                    <th>Invoice / Ref</th>
                                    <th>Bill Type</th>
                                    <th class="text-right">Settled Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($receipt->allocations as $alloc)
                                    <tr>
                                        <td>{{ $alloc->bill ? $alloc->bill->invoice : 'Ref ' . $alloc->bill_id }}</td>
                                        <td>{{ $alloc->bill_type === 'App\Models\Sales' ? 'Sales' : 'Purchase' }}</td>
                                        <td class="text-right">PKR {{ number_format($alloc->amount, 2) }}</td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    @endif
                </div>

                <!-- Destination Adjustments (Debit) -->
                <div class="alloc-column">
                    <span class="alloc-header-tag">Destination Adjustments (Debit)</span>
                    @if($payment->allocations->count() == 0)
                        <div style="font-size: 8.5px; color: #64748b; margin-top: 4px;">No individual bill allocations.</div>
                    @else
                        <table class="alloc-mini-table">
                            <thead>
                                <tr>
                                    <th>Invoice / Ref</th>
                                    <th>Bill Type</th>
                                    <th class="text-right">Settled Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($payment->allocations as $alloc)
                                    <tr>
                                        <td>{{ $alloc->bill ? $alloc->bill->invoice : 'Ref ' . $alloc->bill_id }}</td>
                                        <td>{{ $alloc->bill_type === 'App\Models\Sales' ? 'Sales' : 'Purchase' }}</td>
                                        <td class="text-right">PKR {{ number_format($alloc->amount, 2) }}</td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    @endif
                </div>
            </div>
        @endif

        {{-- ═══ REMARKS ═══ --}}
        @if($receipt->remarks)
            <div class="remarks-row">
                <div class="remarks-label-cell">Remarks / Narration</div>
                <div class="remarks-value-cell">
                    {{ $receipt->remarks }}
                </div>
            </div>
        @endif

        {{-- ═══ SIGNATURES ═══ --}}
        <div class="signatures-grid">
            <div class="sig-cell">
                <div class="sig-space">
                    {{ $receipt->created_by_user->name ?? 'Accounts Dept' }}
                </div>
                <div class="sig-line"></div>
                <div class="sig-label">Prepared By</div>
            </div>
            <div class="sig-cell">
                <div class="sig-space"></div>
                <div class="sig-line"></div>
                <div class="sig-label">Verified By</div>
            </div>
            <div class="sig-cell">
                <div class="sig-space"></div>
                <div class="sig-line"></div>
                <div class="sig-label">Authorised By</div>
            </div>
        </div>

        {{-- ═══ FOOTER ═══ --}}
        <div class="voucher-footer">
            <div class="footer-left">
                Phone: {{ $f_phone }} &nbsp;·&nbsp; Email: {{ $f_email }} &nbsp;·&nbsp; Address: {{ $f_addr }}
            </div>
            <div class="footer-right">
                Computer-generated voucher &middot; Ref: {{ $voucher_no }} &middot; {{ \Carbon\Carbon::parse($receipt->date)->format('d M Y') }}
            </div>
        </div>

    </div>
</body>

</html>
