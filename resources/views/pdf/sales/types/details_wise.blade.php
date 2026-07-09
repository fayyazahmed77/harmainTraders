@extends('pdf.sales.layout')

@section('content')
<table>
    <thead>
        <tr>
            <th style="width: 30px;">S.#</th>
            <th style="width: 100px;">Date</th>
            <th style="width: 70px;" class="text-right">Bill Count</th>
            <th style="width: 70px;" class="text-right">Qty F</th>
            <th style="width: 70px;" class="text-right">Qty P</th>
            <th style="width: 90px;" class="text-right">Gross</th>
            <th style="width: 90px;" class="text-right">Discount</th>
            <th style="width: 90px;" class="text-right">Sales Return</th>
            <th style="width: 100px;" class="text-right">Net Amount</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $index => $row)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>{{ strtoupper(date('d M Y', strtotime($row['date']))) }}</td>
            <td class="text-right">{{ number_format($row['bill_count'], 0) }}</td>
            <td class="text-right">{{ number_format($row['qty_full'], 0) }}</td>
            <td class="text-right">{{ number_format($row['qty_pcs'], 0) }}</td>
            <td class="text-right">{{ number_format($row['gross'], 2) }}</td>
            <td class="text-right">{{ number_format($row['discount'], 2) }}</td>
            <td class="text-right">{{ number_format($row['sales_return'] ?? 0, 2) }}</td>
            <td class="text-right font-bold">{{ number_format($row['amount'], 2) }}</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="background-color: #f8fafc; font-weight: 900;">
            <td colspan="2" class="text-right uppercase">Totals</td>
            <td class="text-right">{{ collect($data)->sum('bill_count') }}</td>
            <td class="text-right">{{ collect($data)->sum('qty_full') }}</td>
            <td class="text-right">{{ collect($data)->sum('qty_pcs') }}</td>
            <td class="text-right">{{ number_format(collect($data)->sum('gross'), 2) }}</td>
            <td class="text-right">{{ number_format(collect($data)->sum('discount'), 2) }}</td>
            <td class="text-right">{{ number_format(collect($data)->sum('sales_return'), 2) }}</td>
            <td class="text-right">{{ number_format(collect($data)->sum('amount'), 2) }}</td>
        </tr>
    </tfoot>
</table>
@endsection
