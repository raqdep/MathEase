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

    // Same rules as teacher registration (teacher-register.php)
    if (strlen($newPassword) < 8) {
        throw new Exception('Password must be at least 8 characters long');
    }
    if (strlen($newPassword) > 30) {
        throw new Exception('Password must be at most 30 characters');
    }
    if (!preg_match('/[a-z]/', $newPassword)) {
        throw new Exception('Password must contain at least one lowercase letter');
    }
    if (!preg_match('/[A-Z]/', $newPassword)) {
        throw new Exception('Password must contain at least one uppercase letter');
    }
    if (!preg_match('/[0-9]/', $newPassword)) {
        throw new Exception('Password must contain at least one number');
    }
    if (!preg_match('/[^a-zA-Z0-9]/', $newPassword)) {
        throw new Exception('Password must contain at least one special character');
    }

    $stmt = $pdo->prepare("
        SELECT id, first_name, email, reset_token_expires
        FROM teachers
        WHERE reset_token = ? AND reset_token_expires IS NOT NULL AND reset_token_expires > NOW()
    ");
    $stmt->execute([$token]);

    if ($stmt->rowCount() === 0) {
        throw new Exception('Invalid or expired reset link. Please request a new password reset.');
    }

    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        UPDATE teachers
        SET password = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$hashedPassword, $teacher['id']]);

    require_once __DIR__ . '/../gmail-fixed-test.php';

    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');
    $scheme = $https ? 'https' : 'http';
    $basePath = dirname(dirname($_SERVER['REQUEST_URI'] ?? ''));
    $loginUrl = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . $basePath . '/teacher-login.html';

    $subject = 'MathEase Teacher Portal — Password changed';
    $first = htmlspecialchars($teacher['first_name']);
    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Password updated</title></head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
            <h1 style="color: #667eea; text-align: center;">Password updated</h1>
            <p style="color: #666666; font-size: 16px;">Hi ' . $first . ',</p>
            <p style="color: #666666; font-size: 16px;">Your MathEase teacher account password was successfully changed.</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="' . htmlspecialchars($loginUrl) . '" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600;">Sign in to Teacher Portal</a>
            </div>
            <p style="color: #6c757d; font-size: 14px;">If you did not change your password, contact an administrator immediately.</p>
        </div>
    </body>
    </html>';

    $emailSent = send_gmail_verification_fixed($teacher['email'], $subject, $htmlBody);

    $response = [
        'success' => true,
        'message' => 'Your password has been reset. You can sign in with your new password.',
        'email_sent' => $emailSent,
    ];

    error_log('Teacher password reset completed for: ' . $teacher['email']);
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage(),
    ];
    error_log('Teacher reset password error: ' . $e->getMessage());
}

echo json_encode($response);
