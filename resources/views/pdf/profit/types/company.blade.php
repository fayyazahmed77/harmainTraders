@extends('pdf.profit.layout')

@section('title', 'Company Wise Profit Report')

@section('content')
<thead>
    <tr>
        <th>COMPANY / MANUFACTURER</th>
        <th class="text-right" style="width: 100px;">SALES</th>
        <th class="text-right" style="width: 100px;">PURCHASES</th>
        <th class="text-right" style="width: 100px;">GROSS PROFIT</th>
        <th class="text-center" style="width: 80px;">GROSS PROFIT %</th>
    </tr>
</thead>
<tbody>
    @foreach($data as $row)
        <tr>
            <td class="font-black uppercase">{{ $row['name'] }}</td>
            <td class="text-right font-bold">{{ number_format($row['revenue']) }}</td>
            <td class="text-right font-bold text-muted">{{ number_format($row['cogs']) }}</td>
            <td class="text-right font-black {{ $row['profit'] >= 0 ? 'text-emerald' : 'text-rose' }}">{{ number_format($row['profit']) }}</td>
            <td class="text-center">
                <span class="pill {{ $row['margin'] >= 0 ? '' : 'style="background: #fff1f2; color: #e11d48;"' }}">
                    {{ number_format($row['margin'], 2) }}%
                </span>
            </td>
        </tr>
    @endforeach
    <tr class="total-row">
        <td class="text-right" style="padding-right: 20px;">GRAND TOTALS</td>
        <td class="text-right">{{ number_format($totals['revenue']) }}</td>
        <td class="text-right">{{ number_format($totals['cogs']) }}</td>
        <td class="text-right {{ $totals['profit'] >= 0 ? 'text-emerald' : 'text-rose' }}">{{ number_format($totals['profit']) }}</td>
        <td class="text-center">
            <span class="pill" style="background: #4f46e5; color: white;">{{ number_format($totals['margin'], 2) }}%</span>
        </td>
    </tr>
</tbody>
@endsection
