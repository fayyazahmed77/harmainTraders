@php
$logo_path = storage_path('app/public/img/favicon.png');
if (!file_exists($logo_path)) {
$logo_path = public_path('storage/img/favicon.png');
}

$logo_base64 = "";
if (file_exists($logo_path)) {
$logo_data = file_get_contents($logo_path);
$logo_type = pathinfo($logo_path, PATHINFO_EXTENSION);
$logo_base64 = 'data:image/' . $logo_type . ';base64,' . base64_encode($logo_data);
}
@endphp
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Offer List - {{ $offer->account->title }}</title>
    <style>
        body {
            font-family: sans-serif;
            font-size: 12px;
        }

        .header {
            width: 100%;
            margin-bottom: 20px;
        }

        .header-left {
            float: left;
        }

        .header-right {
            float: right;
            text-align: right;
        }

        .clear {
            clear: both;
        }

        .logo-section {
            margin-bottom: 10px;
        }

        .logo-icon {
            display: inline-block;
            vertical-align: middle;
            width: 40px;
            height: 40px;
            margin-right: 10px;
        }

        .brand-text {
            display: inline-block;
            vertical-align: middle;
        }

        .brand-name {
            font-size: 18px;
            font-weight: bold;
            color: #444;
            line-height: 1.2;
        }

        .brand-tagline {
            font-size: 9px;
            color: #888;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .category-title {
            font-weight: bold;
            font-size: 14px;
            margin-top: 15px;
            margin-bottom: 5px;
            text-transform: uppercase;
            color: #f97316;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        th,
        td {
            border: 1px solid #000;
            padding: 5px;
            text-align: center;
        }

        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }

        .text-left {
            text-align: left;
        }
    </style>
</head>

<body>
    <div class="logo-section" style="text-align: center; margin-bottom: 15px;">
        <div class="logo-icon" style="display: inline-block;">
            <img src="{{ $logo_base64 }}" width="40" height="40" alt="Logo">
        </div>
        <div class="brand-text" style="display: inline-block;">
            <div class="brand-name">Harmain <span style="color:#000">Traders</span></div>
            <div class="brand-tagline">Wholesale <span style="color:#000">&</span> Supply Chain</div>
        </div>
    </div>
    <div style="text-align: center; margin-bottom: 15px;">
        <span>1st Floor, Marvi Market, Katchi Gali No.1 Denso Hall, Karachi</span><br>
        <span>Phone No. : 0332 3218684 / 021 32401607</span>
    </div>
    <div class="header">
        <div class="header-left">
            <strong>Name:</strong> {{ $offer->account->title }}<br>
            <small>{{ $offer->account->address }}</small>
        </div>
        <div class="header-right">
            <strong>Date:</strong> {{ \Carbon\Carbon::parse($offer->date)->format('d/m/Y') }}<br>
            <strong>Price Type:</strong> {{ ucfirst($offer->offertype) }}
        </div>
        <div class="clear"></div>
    </div>

    @php
    $groupedItems = $offer->items->groupBy(function($item) {
    // The Items model has a 'category' field that stores the category ID
    // We need to look up the category name
    if (isset($item->items) && isset($item->items->category)) {
    // Check if category is already loaded as a relationship
    if ($item->items->relationLoaded('category') && $item->items->category instanceof \App\Models\ItemCategory) {
    return $item->items->category->name;
    }

    // Otherwise, category is an ID - look it up
    if (is_numeric($item->items->category)) {
    $cat = \App\Models\ItemCategory::find($item->items->category);
    return $cat ? $cat->name : 'UNCATEGORIZED';
    }
    }
    return 'UNCATEGORIZED';
    });
    @endphp

    @foreach($groupedItems as $category => $items)
    <div class="category-title">{{ $category }}</div>
    <table>
        <thead>
            <tr>
                <th class="text-left" style="width: 40%;">Items</th>
                <th>Pack Ctn</th>
                <th>Loose Ctn</th>
                <th>M.R.P</th>
                <th>Scheme</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $item)
            <tr>
                <td class="text-left">{{ $item->items->title }}</td>
                <td>{{ $item->pack_ctn }}</td>
                <td>{{ $item->loos_ctn }}</td>
                <td>{{ $item->mrp }}</td>
                <td>{{ $item->scheme }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endforeach
</body>

</html>