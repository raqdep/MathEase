<?php
/**
 * Shared .env load + session + timezone (no database).
 * Used by config.php and by endpoints that only need auth env (e.g. export-topic-ppt.php).
 */
require_once __DIR__ . '/load-env.php';

if (session_status() == PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_secure', 0); // Set to 1 for HTTPS
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.cookie_path', '/'); // Ensure cookies are available for all paths

    session_start();
}

date_default_timezone_set('Asia/Manila');
