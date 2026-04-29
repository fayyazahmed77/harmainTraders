@extends('pdf.sales.layout')

@section('content')
@php
    $groupedData = collect($data)->groupBy('account_title');
    $globalIdx = 0;
@endphp

@foreach($groupedData as $account => $items)
    <div style="margin-bottom: 15px; page-break-inside: avoid; border: 1px solid #000;">
        <!-- Account Header -->
        <div style="background-color: #fff; border-bottom: 1px solid #000; padding: 4px 8px;">
            <table style="width: 100%; border: none;">
                <tr>
                    <td style="border: none; padding: 2px;">
                        <span style="font-size: 6px; color: #666; text-transform: uppercase;">Account Title</span><br>
                        <strong style="font-size: 9px; text-transform: uppercase;">{{ $account }}</strong>
                    </td>
                    <td style="border: none; text-align: right; padding: 2px;">
                        <span style="font-size: 6px; color: #666; text-transform: uppercase;">Total Sales</span><br>
                        <strong style="font-size: 10px;">{{ number_format($items->sum('amount'), 2) }}</strong>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="width: 25px; border: 1px solid #000;">S#</th>
                    <th style="border: 1px solid #000; text-align: left;">Product</th>
                    <th style="width: 40px; border: 1px solid #000;" class="text-center">Pack</th>
                    <th style="width: 30px; border: 1px solid #000;" class="text-center">QF</th>
                    <th style="width: 30px; border: 1px solid #000;" class="text-center">QP</th>
                    <th style="width: 50px; border: 1px solid #000;" class="text-right">Rate</th>
                    <th style="width: 70px; border: 1px solid #000;" class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $idx => $row)
                    @php $globalIdx++; @endphp
                    <tr>
                        <td style="font-size: 7px; text-align: center; border: 1px solid #eee;">{{ $globalIdx }}</td>
                        <td style="font-size: 8px; font-weight: bold; text-transform: uppercase; padding: 3px; border: 1px solid #eee;">{{ $row['product_name'] }}</td>
                        <td style="font-size: 7px; text-align: center; border: 1px solid #eee;">{{ $row['pack_size'] }}</td>
                        <td style="font-size: 8px; font-weight: bold; text-align: center; border: 1px solid #eee;">{{ (int)$row['qty_full'] }}</td>
                        <td style="font-size: 8px; text-align: center; border: 1px solid #eee;">{{ (int)$row['qty_pcs'] }}</td>
                        <td style="font-size: 8px; text-align: right; border: 1px solid #eee;">{{ number_format($row['rate'], 1) }}</td>
                        <td style="font-size: 8px; font-weight: 900; text-align: right; border: 1px solid #eee;">{{ number_format($row['amount'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
@endforeach
@endsection
