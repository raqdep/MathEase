<?php
require_once 'php/config.php';

// Simple email testing tool
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $testEmail = isset($_POST['test_email']) ? sanitize_input($_POST['test_email']) : '';
    
    if (empty($testEmail)) {
        $result = ['success' => false, 'message' => 'Please provide an email address'];
    } else {
        // Test email content
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
        
        // Try to send email
        $emailSent = send_email($testEmail, $subject, $htmlBody);
        
        if ($emailSent) {
            $result = ['success' => true, 'message' => 'Test email sent successfully! Check your inbox.'];
        } else {
            $result = ['success' => false, 'message' => 'Failed to send test email. Check server logs.'];
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
    <title>Email Test Tool - MathEase</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/auth.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body class="register-page">
    <section class="auth-section" style="padding-top:60px;">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h2>Email System Test</h2>
                    <p>Test if the email verification system is working</p>
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
                    <p><a href="register.html">Back to Registration</a></p>
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
                const response = await fetch('php/test-email.php', {
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
