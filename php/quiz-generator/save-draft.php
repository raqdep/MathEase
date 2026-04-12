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
$questions = $body['questions'] ?? null;
if ($draftId <= 0 || !is_array($questions)) {
    quiz_gen_json(['success' => false, 'message' => 'draft_id and questions array are required.'], 400);
}
if (count($questions) > 30) {
    quiz_gen_json(['success' => false, 'message' => 'Maximum 30 questions allowed.'], 400);
}

$repo = new QuizGen_Repository($pdo);
if (!$repo->findForTeacher($draftId, $teacherId)) {
    quiz_gen_json(['success' => false, 'message' => 'Draft not found.'], 404);
}

$wrap = json_encode(['questions' => $questions], JSON_UNESCAPED_UNICODE);
if ($wrap === false) {
    quiz_gen_json(['success' => false, 'message' => 'Could not encode questions.'], 400);
}

$repo->updateQuestions($draftId, $teacherId, null, $wrap);

quiz_gen_json(['success' => true, 'message' => 'Draft saved.']);
