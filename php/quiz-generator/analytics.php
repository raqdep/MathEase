<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/Repository.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    quiz_gen_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

$teacherId = quiz_gen_require_teacher();
quiz_gen_ensure_schema($pdo);

$quizId = (int) ($_GET['quiz_id'] ?? 0);
if ($quizId <= 0) {
    quiz_gen_json(['success' => false, 'message' => 'quiz_id is required.'], 400);
}

$repo = new QuizGen_Repository($pdo);
$row = $repo->findForTeacher($quizId, $teacherId);
if (!$row || ($row['status'] ?? '') !== 'published') {
    quiz_gen_json(['success' => false, 'message' => 'Published quiz not found.'], 404);
}

$summary = $repo->analytics($quizId, $teacherId);

$st = $pdo->prepare('
    SELECT results_json FROM generated_quiz_attempts WHERE quiz_id = ?
');
$st->execute([$quizId]);
$miss = [];
while ($r = $st->fetch(PDO::FETCH_ASSOC)) {
    $rj = json_decode($r['results_json'] ?? '', true);
    if (!is_array($rj)) {
        continue;
    }
    foreach ($rj['per_question'] ?? [] as $pq) {
        if (empty($pq['correct'])) {
            $oi = (int) ($pq['original_index'] ?? -1);
            if ($oi >= 0) {
                $miss[$oi] = ($miss[$oi] ?? 0) + 1;
            }
        }
    }
}
arsort($miss);
$missTop = [];
foreach (array_slice($miss, 0, 8, true) as $idx => $cnt) {
    $missTop[] = ['question_index' => (int) $idx, 'miss_count' => $cnt];
}

quiz_gen_json([
    'success' => true,
    'summary' => $summary,
    'most_missed_indices' => $missTop,
]);
