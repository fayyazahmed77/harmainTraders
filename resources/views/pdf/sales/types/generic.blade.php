@extends('pdf.sales.layout')

@section('content')
<div style="text-align: center; padding: 50px; border: 2px dashed #cbd5e1; border-radius: 8px; color: #64748b;">
    <h1 style="font-size: 18px; margin-bottom: 10px;">{{ strtoupper(str_replace('_', ' ', $type)) }}</h1>
    <p>This report template is initialized and ready for data implementation.</p>
    
    <table style="margin-top: 30px;">
        <thead>
            <tr>
                <th>S.#</th>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $index => $row)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $row['date'] ?? '-' }}</td>
                <td>{{ $row['customer_name'] ?? ($row['product_name'] ?? 'Detail') }}</td>
                <td class="text-right">{{ number_format($row['amount'] ?? 0, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection
