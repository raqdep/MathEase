<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/Repository.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    quiz_gen_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

$studentId = quiz_gen_require_student();
quiz_gen_ensure_schema($pdo);

$repo = new QuizGen_Repository($pdo);
$list = $repo->listPublishedForStudent($studentId);

quiz_gen_json(['success' => true, 'quizzes' => $list]);
