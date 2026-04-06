<?php
/**
 * Lightweight page-visit logger for student audit trail (Flashcards, Achievements, etc.)
 */
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false]);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/student-activity-log-helper.php';

$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '[]', true);
$page = is_array($input) ? ($input['page'] ?? '') : '';

$map = [
    'flashcards'   => 'flashcards_open',
    'achievements' => 'achievements_open',
];

$action = $map[$page] ?? null;
if ($action === null) {
    echo json_encode(['success' => false, 'message' => 'unknown page']);
    exit;
}

$label = $page === 'flashcards' ? 'Opened Flashcards' : 'Visited Achievements';
log_student_activity($pdo, (int) $_SESSION['user_id'], $action, $label);

echo json_encode(['success' => true]);
