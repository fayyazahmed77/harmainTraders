<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Purchase Return Report</title>
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
            background-color: #ef4444;
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
        <h1>Purchase Return Report</h1>
        <p>Period: {{ $from }} to {{ $to }}</p>
        <p>Generated: {{ date('d M Y H:i') }}</p>
    </div>

    <div class="summary">
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">Total Returns</div>
                <div class="value">Rs. {{ number_format($summary['total_returns'], 0) }}</div>
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
                <div class="label">Average Return</div>
                <div class="value">Rs. {{ number_format($summary['average_return'], 0) }}</div>
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
            @foreach($returns as $return)
            <tr>
                <td>{{ date('d M Y', strtotime($return->date)) }}</td>
                <td>{{ $return->invoice }}</td>
                <td>{{ $return->supplier_name }}</td>
                <td class="text-right">{{ $return->no_of_items }}</td>
                <td class="text-right">Rs. {{ number_format($return->gross_total, 0) }}</td>
                <td class="text-right">Rs. {{ number_format($return->discount_total, 0) }}</td>
                <td class="text-right"><strong>Rs. {{ number_format($return->net_total, 0) }}</strong></td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr style="background-color: #f0f0f0; font-weight: bold;">
                <td colspan="6" class="text-right">Total:</td>
                <td class="text-right">Rs. {{ number_format($summary['total_returns'], 0) }}</td>
            </tr>
        </tfoot>
    </table>

    <div class="footer">
        <p>This is a computer-generated report. No signature required.</p>
    </div>
</body>

</html>