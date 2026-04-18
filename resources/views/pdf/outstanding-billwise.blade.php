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
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Unified Outstanding Bill Wise Report</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9px;
            color: #000;
            margin: 0;
            padding: 0;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        
        .header {
            margin-bottom: 20px;
        }
        .report-title {
            font-size: 15px;
            margin-bottom: 5px;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
        }

        .logo-section {
            display: inline-block;
            margin-bottom: 10px;
        }
        .brand-name {
            font-size: 26px;
            font-weight: bold;
            color: #1e40af;
            line-height: 1;
        }
        .brand-tagline {
            font-size: 10px;
            color: #334155;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 4px;
            font-weight: bold;
        }
        
        .criteria-text {
            font-size: 9px;
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f1f5f9;
            border-bottom: 2px solid #334155;
            color: #334155;
        }
        
        table.ledger {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #334155;
        }
        table.ledger th, table.ledger td {
            border: 1px solid #94a3b8;
            padding: 6px 4px;
        }
        table.ledger th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            font-size: 8px;
            border: 1px solid #0f172a;
        }
        
        table.ledger tr:nth-child(even) {
            background-color: #f8fafc;
        }
        
        .type-badge {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 7px;
            text-transform: uppercase;
        }
        .type-rec { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .type-pay { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

        table.summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            border: 1px solid #334155;
            border-top: none;
        }
        table.summary-table td {
            padding: 8px 10px;
            font-weight: bold;
            border: 1px solid #94a3b8;
        }
        .summary-label {
            color: #1e293b;
            text-transform: uppercase;
            font-size: 7.5px;
            background-color: #f1f5f9;
        }
        .summary-value {
            color: #0f172a;
            font-size: 10px;
        }

        .net-footer {
            margin-top: 30px;
            background-color: #0f172a;
            color: #fff;
            padding: 20px;
            border-radius: 8px;
        }
        .net-grid {
            width: 100%;
        }
        .net-grid td { vertical-align: top; }
        .stat-label { font-size: 8px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .stat-value { font-size: 14px; font-weight: bold; }

        .party-group {
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
    </style>
</head>
<body>

    @php
       $globalReceivable = collect($data)->filter(fn($i) => $i['bill_type'] === 'receivable')->sum('remaining');
       $globalPayable = collect($data)->filter(fn($i) => $i['bill_type'] === 'payable')->sum('remaining');
       
       $groupedData = collect($data)->groupBy('party_id');

       function formatNum($num) {
           if ($num == 0 || $num == null) return '-';
           return number_format($num, 2);
       }
    @endphp

    <div class="header text-center">
        <div class="logo-section">
            <div class="brand-text">
                <div class="brand-name">Harmain <span style="color:#000">Traders</span></div>
                <div class="brand-tagline">Financial Portfolio Intelligence</div>
            </div>
        </div>
        
        <div class="report-title">Unified Deep Analysis: Outstanding Bill Wise</div>

        <div class="criteria-text">
            <table width="100%">
                <tr>
                    <td width="33%" align="left"><strong>AS ON:</strong> {{ date('d-M-Y', strtotime($to_date)) }}</td>
                    <td width="33%" align="center"><strong>CONSOLIDATED REPORT</strong></td>
                    <td width="33%" align="right"><strong>ACC:</strong> {{ $account ? strtoupper($account->title) : 'ALL UNITS' }}</td>
                </tr>
            </table>
        </div>
    </div>

    @foreach($groupedData as $partyId => $bills)
        @php
            $lastBill = collect($bills)->last();
            $summary = $lastBill['party_summary'] ?? ['party_un_due_amount' => 0, 'party_due_amount' => 0, 'credit_days' => 0, 'credit_limit' => 0, 'party_type' => 'receivable'];
            $partyName = $lastBill['party_name'] ?? 'Unknown';
            $isRec = $summary['party_type'] === 'receivable';
        @endphp

        <div class="party-group">
            <table class="ledger">
                <thead>
                    <tr>
                        <th width="8%">Date</th>
                        <th width="10%">Voucher #</th>
                        <th width="5%">Type</th>
                        <th width="32%">Party/Account Name</th>
                        <th width="10%">Due Date</th>
                        <th width="7%">Aging</th>
                        <th width="9%">Bill Amt</th>
                        <th width="9%">Paid</th>
                        <th width="10%">Remaining</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($bills as $bill)
                        @php
                            $agingColor = $bill['days'] > 0 ? '#b91c1c' : '#059669';
                            $agingWeight = $bill['days'] > 0 ? 'font-bold' : '';
                        @endphp
                    <tr>
                        <td class="text-center">{{ date('d-M-y', strtotime($bill['date'])) }}</td>
                        <td class="text-center font-bold">{{ $bill['voucher_no'] }}</td>
                        <td class="text-center">
                            <span class="type-badge {{ $bill['bill_type'] === 'receivable' ? 'type-rec' : 'type-pay' }}">
                                {{ $bill['bill_type'] === 'receivable' ? 'REC' : 'PAY' }}
                            </span>
                        </td>
                        <td class="font-bold">{{ $bill['party_name'] }}</td>
                        <td class="text-center">{{ date('d-M-y', strtotime($bill['due_date'])) }}</td>
                        <td class="text-center {{ $agingWeight }}" style="color: <?php echo $agingColor; ?>;">
                            {{ $bill['days'] > 0 ? $bill['days'].' d' : abs($bill['days']).' l' }}
                        </td>
                        <td class="text-right">{{ formatNum($bill['bill_amt']) }}</td>
                        <td class="text-right">{{ formatNum($bill['paid']) }}</td>
                        <td class="text-right font-bold">{{ formatNum($bill['remaining']) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <table class="summary-table">
                <tr>
                    <td width="15%" class="summary-label">UN DUE</td>
                    <td width="15%" class="summary-value">{{ formatNum($summary['party_un_due_amount']) }}</td>
                    <td width="15%" class="summary-label" style="color: #b91c1c;">DUE AMOUNT</td>
                    <td width="15%" class="summary-value" style="color: #b91c1c;">{{ formatNum($summary['party_due_amount']) }}</td>
                    <td width="10%" class="summary-label text-right">DAYS</td>
                    <td width="5%" class="summary-value text-right">{{ $summary['credit_days'] }}</td>
                    <td width="12%" class="summary-label text-right">LIMIT</td>
                    <td width="13%" class="summary-value text-right">**********</td>
                </tr>
            </table>
        </div>
    @endforeach

    @if(count($groupedData) > 0)
    <div class="net-footer">
        <table class="net-grid">
            <tr>
                <td width="30%">
                    <div class="stat-label">Total Receivables (Inbound)</div>
                    <div class="stat-value">Rs. {{ number_format($globalReceivable, 2) }}</div>
                </td>
                <td width="30%">
                    <div class="stat-label">Total Payables (Outbound)</div>
                    <div class="stat-value">Rs. {{ number_format($globalPayable, 2) }}</div>
                </td>
                <td width="40%" align="right">
                    @php
                        $netVal = $globalReceivable - $globalPayable;
                        $netColor = $netVal >= 0 ? '#34d399' : '#f87171';
                    @endphp
                    <div class="stat-label" style="color: #818cf8;">Net Portfolio Position</div>
                    <div class="stat-value" style="font-size: 20px; color: <?php echo $netColor; ?>;">
                        Rs. {{ number_format($netVal, 2) }}
                    </div>
                </td>
            </tr>
        </table>
    </div>
    @endif

    <div style="position: fixed; bottom: -20px; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 5px;">
        <table width="100%" style="font-size: 7px; color: #64748b;">
            <tr>
                <td width="33%">Ref: Outstanding Unified Analysis | {{ date('d-M-Y H:i') }}</td>
                <td width="33%" align="center">Harnain Financial OS v4.0</td>
                <td width="33%" align="right">Page 1 of 1</td>
            </tr>
        </table>
    </div>

</body>
</html>
