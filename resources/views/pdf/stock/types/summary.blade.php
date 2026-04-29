@extends('pdf.stock.layout')

@section('content')
<table>
    <thead>
        <tr>
            <th style="width: 30px;">S.#</th>
            <th>Item Description</th>
            <th style="width: 70px;">Rate</th>
            <th style="width: 60px;">Packing</th>
            <th style="width: 60px;">In</th>
            <th style="width: 60px;">Out</th>
            <th style="width: 60px;">Balance</th>
        </tr>
    </thead>
    <tbody>
        @php
            $totalIn = 0;
            $totalOut = 0;
            $totalBalance = 0;
        @endphp
        @foreach($data as $idx => $row)
            @php
                $totalIn += $row['in_qty'];
                $totalOut += $row['out_qty'];
                $totalBalance += $row['balance_qty'];
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
                <td class="text-right">{{ number_format($row['in_qty'], 0) }}</td>
                <td class="text-right">{{ number_format($row['out_qty'], 0) }}</td>
                <td class="text-right bold {{ $row['balance_qty'] < 0 ? 'text-danger' : '' }}">
                    {{ number_format($row['balance_qty'], 0) }}
                </td>
            </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="background-color: #f9fafb; font-weight: bold;">
            <td colspan="4" class="text-right">TOTALS</td>
            <td class="text-right">{{ number_format($totalIn, 0) }}</td>
            <td class="text-right">{{ number_format($totalOut, 0) }}</td>
            <td class="text-right" style="color: #059669;">{{ number_format($totalBalance, 0) }}</td>
        </tr>
    </tfoot>
</table>
@endsection
