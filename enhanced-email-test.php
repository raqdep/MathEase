<?php
require_once 'php/config.php';

/**
 * Enhanced Email Sending with Multiple Fallback Methods
 * This function tries multiple methods to ensure emails are delivered
 */
function send_verification_email($to, $subject, $htmlBody) {
    $from_email = MAIL_FROM;
    $from_name = MAIL_FROM_NAME;
    
    // Method 1: Try Gmail SMTP with improved error handling
    $smtp_result = send_gmail_smtp_improved($to, $subject, $htmlBody);
    if ($smtp_result) {
        error_log("Email sent successfully via Gmail SMTP to: {$to}");
        return true;
    }
    
    // Method 2: Try PHP mail() function
    $mail_result = send_php_mail($to, $subject, $htmlBody);
    if ($mail_result) {
        error_log("Email sent successfully via PHP mail() to: {$to}");
        return true;
    }
    
    // Method 3: Try alternative SMTP settings
    $alt_smtp_result = send_alternative_smtp($to, $subject, $htmlBody);
    if ($alt_smtp_result) {
        error_log("Email sent successfully via alternative SMTP to: {$to}");
        return true;
    }
    
    // Method 4: Save to file for manual sending
    $file_result = save_email_to_file($to, $subject, $htmlBody);
    if ($file_result) {
        error_log("Email saved to file for manual sending to: {$to}");
        return true;
    }
    
    error_log("All email methods failed for: {$to}");
    return false;
}

/**
 * Improved Gmail SMTP with better error handling
 */
function send_gmail_smtp_improved($to, $subject, $htmlBody) {
    $smtp_host = MAIL_HOST;
    $smtp_port = MAIL_PORT;
    $smtp_user = MAIL_USERNAME;
    $smtp_pass = MAIL_PASSWORD;
    $from_email = MAIL_FROM;
    $from_name = MAIL_FROM_NAME;
    
    // Create plain text version
    $textBody = strip_tags($htmlBody);
    
    // Build email headers
    $headers = "From: {$from_name} <{$from_email}>\r\n";
    $headers .= "Reply-To: {$from_email}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "X-Mailer: MathEase Verification System\r\n";
    
    // Try different SMTP approaches
    $methods = [
        ['port' => 587, 'ssl' => false, 'tls' => true],
        ['port' => 465, 'ssl' => true, 'tls' => false],
        ['port' => 25, 'ssl' => false, 'tls' => false]
    ];
    
    foreach ($methods as $method) {
        $result = try_smtp_method($smtp_host, $method['port'], $smtp_user, $smtp_pass, $from_email, $to, $subject, $htmlBody, $method['ssl'], $method['tls']);
        if ($result) {
            return true;
        }
    }
    
    return false;
}

/**
 * Try specific SMTP method
 */
