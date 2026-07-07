<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Journal Voucher - {{ $voucher_no }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
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

        .voucher {
            width: 100%;
            background: #ffffff;
        }

        /* ── HEADER ── */
        .header {
            display: table;
            width: 100%;
            border-bottom: 2px solid #000000;
            padding-bottom: 8px;
            margin-bottom: 15px;
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

        /* ── DOUBLE ENTRY TABLE ── */
        .entry-section-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #333333;
            margin-bottom: 3px;
            margin-top: 10px;
        }

        .entry-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 15px;
        }

        .entry-table thead th {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #000000;
            background-color: #eeeeee;
            padding: 5px 8px;
            text-align: left;
            border: 0.5px solid #aaaaaa;
        }

        .entry-table thead th.text-right {
            text-align: right;
        }

        .entry-table tbody td {
            padding: 6px 8px;
            border: 0.5px solid #cccccc;
            font-size: 10px;
            color: #000000;
            vertical-align: middle;
        }

        .entry-table tbody td.text-right {
            text-align: right;
        }

        .entry-table tfoot td {
            padding: 6px 8px;
            border: 0.5px solid #aaaaaa;
            background-color: #eeeeee;
            font-size: 10px;
            font-weight: 700;
            color: #000000;
        }

        .entry-table tfoot td.text-right {
            text-align: right;
        }

        /* ── SUMMARY SECTION ── */
        .summary-section {
            display: table;
            width: 100%;
            margin-top: 6px;
            margin-bottom: 15px;
            border: 1px solid #bbbbbb;
            border-collapse: collapse;
        }

        .amount-words-cell {
            display: table-cell;
            width: 100%;
            padding: 8px 10px;
            vertical-align: top;
        }

        .amount-label-title {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            color: #555555;
            letter-spacing: 0.5px;
        }

        .amount-words {
            font-size: 11px;
            font-weight: 700;
            color: #000000;
            font-style: italic;
            margin-top: 4px;
            line-height: 1.3;
        }

        /* ── REMARKS ── */
        .remarks-row {
            display: table;
            width: 100%;
            border: 1px solid #bbbbbb;
            margin-bottom: 15px;
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
            margin-top: 25px;
            margin-bottom: 25px;
        }

        .sig-cell {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            vertical-align: bottom;
            padding: 0 8px;
        }

        .sig-space {
            height: 48px;
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

        /* ── ALLOCATION BLOCK ── */
        .alloc-block {
            display: table;
            width: 100%;
            margin-bottom: 15px;
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
            border-left: 0.5px dashed #bbbbbb;
        }

        .alloc-mini-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-top: 4px;
        }

        .alloc-mini-table th {
            font-size: 7.5px;
            font-weight: 700;
            text-transform: uppercase;
            color: #000;
            border-bottom: 1px solid #000;
            padding: 3px 4px;
            text-align: left;
        }

        .alloc-mini-table th.text-right {
            text-align: right;
        }

        .alloc-mini-table td {
            padding: 3px 4px;
            border-bottom: 0.5px solid #dddddd;
            color: #222;
        }

        .alloc-mini-table td.text-right {
            text-align: right;
        }
    </style>
</head>

