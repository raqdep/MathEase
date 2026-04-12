<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/Grader.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    quiz_gen_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

$studentId = quiz_gen_require_student();
quiz_gen_ensure_schema($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '[]', true);
if (!is_array($body)) {
    quiz_gen_json(['success' => false, 'message' => 'Invalid JSON body.'], 400);
}

$quizId = (int) ($body['quiz_id'] ?? 0);
$order = $body['order'] ?? null;
$answers = $body['answers'] ?? null;

if ($quizId <= 0 || !is_array($order) || !is_array($answers)) {
    quiz_gen_json(['success' => false, 'message' => 'quiz_id, order, and answers are required.'], 400);
}

$repo = new QuizGen_Repository($pdo);
if (!$repo->studentCanAccessQuiz($quizId, $studentId)) {
    quiz_gen_json(['success' => false, 'message' => 'Quiz not available.'], 403);
}

$row = $repo->findPublishedVisibleToStudents($quizId);
if (!$row) {
    quiz_gen_json(['success' => false, 'message' => 'Not found.'], 404);
}

$qwrap = json_decode($row['questions_json'] ?? '{}', true);
$questions = is_array($qwrap['questions'] ?? null) ? $qwrap['questions'] : [];
$n = count($questions);
if ($n < 1 || count($order) !== $n || count($answers) !== $n) {
    quiz_gen_json(['success' => false, 'message' => 'Invalid attempt payload.'], 400);
}

$seen = [];
foreach ($order as $v) {
    $v = (int) $v;
    if ($v < 0 || $v >= $n || isset($seen[$v])) {
        quiz_gen_json(['success' => false, 'message' => 'Invalid order.'], 400);
    }
    $seen[$v] = true;
}

$correct = 0;
$per = [];
$byIdx = [];
foreach ($order as $slot => $orig) {
    $orig = (int) $orig;
    $ans = isset($answers[$slot]) ? (string) $answers[$slot] : '';
    $q = $questions[$orig];
    $g = QuizGen_Grader::grade($q, $ans);
    if ($g['ok']) {
        $correct++;
    }
    $per[] = [
        'slot' => $slot,
        'original_index' => $orig,
        'your_answer' => $ans,
        'correct' => $g['ok'],
        'feedback' => $g['feedback'],
    ];
    $byIdx[$orig] = $ans;
}

$score = $correct;
$resultsJson = json_encode([
    'per_question' => $per,
    'summary' => [
        'score' => $score,
        'total' => $n,
        'percent' => $n > 0 ? round(100 * $score / $n, 1) : 0,
    ],
], JSON_UNESCAPED_UNICODE);

$answersJson = json_encode(['by_original_index' => $byIdx], JSON_UNESCAPED_UNICODE);
$orderJson = json_encode($order, JSON_UNESCAPED_UNICODE);

$repo->insertAttempt($quizId, $studentId, $score, $n, $correct, $answersJson, $resultsJson, $orderJson);

quiz_gen_json([
    'success' => true,
    'score' => $score,
    'total' => $n,
    'percent' => $n > 0 ? round(100 * $score / $n, 1) : 0,
    'results' => json_decode($resultsJson, true),
]);
