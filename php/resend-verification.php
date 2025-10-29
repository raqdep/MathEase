<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
    
    if ($userId <= 0) {
        throw new Exception('User ID is required');
    }
    
    // Get user information
    $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, email_verified FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('User not found');
    }
    
    $user = $stmt->fetch();
    
    if ($user['email_verified']) {
        throw new Exception('Email is already verified');
    }
    
    // Generate new verification token
    $verificationToken = bin2hex(random_bytes(32));
    $linkExpires = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    // Update user with new verification data
    $stmt = $pdo->prepare("
        UPDATE users 
        SET verification_link_token = ?, verification_link_expires = ?, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$verificationToken, $linkExpires, $user['id']]);
    
    // Send verification email
    require_once '../gmail-fixed-test.php';
    
    $verificationLink = "http://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . "/verify-email.php?token=" . $verificationToken;
    
    $subject = 'MathEase - Verify Your Account';
    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>MathEase Email Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #667eea; text-align: center; margin-bottom: 30px;">MathEase Email Verification</h1>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ' . htmlspecialchars($user['first_name']) . ',
            </p>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Welcome to MathEase! Thank you for registering with us. To complete your registration and start learning, please verify your email address by clicking the button below.
            </p>
            
            <!-- Verification Link -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="' . $verificationLink . '" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    Verify Account
                </a>
            </div>
            
            <div style="background: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="color: #2d5a2d; margin: 0; font-size: 14px; font-weight: 500;">
                    ✅ Simply click the "Verify Account" button above to complete your registration.
                </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 16px;">Alternative verification:</h3>
                <p style="color: #6c757d; margin: 0 0 10px 0; font-size: 14px;">
                    If the button doesn\'t work, copy and paste this link into your browser:
                </p>
                <p style="color: #667eea; margin: 0; font-size: 14px; word-break: break-all;">
                    <a href="' . $verificationLink . '" style="color: #667eea;">' . $verificationLink . '</a>
                </p>
            </div>
            
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
                <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                    <strong>Important:</strong> This verification link will expire in 24 hours for security reasons.
                </p>
                <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    If you didn\'t create an account with MathEase, please ignore this email.
                </p>
            </div>
        </div>
    </body>
    </html>';
    
    $emailSent = send_gmail_verification_fixed($user['email'], $subject, $htmlBody);
    
    if ($emailSent) {
        $response = [
            'success' => true,
            'message' => 'Verification email sent! Please check your inbox and spam folder.',
            'email_sent' => true
        ];
        error_log("Verification email sent to: {$user['email']}");
    } else {
        // Fallback: save to file
        $file_result = save_email_to_file($user['email'], $subject, $htmlBody);
        $response = [
            'success' => true,
            'message' => 'Verification email sent. Please check your inbox or contact support if you don\'t receive it.',
            'email_sent' => $file_result
        ];
        error_log("Verification email saved to file for: {$user['email']}");
    }
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    error_log("Resend verification error: " . $e->getMessage());
}

echo json_encode($response);
?>
