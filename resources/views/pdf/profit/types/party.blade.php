<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Profit & Loss Party Wise</title>
    <style>
        @page {
            margin: 20px 30px;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px;
            color: #000;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .company-name {
            font-size: 20px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
        }
        .address {
            font-size: 12px;
            margin: 4px 0;
        }
        .report-title {
            font-size: 14px;
            font-weight: bold;
            margin: 15px 0;
        }
        .criteria {
            text-align: left;
            font-size: 11px;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
        }
        th, td {
            border: 1px solid #000;
            padding: 4px 6px;
        }
        th {
            background-color: #e5e7eb;
            font-weight: bold;
            text-align: center;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        tbody tr:nth-child(odd) {
            background-color: #f3f4f6;
        }
        tbody tr:nth-child(even) {
            background-color: #ffffff;
        }
        .total-row {
            font-weight: bold;
            background-color: #ffffff !important;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1 class="company-name">HARAMAIN TRADERS</h1>
        <p class="address">1st Floor, Marvi Market, Katchi Gali No.1 Denso Hall, Karachi</p>
        <h2 class="report-title">Profit & Loss Party Wise</h2>
    </div>

    <div class="criteria">
        CRITERIA : Dated From {{ strtoupper($params['fromDate']->format('d-M-Y')) }} To {{ strtoupper($params['toDate']->format('d-M-Y')) }}
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 40px;">S.#</th>
                <th class="text-left">Customer</th>
                <th style="width: 100px;">Sale Amount</th>
                <th style="width: 100px;">Pur Amount</th>
                <th style="width: 100px;">Profit Loss</th>
                <th style="width: 60px;">%</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
                <tr>
                    <td class="text-center">{{ $loop->iteration }}</td>
                    <td class="uppercase text-left">{{ $row['name'] }}</td>
                    <td class="text-right">{{ number_format($row['revenue'], 2) }}</td>
                    <td class="text-right">{{ number_format($row['cogs'], 2) }}</td>
                    <td class="text-right">{{ number_format($row['profit'], 2) }}</td>
                    <td class="text-center">
                        @if($row['revenue'] > 0)
                            {{ number_format(($row['profit'] / $row['revenue']) * 100, 2) }}
                        @else
                            0.00
                        @endif
                    </td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="2" class="text-right">GRAND TOTALS</td>
                <td class="text-right">{{ number_format($totals['revenue'], 2) }}</td>
                <td class="text-right">{{ number_format($totals['cogs'], 2) }}</td>
                <td class="text-right">{{ number_format($totals['profit'], 2) }}</td>
                <td class="text-center">
                    @if($totals['revenue'] > 0)
                        {{ number_format(($totals['profit'] / $totals['revenue']) * 100, 2) }}
                    @else
                        0.00
                    @endif
                </td>
            </tr>
        </tbody>
    </table>

</body>
</html>
