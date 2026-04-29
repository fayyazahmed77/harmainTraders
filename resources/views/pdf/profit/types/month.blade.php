@extends('pdf.profit.layout')

@section('title', 'Profit & Loss Month Wise')

@section('content')
<thead>
    <tr>
        <th style="width: 30px;">S.#</th>
        <th class="text-left">Month</th>
        <th style="width: 80px;">Sale Amount</th>
        <th style="width: 80px;">Pur Amount</th>
        <th style="width: 80px;">Gross Profit Loss</th>
        <th style="width: 40px;">%</th>
        <th style="width: 80px;">Expense</th>
        <th style="width: 80px;">Net Profit Loss</th>
        <th style="width: 40px;">%</th>
    </tr>
</thead>
<tbody>
    @php
        $calc_rev = 0;
        $calc_cogs = 0;
        $calc_prof = 0;
        $calc_exp = 0;
        $calc_net = 0;
    @endphp

    @foreach($data as $row)
        @php
            $calc_rev += $row['revenue'];
            $calc_cogs += $row['cogs'];
            $calc_prof += $row['profit'];
            $calc_exp += $row['expense'] ?? 0;
            $calc_net += $row['net_profit'] ?? 0;
        @endphp
        <tr>
            <td class="text-center">{{ $loop->iteration }}</td>
            <td class="uppercase text-left font-bold">{{ $row['month'] }}</td>
            <td class="text-right">{{ number_format($row['revenue'], 2) }}</td>
            <td class="text-right">{{ number_format($row['cogs'], 2) }}</td>
            <td class="text-right font-black">{{ number_format($row['profit'], 2) }}</td>
            <td class="text-center font-bold">{{ number_format($row['margin'], 2) }}</td>
            <td class="text-right">{{ number_format($row['expense'] ?? 0, 0) }}</td>
            <td class="text-right font-black">{{ number_format($row['net_profit'] ?? 0, 2) }}</td>
            <td class="text-center font-bold">{{ number_format($row['net_margin'] ?? 0, 2) }}</td>
        </tr>
    @endforeach
    
    @php
        $tot_margin = $calc_rev > 0 ? ($calc_prof / $calc_rev) * 100 : 0;
        $tot_net_margin = $calc_rev > 0 ? ($calc_net / $calc_rev) * 100 : 0;
    @endphp
    <tr class="total-row">
        <td colspan="2" class="text-right font-black" style="padding-right: 20px;">Total</td>
        <td class="text-right font-black">{{ number_format($calc_rev, 2) }}</td>
        <td class="text-right font-black">{{ number_format($calc_cogs, 2) }}</td>
        <td class="text-right font-black">{{ number_format($calc_prof, 2) }}</td>
        <td class="text-center font-black">{{ number_format($tot_margin, 2) }}</td>
        <td class="text-right font-black">{{ number_format($calc_exp, 0) }}</td>
        <td class="text-right font-black">{{ number_format($calc_net, 2) }}</td>
        <td class="text-center font-black">{{ number_format($tot_net_margin, 2) }}</td>
    </tr>
</tbody>
@endsection
