<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/Repository.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    quiz_gen_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

$teacherId = quiz_gen_require_teacher();
quiz_gen_ensure_schema($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '[]', true);
if (!is_array($body)) {
    quiz_gen_json(['success' => false, 'message' => 'Invalid JSON body.'], 400);
}

$draftId = (int) ($body['draft_id'] ?? 0);
$classId = (int) ($body['class_id'] ?? 0);
$title = trim((string) ($body['title'] ?? ''));
$questions = $body['questions'] ?? null;

if ($draftId <= 0 || $classId <= 0 || $title === '' || !is_array($questions) || count($questions) < 1) {
    quiz_gen_json(['success' => false, 'message' => 'draft_id, class_id, title, and at least one question are required.'], 400);
}
if (count($questions) > 30) {
    quiz_gen_json(['success' => false, 'message' => 'Maximum 30 questions allowed. Remove extra items before publishing.'], 400);
}

$repo = new QuizGen_Repository($pdo);
if (!$repo->validateClassForTeacher($classId, $teacherId)) {
    quiz_gen_json(['success' => false, 'message' => 'Invalid class for this teacher.'], 403);
}

$row = $repo->findForTeacher($draftId, $teacherId);
if (!$row) {
    quiz_gen_json(['success' => false, 'message' => 'Draft not found.'], 404);
}

$wrap = json_encode(['questions' => $questions], JSON_UNESCAPED_UNICODE);
if ($wrap === false) {
    quiz_gen_json(['success' => false, 'message' => 'Could not encode questions.'], 400);
}

$repo->publish($draftId, $teacherId, $classId, $title, (string) $wrap);

$quizTypeKey = 'teacher_gen_' . $draftId;
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS quiz_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quiz_type VARCHAR(64) NOT NULL,
            class_id INT NOT NULL,
            deadline DATETIME NOT NULL,
            time_limit INT NOT NULL DEFAULT 20,
            is_open TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_quiz_class (quiz_type, class_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
} catch (Throwable $e) {
    error_log('[QuizGen publish] quiz_settings ensure: ' . $e->getMessage());
}
try {
    $ins = $pdo->prepare('
        INSERT INTO quiz_settings (quiz_type, class_id, deadline, time_limit, is_open)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), 20, 0)
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
    ');
    $ins->execute([$quizTypeKey, $classId]);
} catch (Throwable $e) {
    error_log('[QuizGen publish] quiz_settings insert: ' . $e->getMessage());
}

quiz_gen_json([
    'success' => true,
    'message' => 'Quiz published for the selected class.',
    'quiz_id' => $draftId,
]);
