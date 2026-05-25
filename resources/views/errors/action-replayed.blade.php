<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Action Already Processed - Harnain Traders ERP</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #080706;
            --card-bg: #12100e;
            --primary: #E8941A;
            --warning: #F59E0B;
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
            background: radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, rgba(0,0,0,0) 70%);
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
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
        }

        .icon {
            color: var(--warning);
            font-size: 36px;
            font-weight: bold;
        }

        h1 {
            font-size: 22px;
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

        .btn {
            background-color: var(--border);
            color: var(--text-primary);
            border: 1px solid var(--border);
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
            background-color: rgba(255, 255, 255, 0.05);
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
            <span class="icon">&#9888;</span>
        </div>
        <h1>Link Processed</h1>
        <p class="subtitle">{{ $message }}</p>

        <a href="/dashboard" class="btn">Return to ERP</a>
    </div>
</body>
</html>
