<?php
require_once 'config.php';
require_once __DIR__ . '/../gmail-fixed-test.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

try {
    $accountType = isset($_POST['account_type']) ? trim($_POST['account_type']) : 'student';
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';

    $otp = (string) random_int(100000, 999999);
    $otpExpires = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    if ($accountType === 'teacher') {
        if ($id <= 0) {
            throw new Exception('Missing teacher account id.');
        }
        $stmt = $pdo->prepare("SELECT id, first_name, email, email_verified FROM teachers WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) throw new Exception('Teacher account not found.');
        if (!empty($row['email_verified'])) throw new Exception('Email is already verified.');

        try {
            $pdo->exec("ALTER TABLE teachers ADD COLUMN otp VARCHAR(10) NULL");
        } catch (Exception $e) {}
        try {
            $pdo->exec("ALTER TABLE teachers ADD COLUMN expiration_otp DATETIME NULL");
        } catch (Exception $e) {}

        $update = $pdo->prepare("UPDATE teachers SET otp = ?, expiration_otp = ? WHERE id = ?");
        $update->execute([$otp, $otpExpires, $id]);

        $subject = 'MathEase Teacher verification code';
        $body = '<p>Hi ' . htmlspecialchars($row['first_name']) . ',</p>'
            . '<p>Your verification code is:</p>'
            . '<h2 style="letter-spacing:6px;">' . $otp . '</h2>'
            . '<p>This code expires in 15 minutes.</p>';

        $sent = send_gmail_verification_fixed($row['email'], $subject, $body);
        if (!$sent) save_email_to_file($row['email'], $subject, $body);

        echo json_encode(['success' => true, 'message' => 'OTP resent to your teacher email.']);
        exit;
    }

    // Default: student
    if ($id <= 0 && $email !== '') {
        $lookup = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $lookup->execute([$email]);
        $found = $lookup->fetch(PDO::FETCH_ASSOC);
        if ($found) {
            $id = (int) $found['id'];
        }
    }

    if ($id <= 0) {
        throw new Exception('Missing user account id.');
    }

    $stmt = $pdo->prepare("SELECT id, first_name, email, email_verified FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) throw new Exception('User account not found.');
    if (!empty($row['email_verified'])) throw new Exception('Email is already verified.');

    $update = $pdo->prepare("UPDATE users SET otp = ?, expiration_otp = ?, verification_link_token = NULL, verification_link_expires = NULL WHERE id = ?");
    $update->execute([$otp, $otpExpires, $id]);

    $subject = 'MathEase verification code';
    $body = '<p>Hi ' . htmlspecialchars($row['first_name']) . ',</p>'
        . '<p>Your verification code is:</p>'
        . '<h2 style="letter-spacing:6px;">' . $otp . '</h2>'
        . '<p>This code expires in 15 minutes.</p>';

    $sent = send_gmail_verification_fixed($row['email'], $subject, $body);
    if (!$sent) save_email_to_file($row['email'], $subject, $body);

    echo json_encode(['success' => true, 'message' => 'OTP resent to your email.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