<body>
    <div class="voucher">

        {{-- ═══ HEADER ═══ --}}
        @php
            $f_name = $receipt->firm ? $receipt->firm->name : 'Harmain Traders';
            $f_sub = $receipt->firm ? $receipt->firm->business : 'Wholesale & Supply Chain';
            $f_addr = $receipt->firm ? trim($receipt->firm->address1 . ' ' . $receipt->firm->address2) : 'Karachi, Pakistan';
            $f_phone = $receipt->firm ? $receipt->firm->phone : '+92 300 0000000';
            $f_email = $receipt->firm ? $receipt->firm->email : 'info@harmaintraders.com';
            $f_website = $receipt->firm ? $receipt->firm->website : 'aishtycoons.agency';
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
                    &nbsp;&nbsp;
                    Time: <strong>{{ \Carbon\Carbon::parse($receipt->created_at)->setTimezone('Asia/Karachi')->format('h:i A') }}</strong>
                </div>
            </div>
        </div>

        {{-- ═══ JOURNAL ENTRIES TABLE ═══ --}}
        <div class="entry-section-label">Double Entry Transaction</div>
        <table class="entry-table">
            <thead>
                <tr>
                    <th style="width: 15%;">Type</th>
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
                    <td>{{ $payment->account ? $payment->account->code : '-' }}</td>
                    <td><strong>{{ $payment->account ? $payment->account->title : 'N/A' }}</strong></td>
                    <td class="text-right"><strong>PKR {{ number_format($payment->amount, 2) }}</strong></td>
                    <td class="text-right">-</td>
                </tr>
                <!-- Credit Entry -->
                <tr>
                    <td><strong>CREDIT (Cr)</strong></td>
                    <td>{{ $receipt->account ? $receipt->account->code : '-' }}</td>
                    <td><strong>{{ $receipt->account ? $receipt->account->title : 'N/A' }}</strong></td>
                    <td class="text-right">-</td>
                    <td class="text-right"><strong>PKR {{ number_format($receipt->amount, 2) }}</strong></td>
                </tr>
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3"><strong>Total</strong></td>
                    <td class="text-right"><strong>PKR {{ number_format($payment->amount, 2) }}</strong></td>
                    <td class="text-right"><strong>PKR {{ number_format($receipt->amount, 2) }}</strong></td>
                </tr>
            </tfoot>
        </table>

        {{-- ═══ REDESIGNED SUMMARY & AMOUNT IN WORDS SECTION ═══ --}}
        <div class="summary-section">
            <div class="amount-words-cell">
                <div class="amount-label-title">Amount in Words</div>
                <div class="amount-words">
                    @if($receipt->amount_in_words)
                        {{ $receipt->amount_in_words }}
                    @else
                        {{ \NumberFormatter::create('en', \NumberFormatter::SPELLOUT)->format($receipt->amount) }} rupees only
                    @endif
                </div>
            </div>
        </div>

        {{-- ═══ ALLOCATIONS DETAILS BLOCK ═══ --}}
        @if($receipt->allocations->count() > 0 || $payment->allocations->count() > 0)
            <div class="entry-section-label">Settlement / Allocations Breakdown</div>
            <div class="alloc-block">
                <!-- Source Adjustments (Credit) -->
                <div class="alloc-column">
                    <span style="font-weight: bold; color: #b91c1c;">Source Adjustments (Credit)</span>
                    @if($receipt->allocations->count() == 0)
                        <div style="font-size: 9px; color: #777; margin-top: 4px;">No adjustments.</div>
                    @else
                        <table class="alloc-mini-table">
                            <thead>
                                <tr>
                                    <th>Ref / Invoice</th>
                                    <th>Type</th>
                                    <th class="text-right">Adjusted Amount</th>
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
                    <span style="font-weight: bold; color: #047857;">Destination Adjustments (Debit)</span>
                    @if($payment->allocations->count() == 0)
                        <div style="font-size: 9px; color: #777; margin-top: 4px;">No adjustments.</div>
                    @else
                        <table class="alloc-mini-table">
                            <thead>
                                <tr>
                                    <th>Ref / Invoice</th>
                                    <th>Type</th>
                                    <th class="text-right">Adjusted Amount</th>
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
                <div class="remarks-label-cell">Remarks / Note</div>
                <div class="remarks-value-cell">
                    {{ $receipt->remarks }}
                </div>
            </div>
        @endif

        {{-- ═══ SIGNATURES ═══ --}}
        <div class="signatures-grid">
            <div class="sig-cell">
                <div class="sig-space" style="font-size: 10px; font-weight: bold; padding-top: 12px; height: 28px;">
                    {{ $receipt->created_by_user->name ?? 'Fayyaz Ahmed' }}
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
                Computer-generated &middot; {{ $voucher_no }} &middot; {{ \Carbon\Carbon::parse($receipt->date)->format('d M Y') }}
            </div>
        </div>

    </div>
</body>

</html>
