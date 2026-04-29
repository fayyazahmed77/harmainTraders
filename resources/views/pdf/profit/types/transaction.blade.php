@extends('pdf.profit.layout')

@section('title', 'Transaction Wise Profit Report')

@section('content')
<thead>
    <tr>
        <th width="2%" style="width: 2% !important;">S.#</th>
        <th width="7%" style="width: 7% !important;">Inv #</th>
        <th width="8%" style="width: 8% !important;">Inv Date</th>
        <th width="12%" style="width: 12% !important;">Account</th>
        <th width="33%" style="width: 33% !important;">Product</th>
        <th class="text-center" width="3%" style="width: 3% !important;">Qty</th>
        <th class="text-center" width="6%" style="width: 6% !important;">Rate</th>
        <th class="text-center" width="7%" style="width: 7% !important;">Amount</th>
        <th class="text-center" width="6%" style="width: 6% !important;">Rate</th>
        <th class="text-center" width="7%" style="width: 7% !important;">Amount</th>
        <th class="text-center" width="6%" style="width: 6% !important;">Profit</th>
        <th class="text-center" width="3%" style="width: 3% !important;">%</th>
    </tr>
</thead>
<tbody>
    @foreach($data as $row)
        <tr>
            <td class="text-center text-muted">{{ $loop->iteration }}</td>
            <td class="font-black text-indigo">{{ $row['invoice'] }}</td>
            <td class="text-center font-bold text-muted">{{ \Carbon\Carbon::parse($row['date'])->format('d-M-y') }}</td>
            <td class="font-bold">{{ $row['customer_name'] }}</td>
            <td class="font-bold uppercase">{{ $row['product_name'] }}</td>
            <td class="text-center font-black">{{ number_format($row['qty']) }}</td>
            <td class="text-center font-bold text-muted">{{ number_format($row['sale_rate'], 2) }}</td>
            <td class="text-center font-black">{{ number_format($row['revenue']) }}</td>
            <td class="text-center font-bold text-muted">{{ number_format($row['purchase_rate'], 2) }}</td>
            <td class="text-center font-black">{{ number_format($row['cogs']) }}</td>
            <td class="text-center font-black">{{ number_format($row['profit']) }}</td>
            <td class="text-center font-black">{{ number_format($row['margin'], 1) }}%</td>
        </tr>
    @endforeach
    <tr class="total-row">
        <td colspan="7" class="text-right font-black" style="padding-right: 20px;">GRAND TOTALS</td>
        <td class="text-center font-black">{{ number_format($totals['revenue']) }}</td>
        <td class="text-center font-black">---</td>
        <td class="text-center font-black">{{ number_format($totals['cogs']) }}</td>
        <td class="text-center font-black">{{ number_format($totals['profit']) }}</td>
        <td class="text-center font-black">{{ number_format($totals['margin'], 1) }}%</td>
    </tr>
</tbody>
@endsection
