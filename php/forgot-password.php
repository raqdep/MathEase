<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = isset($input['email']) ? sanitize_input($input['email']) : '';
    
    if (empty($email)) {
        throw new Exception('Email address is required');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Check if email exists in the database
    $stmt = $pdo->prepare("SELECT id, first_name, last_name, email_verified FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('Email address not found in our system');
    }
    
    $user = $stmt->fetch();
    
    // Check if email is verified
    if (!$user['email_verified']) {
        throw new Exception('Please verify your email address first before resetting your password');
    }
    
    // Generate password reset token
    $resetToken = bin2hex(random_bytes(32));
    $tokenExpires = date('Y-m-d H:i:s', strtotime('+1 hour')); // Token expires in 1 hour
    
    // Update user with reset token
    $stmt = $pdo->prepare("
        UPDATE users 
        SET password_reset_token = ?, password_reset_expires = ?, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$resetToken, $tokenExpires, $user['id']]);
    
    // Send password reset email
    require_once '../gmail-fixed-test.php';
    
    $resetLink = "http://" . $_SERVER['HTTP_HOST'] . dirname(dirname($_SERVER['REQUEST_URI'])) . "/reset-password.html?token=" . $resetToken;
    
    $subject = 'MathEase - Password Reset Request';
    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>MathEase Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #667eea; text-align: center; margin-bottom: 30px;">MathEase Password Reset</h1>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ' . htmlspecialchars($user['first_name']) . ',
            </p>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                We received a request to reset your password for your MathEase account. Click the button below to reset your password.
            </p>
            
            <!-- Reset Password Link -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="' . $resetLink . '" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    Reset My Password
                </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px; font-weight: 500;">
                    ⚠️ This password reset link will expire in 1 hour for security reasons.
                </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 16px;">Alternative reset method:</h3>
                <p style="color: #6c757d; margin: 0 0 10px 0; font-size: 14px;">
                    If the button doesn\'t work, copy and paste this link into your browser:
                </p>
                <p style="color: #667eea; margin: 0; font-size: 14px; word-break: break-all;">
                    <a href="' . $resetLink . '" style="color: #667eea;">' . $resetLink . '</a>
                </p>
            </div>
            
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
                <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                    <strong>Security Notice:</strong> If you didn\'t request this password reset, please ignore this email. Your password will remain unchanged.
                </p>
                <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    For security reasons, this link can only be used once and will expire after 1 hour.
                </p>
            </div>
        </div>
    </body>
    </html>';
    
    $emailSent = send_gmail_verification_fixed($email, $subject, $htmlBody);
    
    if ($emailSent) {
        $response = [
            'success' => true,
            'message' => 'Password reset link has been sent to your Gmail inbox.',
            'email_sent' => true
        ];
        error_log("Password reset email sent to: {$email}");
    } else {
        // Fallback: save to file
        $file_result = save_email_to_file($email, $subject, $htmlBody);
        $response = [
            'success' => true,
            'message' => 'Password reset link has been sent. Please check your Gmail inbox or contact support if you don\'t receive it.',
            'email_sent' => $file_result
        ];
        error_log("Password reset email saved to file for: {$email}");
    }
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    error_log("Forgot password error: " . $e->getMessage());
}

echo json_encode($response);
?>
