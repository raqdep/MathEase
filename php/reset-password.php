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
    $token = isset($input['token']) ? sanitize_input($input['token']) : '';
    $newPassword = isset($input['new_password']) ? $input['new_password'] : '';
    
    if (empty($token)) {
        throw new Exception('Reset token is required');
    }
    
    if (empty($newPassword)) {
        throw new Exception('New password is required');
    }
    
    if (strlen($newPassword) < 8) {
        throw new Exception('Password must be at least 8 characters long');
    }
    
    // Check if token exists and is valid
    $stmt = $pdo->prepare("
        SELECT id, first_name, email, password_reset_expires 
        FROM users 
        WHERE password_reset_token = ? AND password_reset_expires > NOW()
    ");
    $stmt->execute([$token]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('Invalid or expired reset token. Please request a new password reset.');
    }
    
    $user = $stmt->fetch();
    
    // Hash the new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Update password and clear reset token
    $stmt = $pdo->prepare("
        UPDATE users 
        SET password = ?, password_reset_token = NULL, password_reset_expires = NULL, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$hashedPassword, $user['id']]);
    
    // Send confirmation email
    require_once '../gmail-fixed-test.php';
    
    $subject = 'MathEase - Password Reset Confirmation';
    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>MathEase Password Reset Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #667eea; text-align: center; margin-bottom: 30px;">MathEase Password Reset</h1>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ' . htmlspecialchars($user['first_name']) . ',
            </p>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Your password has been successfully reset. You can now log in to your MathEase account with your new password.
            </p>
            
            <div style="background: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="color: #2d5a2d; margin: 0; font-size: 14px; font-weight: 500;">
                    ✅ Your password has been successfully updated.
                </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="http://' . $_SERVER['HTTP_HOST'] . dirname(dirname($_SERVER['REQUEST_URI'])) . '/login.html" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    Login to MathEase
                </a>
            </div>
            
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
                <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                    <strong>Security Notice:</strong> If you didn\'t reset your password, please contact our support team immediately.
                </p>
                <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    This confirmation email was sent to: ' . htmlspecialchars($user['email']) . '
                </p>
            </div>
        </div>
    </body>
    </html>';
    
    $emailSent = send_gmail_verification_fixed($user['email'], $subject, $htmlBody);
    
    $response = [
        'success' => true,
        'message' => 'Your password has been successfully reset. You can now log in with your new password.',
        'email_sent' => $emailSent
    ];
    
    error_log("Password reset completed for user: {$user['email']}");
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    error_log("Password reset error: " . $e->getMessage());
}

echo json_encode($response);
?>
