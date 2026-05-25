<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Action Successful - Harnain Traders ERP</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #080706;
            --card-bg: #12100e;
            --primary: #E8941A;
            --success: #10B981;
            --danger: #EF4444;
            --text-primary: #F5F0E8;
            --text-secondary: #9B958C;
            --border: #231F1B;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-primary);
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
        }

        .background-glow {
            position: absolute;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(232, 148, 26, 0.08) 0%, rgba(0,0,0,0) 70%);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1;
            pointer-events: none;
        }

        .card {
            background-color: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 40px;
            width: 90%;
            max-width: 450px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            z-index: 2;
            position: relative;
            backdrop-filter: blur(10px);
        }

        .brand {
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 3px;
            color: var(--primary);
            text-transform: uppercase;
            margin-bottom: 30px;
        }

        .icon-container {
            width: 80px;
            height: 80px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
        }

        .icon {
            color: var(--success);
            font-size: 40px;
            font-weight: bold;
        }

        h1 {
            font-size: 24px;
            font-weight: 900;
            margin: 0 0 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .subtitle {
            font-size: 14px;
            color: var(--text-secondary);
            margin: 0 0 30px;
            line-height: 1.5;
        }

        .details-box {
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 30px;
            font-size: 12px;
            color: var(--text-secondary);
            text-align: left;
            word-break: break-all;
        }

        .details-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }

        .details-row:last-child {
            margin-bottom: 0;
        }

        .details-label {
            font-weight: 600;
            color: var(--text-primary);
        }

        .btn {
            background-color: var(--primary);
            color: var(--bg-color);
            border: none;
            padding: 12px 30px;
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            display: inline-block;
        }

        .btn:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        .btn:active {
            transform: translateY(0);
        }
    </style>
</head>
<body>
    <div class="background-glow"></div>
    <div class="card">
        <div class="brand">Harnain Traders ERP</div>
        <div class="icon-container">
            <span class="icon">&#10004;</span>
        </div>
        <h1>Action Executed</h1>
        <p class="subtitle">The access authorization request has been successfully processed.</p>
        
        <div class="details-box">
            <div class="details-row">
                <span class="details-label">Request ID:</span>
                <span>{{ $id }}</span>
            </div>
            <div class="details-row">
                <span class="details-label">Workflow Action:</span>
                <span style="color: var(--primary); font-weight: bold; text-transform: uppercase;">{{ $action }}</span>
            </div>
        </div>

        <a href="/dashboard" class="btn">Go to Dashboard</a>
    </div>
</body>
</html>
