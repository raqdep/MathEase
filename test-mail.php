<?php
require_once 'php/config.php';

// Alternative email sending method using cURL
function send_email_test($to, $subject, $htmlBody) {
    $from_email = MAIL_FROM;
    $from_name = MAIL_FROM_NAME;
    
    // Create email data
    $email_data = array(
        'to' => $to,
        'subject' => $subject,
        'body' => $htmlBody,
        'from' => $from_email,
        'from_name' => $from_name,
        'timestamp' => date('Y-m-d H:i:s')
    );
    
    // Try to send via a simple HTTP-based service (like EmailJS or similar)
    // For now, let's use a more reliable SMTP approach
    
    // Use PHP's built-in mail() function with proper headers
    $headers = "From: {$from_name} <{$from_email}>\r\n";
    $headers .= "Reply-To: {$from_email}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "X-Mailer: MathEase Email System\r\n";
    
    // Set sendmail_from
    ini_set('sendmail_from', $from_email);
    
    $result = @mail($to, $subject, $htmlBody, $headers);
    
    if ($result) {
        error_log("Email sent successfully via mail() to: {$to}");
        return true;
    } else {
        error_log("mail() function failed for: {$to}");
        return false;
    }
}

// Test the new email function
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $testEmail = isset($_POST['test_email']) ? sanitize_input($_POST['test_email']) : '';
    
    if (empty($testEmail)) {
        $result = ['success' => false, 'message' => 'Please provide an email address'];
    } else {
        $subject = 'MathEase Email Test - ' . date('Y-m-d H:i:s');
        $htmlBody = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>MathEase Email Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #667eea; text-align: center;">MathEase Email Test</h1>
                <p>This is a test email to verify that the email system is working correctly.</p>
                <p><strong>Test Time:</strong> ' . date('Y-m-d H:i:s') . '</p>
                <p><strong>Recipient:</strong> ' . htmlspecialchars($testEmail) . '</p>
                <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; color: #2d5a2d;"><strong>✅ Email system is working!</strong></p>
                </div>
                <p>If you received this email, the verification system should work properly.</p>
            </div>
        </body>
        </html>';
        
        // Try the new method
        $emailSent = send_email_test($testEmail, $subject, $htmlBody);
        
        if ($emailSent) {
            $result = ['success' => true, 'message' => 'Test email sent successfully! Check your inbox.'];
        } else {
            $result = ['success' => false, 'message' => 'Failed to send test email. Check server configuration.'];
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
    <title>Alternative Email Test - MathEase</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/auth.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body class="register-page">
    <section class="auth-section" style="padding-top:60px;">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h2>Alternative Email Test</h2>
                    <p>Test email using PHP mail() function</p>
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
                            Send Test Email
                        </button>
                    </div>
                </form>

                <div class="auth-footer">
                    <p><a href="test-smtp.php">SMTP Test</a> | <a href="email-viewer.php">View Saved Emails</a></p>
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
                const response = await fetch('test-mail.php', {
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
