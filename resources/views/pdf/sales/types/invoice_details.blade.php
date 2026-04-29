@extends('pdf.sales.layout')

@section('content')
@php
    $invoices = collect($data)->groupBy('sale_id');
@endphp

@foreach($invoices as $invId => $items)
    @php 
        $firstItem = $items->first(); 
    @endphp
    
    <div style="margin-bottom: 15px; page-break-inside: avoid; border: 1px solid #000;">
        <!-- Invoice Header Table -->
        <table style="width: 100%; border-collapse: collapse; border: none;">
            <tr>
                <td style="border: none; border-bottom: 1px solid #000; width: 25%; padding: 4px;">
                    <span style="font-size: 6px; color: #666; text-transform: uppercase;">Inv #</span><br>
                    <strong style="font-size: 10px;">{{ $firstItem['inv_no'] }}</strong>
                </td>
                <td style="border: none; border-bottom: 1px solid #000; width: 25%; padding: 4px;">
                    <span style="font-size: 6px; color: #666; text-transform: uppercase;">Date</span><br>
                    <strong style="font-size: 9px;">{{ \Carbon\Carbon::parse($firstItem['inv_date'])->format('d-M-Y') }}</strong>
                </td>
                <td style="border: none; border-bottom: 1px solid #000; width: 30%; padding: 4px;">
                    <span style="font-size: 6px; color: #666; text-transform: uppercase;">Account</span><br>
                    <strong style="font-size: 9px; text-transform: uppercase;">{{ $firstItem['account_title'] }}</strong>
                </td>
                <td style="border: none; border-bottom: 1px solid #000; width: 20%; text-align: right; padding: 4px;">
                    <span style="font-size: 6px; color: #666; text-transform: uppercase;">Total</span><br>
                    <strong style="font-size: 10px;">{{ number_format($firstItem['inv_amount'], 2) }}</strong>
                </td>
            </tr>
        </table>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="width: 20px; border: 1px solid #000;">S#</th>
                    <th style="text-align: left; border: 1px solid #000;">Item Description</th>
                    <th style="width: 35px; border: 1px solid #000;" class="text-right">T.P.</th>
                    <th style="width: 20px; border: 1px solid #000;" class="text-center">QF</th>
                    <th style="width: 20px; border: 1px solid #000;" class="text-center">QP</th>
                    <th style="width: 35px; border: 1px solid #000;" class="text-right">Rate</th>
                    <th style="width: 20px; border: 1px solid #000;" class="text-center">BF</th>
                    <th style="width: 30px; border: 1px solid #000;" class="text-right">Disc</th>
                    <th style="width: 50px; border: 1px solid #000;" class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $idx => $item)
                    <tr>
                        <td style="font-size: 7px; text-align: center; border: 1px solid #eee;">{{ $idx + 1 }}</td>
                        <td style="font-size: 8px; font-weight: bold; text-transform: uppercase; padding: 2px; border: 1px solid #eee;">{{ $item['item_name'] }}</td>
                        <td style="font-size: 7px; text-align: right; border: 1px solid #eee;">{{ number_format($item['trade_price'], 1) }}</td>
                        <td style="font-size: 7px; text-align: center; border: 1px solid #eee;">{{ (int)$item['qty_full'] }}</td>
                        <td style="font-size: 7px; text-align: center; border: 1px solid #eee;">{{ (int)$item['qty_pcs'] }}</td>
                        <td style="font-size: 7px; text-align: right; border: 1px solid #eee;">{{ number_format($item['rate'], 1) }}</td>
                        <td style="font-size: 7px; text-align: center; border: 1px solid #eee;">{{ (int)$item['bonus_full'] }}</td>
                        <td style="font-size: 7px; text-align: right; border: 1px solid #eee;">{{ number_format($item['disc_1'], 1) }}</td>
                        <td style="font-size: 8px; font-weight: 900; text-align: right; border: 1px solid #eee;">{{ number_format($item['amount'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
@endforeach
@endsection
