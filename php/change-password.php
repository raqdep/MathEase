<?php
/**
 * Change Password
 * Allows students to change their password
 */

// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

require_once 'config.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // Get JSON input
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);
    
    if (!$input) {
        throw new Exception('Invalid input data');
    }
    
    $current_password = $input['current_password'] ?? '';
    $new_password = $input['new_password'] ?? '';
    
    if (empty($current_password) || empty($new_password)) {
        throw new Exception('Current password and new password are required');
    }
    
    if (strlen($new_password) < 8 || strlen($new_password) > 30) {
        throw new Exception('New password must be 8-30 characters long');
    }

    $hasLower = preg_match('/[a-z]/', $new_password);
    $hasUpper = preg_match('/[A-Z]/', $new_password);
    $hasNumber = preg_match('/[0-9]/', $new_password);
    $hasSpecial = preg_match('/[^a-zA-Z0-9]/', $new_password);
    if (!$hasLower || !$hasUpper || !$hasNumber || !$hasSpecial) {
        throw new Exception('Password must include uppercase, lowercase, number, and special character');
    }

    if ($current_password === $new_password) {
        throw new Exception('New password must be different from current password');
    }
    
    // Get current user password
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception('User not found');
    }
    
    // Verify current password
    if (!password_verify($current_password, $user['password'])) {
        throw new Exception('Current password is incorrect');
    }
    
    // Hash new password
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    
    // Update password in database
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $updateResult = $stmt->execute([$hashed_password, $user_id]);
    
    if (!$updateResult) {
        throw new Exception('Failed to update password in database');
    }
    
    // Verify the password was updated successfully
    $verifyStmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $verifyStmt->execute([$user_id]);
    $savedPassword = $verifyStmt->fetchColumn();
    
    if (!password_verify($new_password, $savedPassword)) {
        throw new Exception('Failed to verify password was saved correctly');
    }
    
    // Final verification - try to login with new password to confirm it was saved
    $finalCheck = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $finalCheck->execute([$user_id]);
    $finalPassword = $finalCheck->fetchColumn();
    
    if (!password_verify($new_password, $finalPassword)) {
        error_log("ERROR: Password verification failed after update for user_id: $user_id");
        throw new Exception('Password was not saved correctly. Please try again.');
    }
    
    error_log("SUCCESS: Password changed and verified in database for user_id: $user_id");
    
    echo json_encode([
        'success' => true,
        'message' => 'Password changed and saved to database successfully',
        'verified' => true
    ]);
    
} catch (Exception $e) {
    error_log("Error in change-password.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
