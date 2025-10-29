<?php
require_once 'php/config.php';

/**
 * Dedicated Gmail SMTP for sending verification codes
 * This function focuses specifically on Gmail delivery
 */
function send_gmail_verification($to, $subject, $htmlBody) {
    $smtp_host = 'smtp.gmail.com';
    $smtp_port = 465; // SSL port
    $smtp_user = MAIL_USERNAME;
    $smtp_pass = MAIL_PASSWORD;
    $from_email = MAIL_FROM;
    $from_name = MAIL_FROM_NAME;
    
    // Create SSL context for Gmail
    $context = stream_context_create([
        "ssl" => [
            "verify_peer" => false,
            "verify_peer_name" => false,
            "allow_self_signed" => true,
        ]
    ]);
    
    // Connect to Gmail SMTP with SSL
    $socket = @stream_socket_client("ssl://{$smtp_host}:{$smtp_port}", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $context);
    
    if (!$socket) {
        error_log("Gmail SSL connection failed: {$errstr} ({$errno})");
        return false;
    }
    
    try {
        // Read initial response
        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) != '220') {
            error_log("Gmail initial response error: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send EHLO
        fputs($socket, "EHLO localhost\r\n");
        $response = fgets($socket, 1024);
        
        // Authenticate with Gmail
        fputs($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 1024);
        
        if (substr($response, 0, 3) != '334') {
            error_log("Gmail AUTH LOGIN failed: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send username
        fputs($socket, base64_encode($smtp_user) . "\r\n");
        $response = fgets($socket, 1024);
        
        if (substr($response, 0, 3) != '334') {
            error_log("Gmail username rejected: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send password
        fputs($socket, base64_encode($smtp_pass) . "\r\n");
        $response = fgets($socket, 1024);
        
        if (substr($response, 0, 3) != '235') {
            error_log("Gmail password rejected: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send MAIL FROM
        fputs($socket, "MAIL FROM: <{$from_email}>\r\n");
        $response = fgets($socket, 1024);
        
        if (substr($response, 0, 3) != '250') {
            error_log("Gmail MAIL FROM failed: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send RCPT TO
        fputs($socket, "RCPT TO: <{$to}>\r\n");
        $response = fgets($socket, 1024);
        
        if (substr($response, 0, 3) != '250') {
            error_log("Gmail RCPT TO failed: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send DATA
        fputs($socket, "DATA\r\n");
        $response = fgets($socket, 1024);
        
        if (substr($response, 0, 3) != '354') {
            error_log("Gmail DATA command failed: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send email content
        fputs($socket, "Subject: {$subject}\r\n");
        fputs($socket, "To: {$to}\r\n");
        fputs($socket, "From: {$from_name} <{$from_email}>\r\n");
        fputs($socket, "MIME-Version: 1.0\r\n");
        fputs($socket, "Content-Type: text/html; charset=UTF-8\r\n");
        fputs($socket, "X-Mailer: MathEase Verification System\r\n");
        fputs($socket, "\r\n");
        fputs($socket, $htmlBody);
        fputs($socket, "\r\n.\r\n");
        
        $response = fgets($socket, 1024);
        
        if (substr($response, 0, 3) != '250') {
            error_log("Gmail email sending failed: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send QUIT
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        
        error_log("Gmail verification email sent successfully to: {$to}");
        return true;
        
    } catch (Exception $e) {
        error_log("Gmail SMTP error: " . $e->getMessage());
        fclose($socket);
        return false;
    }
}

// Test Gmail SMTP
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $testEmail = isset($_POST['test_email']) ? sanitize_input($_POST['test_email']) : '';
    
    if (empty($testEmail)) {
        $result = ['success' => false, 'message' => 'Please provide an email address'];
    } else {
        $subject = 'MathEase Gmail Test - ' . date('Y-m-d H:i:s');
        $htmlBody = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>MathEase Gmail Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #667eea; text-align: center;">MathEase Gmail Test</h1>
                <p>This email was sent directly via Gmail SMTP to test the verification system.</p>
                <p><strong>Test Time:</strong> ' . date('Y-m-d H:i:s') . '</p>
                <p><strong>Recipient:</strong> ' . htmlspecialchars($testEmail) . '</p>
                <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; color: #2d5a2d;"><strong>✅ Gmail SMTP is working!</strong></p>
                </div>
                <p>If you received this email, verification codes will be sent to your Gmail inbox.</p>
            </div>
        </body>
        </html>';
        
        $emailSent = send_gmail_verification($testEmail, $subject, $htmlBody);
        
        if ($emailSent) {
            $result = ['success' => true, 'message' => 'Gmail test email sent successfully! Check your Gmail inbox.'];
        } else {
            $result = ['success' => false, 'message' => 'Gmail SMTP failed. Check server logs and App Password configuration.'];
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
    <title>Gmail SMTP Test - MathEase</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/auth.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body class="register-page">
    <section class="auth-section" style="padding-top:60px;">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h2>Gmail SMTP Test</h2>
                    <p>Test Gmail SMTP for sending verification codes</p>
                </div>

                <form id="gmail-test-form">
                    <div class="form-group">
                        <label for="test_email">Your Gmail Address</label>
                        <div class="input-group">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="test_email" name="test_email" required placeholder="Enter your Gmail address">
                        </div>
                    </div>

                    <div class="form-group">
                        <button type="submit" class="btn btn-primary btn-full">
                            <i class="fas fa-paper-plane"></i>
                            Send Gmail Test Email
                        </button>
                    </div>
                </form>

                <div class="auth-footer">
                    <p><a href="gmail-setup-guide.html">Gmail Setup Guide</a> | <a href="email-viewer.php">View Saved Emails</a></p>
                </div>
            </div>
        </div>
    </section>

    <script>
        document.getElementById('gmail-test-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('gmail-smtp-test.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Gmail Email Sent!',
                        text: result.message,
                        confirmButtonText: 'OK'
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gmail Failed',
                        text: result.message,
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred while testing Gmail SMTP.',
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
