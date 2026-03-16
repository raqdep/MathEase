<?php
/**
 * Check Admin Session
 * Returns admin session information if admin is logged in
 */

require_once 'config.php';

header('Content-Type: application/json');

// Check if admin is logged in via PHP session
if (isset($_SESSION['admin_id']) && isset($_SESSION['admin_email'])) {
    echo json_encode([
        'success' => true,
        'logged_in' => true,
        'admin_id' => $_SESSION['admin_id'],
        'admin_email' => $_SESSION['admin_email'],
        'admin_name' => $_SESSION['admin_name'] ?? 'Admin',
        'admin_role' => $_SESSION['admin_role'] ?? 'super_admin',
        'user_type' => $_SESSION['user_type'] ?? 'admin'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'logged_in' => false,
        'message' => 'Admin not logged in'
    ]);
}
exit;
?>
