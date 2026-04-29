@extends('pdf.purchase.layout')

@section('content')
<thead>
    <tr>
        <th width="30">S.#</th>
        <th width="100">Area</th>
        <th>Account</th>
        <th width="100">Contact</th>
        <th width="90">Purchases</th>
        <th width="90">Payment</th>
        <th width="90">Balance</th>
    </tr>
</thead>
<tbody>
    @foreach($data as $index => $row)
    <tr>
        <td class="text-center">{{ $index + 1 }}</td>
        <td class="uppercase text-center">{{ $row['area_name'] ?? '---' }}</td>
        <td class="uppercase wrap-text">{{ $row['account_name'] }}</td>
        <td class="text-center">{{ $row['contact'] ?? '---' }}</td>
        <td class="text-right">{{ number_format($row['total_purchase'], 2) }}</td>
        <td class="text-right font-bold" style="color: #059669;">{{ number_format($row['total_payment'], 2) }}</td>
        <td class="text-right font-black" style="color: #dc2626;">{{ number_format($row['balance'], 2) }}</td>
    </tr>
    @endforeach
</tbody>
<tfoot>
    <tr class="total-row">
        <td colspan="4" class="text-center">GRAND TOTALS</td>
        <td class="text-right">{{ number_format(collect($data)->sum('total_purchase'), 2) }}</td>
        <td class="text-right">{{ number_format(collect($data)->sum('total_payment'), 2) }}</td>
        <td class="text-right">{{ number_format(collect($data)->sum('balance'), 2) }}</td>
    </tr>
</tfoot>
@endsection
