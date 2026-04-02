<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

if (!isset($_SESSION['admin_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        $input = [];
    }

    $to = trim((string)($input['to'] ?? ''));
    if ($to === '') {
        $to = trim((string)($_SESSION['admin_email'] ?? ''));
    }
    if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'success' => false,
            'message' => 'No valid recipient email found. Enter a test email or re-login as admin.',
        ]);
        exit;
    }

    if (!function_exists('send_gmail_verification_fixed')) {
        $gmailPath = __DIR__ . '/../gmail-fixed-test.php';
        if (is_file($gmailPath)) {
            require_once $gmailPath;
        }
    }
    if (!function_exists('send_gmail_verification_fixed')) {
        echo json_encode(['success' => false, 'message' => 'Mail helper not available.']);
        exit;
    }
    if (!defined('MAIL_USERNAME') || trim((string) MAIL_USERNAME) === '') {
        echo json_encode(['success' => false, 'message' => 'MAIL_USERNAME is missing. Set it in .env and restart Apache.']);
        exit;
    }
    if (!defined('MAIL_PASSWORD') || trim((string) MAIL_PASSWORD) === '') {
        echo json_encode(['success' => false, 'message' => 'MAIL_PASSWORD is missing. Use Gmail App Password in .env, then restart Apache.']);
        exit;
    }

    $subject = 'MathEase SMTP Test';
    $body = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;color:#1f2937;">'
        . '<div style="max-width:560px;margin:0 auto;padding:20px;">'
        . '<h2 style="margin:0 0 10px;color:#1e3a8a;">SMTP Test Successful</h2>'
        . '<p style="margin:0 0 10px;">This is a test email from MathEase maintenance panel.</p>'
        . '<p style="margin:0 0 10px;"><strong>Sent at:</strong> ' . htmlspecialchars(date('M d, Y h:i A'), ENT_QUOTES, 'UTF-8') . '</p>'
        . '<p style="margin:0;">- MathEase Team</p>'
        . '</div></body></html>';

    $ok = send_gmail_verification_fixed($to, $subject, $body);
    if (!$ok) {
        echo json_encode([
            'success' => false,
            'message' => 'SMTP test failed. Check MAIL_USERNAME/MAIL_PASSWORD (app password) in .env.',
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'SMTP test email sent to ' . $to,
    ]);
} catch (Throwable $e) {
    error_log('admin-maintenance-smtp-test.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error while testing SMTP.']);
}

