<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $payment->voucher_no }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 14px;
            color: #333;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }

        .container {
            padding: 30px;
        }

        .header {
            display: table;
            width: 100%;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .header-left {
            display: table-cell;
            vertical-align: top;
        }

        .header-right {
            display: table-cell;
            vertical-align: top;
            text-align: right;
        }

        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1a1a1a;
            margin: 0;
        }

        .voucher-title {
            font-size: 28px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
            color: #1a1a1a;
        }

        .voucher-sub {
            color: #777;
            margin-top: 5px;
        }

        .voucher-no {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .voucher-date {
            color: #555;
        }

        .details-grid {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }

        .details-col {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }

        .section-label {
            font-size: 11px;
            text-transform: uppercase;
            font-weight: bold;
            color: #888;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }

        .party-info .name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
        }

        .party-info .address {
            color: #555;
            font-size: 13px;
            max-width: 300px;
        }

        .payment-meta {
            text-align: right;
        }

        .meta-row {
            margin-bottom: 8px;
        }

        .meta-label {
            color: #777;
            display: inline-block;
            width: 100px;
        }

        .meta-value {
            font-weight: bold;
            display: inline-block;
            width: 120px;
            text-align: right;
        }

        .amount-card {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            display: table;
            width: 100%;
        }

        .amount-label {
            display: table-cell;
            vertical-align: middle;
            font-size: 16px;
            font-weight: 500;
        }

        .amount-value {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            font-size: 24px;
            font-weight: bold;
            color: #111;
        }

        .table-section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
        }

        th {
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            color: #888;
            border-bottom: 1px solid #eee;
            padding: 10px 5px;
            font-weight: bold;
        }

        td {
            padding: 12px 5px;
            border-bottom: 1px solid #f9f9f9;
            font-size: 13px;
        }

        .text-right {
            text-align: right;
        }

        .footer {
            margin-top: 100px;
            display: table;
            width: 100%;
        }

        .signature-box {
            display: table-cell;
            width: 50%;
            text-align: center;
        }

        .sig-line {
            width: 200px;
            border-top: 1px solid #ccc;
            margin: 0 auto 10px auto;
        }

        .sig-label {
            font-size: 12px;
            color: #777;
        }

        .remarks-section {
            margin-top: 20px;
            padding: 15px;
            border-left: 3px solid #eee;
            background-color: #fcfcfc;
            font-size: 13px;
            color: #555;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                <div class="company-name">Harmain Traders</div>
                <p class="voucher-sub">Wholesale & Supply Chain</p>
                <h1 class="voucher-title">{{ $payment->type === 'RECEIPT' ? 'RECEIPT VOUCHER' : 'PAYMENT VOUCHER' }}</h1>
            </div>
            <div class="header-right">
                <div class="voucher-no">{{ $payment->voucher_no }}</div>
                <div class="voucher-date">Date: {{ \Carbon\Carbon::parse($payment->date)->format('Y-m-d') }}</div>
            </div>
        </div>

        <div class="details-grid">
            <div class="details-col">
                <div class="section-label">{{ $payment->type === 'RECEIPT' ? 'RECEIVED FROM' : 'PAID TO' }}</div>
                <div class="party-info">
                    <div class="name">{{ $payment->account->title }}</div>
                    <div class="address">
                        {{ $payment->account->address1 }}<br>
                        {{ $payment->account->telephone1 }}
                    </div>
                </div>
            </div>
            <div class="details-col">
                <div class="payment-meta">
                    <div class="section-label">PAYMENT DETAILS</div>
                    <div class="meta-row">
                        <span class="meta-label">Method:</span>
                        <span class="meta-value">{{ $payment->payment_method ?: 'Cash' }}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Account:</span>
                        <span class="meta-value">{{ $payment->paymentAccount ? $payment->paymentAccount->title : '-' }}</span>
                    </div>
                    @if($payment->cheque_no)
                    <div class="meta-row">
                        <span class="meta-label">Cheque #:</span>
                        <span class="meta-value">{{ $payment->cheque_no }}</span>
                    </div>
                    @endif
                </div>
            </div>
        </div>

        <div class="amount-card">
            <div class="amount-label">Total Amount</div>
            <div class="amount-value">{{ number_format($payment->amount, 2) }}</div>
        </div>

        @if($payment->allocations->count() > 0)
        <div class="table-section-title">Payment Allocation</div>
        <table>
            <thead>
                <tr>
                    <th>Bill Type</th>
                    <th class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($payment->allocations as $allocation)
                <tr>
                    <td>
                        {{ class_basename($allocation->bill_type) }} #{{ $allocation->bill_id }}
                    </td>
                    <td class="text-right">{{ number_format($allocation->amount, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif

        @if($payment->remarks)
        <div class="remarks-section">
            <strong>Remarks:</strong> {{ $payment->remarks }}
        </div>
        @endif

        <div class="footer">
            <div class="signature-box">
                <div class="sig-line"></div>
                <div class="sig-label">Authorized Signature</div>
            </div>
            <div class="signature-box">
                <div class="sig-line"></div>
                <div class="sig-label">Receiver Signature</div>
            </div>
        </div>
    </div>
</body>

</html>