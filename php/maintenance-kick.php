<?php
/**
 * During maintenance: redirect non-admin users to login after clearing session.
 * Invoked from client when maintenance turns on while user is still logged in.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/maintenance-helper.php';

if (!isMaintenanceMode($pdo)) {
    header('Location: ../index.html');
    exit;
}

if (isset($_SESSION['admin_id'])) {
    header('Location: ../admin.html');
    exit;
}

$target = '../login.html?maintenance=1';
if (isset($_SESSION['teacher_id']) && (($_SESSION['user_type'] ?? '') === 'teacher')) {
    $target = '../teacher-login.html?maintenance=1';
}

$_SESSION = [];
if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
}

header('Location: ' . $target);
exit;
