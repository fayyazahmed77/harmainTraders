@extends('pdf.stock.layout')

@section('content')
<table>
    <thead>
        <tr>
            <th style="width: 30px;">S.#</th>
            <th>Item Description</th>
            <th style="width: 60px;">Rate</th>
            <th style="width: 40px;">Packing</th>
            <th style="width: 50px;">Re-Order</th>
            <th style="width: 50px;">Balance</th>
            <th style="width: 50px; background-color: #fef3c7;">Shortfall</th>
            @if(isset($params['withAmount']) && $params['withAmount'])
                <th style="width: 80px;">Amount</th>
            @endif
        </tr>
    </thead>
    <tbody>
        @php
            $totalBalance = 0;
            $totalShortfall = 0;
            $totalAmount = 0;
        @endphp
        @foreach($data as $idx => $row)
            @php
                $totalBalance += $row['balance_qty'];
                $totalShortfall += $row['shortfall'];
                $totalAmount += $row['amount'] ?? 0;
            @endphp
            <tr>
                <td class="text-center">{{ $idx + 1 }}</td>
                <td>
                    @if(isset($is_excel) && $is_excel)
                        {{ $row['item_name'] }} - {{ $row['company_name'] }}
                    @else
                        <div class="bold uppercase">{{ $row['item_name'] }}</div>
                        <div style="font-size: 7px; color: #666;">{{ $row['company_name'] }}</div>
                    @endif
                </td>
                <td class="text-right">{{ number_format($row['rate'], 2) }}</td>
                <td class="text-center">{{ $row['packing_qty'] }}</td>
                <td class="text-right">{{ number_format($row['reorder_level'] ?? 0, 0) }}</td>
                <td class="text-right {{ $row['balance_qty'] < 0 ? 'text-danger' : '' }}">
                    {{ number_format($row['balance_qty'], 0) }}
                </td>
                <td class="text-right bold" style="color: #d97706; background-color: #fffbeb;">
                    {{ number_format($row['shortfall'], 0) }}
                </td>
                @if(isset($params['withAmount']) && $params['withAmount'])
                    <td class="text-right bold">{{ number_format($row['amount'] ?? 0, 2) }}</td>
                @endif
            </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="background-color: #f9fafb; font-weight: bold;">
            <td colspan="5" class="text-right">TOTALS</td>
            <td class="text-right text-success">{{ number_format($totalBalance, 0) }}</td>
            <td class="text-right" style="color: #d97706;">{{ number_format($totalShortfall, 0) }}</td>
            @if(isset($params['withAmount']) && $params['withAmount'])
                <td class="text-right text-success">{{ number_format($totalAmount, 2) }}</td>
            @endif
        </tr>
    </tfoot>
</table>
@endsection
