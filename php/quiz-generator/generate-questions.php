<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/pdf_extract.php';
require_once __DIR__ . '/GroqQuizGenerator.php';
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
$tos = $body['tos'] ?? null;
if ($draftId <= 0 || !is_array($tos)) {
    quiz_gen_json(['success' => false, 'message' => 'draft_id and tos are required.'], 400);
}

$defaults = [
    'remembering' => 3,
    'understanding' => 3,
    'applying' => 3,
    'analyzing' => 3,
];
foreach ($defaults as $k => $v) {
    if (!isset($tos[$k])) {
        $tos[$k] = $v;
    }
    $tos[$k] = max(0, min(30, (int) $tos[$k]));
}
$tosSum = (int) ($tos['remembering'] + $tos['understanding'] + $tos['applying'] + $tos['analyzing']);
if ($tosSum > 30) {
    quiz_gen_json(['success' => false, 'message' => 'Total questions across all cognitive levels cannot exceed 30.'], 400);
}
if ($tosSum < 1) {
    quiz_gen_json(['success' => false, 'message' => 'Set at least one question in the Table of Specification.'], 400);
}

$repo = new QuizGen_Repository($pdo);
$row = $repo->findForTeacher($draftId, $teacherId);
if (!$row) {
    quiz_gen_json(['success' => false, 'message' => 'Draft not found.'], 404);
}

try {
    $extracted = (string) ($row['extracted_text'] ?? '');

    $pdfRel = trim((string) ($row['pdf_storage_path'] ?? ''));
    if ($pdfRel !== '') {
        $root = dirname(__DIR__, 2);
        $abs = $root . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, ltrim($pdfRel, '/\\'));
        if (is_readable($abs)) {
            try {
                $fromFile = quiz_gen_extractPdfText($abs);
                if (strlen(trim($fromFile)) >= 80) {
                    $extracted = $fromFile;
                }
            } catch (Throwable $e) {
                error_log('[QuizGen] re-read PDF for generation: ' . $e->getMessage());
            }
        }
    }

    $extracted = quiz_gen_prepareLessonTextForQuizGeneration($extracted);

    if (strlen(trim($extracted)) < 80) {
        quiz_gen_json([
            'success' => false,
            'message' => 'No readable text from this quiz’s PDF. Upload the PDF again or try a text-based PDF.',
        ], 400);
    }

    [$key, $model, $url] = quiz_gen_groq_config();
    if (empty($key)) {
        quiz_gen_json(['success' => false, 'message' => 'Groq API key not configured (GROQ_API_KEY).'], 500);
    }

    $questions = QuizGen_GroqQuizGenerator::generate([], $tos, $extracted, $key, $model, $url);
    $tosJson = quiz_gen_json_encode($tos);
    $qJson = quiz_gen_json_encode(['questions' => $questions]);
    $repo->updateQuestions($draftId, $teacherId, $tosJson, $qJson);

    quiz_gen_json([
        'success' => true,
        'questions' => $questions,
        'message' => 'Questions generated. Review and edit before publishing.',
    ]);
} catch (Throwable $e) {
    error_log('[QuizGen] generate-questions: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    $msg = $e->getMessage();

    if ($e instanceof \PDOException || strpos($msg, 'SQLSTATE') !== false) {
        $friendly = 'Could not save to the database. ';
        if (preg_match('/1406|22001|Data too long|too long for column/i', $msg)) {
            $friendly .= 'The quiz text is larger than your current column allows. Reload the page and try again (columns are auto-upgraded). If it persists, run database/quiz_generator_migration.sql or ALTER questions_json to MEDIUMTEXT.';
        } elseif (preg_match("/doesn't exist|Unknown table|1146|Unknown column/i", $msg)) {
            $friendly .= 'Quiz generator tables may be missing. Import database/quiz_generator_migration.sql into your database.';
        } else {
            $friendly .= substr(preg_replace('/\s+/', ' ', $msg), 0, 220);
        }
        quiz_gen_json(['success' => false, 'message' => $friendly], 200);
    }

    $isGen = (stripos($msg, 'Groq') !== false) || (stripos($msg, 'HTTP') !== false) || (stripos($msg, 'cURL') !== false);
    quiz_gen_json([
        'success' => false,
        'message' => $isGen ? ('Generation failed: ' . $msg) : ('Could not save generated quiz: ' . substr($msg, 0, 200)),
    ], 200);
}
