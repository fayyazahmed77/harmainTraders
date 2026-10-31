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
    <title>Bank Ledger - {{ $account ? $account->title : 'ALL' }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #111;
            margin: 0;
            padding: 15px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        
        .header {
            margin-bottom: 12px;
        }
        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 3px;
            text-transform: uppercase;
        }
        .report-title {
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Logo Styles */
        .logo-section {
            display: inline-block;
            margin-bottom: 6px;
        }
        .logo-icon {
            display: inline-block;
            vertical-align: middle;
            margin-right: 8px;
        }
        .brand-text {
            display: inline-block;
            vertical-align: middle;
            text-align: left;
        }
        .brand-name {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            line-height: 1;
        }
        .brand-tagline {
            font-size: 8px;
            color: #666;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-top: 2px;
        }
        
        /* KPI Cards Grid */
        .kpi-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .kpi-table td {
            width: 20%;
            border: 1px solid #d1d5db;
            padding: 6px 8px;
            vertical-align: top;
            background-color: #f9fafb;
        }
        .kpi-title {
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 3px;
        }
        .kpi-value {
            font-size: 13px;
            font-weight: bold;
            color: #111827;
        }
        .kpi-subtext {
            font-size: 7.5px;
            color: #9ca3af;
            margin-top: 2px;
        }

        .filter-info {
            width: 100%;
            margin-bottom: 10px;
            font-size: 10px;
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            padding: 4px 6px;
        }
        .filter-info td {
            padding: 3px 6px;
        }
        
        table.ledger {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            border: 1.5px solid #000;
        }
        table.ledger th, table.ledger td {
            border: 1px solid #9ca3af;
            padding: 4px 5px;
        }
        table.ledger th {
            background-color: #e5e7eb;
            font-weight: bold;
            text-align: center;
            font-size: 9px;
            text-transform: uppercase;
        }
        
        .badge-cleared {
            background-color: #d1fae5;
            color: #065f46;
            padding: 2px 4px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 8px;
            display: inline-block;
        }
        .badge-pending {
            background-color: #fef3c7;
            color: #92400e;
            padding: 2px 4px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 8px;
            display: inline-block;
        }
        .no-impact-note {
            font-size: 7px;
            color: #b45309;
            display: block;
            margin-top: 1px;
        }
        
        .footer-totals-wrapper {
            width: 100%;
            margin-top: 15px;
        }
        .totals-table {
            width: 55%;
            float: right;
            border-collapse: collapse;
            font-weight: bold;
        }
        .totals-table td {
            border: 1px solid #000;
            padding: 5px 8px;
        }
        
        .footer {
            margin-top: 35px;
            font-size: 9px;
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
        @media print {
            body {
                padding: 0;
            }
        }
    </style>
</head>
<body>

    @php
        function formatSafeCurrency($val) {
            return number_format($val ?? 0, 0);
        }
    @endphp

    <div class="header text-center">
        <div class="logo-section">
            <div class="logo-icon">
                @if($logo_base64)
                    <img src="{{ $logo_base64 }}" width="32" height="32">
                @endif
            </div>
            <div class="brand-text">
                <div class="brand-name">Haramain <span style="color:#000">Traders</span></div>
                <div class="brand-tagline">Wholesale <span style="color:#000">&</span> Supply Chain</div>
            </div>
        </div>
        
        <div style="width: 100%; margin-top: 3px;">
            <div class="report-title" style="border-top: 1px dashed #000; display: inline-block; padding: 4px 25px;">BANK LEDGER (BANK STATEMENT)</div>
        </div>
    </div>

    <!-- Filter Bar Header -->
    <table class="filter-info">
        <tr>
            <td width="10%"><span class="font-bold">Period From:</span></td>
            <td width="15%" class="font-bold">{{ $from_date ? date('d M Y', strtotime($from_date)) : '---' }}</td>
            <td width="5%" class="text-center"><span class="font-bold">To:</span></td>
            <td width="15%" class="font-bold">{{ $to_date ? date('d M Y', strtotime($to_date)) : '---' }}</td>
            <td width="12%"><span class="font-bold">Bank Account:</span></td>
            <td width="28%" class="font-bold">{{ $account ? strtoupper($account->title) : 'ALL BANKS' }}</td>
            <td width="15%" class="text-right font-bold">{{ $account && $account->code ? 'A/C: ' . $account->code : '' }}</td>
        </tr>
    </table>

    <!-- 5 KPI Cards Grid Matching the UI -->
    <table class="kpi-table">
        <tr>
            <!-- 1. Opening Bank Balance -->
            <td style="border-left: 3px solid #6366f1;">
                <div class="kpi-title">Opening Bank Balance</div>
                <div class="kpi-value">
                    Rs {{ formatSafeCurrency(abs($opening_balance)) }}
                    <span style="font-size: 9px; font-weight: normal; color: {{ $opening_balance >= 0 ? '#059669' : '#dc2626' }};">
                        {{ $opening_balance >= 0 ? 'DR' : 'CR' }}
                    </span>
                </div>
                <div class="kpi-subtext">Cleared before period</div>
            </td>

            <!-- 2. Cleared Deposits -->
            <td style="border-left: 3px solid #10b981;">
                <div class="kpi-title">Deposits (IN)</div>
                <div class="kpi-value" style="color: #059669;">
                    Rs {{ formatSafeCurrency($total_cleared_deposits ?? $total_debit) }}
                </div>
                <div class="kpi-subtext">Cleared money in</div>
            </td>

            <!-- 3. Cleared Withdrawals -->
            <td style="border-left: 3px solid #ef4444;">
                <div class="kpi-title">Withdrawals (OUT)</div>
                <div class="kpi-value" style="color: #dc2626;">
                    Rs {{ formatSafeCurrency($total_cleared_withdrawals ?? $total_credit) }}
                </div>
                <div class="kpi-subtext">Cleared cheques / debits</div>
            </td>

            <!-- 4. Uncleared Float -->
            <td style="border-left: 3px solid #f59e0b;">
                <div class="kpi-title">Pending Cheques Float</div>
                <div class="kpi-value" style="color: #d97706;">
                    Rs {{ formatSafeCurrency($total_uncleared_float ?? 0) }}
                </div>
                <div class="kpi-subtext">Issued but unpresented</div>
            </td>

            <!-- 5. Real Cleared Bank Balance -->
            <td style="border-left: 3px solid #0284c7; background-color: #f0f9ff;">
                <div class="kpi-title" style="color: #0369a1;">Real Bank Balance</div>
                <div class="kpi-value" style="color: {{ $closing_bank_balance >= 0 ? '#0284c7' : '#dc2626' }};">
                    Rs {{ formatSafeCurrency(abs($closing_bank_balance ?? $closing_balance)) }}
                    <span style="font-size: 9px; font-weight: normal;">
                        {{ ($closing_bank_balance ?? $closing_balance) >= 0 ? 'DR' : 'CR' }}
                    </span>
                </div>
                <div class="kpi-subtext" style="color: #0284c7; font-weight: bold;">Matches Real Bank Book</div>
            </td>
        </tr>
    </table>

    <!-- Ledger Table -->
    <table class="ledger">
        <thead>
            <tr>
                <th width="8%">Date</th>
                <th width="10%">Voucher #</th>
                <th width="24%">Beneficiary / Contra Party</th>
                <th width="8%">Method</th>
                <th width="10%">Cheque #</th>
                <th width="8%">Chq Date</th>
                <th width="8%">Clear Date</th>
                <th width="8%">Status</th>
                <th width="8%">Deposit (IN)</th>
                <th width="8%">Withdrawal (OUT)</th>
                <th width="10%">Bank Balance</th>
            </tr>
        </thead>
        <tbody>
            <!-- BBF Row -->
            <tr style="background-color: #fafafa;">
                <td class="text-center">{{ $from_date ? date('d-M-y', strtotime($from_date)) : '' }}</td>
                <td class="text-center font-bold">BBF</td>
                <td class="font-bold">BROUGHT FORWARD BALANCE</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
                <td class="text-center"><span class="badge-cleared">CLEARED</span></td>
                <td class="text-right"></td>
                <td class="text-right"></td>
                <td class="text-right font-bold">
                    {{ formatSafeCurrency(abs($opening_balance)) }} {{ $opening_balance >= 0 ? 'DR' : 'CR' }}
                </td>
            </tr>

            @foreach($data as $row)
            @php
                $isCleared = !empty($row['is_cleared']);
                $isPending = !$isCleared;
                $rowStatus = $row['cheque_status'] ?? ($isCleared ? 'Cleared' : 'Pending');
            @endphp
            <tr style="{{ $isPending ? 'background-color: #fffbeb;' : '' }}">
                <td class="text-center">{{ !empty($row['date']) ? date('d-M-y', strtotime($row['date'])) : '' }}</td>
                <td class="text-center font-bold">{{ $row['voucher_no'] ?? '-' }}</td>
                <td>{{ $row['contra_party'] ?? $row['description'] ?? 'General Account' }}</td>
                <td class="text-center">{{ $row['method'] ?? 'Cash' }}</td>
                <td class="text-center font-bold">{{ $row['cheque_no'] ?? '-' }}</td>
                <td class="text-center">{{ !empty($row['cheque_date']) ? date('d-m-y', strtotime($row['cheque_date'])) : '-' }}</td>
                <td class="text-center">{{ !empty($row['clear_date']) ? date('d-m-y', strtotime($row['clear_date'])) : '-' }}</td>
                <td class="text-center">
                    @if($isCleared)
                        <span class="badge-cleared">CLEARED</span>
                    @else
                        <span class="badge-pending">PENDING</span>
                    @endif
                </td>
                <td class="text-right" style="color: #059669;">
                    {{ !empty($row['deposit']) && $row['deposit'] > 0 ? formatSafeCurrency($row['deposit']) : '-' }}
                </td>
                <td class="text-right" style="color: #dc2626;">
                    {{ !empty($row['withdrawal']) && $row['withdrawal'] > 0 ? formatSafeCurrency($row['withdrawal']) : '-' }}
                </td>
                <td class="text-right font-bold">
                    {{ formatSafeCurrency(abs($row['running_balance'] ?? $row['balance'] ?? 0)) }}
                    @if($isPending)
                        <span class="no-impact-note">(No impact yet)</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Totals Table -->
    <div class="footer-totals-wrapper clearfix">
        <table class="totals-table">
            <tr>
                <td width="25%">Total Cleared Deposits</td>
                <td width="25%" class="text-right" style="color: #059669;">
                    {{ formatSafeCurrency($total_cleared_deposits ?? $total_debit) }}
                </td>
                <td width="25%">Total Cleared Withdrawals</td>
                <td width="25%" class="text-right" style="color: #dc2626;">
                    {{ formatSafeCurrency($total_cleared_withdrawals ?? $total_credit) }}
                </td>
            </tr>
            <tr>
                <td>Pending Float</td>
                <td class="text-right" style="color: #d97706;">
                    {{ formatSafeCurrency($total_uncleared_float ?? 0) }}
                </td>
                <td style="background-color: #f0f9ff; color: #0369a1;">Real Bank Balance</td>
                <td class="text-right font-bold" style="background-color: #f0f9ff; color: #0284c7;">
                    Rs {{ formatSafeCurrency(abs($closing_bank_balance ?? $closing_balance)) }} {{ ($closing_bank_balance ?? $closing_balance) >= 0 ? 'DR' : 'CR' }}
                </td>
            </tr>
        </table>
    </div>

    <!-- Print Footer -->
    <table class="footer">
        <tr>
            <td width="33%" class="font-bold">{{ date('l F d Y h:i A') }}</td>
            <td width="34%" class="text-center font-bold">Verified Bank Statement</td>
            <td width="33%" class="text-right font-bold"><span style="font-weight: normal;">Printed By:</span> {{ auth()->user() ? strtoupper(auth()->user()->name) : 'SUPER' }}</td>
        </tr>
        <tr>
            <td colspan="3" class="text-center" style="padding-top: 8px; border-top: 1px solid #000;">
                Software Designed By Aishtycoons : 0300-2086828
            </td>
        </tr>
    </table>

    @if(isset($is_print_mode) && $is_print_mode)
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
    @endif
</body>
</html>

