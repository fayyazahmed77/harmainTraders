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
            color: #E8941A; 
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
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 4px; 
            color: #F5F0E8;
            font-size: 13px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .table th {
            text-align: left;
            border-bottom: 2px solid #231F1B;
            padding-bottom: 8px;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 11px;
            color: #E8941A;
        }
        .table td {
            padding: 10px 0;
            border-bottom: 1px solid #231F1B;
            font-size: 13px;
            color: #9B958C;
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
                <div class="headline">Order Received Successfully</div>
                <p>Hello <strong>{{ $sale->customer->title ?? 'Customer' }}</strong>,</p>
                <p>Thank you for shopping with us! We have received your order (Invoice: <strong>{{ $sale->invoice }}</strong>) and it is currently being processed.</p>
                
                <div class="details-box">
                    <strong>Invoice ID:</strong> #{{ $sale->invoice }}<br/>
                    <strong>Order Date:</strong> {{ \Carbon\Carbon::parse($sale->date)->format('d M Y') }}<br/>
                    <strong>Net Total:</strong> Rs {{ number_format($sale->net_total) }}<br/>
                    <strong>Status:</strong> {{ $sale->status }}
                </div>

                <div class="headline" style="font-size: 14px; margin-top: 30px; margin-bottom: 10px;">Items Ordered</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Item Description</th>
                            <th>Qty</th>
                            <th style="text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($sale->items as $item)
                            <tr>
                                <td>{{ $item->item->title ?? 'Product' }}</td>
                                <td>
                                    @if ($item->qty_carton > 0)
                                        {{ (int)$item->qty_carton }} Ctn
                                    @endif
                                    @if ($item->qty_pcs > 0)
                                        {{ (int)$item->qty_pcs }} Pcs
                                    @endif
                                </td>
                                <td style="text-align: right;">Rs {{ number_format($item->subtotal) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>

                <p style="margin-top: 25px;">You can view the real-time status or download your invoice PDF directly using the secure link below:</p>
                <div class="btn-container">
                    <a href="{{ url('/g/' . ($sale->customer->guest_token ?? '') . '/invoice/' . $sale->invoice) }}" class="btn">VIEW ORDER DETAILS</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
