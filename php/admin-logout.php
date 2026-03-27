<?php
/**
 * Clear admin session and return to the unified login portal.
 */
require_once __DIR__ . '/config.php';

$_SESSION = $_SESSION ?? [];
foreach (['admin_id', 'admin_email', 'admin_name', 'admin_role'] as $k) {
    unset($_SESSION[$k]);
}
if (isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'admin') {
    unset($_SESSION['user_type']);
}

session_destroy();

header('Location: ../teacher-login.html?from=admin&logged_out=1');
exit;
