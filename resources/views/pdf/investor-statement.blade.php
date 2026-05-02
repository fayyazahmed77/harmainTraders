<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Investor Statement - {{ $period }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 11px; color: #1a1a1a; margin: 0; padding: 40px; line-height: 1.4; }
        .header { margin-bottom: 40px; }
        .logo-area { float: left; width: 50%; }
        .firm-name { font-size: 24px; font-weight: 900; color: #000; letter-spacing: -1px; text-transform: uppercase; }
        .firm-tagline { font-size: 9px; color: #C9A84C; font-weight: bold; margin-top: 2px; }
        
        .statement-title-area { float: right; width: 50%; text-align: right; }
        .statement-label { font-size: 18px; font-weight: 300; color: #666; text-transform: uppercase; }
        .statement-period { font-size: 12px; font-weight: bold; color: #000; margin-top: 5px; }

        .clear { clear: both; }

        .investor-info { margin-top: 40px; margin-bottom: 40px; }
        .info-box { float: left; width: 60%; }
        .info-box h3 { font-size: 10px; color: #888; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 5px; width: 200px; }
        .info-name { font-size: 16px; font-weight: bold; }
        .info-detail { font-size: 10px; color: #555; margin-top: 4px; }

        .summary-cards { margin-top: 20px; margin-bottom: 30px; }
        .card { float: left; width: 23%; background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 8px; margin-right: 2%; }
        .card:last-child { margin-right: 0; }
        .card-label { font-size: 8px; font-weight: bold; color: #6c757d; text-transform: uppercase; margin-bottom: 5px; }
        .card-value { font-size: 13px; font-weight: bold; color: #000; }

        table.ledger { width: 100%; border-collapse: collapse; margin-top: 20px; }
        table.ledger th { background: #f1f3f5; color: #495057; padding: 12px 10px; text-align: left; font-size: 9px; text-transform: uppercase; border-bottom: 2px solid #dee2e6; }
        table.ledger td { padding: 12px 10px; border-bottom: 1px solid #eee; font-size: 10px; }
        
        .text-right { text-align: right; }
        .pos { color: #2b8a3e; font-weight: bold; }
        .neg { color: #c92a2a; font-weight: bold; }

        .footer { position: fixed; bottom: 0; left: 40px; right: 40px; border-top: 1px solid #eee; padding-top: 15px; font-size: 8px; color: #adb5bd; }
        .footer-left { float: left; }
        .footer-right { float: right; }

        .balance-row { background: #fff9db !important; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-area">
            <div class="firm-name">{{ $firm->name ?? 'HARMAIN TRADERS' }}</div>
            <div class="firm-tagline">INVESTMENT MANAGEMENT DIVISION</div>
        </div>
        <div class="statement-title-area">
            <div class="statement-label">Account Statement</div>
            <div class="statement-period">{{ $period }}</div>
        </div>
        <div class="clear"></div>
    </div>

    <div class="investor-info">
        <div class="info-box">
            <h3>Statement To</h3>
            <div class="info-name">{{ $investor->full_name }}</div>
            <div class="info-detail">ID: INV-{{ str_pad($investor->id, 4, '0', STR_PAD_LEFT) }}</div>
            <div class="info-detail">CNIC: {{ $investor->cnic }}</div>
            <div class="info-detail">Phone: {{ $investor->phone }}</div>
        </div>
        <div class="clear"></div>
    </div>

    <div class="summary-cards">
        <div class="card">
            <div class="card-label">Opening Balance</div>
            <div class="card-value">RS {{ number_format($opening_balance, 2) }}</div>
        </div>
        <div class="card">
            <div class="card-label">Profit Credits</div>
            <div class="card-value pos">+RS {{ number_format($transactions->where('type', 'profit_credit')->sum('amount'), 2) }}</div>
        </div>
        <div class="card">
            <div class="card-label">Withdrawals</div>
            <div class="card-value neg">-RS {{ number_format($transactions->where('type', 'withdrawal')->sum('amount'), 2) }}</div>
        </div>
        <div class="card" style="background: #e7f5ff; border-color: #a5d8ff;">
            <div class="card-label">Closing Balance</div>
            <div class="card-value">RS {{ number_format($transactions->last()?->balance_after ?? $opening_balance, 2) }}</div>
        </div>
        <div class="clear"></div>
    </div>

    <table class="ledger">
        <thead>
            <tr>
                <th width="12%">Date</th>
                <th width="15%">Type</th>
                <th width="43%">Narration</th>
                <th width="15%" class="text-right">Amount</th>
                <th width="15%" class="text-right">Running Balance</th>
            </tr>
        </thead>
        <tbody>
            <tr class="balance-row">
                <td>{{ \Carbon\Carbon::parse($period)->startOfMonth()->format('d-m-Y') }}</td>
                <td>OPENING</td>
                <td>Balance Brought Forward</td>
                <td class="text-right">-</td>
                <td class="text-right">{{ number_format($opening_balance, 2) }}</td>
            </tr>
            @foreach($transactions as $tx)
                <tr>
                    <td>{{ $tx->created_at->format('d-m-Y') }}</td>
                    <td><span style="font-size: 8px; font-weight: bold;">{{ strtoupper($tx->type) }}</span></td>
                    <td>{{ $tx->narration }}</td>
                    <td class="text-right {{ in_array($tx->type, ['profit_credit', 'capital_in', 'reinvestment']) ? 'pos' : 'neg' }}">
                        {{ in_array($tx->type, ['profit_credit', 'capital_in', 'reinvestment']) ? '+' : '-' }}{{ number_format($tx->amount, 2) }}
                    </td>
                    <td class="text-right" style="font-weight: bold;">{{ number_format($tx->balance_after, 2) }}</td>
                </tr>
            @endforeach
            <tr class="balance-row">
                <td>{{ \Carbon\Carbon::parse($period)->endOfMonth()->format('d-m-Y') }}</td>
                <td>CLOSING</td>
                <td>Balance Carried Forward</td>
                <td class="text-right">-</td>
                <td class="text-right">{{ number_format($transactions->last()?->balance_after ?? $opening_balance, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <div class="footer-left">
            This is a computer generated statement and does not require a signature.
        </div>
        <div class="footer-right">
            Generated on {{ date('d-m-Y H:i') }} &bull; Page 1 of 1
        </div>
        <div class="clear"></div>
    </div>
</body>
</html>
