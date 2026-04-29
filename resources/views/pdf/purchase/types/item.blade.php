@extends('pdf.purchase.layout')

@section('content')
<thead>
    <tr>
        <th width="30">S.#</th>
        <th>Item Description</th>
        <th width="40">Pack</th>
        <th width="40">Full</th>
        <th width="40">Pcs</th>
        <th width="80">Gross Amount</th>
        <th width="70">Disc Amt</th>
        <th width="85">Net Amount</th>
    </tr>
</thead>
<tbody>
    @foreach($data as $index => $row)
    <tr>
        <td class="text-center">{{ $index + 1 }}</td>
        <td class="uppercase wrap-text">{{ $row['name'] }}</td>
        <td class="text-center font-bold">{{ $row['packing'] }}</td>
        <td class="text-center font-black" style="color: #2563eb;">{{ number_format($row['qty_full'], 0) }}</td>
        <td class="text-center font-bold" style="color: #3b82f6;">{{ number_format($row['qty_pcs'], 0) }}</td>
        <td class="text-right">{{ number_format($row['gross_amount'], 2) }}</td>
        <td class="text-right font-bold" style="color: #e11d48;">{{ number_format($row['discount_amount'], 2) }}</td>
        <td class="text-right font-black" style="color: #059669;">{{ number_format($row['net_amount'], 2) }}</td>
    </tr>
    @endforeach
</tbody>
<tfoot>
    <tr class="total-row">
        <td colspan="3" class="text-center">GRAND TOTALS</td>
        <td class="text-center" style="color: #2563eb;">{{ number_format(collect($data)->sum('qty_full'), 0) }}</td>
        <td class="text-center" style="color: #3b82f6;">{{ number_format(collect($data)->sum('qty_pcs'), 0) }}</td>
        <td class="text-right">{{ number_format(collect($data)->sum('gross_amount'), 2) }}</td>
        <td class="text-right" style="color: #e11d48;">{{ number_format(collect($data)->sum('discount_amount'), 2) }}</td>
        <td class="text-right" style="color: #059669;">{{ number_format(collect($data)->sum('net_amount'), 2) }}</td>
    </tr>
</tfoot>
@endsection
