<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/Repository.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    quiz_gen_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

$studentId = quiz_gen_require_student();
quiz_gen_ensure_schema($pdo);

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    quiz_gen_json(['success' => false, 'message' => 'id is required.'], 400);
}

$repo = new QuizGen_Repository($pdo);
if (!$repo->studentCanAccessQuiz($id, $studentId)) {
    quiz_gen_json(['success' => false, 'message' => 'Quiz not available.'], 403);
}

$row = $repo->findPublishedVisibleToStudents($id);
if (!$row) {
    quiz_gen_json(['success' => false, 'message' => 'Not found.'], 404);
}

$qwrap = json_decode($row['questions_json'] ?? '{}', true);
$questions = is_array($qwrap['questions'] ?? null) ? $qwrap['questions'] : [];
$n = count($questions);
if ($n < 1) {
    quiz_gen_json(['success' => false, 'message' => 'This quiz has no questions.'], 400);
}

// Stable shuffle per student session (matches submit grading if the page is reloaded)
if (!isset($_SESSION['tg_quiz_orders']) || !is_array($_SESSION['tg_quiz_orders'])) {
    $_SESSION['tg_quiz_orders'] = [];
}
$sessKey = (string) $id;
if (
    isset($_SESSION['tg_quiz_orders'][$sessKey])
    && is_array($_SESSION['tg_quiz_orders'][$sessKey])
    && count($_SESSION['tg_quiz_orders'][$sessKey]) === $n
) {
    $order = $_SESSION['tg_quiz_orders'][$sessKey];
} else {
    $order = range(0, $n - 1);
    shuffle($order);
    $_SESSION['tg_quiz_orders'][$sessKey] = $order;
}

$public = [];
foreach ($order as $i => $orig) {
    $q = $questions[$orig];
    $type = $q['type'] ?? 'identification';
    $item = [
        'slot' => $i,
        'question' => $q['question'] ?? '',
        'type' => $type,
        'difficulty' => $q['difficulty'] ?? 'medium',
        'cognitive_level' => $q['cognitive_level'] ?? '',
    ];
    if ($type === 'multiple_choice') {
        $item['choices'] = $q['choices'] ?? [];
    } else {
        $item['choices'] = [];
    }
    $public[] = $item;
}

quiz_gen_json([
    'success' => true,
    'quiz_id' => $id,
    'quiz_type' => 'teacher_gen_' . $id,
    'title' => $row['title'],
    'order' => $order,
    'questions' => $public,
]);
