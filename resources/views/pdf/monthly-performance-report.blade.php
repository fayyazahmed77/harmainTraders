<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Monthly Performance Report - {{ $period }}</title>
    <style>
        @page { margin: 0; }
        body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            color: #111318; 
            margin: 0; 
            padding: 0;
            background-color: #ffffff;
        }
        .header {
            background-color: #111318;
            color: #ffffff;
            padding: 40px;
            text-align: center;
        }
        .logo {
            width: 150px;
            margin-bottom: 20px;
        }
        .report-title {
            font-size: 24px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0;
        }
        .report-period {
            font-size: 14px;
            color: #C9A84C;
            margin-top: 5px;
            font-weight: bold;
        }
        .content {
            padding: 40px;
        }
        .investor-info {
            margin-bottom: 40px;
            border-bottom: 2px solid #f1f1f1;
            padding-bottom: 20px;
        }
        .investor-name {
            font-size: 18px;
            font-weight: bold;
        }
        .investor-id {
            font-size: 12px;
            color: #6B7280;
        }
        .stats-grid {
            width: 100%;
            margin-bottom: 40px;
        }
        .stat-card {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 10px;
            width: 30%;
            display: inline-block;
            margin-right: 2%;
        }
        .stat-label {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            color: #6B7280;
            margin-bottom: 10px;
        }
        .stat-value {
            font-size: 18px;
            font-weight: bold;
            color: #111318;
        }
        .stat-sub {
            font-size: 10px;
            color: #22C55E;
            font-weight: bold;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .table th {
            text-align: left;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            color: #6B7280;
            padding: 10px;
            border-bottom: 1px solid #f1f1f1;
        }
        .table td {
            padding: 15px 10px;
            font-size: 12px;
            border-bottom: 1px solid #f9fafb;
        }
        .amount {
            font-weight: bold;
            text-align: right;
        }
        .positive { color: #22C55E; }
        .footer {
            position: absolute;
            bottom: 0;
            width: 100%;
            padding: 20px 40px;
            background-color: #f9fafb;
            font-size: 10px;
            color: #9CA3AF;
            text-align: center;
        }
        .branding-gold { color: #C9A84C; }
    </style>
</head>
<body>
    <div class="header">
        @if(isset($logo))
            <img src="{{ public_path($logo) }}" class="logo">
        @else
            <h1 class="branding-gold">HARMAIN TRADERS</h1>
        @endif
        <div class="report-title">Monthly Performance Report</div>
        <div class="report-period">{{ $period_formatted }}</div>
    </div>

    <div class="content">
        <div class="investor-info">
            <table width="100%">
                <tr>
                    <td>
                        <div class="investor-name">{{ $investor->full_name }}</div>
                        <div class="investor-id">Partner ID: INV-{{ str_pad($investor->id, 4, '0', STR_PAD_LEFT) }}</div>
                    </td>
                    <td align="right">
                        <div style="font-size: 12px; font-weight: bold;">Statement Date</div>
                        <div style="font-size: 12px; color: #6B7280;">{{ now()->format('d M Y') }}</div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Opening Capital</div>
                <div class="stat-value">PKR {{ number_format($stats['opening_capital'], 2) }}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Profit Earned</div>
                <div class="stat-value positive">+PKR {{ number_format($stats['profit_earned'], 2) }}</div>
                <div class="stat-sub">ROI: {{ $stats['roi'] }}%</div>
            </div>
            <div class="stat-card" style="margin-right: 0;">
                <div class="stat-label">Closing Balance</div>
                <div class="stat-value">PKR {{ number_format($stats['closing_balance'], 2) }}</div>
            </div>
        </div>

        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #111318; border-left: 3px solid #C9A84C; padding-left: 10px;">Monthly Activity Summary</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Date</th>
                    <th align="right" style="text-align: right;">Amount (PKR)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Initial Monthly Capital</td>
                    <td>{{ $period_start }}</td>
                    <td class="amount">{{ number_format($stats['opening_capital'], 2) }}</td>
                </tr>
                @foreach($transactions as $tx)
                <tr>
                    <td>{{ $tx->narration }}</td>
                    <td>{{ $tx->created_at->format('d M Y') }}</td>
                    <td class="amount {{ $tx->amount >= 0 ? 'positive' : '' }}">
                        {{ $tx->amount >= 0 ? '+' : '' }}{{ number_format($tx->amount, 2) }}
                    </td>
                </tr>
                @endforeach
                <tr style="background-color: #f9fafb; font-weight: bold;">
                    <td>Final Month-End Balance</td>
                    <td>{{ $period_end }}</td>
                    <td class="amount">PKR {{ number_format($stats['closing_balance'], 2) }}</td>
                </tr>
            </tbody>
        </table>

        <div style="margin-top: 50px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
            <p style="font-size: 10px; color: #4B5563; margin: 0; line-height: 1.5;">
                <strong>Disclaimer:</strong> This report is a generated statement of your investment performance for the specified period. Harmain Traders ensures all data is accurate as per our ledger records at the time of generation. Please contact our support if you notice any discrepancies.
            </p>
        </div>
    </div>

    <div class="footer">
        &copy; {{ date('Y') }} Harmain Traders. All Rights Reserved. | Support: info@harmaintraders.com
    </div>
</body>
</html>
