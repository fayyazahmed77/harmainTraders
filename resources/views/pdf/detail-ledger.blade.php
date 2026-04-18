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
    <title>Detail Ledger - {{ $account ? $account->title : 'ALL' }}</title>
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
            font-size: 16px;
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
            margin-bottom: 10px;
            font-size: 11px;
        }
        .filter-info td {
            padding: 2px 0;
        }
        
        table.ledger {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table.ledger th, table.ledger td {
            border: 1px solid #000;
            padding: 4px;
        }
        table.ledger th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        table.ledger .no-border-bottom td {
            border-bottom: none;
        }
        table.ledger .no-border-top td {
            border-top: none;
        }
        
        .totals-table {
            width: 100%;
            border-collapse: collapse;
            font-weight: bold;
            margin-top: 10px;
        }
        .totals-table td {
            border: 1px solid #000;
            padding: 4px;
        }
        
        .footer {
            margin-top: 30px;
            font-size: 10px;
            width: 100%;
        }
        .footer td {
            padding: 2px;
        }
    </style>
</head>
<body>

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
            <div class="report-title" style="border-top: 1px dashed #000; display: inline-block; padding: 5px 30px;">DETAIL LEDGER</div>
        </div>
    </div>

    <table class="filter-info">
        <tr>
            <td width="10%"><span class="font-bold">Date From</span></td>
            <td width="20%">{{ $from_date ? date('d M Y', strtotime($from_date)) : '---' }}</td>
            <td width="10%"><span class="font-bold">To</span></td>
            <td width="20%">{{ $to_date ? date('d M Y', strtotime($to_date)) : '---' }}</td>
            <td width="10%"><span class="font-bold">Account</span></td>
            <td>{{ $account ? $account->title : 'ALL' }}</td>
        </tr>
    </table>

    <table class="ledger">
        <thead>
            <tr>
                <th width="10%">Date</th>
                <th width="10%">Voucher #</th>
                <th width="28%">Description / Remarks</th>
                <th width="6%">Qty</th>
                <th width="8%">T.P.</th>
                <th width="6%">Disc</th>
                <th width="8%">Rate</th>
                <th width="8%">Debit</th>
                <th width="8%">Credit</th>
                <th width="8%">Balance</th>
            </tr>
        </thead>
        <tbody>
            @if($opening_balance > 0)
            <tr>
                <td>{{ $from_date ? date('d M y', strtotime($from_date)) : '' }}</td>
                <td class="text-center font-bold">BBF</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                @if($balance_type == 'dr')
                <td class="text-right">{{ number_format($opening_balance, 0) }}</td>
                <td></td>
                @else
                <td></td>
                <td class="text-right">{{ number_format($opening_balance, 0) }}</td>
                @endif
                <td></td>
            </tr>
            @endif

            @foreach($data as $row)
                @php
                    $detailsCount = count($row->details);
                    $rowsToRender = $detailsCount > 0 ? $detailsCount : 1;
                @endphp

                @for($i = 0; $i < $rowsToRender; $i++)
                    <tr>
                        @if($i == 0)
                            <td>{{ date('d M y', strtotime($row->date)) }}</td>
                            <td>{{ $row->voucher_no }}</td>
                        @else
                            <td></td>
                            <td></td>
                        @endif

                        @if($detailsCount > 0)
                            @php $item = $row->details[$i]; @endphp
                            <td>{{ $item['description'] }}</td>
                            <td class="text-right">{{ $item['qty'] }}</td>
                            <td class="text-right">{{ $item['tp'] }}</td>
                            <td class="text-right">{{ $item['disc'] }}</td>
                            <td class="text-right">{{ $item['rate'] }}</td>
                        @else
                            <td>{{ $row->remarks }}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        @endif

                        @if($i == 0)
                            <td class="text-right">{{ $row->debit > 0 ? number_format($row->debit, 0) : '' }}</td>
                            <td class="text-right">{{ $row->credit > 0 ? number_format($row->credit, 0) : '' }}</td>
                            <td class="text-right">{{ $row->balance ? number_format($row->balance, 0) : '' }}</td>
                        @else
                            <td></td>
                            <td></td>
                            <td></td>
                        @endif
                    </tr>
                @endfor
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td width="20%">Total Debit / Credit</td>
            <td width="20%" class="text-right">{{ number_format($total_debit, 0) }}</td>
            <td width="20%" class="text-right">{{ number_format($total_credit, 0) }}</td>
            <td width="20%">Total Debit / Credit Page Wise</td>
            <td width="10%" class="text-right">{{ number_format($total_debit, 0) }}</td>
            <td width="10%" class="text-right">{{ number_format($total_credit, 0) }}</td>
        </tr>
    </table>

    <table class="footer">
        <tr>
            <td width="33%">{{ date('l F d Y h:i A') }}</td>
            <td width="34%" class="text-center font-bold">Page 1 of 1</td>
            <td width="33%" class="text-right font-bold"><span style="font-weight: normal;">Printed By :</span> {{ auth()->user() ? auth()->user()->name : 'SUPER' }}</td>
        </tr>
        <tr>
            <td colspan="3" class="text-center" style="padding-top: 10px; border-top: 1px solid #000;">
                Software Designed By Aishtycoons : 0300-2086828
            </td>
        </tr>
    </table>

</body>
</html>
