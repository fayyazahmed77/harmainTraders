<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Offer List</title>
    <style>
        body {
            font-family: sans-serif;
            font-size: 12px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        th,
        td {
            border: 1px solid #ddd;
            padding: 4px;
            text-align: left;
        }

        th {
            background-color: #f2f2f2;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .category-header {
            background-color: #e0e0e0;
            font-weight: bold;
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }
    </style>
</head>

<body>
    <div class="header">
        <h2>Offer List</h2>
        <p><strong>Customer/Supplier:</strong> {{ $account->title }}</p>
        <p><strong>Date:</strong> {{ $date }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item Name</th>
                <th class="text-center">Pack</th>
                @if($price_type == 'trade' || $price_type == 'both')
                <th class="text-right">Trade Price</th>
                @endif
                @if($price_type == 'retail' || $price_type == 'both')
                <th class="text-right">Retail Price</th>
                @endif
                <th class="text-center">Scheme</th>
            </tr>
        </thead>
        <tbody>
            @foreach($groupedItems as $categoryName => $items)
            <tr>
                <td colspan="{{ ($price_type == 'both' ? 5 : 4) }}" class="category-header">
                    {{ $categoryName }}
                </td>
            </tr>
            @foreach($items as $item)
            <tr>
                <td>{{ $item['title'] }}</td>
                <td class="text-center">{{ $item['packing_qty'] ?? '-' }}</td>
                @if($price_type == 'trade' || $price_type == 'both')
                <td class="text-right">{{ number_format($item['trade_price'], 2) }}</td>
                @endif
                @if($price_type == 'retail' || $price_type == 'both')
                <td class="text-right">{{ number_format($item['retail'], 2) }}</td>
                @endif
                <td class="text-center">{{ $item['remarks'] ?? '-' }}</td>
            </tr>
            @endforeach
            @endforeach
        </tbody>
    </table>
</body>

</html>