<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Purchase Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .header h1 {
            margin: 0;
            color: #333;
        }

        .header p {
            margin: 5px 0;
            color: #666;
        }

        .summary {
            margin-bottom: 30px;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }

        .summary-item {
            text-align: center;
        }

        .summary-item .label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
        }

        .summary-item .value {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-top: 5px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th {
            background-color: #8b5cf6;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: bold;
        }

        td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
        }

        tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        .text-right {
            text-align: right;
        }

        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>Purchase Report</h1>
        <p>Period: {{ $from }} to {{ $to }}</p>
        <p>Generated: {{ date('d M Y H:i') }}</p>
    </div>

    <div class="summary">
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">Total Purchases</div>
                <div class="value">Rs. {{ number_format($summary['total_purchases'], 0) }}</div>
            </div>
            <div class="summary-item">
                <div class="label">Total Items</div>
                <div class="value">{{ number_format($summary['total_items']) }}</div>
            </div>
            <div class="summary-item">
                <div class="label">Suppliers</div>
                <div class="value">{{ $summary['supplier_count'] }}</div>
            </div>
            <div class="summary-item">
                <div class="label">Average Purchase</div>
                <div class="value">Rs. {{ number_format($summary['average_purchase'], 0) }}</div>
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th>Supplier</th>
                <th class="text-right">Items</th>
                <th class="text-right">Gross Total</th>
                <th class="text-right">Discount</th>
                <th class="text-right">Net Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($purchases as $purchase)
            <tr>
                <td>{{ date('d M Y', strtotime($purchase->date)) }}</td>
                <td>{{ $purchase->invoice }}</td>
                <td>{{ $purchase->supplier_name }}</td>
                <td class="text-right">{{ $purchase->no_of_items }}</td>
                <td class="text-right">Rs. {{ number_format($purchase->gross_total, 0) }}</td>
                <td class="text-right">Rs. {{ number_format($purchase->discount_total, 0) }}</td>
                <td class="text-right"><strong>Rs. {{ number_format($purchase->net_total, 0) }}</strong></td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr style="background-color: #f0f0f0; font-weight: bold;">
                <td colspan="6" class="text-right">Total:</td>
                <td class="text-right">Rs. {{ number_format($summary['total_purchases'], 0) }}</td>
            </tr>
        </tfoot>
    </table>

    <div class="footer">
        <p>This is a computer-generated report. No signature required.</p>
    </div>
</body>

</html>