<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style>
        body { 
            background-color: #080706; 
            color: #F5F0E8; 
            font-family: 'Outfit', 'Barlow', Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            -webkit-text-size-adjust: none;
            width: 100% !important;
        }
        .wrapper { 
            width: 100%; 
            padding: 40px 0; 
            background-color: #080706;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #12100e; 
            border: 1px solid #231F1B; 
            border-radius: 12px; 
            overflow: hidden; 
        }
        .header { 
            background-color: #1A1714; 
            padding: 25px; 
            text-align: center; 
            border-bottom: 1px solid #231F1B;
        }
        .content { 
            padding: 40px; 
        }
        .headline { 
            font-size: 20px; 
            font-weight: 900; 
            margin-bottom: 20px; 
            text-transform: uppercase; 
            color: #EF4444; 
            letter-spacing: 1px;
        }
        p {
            font-size: 14px;
            color: #9B958C;
            line-height: 1.6;
        }
        strong {
            color: #F5F0E8;
        }
        .details-box { 
            background-color: #1A1714; 
            border-left: 4px solid #EF4444; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 4px; 
            color: #F5F0E8;
            font-size: 13px;
        }
        .btn-container {
            margin-top: 35px;
            text-align: left;
        }
        .btn {
            padding: 12px 25px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 900; 
            display: inline-block; 
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            background-color: #E8941A; 
            color: #080706; 
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <span style="color: #E8941A; font-weight: 900; letter-spacing: 3px; font-size: 12px; text-transform: uppercase;">HARNAIN TRADERS ERP</span>
            </div>
            <div class="content">
                <div class="headline">Inventory Low Stock Alert</div>
                <p>Hello Administrator,</p>
                <p>This is an automated system alert notifying you that inventory levels for the item below have dropped below the minimum threshold (reorder level).</p>
                
                <div class="details-box">
                    <strong>Product Title:</strong> {{ $item->title }}<br/>
                    <strong>SKU / Code:</strong> {{ $item->code }}<br/>
                    <strong>Category:</strong> {{ $item->category->name ?? 'N/A' }}<br/><br/>
                    <strong>Current Stock Level:</strong> {{ $item->total_stock_pcs }} pieces ({{ $item->stock_breakdown }})<br/>
                    <strong>Minimum Re-order Level:</strong> {{ $item->reorder_level }} pieces
                </div>

                <p>Please place a supplier purchase order to replenish stock levels soon.</p>
                <div class="btn-container">
                    <a href="{{ url('/items/' . $item->id . '/show') }}" class="btn">VIEW ITEM STOCK</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
