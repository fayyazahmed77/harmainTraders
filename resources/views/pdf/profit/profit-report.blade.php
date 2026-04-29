@extends('pdf.profit.layout')

@section('title', 'Profit Analysis Report')

@section('content')
<thead>
    <tr>
        @if($type === 'transaction')
            <th style="width: 25px;">S.#</th>
            <th style="width: 60px;">Inv #</th>
            <th style="width: 65px;">Inv Date</th>
            <th style="width: 120px;">Account</th>
            <th>Product</th>
            <th class="text-right" style="width: 45px;">Sale Qty</th>
            <th class="text-right" style="width: 60px;">Sale Rate</th>
        @else
            @if(in_array($type, ['party', 'salesman', 'company']))
                <th>{{ $type === 'company' ? 'COMPANY' : 'ENTITY NAME' }}</th>
            @endif
            @if($type === 'date')
                <th>DATE</th>
            @endif
            @if($type === 'month')
                <th>MONTH</th>
            @endif
        @endif
        <th class="text-right" style="width: 75px;">{{ $type === 'transaction' ? 'Sale Amount' : ($type === 'company' ? 'SALES' : 'REVENUE') }}</th>
        <th class="text-right" style="width: 75px;">{{ $type === 'transaction' ? 'Purch Rate' : ($type === 'company' ? 'PURCHASES' : 'COGS') }}</th>
        <th class="text-right" style="width: 75px;">{{ $type === 'transaction' ? 'Purch Amount' : ($type === 'company' ? 'GROSS PROFIT' : 'PROFIT') }}</th>
        <th class="text-center" style="width: 45px;">%</th>
    </tr>
</thead>
<tbody>
    @foreach($data as $row)
        <tr>
            @if($type === 'transaction')
                <td class="text-center text-muted">{{ $loop->iteration }}</td>
                <td class="font-black text-indigo">{{ $row['invoice'] }}</td>
                <td class="text-center font-bold text-muted">{{ \Carbon\Carbon::parse($row['date'])->format('d/m/y') }}</td>
                <td class="font-bold">{{ $row['customer_name'] }}</td>
                <td class="font-bold uppercase">{{ $row['product_name'] }}</td>
                <td class="text-right font-black">{{ number_format($row['qty']) }}</td>
                <td class="text-right font-bold text-muted">{{ number_format($row['sale_rate'], 2) }}</td>
                <td class="text-right font-black">{{ number_format($row['revenue']) }}</td>
                <td class="text-right font-bold text-muted">{{ number_format($row['purchase_rate'], 2) }}</td>
                <td class="text-right font-black">{{ number_format($row['cogs']) }}</td>
            @else
                @if(in_array($type, ['party', 'salesman', 'company']))
                    <td class="font-black uppercase">{{ $row['name'] }}</td>
                @endif
                @if($type === 'date')
                    <td class="font-bold">{{ \Carbon\Carbon::parse($row['date'])->format('d M Y') }}</td>
                @endif
                @if($type === 'month')
                    <td class="font-black uppercase">{{ $row['month'] }}</td>
                @endif

                <td class="text-right font-black">{{ number_format($row['revenue']) }}</td>
                <td class="text-right font-bold text-muted">{{ number_format($row['purchase_rate'] ?? 0, 2) }}</td>
                <td class="text-right font-black">{{ number_format($row['cogs']) }}</td>
            @endif
            <td class="text-center font-bold">
                {{ number_format($row['margin'], 1) }}%
            </td>
        </tr>
    @endforeach
    <tr class="total-row">
        <td colspan="{{ $type === 'transaction' ? 7 : 1 }}" class="text-right font-black" style="padding-right: 20px;">GRAND TOTALS</td>
        <td class="text-right font-black">{{ number_format($totals['revenue']) }}</td>
        <td class="text-right font-black">{{ number_format($totals['cogs'] ?? 0) }}</td>
        <td class="text-right font-black">{{ number_format($totals['profit']) }}</td>
        <td class="text-center font-black">
            {{ number_format($totals['margin'], 2) }}%
        </td>
    </tr>
</tbody>
@endsection
