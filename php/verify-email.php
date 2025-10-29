<?php
require_once 'config.php';

// Handle email verification via link
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['token'])) {
    $token = sanitize_input($_GET['token']);
    
    try {
        // Find user by verification token
        $stmt = $pdo->prepare("SELECT id, first_name, email, verification_link_expires, email_verified FROM users WHERE verification_link_token = ?");
        $stmt->execute([$token]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception("Invalid verification link");
        }
        
        $user = $stmt->fetch();
        
        if ($user['email_verified']) {
            throw new Exception("Email already verified");
        }
        
        if (new DateTime() > new DateTime($user['verification_link_expires'])) {
            throw new Exception("Verification link has expired");
        }
        
        // Mark email as verified and clear verification fields
        $updateStmt = $pdo->prepare("UPDATE users SET email_verified = 1, verification_link_token = NULL, verification_link_expires = NULL, otp = NULL, expiration_otp = NULL WHERE id = ?");
        $updateStmt->execute([$user['id']]);
        
        // Redirect to success page
        header("Location: ../verify-success.html?name=" . urlencode($user['first_name']));
        exit;
        
    } catch (Exception $e) {
        // Redirect to error page
        header("Location: ../verify-error.html?error=" . urlencode($e->getMessage()));
        exit;
    }
}

// Handle OTP verification
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    ob_start();
    $response = array();
    
    try {
        $userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
        $otp = isset($_POST['otp']) ? trim($_POST['otp']) : '';

        if ($userId <= 0 || $otp === '') {
            throw new Exception('Missing parameters');
        }

        // Check OTP stored on users table
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
        $u = $pdo->prepare("UPDATE users SET email_verified = 1, otp = NULL, expiration_otp = NULL, verification_link_token = NULL, verification_link_expires = NULL WHERE id = ?");
        $u->execute([$userId]);

        $response['success'] = true;
        $response['message'] = 'Email verified successfully';
    } catch (Exception $e) {
        $response['success'] = false;
        $response['message'] = $e->getMessage();
    }

    // Return JSON response
    header('Content-Type: application/json');
    if (ob_get_length() !== false) {
        ob_clean();
    }
    echo json_encode($response);
    exit;
}

// If not GET with token or POST, redirect to registration page
header('Location: ../register.html');
exit;
?>
