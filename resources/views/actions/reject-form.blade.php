<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reject Access Request - Harnain Traders ERP</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #080706;
            --card-bg: #12100e;
            --primary: #E8941A;
            --danger: #EF4444;
            --text-primary: #F5F0E8;
            --text-secondary: #9B958C;
            --border: #231F1B;
            --input-bg: #1A1714;
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
        }

        .background-glow {
            position: absolute;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(239, 68, 68, 0.05) 0%, rgba(0,0,0,0) 70%);
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
            text-align: center;
        }

        h1 {
            font-size: 22px;
            font-weight: 900;
            margin: 0 0 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: center;
        }

        .subtitle {
            font-size: 13px;
            color: var(--text-secondary);
            margin: 0 0 25px;
            line-height: 1.5;
            text-align: center;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 8px;
            color: var(--text-primary);
        }

        textarea {
            width: 100%;
            height: 120px;
            background-color: var(--input-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px;
            color: var(--text-primary);
            font-family: inherit;
            font-size: 13px;
            box-sizing: border-box;
            resize: none;
            outline: none;
            transition: border-color 0.2s ease;
        }

        textarea:focus {
            border-color: var(--primary);
        }

        .btn-container {
            display: flex;
            gap: 12px;
        }

        .btn {
            flex: 1;
            padding: 12px;
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
            text-decoration: none;
            box-sizing: border-box;
        }

        .btn-submit {
            background-color: var(--danger);
            color: var(--text-primary);
            border: none;
        }

        .btn-submit:hover {
            opacity: 0.9;
        }

        .btn-cancel {
            background-color: var(--border);
            color: var(--text-secondary);
            border: 1px solid var(--border);
        }

        .btn-cancel:hover {
            color: var(--text-primary);
            background-color: rgba(255, 255, 255, 0.02);
        }

        .error-message {
            color: var(--danger);
            font-size: 11px;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="background-glow"></div>
    <div class="card">
        <div class="brand">Harnain Traders ERP</div>
        <h1>Reject Access Request</h1>
        <p class="subtitle">Please provide a reason for rejecting this access request.</p>

        <form action="{{ $actionUrl }}" method="POST">
            @csrf
            <div class="form-group">
                <label for="reason">Rejection Reason</label>
                <textarea id="reason" name="reason" placeholder="Explain why this request is being rejected..." required autofocus>{{ old('reason') }}</textarea>
                @error('reason')
                    <div class="error-message">{{ $message }}</div>
                @enderror
            </div>

            <div class="btn-container">
                <a href="/dashboard" class="btn btn-cancel">Cancel</a>
                <button type="submit" class="btn btn-submit">Confirm Rejection</button>
            </div>
        </form>
    </div>
</body>
</html>
