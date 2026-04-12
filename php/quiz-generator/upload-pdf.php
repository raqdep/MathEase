<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/pdf_extract.php';
require_once __DIR__ . '/ContentSegmenter.php';
require_once __DIR__ . '/Repository.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    quiz_gen_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

$teacherId = quiz_gen_require_teacher();
quiz_gen_ensure_schema($pdo);

if (empty($_FILES['pdf_file']) || $_FILES['pdf_file']['error'] !== UPLOAD_ERR_OK) {
    quiz_gen_json(['success' => false, 'message' => 'No PDF uploaded or upload error.'], 400);
}

$file = $_FILES['pdf_file'];
if (!function_exists('finfo_open')) {
    quiz_gen_json(['success' => false, 'message' => 'PHP fileinfo extension is required (finfo). Enable it in php.ini.'], 500);
}
$finfo = finfo_open(FILEINFO_MIME_TYPE);
if ($finfo === false) {
    quiz_gen_json(['success' => false, 'message' => 'Could not detect file type (finfo_open failed).'], 500);
}
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if ($mime !== 'application/pdf') {
    quiz_gen_json(['success' => false, 'message' => 'Only PDF files are accepted.'], 400);
}

if ($file['size'] > 10 * 1024 * 1024) {
    quiz_gen_json(['success' => false, 'message' => 'Maximum file size is 10 MB.'], 400);
}

$title = trim((string) ($_POST['quiz_title'] ?? 'Untitled Quiz'));
if ($title === '') {
    $title = 'Untitled Quiz';
}

$baseDir = dirname(__DIR__, 2) . '/uploads/quiz-generator/' . $teacherId;
if (!is_dir($baseDir) && !@mkdir($baseDir, 0755, true)) {
    quiz_gen_json(['success' => false, 'message' => 'Could not create upload directory.'], 500);
}

$safeName = bin2hex(random_bytes(8)) . '.pdf';
$dest = $baseDir . '/' . $safeName;
if (!move_uploaded_file($file['tmp_name'], $dest)) {
    quiz_gen_json(['success' => false, 'message' => 'Failed to store PDF.'], 500);
}

$relPath = 'uploads/quiz-generator/' . $teacherId . '/' . $safeName;

try {
    try {
        $text = quiz_gen_extractPdfText($dest);
    } catch (Throwable $e) {
        @unlink($dest);
        quiz_gen_json(['success' => false, 'message' => $e->getMessage()], 400);
    }

    $text = quiz_gen_prepareLessonTextForQuizGeneration($text);

    if (strlen(trim($text)) < 80) {
        @unlink($dest);
        quiz_gen_json(['success' => false, 'message' => 'Extracted text is too short after removing metadata. Try another PDF.'], 400);
    }

    $topics = QuizGen_ContentSegmenter::segment($text);
    $topicsJson = quiz_gen_json_encode($topics);
    $maxExtractStore = 4 * 1024 * 1024;
    $extractStore = strlen($text) > $maxExtractStore ? substr($text, 0, $maxExtractStore) : $text;

    $slug = bin2hex(random_bytes(6));
    $repo = new QuizGen_Repository($pdo);
    try {
        $id = $repo->createDraft($teacherId, $title, $slug, $relPath, $topicsJson, $extractStore);
    } catch (Throwable $e) {
        @unlink($dest);
        error_log('[QuizGen] createDraft: ' . $e->getMessage());
        quiz_gen_json(['success' => false, 'message' => 'Could not save draft. Check database connection.'], 500);
    }

    $preview = function_exists('mb_substr')
        ? mb_substr($text, 0, 500, 'UTF-8')
        : substr($text, 0, 500);

    quiz_gen_json([
        'success' => true,
        'draft_id' => $id,
        'title' => $title,
        'topics' => $topics,
        'text_preview' => $preview,
    ]);
} catch (Throwable $e) {
    @unlink($dest);
    error_log('[QuizGen] upload-pdf: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    quiz_gen_json([
        'success' => false,
        'message' => 'Upload failed: ' . $e->getMessage(),
    ], 500);
}
