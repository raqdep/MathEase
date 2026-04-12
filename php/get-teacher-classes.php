<?php

declare(strict_types=1);

if (!ob_get_level()) {
    ob_start();
}
ini_set('display_errors', '0');

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!isset($_SESSION['teacher_id'])) {
    if (ob_get_length()) {
        ob_clean();
    }
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error_code' => 'TEACHER_AUTH_REQUIRED',
        'message' => 'Teacher authentication required',
        'redirect' => 'teacher-login.html',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$jsonFlags = JSON_UNESCAPED_UNICODE;
if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
    $jsonFlags |= JSON_INVALID_UTF8_SUBSTITUTE;
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            c.id,
            c.class_name,
            c.class_code,
            c.grade_level,
            c.strand,
            c.description,
            COUNT(DISTINCT CASE WHEN ce.enrollment_status = 'approved' THEN ce.student_id END) as student_count
        FROM classes c
        LEFT JOIN class_enrollments ce ON c.id = ce.class_id
        WHERE c.teacher_id = ? AND c.is_active = TRUE
        GROUP BY c.id, c.class_name, c.class_code, c.grade_level, c.strand, c.description
        ORDER BY c.class_name ASC
    ");
    $stmt->execute([$_SESSION['teacher_id']]);
    $classes = $stmt->fetchAll();

    $out = json_encode([
        'success' => true,
        'classes' => $classes,
    ], $jsonFlags);
    if ($out === false) {
        throw new RuntimeException('json_encode failed');
    }
    if (ob_get_length()) {
        ob_clean();
    }
    echo $out;
} catch (Throwable $e) {
    error_log('[get-teacher-classes] ' . $e->getMessage());
    if (ob_get_length()) {
        ob_clean();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading classes.',
    ], $jsonFlags);
}