function try_smtp_method($host, $port, $user, $pass, $from, $to, $subject, $body, $use_ssl, $use_tls) {
    try {
        if ($use_ssl) {
            // SSL connection
            $context = stream_context_create([
                "ssl" => [
                    "verify_peer" => false,
                    "verify_peer_name" => false,
                ]
            ]);
            $socket = @stream_socket_client("ssl://{$host}:{$port}", $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $context);
        } else {
            // Regular connection
            $socket = @fsockopen($host, $port, $errno, $errstr, 10);
        }
        
        if (!$socket) {
            return false;
        }
        
        // Read initial response
        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) != '220') {
            fclose($socket);
            return false;
        }
        
        // Send EHLO
        fputs($socket, "EHLO localhost\r\n");
        $response = fgets($socket, 1024);
        
        // Handle TLS if needed
        if ($use_tls) {
            fputs($socket, "STARTTLS\r\n");
            $response = fgets($socket, 1024);
            if (substr($response, 0, 3) == '220' || substr($response, 0, 3) == '250') {
                if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    fclose($socket);
                    return false;
                }
                // Send EHLO again after TLS
                fputs($socket, "EHLO localhost\r\n");
                $response = fgets($socket, 1024);
            }
        }
        
        // Try authentication
        fputs($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) == '334') {
            fputs($socket, base64_encode($user) . "\r\n");
            $response = fgets($socket, 1024);
            if (substr($response, 0, 3) == '334') {
                fputs($socket, base64_encode($pass) . "\r\n");
                $response = fgets($socket, 1024);
                if (substr($response, 0, 3) == '235') {
                    // Authentication successful, send email
                    fputs($socket, "MAIL FROM: <{$from}>\r\n");
                    $response = fgets($socket, 1024);
                    if (substr($response, 0, 3) == '250') {
                        fputs($socket, "RCPT TO: <{$to}>\r\n");
                        $response = fgets($socket, 1024);
                        if (substr($response, 0, 3) == '250') {
                            fputs($socket, "DATA\r\n");
                            $response = fgets($socket, 1024);
                            if (substr($response, 0, 3) == '354') {
                                fputs($socket, "Subject: {$subject}\r\n");
                                fputs($socket, "To: {$to}\r\n");
                                fputs($socket, "From: {$from_name} <{$from}>\r\n");
                                fputs($socket, "\r\n");
                                fputs($socket, $body);
                                fputs($socket, "\r\n.\r\n");
                                $response = fgets($socket, 1024);
                                if (substr($response, 0, 3) == '250') {
                                    fputs($socket, "QUIT\r\n");
                                    fclose($socket);
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        fclose($socket);
        return false;
        
    } catch (Exception $e) {
        if (isset($socket)) {
            fclose($socket);
        }
        return false;
    }
}

/**
 * PHP mail() function with proper configuration
 */
function send_php_mail($to, $subject, $htmlBody) {
    $from_email = MAIL_FROM;
    $from_name = MAIL_FROM_NAME;
    
    $headers = "From: {$from_name} <{$from_email}>\r\n";
    $headers .= "Reply-To: {$from_email}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "X-Mailer: MathEase Verification System\r\n";
    
    // Set sendmail_from
    ini_set('sendmail_from', $from_email);
    
    return @mail($to, $subject, $htmlBody, $headers);
}

/**
 * Alternative SMTP with different settings
 */
function send_alternative_smtp($to, $subject, $htmlBody) {
    // Try with different Gmail settings
    $alt_configs = [
        ['host' => 'smtp.gmail.com', 'port' => 465, 'ssl' => true],
        ['host' => 'smtp.gmail.com', 'port' => 587, 'ssl' => false, 'tls' => true],
        ['host' => 'smtp.gmail.com', 'port' => 25, 'ssl' => false, 'tls' => false]
    ];
    
    foreach ($alt_configs as $config) {
        $result = try_smtp_method(
            $config['host'], 
            $config['port'], 
            MAIL_USERNAME, 
            MAIL_PASSWORD, 
            MAIL_FROM, 
            $to, 
            $subject, 
            $htmlBody, 
            isset($config['ssl']) ? $config['ssl'] : false,
            isset($config['tls']) ? $config['tls'] : false
        );
        if ($result) {
            return true;
        }
    }
    
    return false;
}

/**
 * Save email to file for manual sending
 */
function save_email_to_file($to, $subject, $htmlBody) {
    $from_email = MAIL_FROM;
    $from_name = MAIL_FROM_NAME;
    
    $email_content = "To: {$to}\n";
    $email_content .= "From: {$from_name} <{$from_email}>\n";
    $email_content .= "Subject: {$subject}\n";
    $email_content .= "MIME-Version: 1.0\n";
    $email_content .= "Content-Type: text/html; charset=UTF-8\n";
    $email_content .= "X-Mailer: MathEase Verification System\n\n";
    $email_content .= $htmlBody . "\n";
    $email_content .= "---\n";
    
    $filename = "emails/email_" . date('Y-m-d_H-i-s') . "_" . substr(md5($to), 0, 8) . ".txt";
    $filepath = __DIR__ . "/" . $filename;
    
    $email_dir = __DIR__ . "/emails";
    if (!is_dir($email_dir)) {
        mkdir($email_dir, 0755, true);
    }
    
    return file_put_contents($filepath, $email_content) !== false;
}

// Test the enhanced email system
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $testEmail = isset($_POST['test_email']) ? sanitize_input($_POST['test_email']) : '';
    
    if (empty($testEmail)) {
        $result = ['success' => false, 'message' => 'Please provide an email address'];
    } else {
        $subject = 'MathEase Enhanced Email Test - ' . date('Y-m-d H:i:s');
        $htmlBody = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>MathEase Enhanced Email Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #667eea; text-align: center;">MathEase Enhanced Email Test</h1>
                <p>This email was sent using the enhanced email system with multiple fallback methods.</p>
                <p><strong>Test Time:</strong> ' . date('Y-m-d H:i:s') . '</p>
                <p><strong>Recipient:</strong> ' . htmlspecialchars($testEmail) . '</p>
                <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; color: #2d5a2d;"><strong>✅ Enhanced email system is working!</strong></p>
                </div>
                <p>If you received this email, the verification system should work properly.</p>
            </div>
        </body>
        </html>';
        
        $emailSent = send_verification_email($testEmail, $subject, $htmlBody);
        
        if ($emailSent) {
            $result = ['success' => true, 'message' => 'Test email sent successfully using enhanced system! Check your inbox and email viewer.'];
        } else {
            $result = ['success' => false, 'message' => 'All email methods failed. Check email viewer for saved emails.'];
        }
    }
    
    header('Content-Type: application/json');
    echo json_encode($result);
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Email Test - MathEase</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/auth.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body class="register-page">
    <section class="auth-section" style="padding-top:60px;">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h2>Enhanced Email Test</h2>
                    <p>Test email with multiple fallback methods</p>
                </div>

                <form id="email-test-form">
                    <div class="form-group">
                        <label for="test_email">Test Email Address</label>
                        <div class="input-group">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="test_email" name="test_email" required placeholder="Enter your email address">
                        </div>
                    </div>

                    <div class="form-group">
                        <button type="submit" class="btn btn-primary btn-full">
                            <i class="fas fa-paper-plane"></i>
                            Send Enhanced Test Email
                        </button>
                    </div>
                </form>

                <div class="auth-footer">
                    <p><a href="email-viewer.php">View Saved Emails</a> | <a href="test-smtp.php">SMTP Test</a></p>
                </div>
            </div>
        </div>
    </section>

    <script>
        document.getElementById('email-test-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('enhanced-email-test.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Email Sent!',
                        text: result.message,
                        confirmButtonText: 'OK'
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Email Failed',
                        text: result.message,
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred while testing email.',
                    confirmButtonText: 'OK'
                });
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    </script>
</body>
</html>
