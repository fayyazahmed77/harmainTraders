@php
$logo_path = public_path('storage/img/favicon.png');
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
    <title>Payment Detail Report</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 9px; color: #1e293b; margin: 0; padding: 0; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        
        .header { margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
        .brand-name { font-size: 24px; font-weight: bold; color: #1e3a8a; }
        .brand-tagline { font-size: 8px; color: #475569; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; font-weight: bold; }
        .report-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #1e3a8a; margin-top: 5px; }
        
        .criteria { background: #f8fafc; padding: 10px; border: 1px solid #94a3b8; margin-bottom: 15px; border-radius: 4px; }
        .criteria-table { width: 100%; }
        .criteria-label { color: #334155; text-transform: uppercase; font-size: 7px; font-weight: bold; }
        .criteria-value { color: #0f172a; font-size: 9px; font-weight: bold; }

        table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table.data-table th { background: #0f172a; color: white; padding: 8px 6px; text-transform: uppercase; font-size: 8px; text-align: left; border: 1px solid #0f172a; }
        table.data-table td { padding: 8px 6px; border: 1px solid #94a3b8; vertical-align: middle; }
        table.data-table tr:nth-child(even) { background-color: #f8fafc; }
        
        .footer-summary { margin-top: 20px; background: #0f172a; color: white; padding: 15px; border-radius: 6px; }
        .footer-label { font-size: 8px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px; }
        .footer-value { font-size: 16px; font-weight: bold; margin-top: 4px; }

        .remarks-text { font-size: 8px; color: #334155; }
    </style>
</head>
<body>
    <div class="header text-center">
        <div class="brand-name">Harmain <span style="color:#000">Traders</span></div>
        <div class="brand-tagline">Financial Portfolio Intelligence</div>
        <div class="report-title">Payment Detail Analysis</div>
    </div>

    <div class="criteria">
        <table class="criteria-table">
            <tr>
                <td width="33%">
                    <div class="criteria-label">Reporting Period</div>
                    <div class="criteria-value">{{ date('d M, Y', strtotime($from_date)) }} - {{ date('d M, Y', strtotime($to_date)) }}</div>
                </td>
                <td width="33%" align="center">
                    <div class="criteria-label">Execution Type</div>
                    <div class="criteria-value">OUTBOUND PAYMENTS</div>
                </td>
                <td width="33%" align="right">
                    <div class="criteria-label">Primary Account</div>
                    <div class="criteria-value">{{ $account ? strtoupper($account->title) : 'ALL CONSOLIDATED UNITS' }}</div>
                </td>
            </tr>
        </table>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th width="10%">Voucher #</th>
                <th width="10%">Date</th>
                <th width="28%">Account Title</th>
                <th width="12%">Payment Source</th>
                <th width="12%" class="text-right">Amount</th>
                <th width="12%" class="text-right">Balance</th>
                <th width="16%">Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
            <tr>
                <td class="text-center font-bold" style="color: #1e3a8a;">{{ $row['voucher_no'] }}</td>
                <td class="text-center">{{ date('d-M-y', strtotime($row['date'])) }}</td>
                <td class="font-bold">{{ strtoupper($row['party_name']) }}</td>
                <td style="color: #4f46e5; font-weight: bold;">{{ $row['bank_name'] }}</td>
                <td class="text-right font-bold" style="font-size: 10px;">{{ number_format($row['amount'], 2) }}</td>
                <td class="text-right font-bold" style="font-size: 10px; color: #334155;">{{ number_format($row['balance'], 2) }}</td>
                <td class="remarks-text">{{ $row['remarks'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer-summary">
        <table width="100%">
            <tr>
                <td width="60%">
                    <div class="footer-label">Total Settled Portfolio Volume</div>
                    <div class="footer-value">PKR {{ number_format(collect($data)->sum('amount'), 2) }}</div>
                </td>
                <td width="40%" align="right" style="vertical-align: bottom;">
                    <div style="font-size: 7px; color: #94a3b8; text-transform: uppercase;">Generated via Harnain Finance OS</div>
                    <div style="font-size: 8px; color: white;">{{ date('d-M-Y H:i:s') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div style="position: fixed; bottom: -20px; width: 100%; text-align: center; font-size: 7px; color: #94a3b8;">
        Page 1 of 1 | Confidential Financial Intelligence
    </div>
    @if(isset($is_print_mode) && $is_print_mode)
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
    @endif
</body>
</html>
