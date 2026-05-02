@extends('pdf.stock.layout')

@section('content')
<table>
    <thead>
        <tr>
            <th style="width: 25px;">S.#</th>
            <th>Item &amp; Company</th>
            <th style="width: 50px;">Profile</th>
            <th class="price-col">T.P</th>
            <th class="price-col">Retail</th>
            <th class="price-col">L.P.P</th>
            <th>Last Supplier</th>
            <th class="qty-col">Full</th>
            <th class="qty-col">PCS</th>
            <th style="width: 50px;">Balance</th>
        </tr>
    </thead>
    <tbody>
        @php
            $totalBalance = 0;
            $totalFull = 0;
            $totalPCS = 0;
        @endphp
        @foreach($data as $idx => $row)
            @php
                $totalBalance += $row['balance_qty'];
                $totalFull += $row['full_qty'];
                $totalPCS += $row['pcs_qty'];
            @endphp
            <tr class="item-row">
                <td class="text-center">{{ $idx + 1 }}</td>
                <td>
                    @if(isset($is_excel) && $is_excel)
                        {{ $row['item_name'] }} - {{ $row['company_name'] }}
                    @else
                        <div class="bold uppercase" style="font-size: 8px;">{{ $row['item_name'] }}</div>
                        <div style="font-size: 6px; color: #666; margin-top: 1px;">{{ $row['company_name'] }}</div>
                    @endif
                </td>
                <td class="text-center" style="font-size: 7px; color: #4f46e5;">{{ $row['item_type'] ?? 'N/A' }}</td>
                <td class="text-right tabular-nums">{{ number_format($row['rate'], 2) }}</td>
                <td class="text-right tabular-nums">{{ number_format($row['retail'] ?? 0, 2) }}</td>
                <td class="text-right bold tabular-nums" style="color: #059669;">{{ number_format($row['last_purchase_price'] ?? 0, 2) }}</td>
                <td>
                    @if(isset($is_excel) && $is_excel)
                        {{ $row['last_supplier_name'] }}
                    @else
                        <div style="font-size: 6px; color: #444; width: 100px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
                            {{ $row['last_supplier_name'] }}
                        </div>
                    @endif
                </td>
                <td class="text-right bold tabular-nums">{{ $row['full_qty'] }}</td>
                <td class="text-right bold tabular-nums">{{ $row['pcs_qty'] }}</td>
                <td class="text-right bold tabular-nums" style="color: #059669;">
                    {{ number_format($row['balance_qty'], 0) }}
                </td>
            </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="background-color: #f9fafb; font-weight: bold; border-top: 2px solid #059669;">
            <td colspan="7" class="text-right" style="font-size: 8px;">TOTAL INVENTORY MATRIX</td>
            <td class="text-right tabular-nums">{{ number_format($totalFull, 0) }}</td>
            <td class="text-right tabular-nums">{{ number_format($totalPCS, 0) }}</td>
            <td class="text-right tabular-nums" style="color: #059669;">{{ number_format($totalBalance, 0) }}</td>
        </tr>
    </tfoot>
</table>
@endsection
