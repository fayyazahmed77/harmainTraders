@extends('pdf.stock.layout')

@section('content')
@php
    $showTP = ($params['showTP'] ?? 'true') === 'true';
    $showRetail = ($params['showRetail'] ?? 'true') === 'true';
    $showPT2 = ($params['showPT2'] ?? 'false') === 'true';
    $showPT3 = ($params['showPT3'] ?? 'false') === 'true';
    $showPT4 = ($params['showPT4'] ?? 'false') === 'true';
    $showPT5 = ($params['showPT5'] ?? 'false') === 'true';
    $showPT6 = ($params['showPT6'] ?? 'false') === 'true';
    $showPT7 = ($params['showPT7'] ?? 'false') === 'true';
@endphp
<table>
    <thead>
        <tr>
            <th style="width: 30px;">S.#</th>
            <th style="width: 70px;">Code</th>
            <th>Item Description</th>
            @if($showTP) <th style="width: 70px;">T.P.</th> @endif
            @if($showPT2) <th style="width: 70px;">PT 2</th> @endif
            @if($showPT3) <th style="width: 70px;">PT 3</th> @endif
            @if($showPT4) <th style="width: 70px;">PT 4</th> @endif
            @if($showPT5) <th style="width: 70px;">PT 5</th> @endif
            @if($showPT6) <th style="width: 70px;">PT 6</th> @endif
            @if($showPT7) <th style="width: 70px;">PT 7</th> @endif
            @if($showRetail) <th style="width: 70px;">Retail</th> @endif
        </tr>
    </thead>
    <tbody>
        @foreach($data as $idx => $row)
            <tr>
                <td class="text-center">{{ $idx + 1 }}</td>
                <td class="text-center">{{ $row['code'] }}</td>
                <td class="bold uppercase">{{ $row['item_name'] }}</td>
                @if($showTP) <td class="text-right bold">{{ number_format($row['trade_price'], 2) }}</td> @endif
                @if($showPT2) <td class="text-right">{{ number_format($row['pt2'], 2) }}</td> @endif
                @if($showPT3) <td class="text-right">{{ number_format($row['pt3'], 2) }}</td> @endif
                @if($showPT4) <td class="text-right">{{ number_format($row['pt4'], 2) }}</td> @endif
                @if($showPT5) <td class="text-right">{{ number_format($row['pt5'], 2) }}</td> @endif
                @if($showPT6) <td class="text-right">{{ number_format($row['pt6'], 2) }}</td> @endif
                @if($showPT7) <td class="text-right">{{ number_format($row['pt7'], 2) }}</td> @endif
                @if($showRetail) <td class="text-right bold" style="color: #059669;">{{ number_format($row['retail'], 2) }}</td> @endif
            </tr>
        @endforeach
    </tbody>
</table>
@endsection
