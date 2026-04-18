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
    <title>Ledger - {{ $account ? $account->title : 'ALL' }}</title>
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
        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .report-title {
            font-size: 13px;
            margin-bottom: 20px;
            text-transform: uppercase;
        }

        /* Logo Styles */
        .logo-section {
            display: inline-block;
            margin-bottom: 10px;
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
        
        .filter-info {
            width: 100%;
            margin-bottom: 5px;
            font-size: 11px;
        }
        .filter-info td {
            padding: 2px 0;
        }
        
        table.ledger {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 2px solid #000;
        }
        table.ledger th, table.ledger td {
            border: 1px solid #000;
            padding: 4px;
        }
        table.ledger th {
            background-color: #e5e7eb;
            font-weight: bold;
            text-align: center;
        }
        
        .footer-totals-wrapper {
            width: 100%;
            margin-top: 80px;
        }
        .totals-table {
            width: 60%;
            float: right;
            border-collapse: collapse;
            font-weight: bold;
        }
        .totals-table td {
            border: 1px solid #000;
            padding: 4px 6px;
        }
        
        .footer {
            margin-top: 50px;
            font-size: 10px;
            width: 100%;
        }
        .footer td {
            padding: 2px;
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
        function formatVoucherNo($type, $id, $credit, $debit) {
            if ($type === 'Sale') return str_pad($id, 6, "0", STR_PAD_LEFT);
            if ($type === 'Purchase') return str_pad($id, 6, "0", STR_PAD_LEFT);
            if ($type === 'Sales Return') return 'SR-' . str_pad($id, 6, "0", STR_PAD_LEFT);
            if ($type === 'Purchase Return') return 'PR-' . str_pad($id, 6, "0", STR_PAD_LEFT);
            if ($type === 'Payment') {
                if ($credit > 0) return 'BR-' . $id; 
                else return 'BP-' . $id; 
            }
            return $id;
        }

        function formatRemarks($type, $description) {
            // Already uppercase or contains brackets, just return it
            if (stripos($description, '{') !== false) return strtoupper($description);

            if ($type === 'Sale') return 'TOTAL SALES { SALE }';
            if ($type === 'Purchase') return 'TOTAL PURCHASE { PURCHASE }';
            if ($type === 'Sales Return') return 'SALES RETURN { RETURN }';
            if ($type === 'Purchase Return') return 'PURCHASE RETURN { RETURN }';
            if ($type === 'Payment') {
                if(trim(strtoupper($description)) === 'CASH IN HAND') {
                    return 'CASH IN HAND { BNK_REC }';
                }
                return 'CASH IN HAND { ' . strtoupper($description ?: 'BNK_REC') . ' }';
            }
            return strtoupper($description);
        }

        function renderBalance($bal, $orient) {
            if (round($bal, 2) == 0) return 'CR';
            return number_format(abs($bal), 0) . ' ' . ($bal > 0 ? strtoupper($orient) : ($orient == 'cr' ? 'DR' : 'CR'));
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
            <div class="report-title" style="border-top: 1px dashed #000; display: inline-block; padding: 5px 30px;">GENERAL LEDGER</div>
        </div>
    </div>

    <table class="filter-info">
        <tr>
            <td width="10%"><span class="font-bold">Date From</span></td>
            <td width="15%" class="font-bold">{{ $from_date ? date('d M Y', strtotime($from_date)) : '---' }}</td>
            <td width="5%" class="text-center"><span class="font-bold">To</span></td>
            <td width="15%" class="font-bold">{{ $to_date ? date('d M Y', strtotime($to_date)) : '---' }}</td>
            <td width="10%"><span class="font-bold">Account</span></td>
            <td width="30%" class="font-bold">{{ $account ? strtoupper($account->title) : 'ALL' }}</td>
            <td width="15%" class="font-bold text-right">{{ isset($account->area) ? strtoupper($account->area->name) : '' }}</td>
        </tr>
    </table>

    <table class="ledger">
        <thead>
            <tr>
                <th width="10%">Date</th>
                <th width="12%">Voucher #</th>
                <th width="33%">Remarks</th>
                <th width="8%">Chq #</th>
                <th width="8%">Chq Dt</th>
                <th width="9%">Debit</th>
                <th width="9%">Credit</th>
                <th width="11%">Balance</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="text-center">{{ $from_date ? date('d-M-y', strtotime($from_date)) : '' }}</td>
                <td class="text-center">BBF</td>
                <td>{ }</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td class="text-right">{{ renderBalance($opening_balance, $balance_type) }}</td>
            </tr>

            @foreach($data as $row)
            <tr>
                <td class="text-center">{{ date('d-M-y', strtotime($row->date)) }}</td>
                <td class="text-center">{{ formatVoucherNo($row->type, $row->id, $row->credit, $row->debit) }}</td>
                <td>{{ formatRemarks($row->type, $row->description) }}</td>
                <td class="text-center">{{ $row->cheque_no }}</td>
                <td class="text-center">{{ $row->cheque_date ? date('d-m-y', strtotime($row->cheque_date)) : '' }}</td>
                <td class="text-right">{{ $row->debit > 0 ? number_format($row->debit, 0) : '' }}</td>
                <td class="text-right">{{ $row->credit > 0 ? number_format($row->credit, 0) : '' }}</td>
                <td class="text-right">{{ renderBalance($row->balance, $balance_type) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer-totals-wrapper clearfix">
        <table class="totals-table">
            <tr>
                <td width="20%">Total Debit</td>
                <td width="30%" class="text-right">{{ number_format($total_debit, 0) }}</td>
                <td width="20%">Total Credit</td>
                <td width="30%" class="text-right">{{ number_format($total_credit, 0) }}</td>
            </tr>
        </table>
    </div>

    <table class="footer">
        <tr>
            <td width="33%" class="font-bold">{{ date('l F d Y h:i A') }}</td>
            <td width="34%" class="text-center font-bold">Page 1 of 1</td>
            <td width="33%" class="text-right font-bold"><span style="font-weight: normal;">Printed By :</span> {{ auth()->user() ? strtoupper(auth()->user()->name) : 'SUPER' }}</td>
        </tr>
        <tr>
            <td colspan="3" class="text-center" style="padding-top: 10px; border-top: 1px solid #000;">
                Software Designed By Aishtycoons : 0300-2086828
            </td>
        </tr>
    </table>

</body>
</html>