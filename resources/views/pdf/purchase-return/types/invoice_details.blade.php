@extends('pdf.purchase-return.layout')

@section('content')
    @php
        $grouped = collect($data)->groupBy('invoice');
    @endphp

    @foreach($grouped as $invoice => $items)
        <table style="margin-bottom: 10px; border: 1px solid #e2e8f0;">
            <thead>
                <tr style="background-color: #fff1f2;">
                    <th colspan="3" style="font-size: 10px; color: #e11d48;">INV # {{ $invoice }} | {{ $items->first()['account_name'] }}</th>
                    <th colspan="2" class="text-right" style="font-size: 10px; color: #e11d48;">DATE: {{ $items->first()['date'] }}</th>
                </tr>
                <tr style="background-color: #f8fafc;">
                    <th>Product</th>
                    <th class="text-right">Qty (Ctn)</th>
                    <th class="text-right">Qty (Pcs)</th>
                    <th class="text-right">Rate</th>
                    <th class="text-right">Net Value</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                    <tr>
                        <td class="uppercase">{{ $item['product_name'] }}</td>
                        <td class="text-right">{{ $item['qty_full'] }}</td>
                        <td class="text-right">{{ $item['qty_pcs'] }}</td>
                        <td class="text-right">{{ f($item['rate']) }}</td>
                        <td class="text-right font-bold">{{ f($item['amount']) }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr style="background-color: #f8fafc;">
                    <td class="font-black uppercase">Invoice Total</td>
                    <td class="text-right font-black">{{ $items->sum('qty_full') }}</td>
                    <td class="text-right font-black">{{ $items->sum('qty_pcs') }}</td>
                    <td></td>
                    <td class="text-right font-black text-rose">{{ f($items->sum('amount')) }}</td>
                </tr>
            </tfoot>
        </table>
    @endforeach

    <div style="margin-top: 20px; padding: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
        <table style="margin: 0; border: none;">
            <tr>
                <td style="border: none;" class="font-black uppercase">Grand Aggregated Reversal</td>
                <td style="border: none;" class="text-right font-black text-rose" style="font-size: 14px;">{{ f(collect($data)->sum('amount')) }}</td>
            </tr>
        </table>
    </div>
@endsection
