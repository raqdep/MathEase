<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/Repository.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    quiz_gen_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

$teacherId = quiz_gen_require_teacher();
quiz_gen_ensure_schema($pdo);

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    quiz_gen_json(['success' => false, 'message' => 'id is required.'], 400);
}

$repo = new QuizGen_Repository($pdo);
$row = $repo->findForTeacher($id, $teacherId);
if (!$row) {
    quiz_gen_json(['success' => false, 'message' => 'Not found.'], 404);
}

$topics = json_decode($row['topics_json'] ?? '[]', true);
$tos = json_decode($row['tos_json'] ?? 'null', true);
$qwrap = json_decode($row['questions_json'] ?? '{}', true);
$questions = is_array($qwrap['questions'] ?? null) ? $qwrap['questions'] : [];

quiz_gen_json([
    'success' => true,
    'draft' => [
        'id' => (int) $row['id'],
        'title' => $row['title'],
        'status' => $row['status'],
        'class_id' => $row['class_id'] !== null ? (int) $row['class_id'] : null,
        'topics' => is_array($topics) ? $topics : [],
        'tos' => is_array($tos) ? $tos : null,
        'questions' => $questions,
    ],
]);
