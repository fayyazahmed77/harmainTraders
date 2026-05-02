<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Financial Request Update</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f7;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #0A0C10;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            color: #F1F1F1;
            margin: 0;
            font-size: 24px;
        }
        .header span {
            color: #C9A84C;
        }
        .content {
            padding: 40px;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 20px;
        }
        .status-approved { background-color: #d1fae5; color: #065f46; }
        .status-rejected { background-color: #fee2e2; color: #991b1b; }
        
        .details-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
            margin: 25px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .detail-label { color: #64748b; font-weight: 500; }
        .detail-value { color: #1e293b; font-weight: 700; }

        .footer {
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            background-color: #f8fafc;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #C9A84C;
            color: #0A0C10 !important;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Harmain <span>Traders</span></h1>
        </div>
        
        <div class="content">
            <h2>Hello {{ $finRequest->investor->full_name }},</h2>
            
            <p>Your financial request has been reviewed by our administration team.</p>

            <div class="status-badge status-{{ $status }}">
                Request {{ ucfirst($status) }}
            </div>

            <div class="details-box">
                <div class="detail-row">
                    <span class="detail-label">Request Type:</span>
                    <span class="detail-value">{{ ucwords(str_replace('_', ' ', $finRequest->request_type)) }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Amount:</span>
                    <span class="detail-value">PKR {{ number_format($finRequest->amount, 2) }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Requested On:</span>
                    <span class="detail-value">{{ $finRequest->created_at->format('d M Y, h:i A') }}</span>
                </div>
            </div>

            @if($adminNote)
            <div style="margin-top: 20px;">
                <p style="font-weight: bold; margin-bottom: 5px;">Admin Note:</p>
                <p style="color: #475569; font-style: italic; background: #fffbeb; padding: 15px; border-left: 4px solid #f59e0b;">
                    "{{ $adminNote }}"
                </p>
            </div>
            @endif

            <p>You can view the full details of your transaction history and current balance by logging into your investor dashboard.</p>
            
            <a href="{{ config('app.url') }}/investor/dashboard" class="button">Go to Dashboard</a>
        </div>
        
        <div class="footer">
            &copy; {{ date('Y') }} Harmain Traders. All rights reserved.<br>
            Wholesale & Supply Chain Excellence.
        </div>
    </div>
</body>
</html>
