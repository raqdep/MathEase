<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

try {
    $accountType = isset($_POST['account_type']) ? trim($_POST['account_type']) : 'student';
    $otp = isset($_POST['otp']) ? trim($_POST['otp']) : '';
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;

    if ($id <= 0 || $otp === '') {
        throw new Exception('Missing verification details.');
    }

    if ($accountType === 'teacher') {
        $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, email_verified, otp, expiration_otp, approval_status FROM teachers WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) throw new Exception('Teacher account not found.');
        if (!empty($row['email_verified'])) throw new Exception('Email already verified.');
        if (empty($row['otp']) || empty($row['expiration_otp'])) throw new Exception('No OTP found. Please resend code.');
        if (new DateTime() > new DateTime($row['expiration_otp'])) throw new Exception('OTP expired. Please resend code.');
        if (!hash_equals((string)$row['otp'], (string)$otp)) throw new Exception('Invalid OTP.');

        $update = $pdo->prepare("UPDATE teachers SET email_verified = 1, otp = NULL, expiration_otp = NULL, verification_token = NULL, approval_status = IF(approval_status='approved','approved','pending') WHERE id = ?");
        $update->execute([$id]);

        // Notify admin after teacher verifies email
        require_once __DIR__ . '/../gmail-fixed-test.php';
        $adminEmail = 'matheasenc2025@gmail.com';
        $subject = 'New Teacher Account Pending Approval - MathEase';
        $body = '<p>A teacher verified email and is pending approval:</p>'
            . '<p><strong>Name:</strong> ' . htmlspecialchars($row['first_name'] . ' ' . $row['last_name']) . '<br>'
            . '<strong>Email:</strong> ' . htmlspecialchars($row['email']) . '</p>';
        send_gmail_verification_fixed($adminEmail, $subject, $body);

        echo json_encode(['success' => true, 'message' => 'Teacher email verified successfully.']);
        exit;
    }

    // Default: student
    $stmt = $pdo->prepare("SELECT id, email_verified, otp, expiration_otp FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) throw new Exception('User account not found.');
    if (!empty($row['email_verified'])) throw new Exception('Email already verified.');
    if (empty($row['otp']) || empty($row['expiration_otp'])) throw new Exception('No OTP found. Please resend code.');
    if (new DateTime() > new DateTime($row['expiration_otp'])) throw new Exception('OTP expired. Please resend code.');
    if (!hash_equals((string)$row['otp'], (string)$otp)) throw new Exception('Invalid OTP.');

    $update = $pdo->prepare("UPDATE users SET email_verified = 1, otp = NULL, expiration_otp = NULL, verification_link_token = NULL, verification_link_expires = NULL WHERE id = ?");
    $update->execute([$id]);

    echo json_encode(['success' => true, 'message' => 'Email verified successfully.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

