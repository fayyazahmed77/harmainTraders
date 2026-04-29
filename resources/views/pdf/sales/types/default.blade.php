@extends('pdf.sales.layout')

@section('content')
<div style="text-align: center; padding: 50px; border: 2px dashed #cbd5e1; border-radius: 8px; color: #64748b;">
    <h1 style="font-size: 18px; margin-bottom: 10px;">{{ strtoupper(str_replace('_', ' ', $type)) }}</h1>
    <p>Report initialized. Waiting for detailed column configuration.</p>
    
    <table style="margin-top: 30px;">
        <thead>
            <tr>
                @if(count($data) > 0)
                    @foreach(array_keys($data[0]) as $key)
                        @if(!str_contains($key, '_id'))
                            <th>{{ strtoupper(str_replace('_', ' ', $key)) }}</th>
                        @endif
                    @endforeach
                @else
                    <th>No Data</th>
                @endif
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
            <tr>
                @foreach($row as $key => $value)
                    @if(!str_contains($key, '_id'))
                        <td class="{{ is_numeric($value) ? 'text-right' : '' }}">
                            {{ is_numeric($value) ? number_format($value, 2) : $value }}
                        </td>
                    @endif
                @endforeach
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection
