<?php
require_once 'php/config.php';

// SMTP Configuration Checker
function testSMTPConnection() {
    $smtp_host = MAIL_HOST;
    $smtp_port = MAIL_PORT;
    $smtp_user = MAIL_USERNAME;
    $smtp_pass = MAIL_PASSWORD;
    
    $results = [];
    
    // Test 1: Basic connection
    $socket = @fsockopen($smtp_host, $smtp_port, $errno, $errstr, 10);
    if ($socket) {
        $results['connection'] = ['status' => 'success', 'message' => "Connected to {$smtp_host}:{$smtp_port}"];
        fclose($socket);
    } else {
        $results['connection'] = ['status' => 'error', 'message' => "Failed to connect to {$smtp_host}:{$smtp_port} - {$errstr} ({$errno})"];
        return $results;
    }
    
    // Test 2: SMTP Authentication
    $socket = @fsockopen($smtp_host, $smtp_port, $errno, $errstr, 10);
    if ($socket) {
        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) == '220') {
            $results['smtp_greeting'] = ['status' => 'success', 'message' => 'SMTP server responded correctly'];
            
            // Send EHLO
            fputs($socket, "EHLO localhost\r\n");
            $response = fgets($socket, 1024);
            
            // Try STARTTLS
            fputs($socket, "STARTTLS\r\n");
            $response = fgets($socket, 1024);
            if (substr($response, 0, 3) == '220') {
                $results['starttls'] = ['status' => 'success', 'message' => 'STARTTLS supported'];
                
                // Enable TLS
                if (stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    $results['tls'] = ['status' => 'success', 'message' => 'TLS encryption enabled'];
                    
                    // Try authentication
                    fputs($socket, "EHLO localhost\r\n");
                    $response = fgets($socket, 1024);
                    
                    fputs($socket, "AUTH LOGIN\r\n");
                    $response = fgets($socket, 1024);
                    if (substr($response, 0, 3) == '334') {
                        fputs($socket, base64_encode($smtp_user) . "\r\n");
                        $response = fgets($socket, 1024);
                        if (substr($response, 0, 3) == '334') {
                            fputs($socket, base64_encode($smtp_pass) . "\r\n");
                            $response = fgets($socket, 1024);
                            if (substr($response, 0, 3) == '235') {
                                $results['auth'] = ['status' => 'success', 'message' => 'SMTP authentication successful'];
                            } else {
                                $results['auth'] = ['status' => 'error', 'message' => 'SMTP authentication failed - ' . trim($response)];
                            }
                        } else {
                            $results['auth'] = ['status' => 'error', 'message' => 'Username rejected - ' . trim($response)];
                        }
                    } else {
                        $results['auth'] = ['status' => 'error', 'message' => 'AUTH LOGIN not supported - ' . trim($response)];
                    }
                } else {
                    $results['tls'] = ['status' => 'error', 'message' => 'Failed to enable TLS encryption'];
                }
            } else {
                $results['starttls'] = ['status' => 'error', 'message' => 'STARTTLS not supported - ' . trim($response)];
            }
        } else {
            $results['smtp_greeting'] = ['status' => 'error', 'message' => 'Invalid SMTP greeting - ' . trim($response)];
        }
        fclose($socket);
    }
    
    return $results;
}

// Run tests
$testResults = testSMTPConnection();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMTP Configuration Checker - MathEase</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .test-results { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .test-item { padding: 15px; border-bottom: 1px solid #eee; }
        .test-item:last-child { border-bottom: none; }
        .test-title { font-weight: bold; margin-bottom: 5px; }
        .test-success { color: #27ae60; }
        .test-error { color: #e74c3c; }
        .config-info { background: #e8f4fd; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .config-info h3 { margin-top: 0; color: #0c5460; }
        .solution { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .solution h3 { margin-top: 0; color: #856404; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 SMTP Configuration Checker</h1>
            <p>Diagnose email delivery issues</p>
        </div>

        <div class="config-info">
            <h3>Current Configuration</h3>
            <p><strong>SMTP Host:</strong> <?php echo MAIL_HOST; ?></p>
            <p><strong>SMTP Port:</strong> <?php echo MAIL_PORT; ?></p>
            <p><strong>Username:</strong> <?php echo MAIL_USERNAME; ?></p>
            <p><strong>Password:</strong> <?php echo str_repeat('*', strlen(MAIL_PASSWORD)); ?></p>
            <p><strong>From Email:</strong> <?php echo MAIL_FROM; ?></p>
        </div>

        <div class="test-results">
            <h3 style="padding: 15px; margin: 0; background: #f8f9fa; border-bottom: 1px solid #eee;">Test Results</h3>
            
            <?php foreach ($testResults as $test => $result): ?>
                <div class="test-item">
                    <div class="test-title"><?php echo ucfirst(str_replace('_', ' ', $test)); ?></div>
                    <div class="<?php echo $result['status'] === 'success' ? 'test-success' : 'test-error'; ?>">
                        <?php echo $result['message']; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <?php if (isset($testResults['auth']) && $testResults['auth']['status'] === 'error'): ?>
        <div class="solution">
            <h3>🔑 Gmail Authentication Issue</h3>
            <p><strong>Problem:</strong> Gmail SMTP authentication is failing. This is likely because:</p>
            <ul>
                <li>You're using your regular Gmail password instead of an App Password</li>
                <li>2-Factor Authentication is not enabled on your Gmail account</li>
                <li>The App Password is incorrect or expired</li>
            </ul>
            
            <h4>Solution Steps:</h4>
            <ol>
                <li><strong>Enable 2-Factor Authentication:</strong>
                    <ul>
                        <li>Go to your Google Account settings</li>
                        <li>Navigate to Security → 2-Step Verification</li>
                        <li>Enable 2-Step Verification if not already enabled</li>
                    </ul>
                </li>
                <li><strong>Generate App Password:</strong>
                    <ul>
                        <li>Go to Google Account → Security → App passwords</li>
                        <li>Select "Mail" and "Other (custom name)"</li>
                        <li>Enter "MathEase" as the app name</li>
                        <li>Copy the generated 16-character password</li>
                    </ul>
                </li>
                <li><strong>Update Configuration:</strong>
                    <ul>
                        <li>Replace the current password in <code>php/config.php</code> with the App Password</li>
                        <li>The App Password should be 16 characters without spaces</li>
                    </ul>
                </li>
            </ol>
            
            <p><strong>Alternative:</strong> You can continue using the file-based email system by viewing emails at <a href="email-viewer.php">email-viewer.php</a></p>
        </div>
        <?php endif; ?>

        <div style="margin-top: 20px; text-align: center;">
            <a href="email-viewer.php" class="btn" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">View Saved Emails</a>
            <a href="test-email.php" class="btn" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Test Email System</a>
        </div>
    </div>
</body>
</html>
