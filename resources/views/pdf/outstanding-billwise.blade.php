@php
$logo_path = storage_path('app/public/img/favicon.png');
if (!file_exists($logo_path)) {
    $logo_path = public_path('storage/img/favicon.png');
}

$logo_base64 = "";
if (file_exists($logo_path)) {
    $logo_data = file_get_contents($logo_path);
    $logo_type = pathinfo($logo_path, PATHINFO_EXTENSION);
    $logo_base64 = 'data:image/' . $logo_type . ';base64,' . base64_encode($logo_data);
}

$globalReceivable = (float)collect($data)->filter(fn($i) => ($i['bill_type'] ?? '') === 'receivable')->sum('remaining');
$globalPayable = (float)collect($data)->filter(fn($i) => ($i['bill_type'] ?? '') === 'payable')->sum('remaining');
$globalTotalRemaining = (float)collect($data)->sum('remaining');
$globalTotalBilled = (float)collect($data)->sum('bill_amt');
$globalTotalPaid = (float)collect($data)->sum('paid');

$groupedData = collect($data)->groupBy('party_id');

if (!function_exists('formatNum')) {
    function formatNum($num) {
        if ($num === 0 || $num === 0.0 || $num == null) return '-';
        return number_format((float)$num, 2);
    }
}
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Outstanding Bill-Wise Report - {{ !empty($account) ? $account->title : 'Consolidated' }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 7mm 7mm 8mm 7mm;
        }
        
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 8.5px;
            color: #000000;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
            line-height: 1.25;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }

        .header {
            margin-bottom: 15px;
        }
        .report-title {
            font-size: 13px;
            margin-bottom: 10px;
            font-weight: bold;
        }

        /* Logo Styles */
        .logo-section {
            display: inline-block;
            margin-bottom: 5px;
        }
        .logo-icon {
            display: inline-block;
            vertical-align: middle;
            margin-right: 10px;
        }
        .brand-text {
            display: inline-block;
            vertical-align: middle;
            text-align: left;
        }
        .brand-name {
            font-size: 20px;
            font-weight: bold;
            color: #444;
            line-height: 1;
        }
        .brand-tagline {
            font-size: 9px;
            color: #888;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-top: 2px;
        }
        
        .criteria-text {
            font-size: 10.5px;
            margin-bottom: 15px;
            font-weight: bold;
        }

        /* Ledger Table */
        .party-section {
            margin-bottom: 15px;
            page-break-inside: avoid;
        }

        table.ledger-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000000;
        }

        table.ledger-table thead {
            display: table-header-group;
        }

        table.ledger-table tr {
            page-break-inside: avoid;
        }

        table.ledger-table th {
            background-color: #f0f0f0;
            color: #000000;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 8px;
            padding: 5px 4px;
            border: 1px solid #000000;
            letter-spacing: 0.3px;
        }

        table.ledger-table td {
            border: 1px solid #1d1c1cff;
            padding: 4px 4px;
            font-size: 8.5px;
            vertical-align: middle;
        }

        table.ledger-table tbody tr:nth-child(even) {
            background-color: #fbfbfb;
        }

        .type-badge-bw {
            display: inline-block;
            border: 1px solid #000000;
            padding: 1px 4px;
            font-weight: bold;
            font-size: 7px;
            background-color: #ffffff;
            color: #000000;
            text-transform: uppercase;
            border-radius: 2px;
        }

        /* Party Subtotal / Summary Bar */
        table.party-summary-bar {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000000;
            border-top: none;
            background-color: #f4f4f4;
            margin-bottom: 12px;
        }

        table.party-summary-bar td {
            padding: 5px 6px;
            border: 1px solid #999999;
            font-size: 8.5px;
        }

        .summary-bar-label {
            font-size: 7.5px;
            font-weight: bold;
            color: #333333;
            text-transform: uppercase;
            background-color: #e8e8e8;
        }

        .summary-bar-val {
            font-weight: bold;
            color: #000000;
            font-size: 9px;
        }

        /* Grand Total Statement Summary */
        .grand-summary-container {
            width: 100%;
            margin-top: 10px;
            page-break-inside: avoid;
        }

        table.grand-summary-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000000;
            background-color: #ffffff;
        }

        table.grand-summary-table th {
            background-color: #f0f0f0;
            border: 1px solid #000000;
            padding: 5px 8px;
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
            color: #000000;
        }

        table.grand-summary-table td {
            border: 1px solid #000000;
            padding: 6px 8px;
            font-size: 9px;
            vertical-align: middle;
        }

        .double-underline {
            border-top: 1px solid #000000;
            border-bottom: 3px double #000000;
            padding-top: 2px;
            padding-bottom: 2px;
        }

        /* Signatures block */
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
            page-break-inside: avoid;
        }

        .signatures-table td {
            padding: 0 15px;
            vertical-align: bottom;
            text-align: center;
        }

        .sig-line {
            border-top: 1px solid #000000;
            margin-top: 25px;
            padding-top: 4px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            color: #222222;
        }

        /* Print Fixed Footer */
        .doc-footer {
            margin-top: 15px;
            padding-top: 4px;
            border-top: 1px solid #666666;
            font-size: 7.5px;
            color: #444444;
            width: 100%;
        }

        @media print {
            .no-print { display: none !important; }
            body { margin: 0; padding: 0; }
        }
    </style>
