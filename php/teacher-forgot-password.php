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

    $hasEmailVerified = $pdo->query("SHOW COLUMNS FROM teachers LIKE 'email_verified'")->rowCount() > 0;
    $hasApprovalStatus = $pdo->query("SHOW COLUMNS FROM teachers LIKE 'approval_status'")->rowCount() > 0;

    $selectFields = 'id, first_name, last_name, email';
    if ($hasEmailVerified) {
        $selectFields .= ', email_verified';
    }
    if ($hasApprovalStatus) {
        $selectFields .= ', approval_status';
    }

    $stmt = $pdo->prepare("
        SELECT {$selectFields}
        FROM teachers
        WHERE LOWER(email) = LOWER(?)
    ");
    $stmt->execute([$email]);

    if ($stmt->rowCount() === 0) {
        throw new Exception('Email address not found in our system');
    }

    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($hasEmailVerified && isset($teacher['email_verified']) && (int) $teacher['email_verified'] === 0) {
        throw new Exception('Please verify your email address first before resetting your password');
    }

    if ($hasApprovalStatus && isset($teacher['approval_status']) && $teacher['approval_status'] === 'rejected') {
        throw new Exception('Your account has been rejected. Please contact an administrator.');
    }

    $resetToken = bin2hex(random_bytes(32));
    $tokenExpires = date('Y-m-d H:i:s', strtotime('+1 hour'));

    $stmt = $pdo->prepare("
        UPDATE teachers
        SET reset_token = ?, reset_token_expires = ?, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$resetToken, $tokenExpires, $teacher['id']]);

    require_once __DIR__ . '/../gmail-fixed-test.php';

    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');
    $scheme = $https ? 'https' : 'http';
    $basePath = dirname(dirname($_SERVER['REQUEST_URI'] ?? ''));
    $resetLink = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . $basePath . '/teacher-reset-password.html?token=' . urlencode($resetToken);

    $subject = 'MathEase Teacher Portal — Password Reset';
    $first = htmlspecialchars($teacher['first_name']);
    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>MathEase Teacher Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #667eea; text-align: center; margin-bottom: 30px;">Teacher account — reset password</h1>
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hi ' . $first . ',</p>
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                We received a request to reset the password for your MathEase teacher account. Click the button below to choose a new password.
            </p>
            <div style="text-align: center; margin: 40px 0;">
                <a href="' . htmlspecialchars($resetLink) . '" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    Reset my password
                </a>
            </div>
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px; font-weight: 500;">
                    This link expires in 1 hour and can only be used once.
                </p>
            </div>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #6c757d; margin: 0 0 10px 0; font-size: 14px;">If the button does not work, copy this URL into your browser:</p>
                <p style="color: #667eea; margin: 0; font-size: 14px; word-break: break-all;"><a href="' . htmlspecialchars($resetLink) . '">' . htmlspecialchars($resetLink) . '</a></p>
            </div>
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
                <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    If you did not request this, you can ignore this email. Your password will stay the same.
                </p>
            </div>
        </div>
    </body>
    </html>';

    $emailSent = send_gmail_verification_fixed($teacher['email'], $subject, $htmlBody);

    if ($emailSent) {
        $response = [
            'success' => true,
            'message' => 'Password reset link has been sent to your email.',
            'email_sent' => true,
        ];
        error_log('Teacher password reset email sent to: ' . $teacher['email']);
    } else {
        $file_result = save_email_to_file($teacher['email'], $subject, $htmlBody);
        $response = [
            'success' => true,
            'message' => 'Password reset link has been sent. Please check your inbox or contact support if you do not receive it.',
            'email_sent' => $file_result,
        ];
        error_log('Teacher password reset email saved to file for: ' . $teacher['email']);
    }
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage(),
    ];
    error_log('Teacher forgot password error: ' . $e->getMessage());
}

echo json_encode($response);
