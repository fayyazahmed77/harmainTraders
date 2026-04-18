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
    <title>Due Bills Report</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px;
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
            font-size: 11px;
            margin-bottom: 20px;
        }
        
        table.ledger {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            border: 1px solid #000;
        }
        table.ledger th, table.ledger td {
            border: 1px solid #000;
            padding: 3px 5px;
        }
        table.ledger th {
            background-color: #f0f0f0; /* Light gray to match image exactly */
            font-weight: bold;
            text-align: center;
        }
        
        table.summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #000;
        }
        table.summary-table td {
            border: 1px solid #000;
            padding: 3px 5px;
            font-weight: bold;
        }
        table.summary-table .label {
            text-align: left;
            background-color: #fff;
        }
        table.summary-table .value {
            text-align: right;
        }

        table.total-table {
            width: 70%;  /* Not full width for absolute totals based on reference */
            border-collapse: collapse;
            margin-top: 5px;
            border: 1px solid #000;
        }
        table.total-table td {
            border: 1px solid #000;
            padding: 3px 5px;
            font-weight: bold;
        }

        .party-group {
            margin-bottom: 30px;
            page-break-inside: avoid;
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
       $globalUnDue = 0;
       $globalDue = 0;
       
       // Re-group data by customer_id if it's not already structured
       $groupedData = collect($data)->groupBy('customer_id');

       function formatNum($num) {
           if ($num == 0 || $num == null) return '';
           return number_format($num);
       }
    @endphp

    <div class="header text-center">
        <div class="logo-section">
            <div class="logo-icon">
                @if($logo_base64)
                    <img src="{{ $logo_base64 }}" width="35" height="35">
                @endif
            </div>
            <div class="brand-text">
                <div class="brand-name">Harmain <span style="color:#000">Traders</span></div>
                <div class="brand-tagline">Wholesale <span style="color:#000">&</span> Supply Chain</div>
            </div>
        </div>
        
        <div style="width: 100%; margin-top: 5px;">
            <div class="report-title" style="border-top: 1px dashed #000; display: inline-block; padding: 5px 30px;">COMPANY WISE DUE BILL REPORT</div>
        </div>

        <div class="criteria-text text-left">
            CRITERIA : Dated As On {{ strtoupper(date('d-M-Y', strtotime($to_date))) }} And Company Name ={{ $account ? strtoupper($account->title) : 'ALL' }}
        </div>
    </div>

    @foreach($groupedData as $customerId => $bills)
        @php
            $lastBill = collect($bills)->last();
            $summary = $lastBill['party_summary'] ?? ['party_un_due_amount' => 0, 'party_due_amount' => 0, 'credit_days' => 0, 'credit_limit' => 0];
            $partyName = $lastBill['party_name'] ?? 'Unknown';
            
            $globalUnDue += $summary['party_un_due_amount'];
            $globalDue += $summary['party_due_amount'];
        @endphp

        <div class="party-group">
            <table class="ledger">
                <thead>
                    <tr>
                        <th width="10%">Date</th>
                        <th width="10%">Voucher #</th>
                        <th width="35%">Party Name</th>
                        <th width="10%">Due Date</th>
                        <th width="5%">Days</th>
                        <th width="10%">Bill Amt</th>
                        <th width="10%">Paid</th>
                        <th width="10%">Remaining</th>
                        <th width="10%">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($bills as $bill)
                    <tr>
                        <td class="text-center">{{ strtoupper(date('d-M-y', strtotime($bill['date']))) }}</td>
                        <td class="text-center">{{ $bill['voucher_no'] }}</td>
                        <td>{{ $bill['party_name'] }}</td>
                        <td class="text-center">{{ strtoupper(date('d-M-y', strtotime($bill['due_date']))) }}</td>
                        <td class="text-center">{{ $bill['days'] }}</td>
                        <td class="text-right">{{ formatNum($bill['bill_amt']) }}</td>
                        <td class="text-right">{{ formatNum($bill['paid']) }}</td>
                        <td class="text-right">{{ formatNum($bill['remaining']) }}</td>
                        <td class="text-right">{{ formatNum($bill['balance']) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <table class="summary-table">
                <tr>
                    <td width="20%" class="text-center">Party Un Due Amount</td>
                    <td width="15%" class="text-center">{{ formatNum($summary['party_un_due_amount']) }}</td>
                    <td width="15%" class="text-center">Due Amount</td>
                    <td width="15%" class="text-center">{{ formatNum($summary['party_due_amount']) }}</td>
                    <td width="10%" class="text-right">Credit Days</td>
                    <td width="5%" class="text-right">{{ $summary['credit_days'] }}</td>
                    <td width="10%" class="text-right">Credit Limit</td>
                    <td width="10%" class="text-right">{{ $summary['credit_limit'] > 0 ? number_format($summary['credit_limit']) : '**********' }}</td>
                </tr>
            </table>
        </div>
    @endforeach

    @if(count($groupedData) > 0)
    <!-- Global Totals matching reference image spacing precisely -->
    <table class="total-table">
        <tr>
            <td width="30%" class="text-center">Total Un Due Amount</td>
            <td width="20%" class="text-center">{{ formatNum($globalUnDue) }}</td>
            <td width="20%" class="text-center">Due Amount</td>
            <td width="30%" class="text-center">{{ formatNum($globalDue) }}</td>
        </tr>
    </table>
    @else
    <p class="text-center" style="margin-top: 50px;">No Due Bills Found.</p>
    @endif

</body>
</html>