</head>
<body>

    <!-- Header matching Due Bills style -->
    <div class="header text-center">
        <div class="logo-section">
            <div class="logo-icon">
                @if($logo_base64)
                    <img src="{{ $logo_base64 }}" width="35" height="35">
                @endif
            </div>
            <div class="brand-text">
                <div class="brand-name">Haramain <span style="color:#000">Traders</span></div>
                <div class="brand-tagline">Wholesale <span style="color:#000">&</span> Supply Chain</div>
            </div>
        </div>
        
        <div style="width: 100%; margin-top: 5px;">
            <div class="report-title" style="border-top: 1px dashed #000; display: inline-block; padding: 5px 30px;">OUTSTANDING BILL REPORT</div>
        </div>

        @include('pdf.partials.criteria')
    </div>

    <!-- Ledger Tables Grouped by Party -->
    @foreach($groupedData as $partyId => $bills)
        @php
            $lastBill = collect($bills)->last();
            $summary = $lastBill['party_summary'] ?? [
                'party_un_due_amount' => 0, 
                'party_due_amount' => 0, 
                'credit_days' => 0, 
                'credit_limit' => 0, 
                'party_type' => 'payable'
            ];
            $partyName = $lastBill['party_name'] ?? 'Unknown Party';
            $isRec = ($summary['party_type'] ?? '') === 'receivable';
            $partyTotalRemaining = (float)collect($bills)->sum('remaining');
            $partyTotalBilled = (float)collect($bills)->sum('bill_amt');
            $partyTotalPaid = (float)collect($bills)->sum('paid');
        @endphp

        <div class="party-section">
            <table class="ledger-table">
                <thead>
                    <tr>
                        <th width="8%" class="text-center">Date</th>
                        <th width="11%" class="text-center">Voucher #</th>
                        <th width="20%" class="text-left">Party </th>
                        <th width="8%" class="text-center">Due Date</th>
                        <th width="10%" class="text-center">Aging </th>
                        <th width="9%" class="text-right">Bill Amt </th>
                        <th width="9%" class="text-right">Paid </th>
                        <th width="9%" class="text-right">Remaining </th>
                        <th width="10%" class="text-right">Balance </th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($bills as $bill)
                        @php
                            $isOB = !empty($bill['is_opening_balance']) || str_starts_with($bill['voucher_no'] ?? '', 'OPENING-BAL');
                            $daysVal = (int)($bill['days'] ?? 0);
                            
                            // Clear, unambiguous aging representation
                            if ((!empty($bill['type']) && in_array($bill['type'], ['PAYMENT', 'RECEIPT'])) || ($bill['remaining'] ?? 0) < 0 || ($bill['bill_amt'] ?? 0) < 0) {
                                $agingText = 'Advance';
                            } elseif ($daysVal > 0) {
                                $agingText = $daysVal . 'd Overdue';
                            } elseif ($daysVal === 0) {
                                $agingText = 'Due Today';
                            } else {
                                $agingText = abs($daysVal) . 'd Left';
                            }

                            $billTypeLabel = strtoupper($bill['bill_type'] ?? '');
                            if ($isOB) {
                                if (str_contains($bill['voucher_no'] ?? '', 'DR') || ($bill['remaining'] ?? 0) < 0) {
                                    $typeBadge = 'ADV (DR)';
                                } else {
                                    $typeBadge = 'OB (CR)';
                                }
                            } else {
                                $typeBadge = $billTypeLabel === 'RECEIVABLE' ? 'REC' : 'PAY';
                            }
                        @endphp
                        <tr>
                            <td class="text-center">
                                {{ !empty($bill['date']) ? date('d-M-y', strtotime($bill['date'])) : '-' }}
                            </td>
                            <td class="text-center font-bold">
                                {{ $bill['voucher_no'] }}
                            </td>
                          
                            <td class="text-left font-bold">
                                {{ $bill['party_name'] }}
                            </td>
                            <td class="text-center">
                                {{ !empty($bill['due_date']) ? date('d-M-y', strtotime($bill['due_date'])) : '-' }}
                            </td>
                            <td class="text-center font-bold">
                                {{ $agingText }}
                            </td>
                            <td class="text-right">
                                {{ formatNum($bill['bill_amt']) }}
                            </td>
                            <td class="text-right">
                                {{ formatNum($bill['paid']) }}
                            </td>
                            <td class="text-right">
                                {{ formatNum($bill['remaining']) }}
                            </td>
                            <td class="text-right font-bold">
                                {{ formatNum($bill['balance']) }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <!-- Party Summary Bar -->
            <!-- Party Summary Bar -->
            <table class="party-summary-bar">
                <tr>
                  
                    <td width="10%" class="summary-bar-label text-center">Overdue</td>
                    <td width="11%" class="summary-bar-val text-right">{{ formatNum($summary['party_due_amount']) }}</td>
                    
                    <td width="8%" class="summary-bar-label text-center">Terms</td>
                    <td width="8%" class="summary-bar-val text-center">{{ $summary['credit_days'] }} Days</td>
                    
                    <td width="11%" class="summary-bar-label text-center" style="background-color: #e2e8f0;">Ledger Bal</td>
                    <td width="13%" class="summary-bar-val text-right font-bold" style="background-color: #f1f5f9;">
                        Rs. {{ formatNum($summary['current_balance'] ?? $partyTotalRemaining) }}
                    </td>
                    
                    <td width="11%" class="summary-bar-label text-center" style="background-color: #dedede;">Outstanding</td>
                    <td width="17%" class="summary-bar-val text-right double-underline font-bold" style="background-color: #f0f0f0;">
                        Rs. {{ formatNum($partyTotalRemaining) }}
                    </td>
                </tr>
            </table>
        </div>
    @endforeach

    <!-- Grand Statement Summary Table -->
    @if(count($groupedData) > 0)
    <div class="grand-summary-container">
        <table class="grand-summary-table">
            <thead>
                <tr>
                    <th width="25%" class="text-center">Total Invoices / Bills</th>
                    <th width="25%" class="text-right">Total Billed Amount</th>
                    <th width="25%" class="text-right">Total Amount Settled</th>
                    <th width="25%" class="text-right">Net Total Outstanding</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="text-center font-bold">
                        {{ count($data) }} Record(s) across {{ count($groupedData) }} Account(s)
                    </td>
                    <td class="text-right font-bold">
                        Rs. {{ number_format($globalTotalBilled, 2) }}
                    </td>
                    <td class="text-right font-bold">
                        Rs. {{ number_format($globalTotalPaid, 2) }}
                    </td>
                    <td class="text-right font-bold" style="font-size: 11px;">
                        <span class="double-underline">
                            Rs. {{ number_format($globalTotalRemaining, 2) }}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td colspan="4" class="text-left" style="background-color: #fafafa; font-size: 8px;">
                        <strong>Portfolio Position:</strong>
                        @php
                            $isSupplierParty = !empty($account) ? ((bool)($account->purchase ?? false) || (int)($account->type ?? 0) === 6 || strtolower($account->accountType->name ?? '') === 'supplier') : false;
                        @endphp
                        @if($globalPayable > 0.005 && $globalReceivable > 0.005)
                            Total Outbound Payables: <strong>Rs. {{ number_format($globalPayable, 2) }}</strong> &nbsp;|&nbsp; 
                            Total Inbound Receivables: <strong>Rs. {{ number_format($globalReceivable, 2) }}</strong> &nbsp;|&nbsp; 
                            Net Balance: <strong>Rs. {{ number_format(abs($globalReceivable - $globalPayable), 2) }} {{ $globalReceivable >= $globalPayable ? '(Receivable / Advance)' : '(Payable)' }}</strong>
                        @elseif($globalPayable > 0.005)
                            Total Outbound Payables (Obligations to Suppliers): <strong>Rs. {{ number_format($globalPayable, 2) }}</strong>
                        @elseif($globalPayable < -0.005)
                            Total Outbound Advance (Prepayments to Suppliers): <strong>Rs. {{ number_format(abs($globalPayable), 2) }}</strong>
                        @elseif($globalReceivable > 0.005)
                            @if($isSupplierParty)
                                Total Outbound Advance (Prepayments to Suppliers): <strong>Rs. {{ number_format($globalReceivable, 2) }} DR</strong>
                            @else
                                Total Inbound Receivables (Claims from Customers): <strong>Rs. {{ number_format($globalReceivable, 2) }}</strong>
                            @endif
                        @elseif($globalReceivable < -0.005)
                            Total Inbound Advance (Customer Credits): <strong>Rs. {{ number_format(abs($globalReceivable), 2) }}</strong>
                        @else
                            Account is fully reconciled. Zero outstanding balance.
                        @endif
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Official Signatures Block -->
    <table class="signatures-table">
        <tr>
            <td width="25%">
                <div class="sig-line">Prepared By</div>
            </td>
            <td width="25%">
                <div class="sig-line">Checked &amp; Audited By</div>
            </td>
            <td width="25%">
                <div class="sig-line">Accounts Manager</div>
            </td>
            <td width="25%">
                <div class="sig-line">Party Acknowledgment</div>
            </td>
        </tr>
    </table>
    @endif

    <!-- Document Footer -->
    <div class="doc-footer">
        <table width="100%">
            <tr>
                <td width="40%" class="text-left">
                    Haramain Traders ERP &bull; Official Outstanding Bill-Wise Audit Statement
                </td>
                <td width="30%" class="text-center">
                    Printed On: {{ date('d-M-Y \a\t h:i A') }}
                </td>
                <td width="30%" class="text-right">
                    Confidential Financial Document
                </td>
            </tr>
        </table>
    </div>

    @if(!empty($is_print_mode))
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
    @endif
</body>
</html>
