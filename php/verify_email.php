<?php
require_once 'config.php';

// Verify OTP for email verification
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$response = ['success' => false];

try {
    $userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
    $otp = isset($_POST['otp']) ? trim($_POST['otp']) : '';

    if ($userId <= 0 || $otp === '') {
        throw new Exception('Missing parameters');
    }

    // Check otp stored on users table
    $stmt = $pdo->prepare("SELECT id, otp, expiration_otp, email_verified FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    if ($stmt->rowCount() === 0) {
        throw new Exception('User not found');
    }
    $row = $stmt->fetch();

    if ($row['email_verified']) {
        throw new Exception('Email already verified');
    }

    if (empty($row['otp']) || empty($row['expiration_otp'])) {
        throw new Exception('No verification code found.');
    }

    if (new DateTime() > new DateTime($row['expiration_otp'])) {
        throw new Exception('OTP expired');
    }

    if (!hash_equals((string)$row['otp'], (string)$otp)) {
        throw new Exception('Invalid OTP');
    }

    // Mark user's email as verified and clear otp fields
    $u = $pdo->prepare("UPDATE users SET email_verified = 1, otp = NULL, expiration_otp = NULL WHERE id = ?");
    $u->execute([$userId]);

    $response['success'] = true;
    $response['message'] = 'Email verified successfully';
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
}

header('Content-Type: application/json');
echo json_encode($response);
exit;
?>