<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/lesson-source.php';
require_once __DIR__ . '/ContentSegmenter.php';
require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/pdf_extract.php';
require_once __DIR__ . '/../teacher-lessons-schema.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    quiz_gen_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

$teacherId = quiz_gen_require_teacher();
quiz_gen_ensure_schema($pdo);
ensure_teacher_lessons_schema($pdo);

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '[]', true);
if (!is_array($body)) {
    quiz_gen_json(['success' => false, 'message' => 'Invalid JSON body.'], 400);
}

$source = trim((string) ($body['source'] ?? ''));
$quizTitle = trim((string) ($body['quiz_title'] ?? ''));

$extracted = '';
$subtitle = '';

try {
    if ($source === 'builtin') {
        $slug = trim((string) ($body['topic_slug'] ?? ''));
        $lessonIndex = (int) ($body['lesson_index'] ?? 0);
        if ($slug === '' || $lessonIndex < 1) {
            quiz_gen_json(['success' => false, 'message' => 'Choose a lesson and topic.'], 400);
        }

        $res = quiz_gen_text_from_builtin_lesson($slug, $lessonIndex);
        if (!$res['ok']) {
            quiz_gen_json(['success' => false, 'message' => $res['message']], 400);
        }
        $extracted = $res['text'];
        $mods = quiz_gen_builtin_modules();
        $cfg = $mods[$slug] ?? null;
        if ($cfg) {
            $topicLabel = $cfg['topics'][$lessonIndex - 1] ?? '';
            $subtitle = $cfg['lessonTitle'] . ($topicLabel !== '' ? ' — ' . $topicLabel : '');
        }
    } elseif ($source === 'teacher_lesson') {
        $lessonId = (int) ($body['teacher_lesson_id'] ?? 0);
        if ($lessonId <= 0) {
            quiz_gen_json(['success' => false, 'message' => 'Select one of your created lessons.'], 400);
        }

        $st = $pdo->prepare('SELECT id, title, html_content FROM teacher_lessons WHERE id = ? AND teacher_id = ?');
        $st->execute([$lessonId, $teacherId]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            quiz_gen_json(['success' => false, 'message' => 'Lesson not found.'], 404);
        }

        $plain = quiz_gen_html_to_plain_for_quiz((string) ($row['html_content'] ?? ''));
        $extracted = 'Teacher lesson: ' . ($row['title'] ?? 'Untitled') . "\n\n" . $plain;
        $subtitle = (string) ($row['title'] ?? '');
    } else {
        quiz_gen_json(['success' => false, 'message' => 'Invalid source. Use builtin or teacher_lesson.'], 400);
    }

    $extracted = quiz_gen_prepareLessonTextForQuizGeneration($extracted);

    if (strlen(trim($extracted)) < 80) {
        quiz_gen_json([
            'success' => false,
            'message' => 'Not enough text to generate questions. Try another topic or a longer lesson.',
        ], 400);
    }

    $topics = QuizGen_ContentSegmenter::segment($extracted);
    $topicsJson = quiz_gen_json_encode($topics);
    $maxExtractStore = 4 * 1024 * 1024;
    $extractStore = strlen($extracted) > $maxExtractStore ? substr($extracted, 0, $maxExtractStore) : $extracted;

    if ($quizTitle === '') {
        $quizTitle = $subtitle !== '' ? ($subtitle . ' — Quiz') : ('Quiz ' . date('Y-m-d H:i'));
    }

    $slug = bin2hex(random_bytes(6));
    $repo = new QuizGen_Repository($pdo);
    $id = $repo->createDraft($teacherId, $quizTitle, $slug, null, $topicsJson, $extractStore);

    $preview = function_exists('mb_substr')
        ? mb_substr($extracted, 0, 500, 'UTF-8')
        : substr($extracted, 0, 500);

    quiz_gen_json([
        'success' => true,
        'draft_id' => $id,
        'title' => $quizTitle,
        'topics' => $topics,
        'text_preview' => $preview,
    ]);
} catch (Throwable $e) {
    error_log('[QuizGen] create-draft-from-lesson: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    quiz_gen_json(['success' => false, 'message' => 'Could not create draft: ' . $e->getMessage()], 500);
}
