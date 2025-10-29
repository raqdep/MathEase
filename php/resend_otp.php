<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$response = ['success' => false];
try {
    $userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
    if ($userId <= 0) throw new Exception('Missing user id');

    // Fetch user email and name
    $stmt = $pdo->prepare("SELECT id, first_name, email FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    if ($stmt->rowCount() === 0) throw new Exception('User not found');
    $user = $stmt->fetch();

    // Generate new OTP and expiry
    $otp = random_int(100000, 999999);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    // Ensure users table has otp and expiration_otp columns - ignore errors
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp VARCHAR(10) NULL, ADD COLUMN IF NOT EXISTS expiration_otp DATETIME NULL");
    } catch (Exception $e) {
        // ignore
    }

    // Update user row with new OTP and expiration
    $update = $pdo->prepare("UPDATE users SET otp = ?, expiration_otp = ? WHERE id = ?");
    $update->execute([$otp, $expiresAt, $userId]);

    // Send email with improved template
    $subject = 'Your MathEase verification code - OTP Resent';
    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MathEase Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">MathEase</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">New Verification Code</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">New Verification Code</h2>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hi ' . htmlspecialchars($user['first_name']) . ',
                </p>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    You requested a new verification code. Here is your new OTP:
                </p>
                
                <!-- OTP Code Box -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0;">
                    <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Your New Verification Code</p>
                    <div style="background: #ffffff; color: #667eea; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px; border-radius: 8px; display: inline-block; min-width: 200px;">' . $otp . '</div>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                    <p style="color: #856404; margin: 0; font-size: 14px; font-weight: 500;">
                        ⏰ This code will expire in 15 minutes for security reasons.
                    </p>
                </div>
                
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                    If you did not request this code, please ignore this email.
                </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="color: #6c757d; margin: 0; font-size: 14px;">
                    Best regards,<br>
                    <strong>The MathEase Team</strong>
                </p>
                <p style="color: #adb5bd; margin: 10px 0 0 0; font-size: 12px;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>';

    $sent = send_email($user['email'], $subject, $htmlBody);
    if ($sent) {
        $response = ['success' => true, 'message' => 'OTP resent'];
    } else {
        $response = ['success' => false, 'message' => 'Failed to send OTP'];
    }
} catch (Exception $e) {
    $response = ['success' => false, 'message' => $e->getMessage()];
    error_log('Resend OTP error: ' . $e->getMessage());
}

header('Content-Type: application/json');
echo json_encode($response);
exit;
?>