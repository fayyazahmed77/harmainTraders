<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Investor Ledger - {{ $investor->full_name }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 11px; color: #333; margin: 0; padding: 0; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #C9A84C; padding-bottom: 10px; }
        .firm-name { font-size: 20px; font-weight: bold; color: #0A0C10; text-transform: uppercase; }
        .report-title { font-size: 14px; color: #666; margin-top: 5px; }
        
        .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
        .info-table td { padding: 4px 0; vertical-align: top; }
        .info-label { font-weight: bold; color: #666; width: 120px; }
        
        .stats-grid { width: 100%; margin-bottom: 20px; }
        .stats-box { border: 1px solid #eee; padding: 10px; background: #fafafa; border-radius: 4px; }
        .stats-label { font-size: 9px; color: #888; text-transform: uppercase; margin-bottom: 3px; }
        .stats-value { font-size: 14px; font-weight: bold; color: #0A0C10; }

        table.ledger { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table.ledger th { background: #181C23; color: #fff; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
        table.ledger td { padding: 8px; border-bottom: 1px solid #eee; }
        table.ledger tr:nth-child(even) { background: #f9f9f9; }
        
        .text-right { text-align: right; }
        .amount-pos { color: #22C55E; font-weight: bold; }
        .amount-neg { color: #EF4444; font-weight: bold; }
        .status-active { color: #22C55E; }
        .status-inactive { color: #666; }
        
        .footer { position: fixed; bottom: -30px; left: 0; right: 0; height: 30px; font-size: 9px; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="firm-name">{{ $firm->name ?? 'HARMAIN TRADERS' }}</div>
        <div class="report-title">Investor Transaction Ledger</div>
    </div>

    <table class="info-table">
        <tr>
            <td class="info-label">Investor Name:</td>
            <td>{{ $investor->full_name }}</td>
            <td class="info-label text-right">Report Date:</td>
            <td class="text-right">{{ date('d M, Y') }}</td>
        </tr>
        <tr>
            <td class="info-label">Phone / CNIC:</td>
            <td>{{ $investor->phone }} / {{ $investor->cnic }}</td>
            <td class="info-label text-right">Joining Date:</td>
            <td class="text-right">{{ $investor->joining_date->format('d M, Y') }}</td>
        </tr>
    </table>

    <table class="stats-grid">
        <tr>
            <td width="32%">
                <div class="stats-box">
                    <div class="stats-label">Current Capital Balance</div>
                    <div class="stats-value">PKR {{ number_format($investor->capitalAccount->current_capital, 2) }}</div>
                </div>
            </td>
            <td width="2%"></td>
            <td width="32%">
                <div class="stats-box">
                    <div class="stats-label">Ownership Stake</div>
                    <div class="stats-value">{{ number_format($investor->capitalAccount->ownership_percentage, 2) }}%</div>
                </div>
            </td>
            <td width="2%"></td>
            <td width="32%">
                <div class="stats-box">
                    <div class="stats-label">Account Status</div>
                    <div class="stats-value {{ $investor->status === 'active' ? 'status-active' : 'status-inactive' }}">
                        {{ strtoupper($investor->status) }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <table class="ledger">
        <thead>
            <tr>
                <th width="15%">Date</th>
                <th width="45%">Description</th>
                <th width="20%" class="text-right">Amount (PKR)</th>
                <th width="20%" class="text-right">Balance After</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transactions as $tx)
                <tr>
                    <td>{{ $tx->created_at->format('d-m-Y') }}</td>
                    <td>
                        <div><strong>{{ $tx->description }}</strong></div>
                        <div style="font-size: 8px; color: #888;">{{ strtoupper(str_replace('_', ' ', $tx->transaction_type)) }}</div>
                    </td>
                    <td class="text-right {{ in_array($tx->transaction_type, ['capital_in', 'profit_credit']) ? 'amount-pos' : 'amount-neg' }}">
                        {{ in_array($tx->transaction_type, ['capital_in', 'profit_credit']) ? '+' : '-' }}
                        {{ number_format($tx->amount, 2) }}
                    </td>
                    <td class="text-right" style="font-weight: bold;">
                        {{ number_format($tx->balance_after, 2) }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Generated by Harmain Traders ERP &bull; {{ date('Y-m-d H:i:s') }} &bull; Page 1
    </div>
</body>
</html>
