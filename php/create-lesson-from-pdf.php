<?php
/* -------------------------------------------------------------
   create_lesson.php  –  Teacher PDF → Math Lesson (Groq)
   ------------------------------------------------------------- */

/* ---------- 0️⃣  Constants & helpers ---------- */
define('MAX_PDF_SIZE', 10 * 1024 * 1024);      // 10 MiB
/** Hard cap on extracted PDF text before tiered Groq attempts (memory / sanity). */
define('MAX_PDF_TEXT_FOR_LLM', 8000);
/** Groq on_demand ~6k TPM per request: prompt + max_tokens must stay below cap. */
define('GROQ_LESSON_TIMEOUT_SEC', 90);
define('MATH_KEYWORDS', [
    'function','mathematics','math','equation','formula','graph','domain','range',
    'rational','polynomial','algebra','calculus','trigonometry','statistics',
    'probability','solve','solution','variable','coefficient','exponent',
    'derivative','integral','matrix','vector','slope','intercept','quadratic',
    'linear','exponential','logarithm','inequality','fraction','decimal',
    'percentage','ratio','proportion','geometry','angle','triangle','circle',
    'square','rectangle','area','perimeter','volume','surface','coordinate',
    'axis','plot','data','mean','median','mode','standard deviation',
    'correlation','regression','model','theorem','proof','axiom','postulate',
    'conjecture','hypothesis','numerical','computation','calculation','arithmetic',
    'algebraic','geometric','trigonometric'
]);

/**
 * Simple logger – writes to PHP error log with a consistent prefix.
 */
function log_msg(string $msg): void {
    error_log('[LessonCreate] ' . $msg);
}

/**
 * Truncate to at most $maxBytes bytes without splitting a UTF-8 code unit.
 * Plain substr() can leave invalid UTF-8; json_encode then fails → empty POST → Groq HTTP 400.
 */
function truncateUtf8Bytes(string $s, int $maxBytes): string
{
    if ($maxBytes <= 0) {
        return '';
    }
    if (strlen($s) <= $maxBytes) {
        return $s;
    }
    if (function_exists('mb_strcut')) {
        $cut = mb_strcut($s, 0, $maxBytes, 'UTF-8');
        if ($cut !== false && $cut !== '') {
            return $cut;
        }
    }
    $s = substr($s, 0, $maxBytes);
    return preg_replace('/[\x80-\xBF]+$/', '', $s) ?? $s;
}

/** Strip invalid UTF-8 so the Groq request body is always valid JSON. */
function utf8SafeForJson(string $s): string
{
    if ($s === '') {
        return '';
    }
    if (function_exists('iconv')) {
        $t = @iconv('UTF-8', 'UTF-8//IGNORE', $s);
        if ($t !== false) {
            return $t;
        }
    }
    return $s;
}

function groqRequestJsonEncodeFlags(): int
{
    $f = JSON_UNESCAPED_UNICODE;
    if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
        $f |= JSON_INVALID_UTF8_SUBSTITUTE;
    }
    return $f;
}

/**
 * Sends a JSON response and halts execution.
 */
function json_response(array $payload, int $httpCode = 200): void {
    // Clean any stray output, set header, output JSON, and exit.
    if (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo json_encode($payload);
    exit;
}

/* ---------- 1️⃣  Bootstrap ---------- */
ob_start();                         // start buffering (will be cleared before output)
session_start();

require_once __DIR__ . '/config.php';      // must only define $pdo, no output
require_once __DIR__ . '/load-env.php';   // loads .env into getenv()
require_once __DIR__ . '/teacher-lessons-schema.php';
require_once __DIR__ . '/teacher-activity-log-helper.php';
require_once __DIR__ . '/teacher-lesson-html-template.php';

$__matheaseComposer = dirname(__DIR__) . '/vendor/autoload.php';
if (is_readable($__matheaseComposer)) {
    require_once $__matheaseComposer;
}

/* ---------- 2️⃣  Auth ---------- */
if (
    empty($_SESSION['teacher_id']) ||
    ($_SESSION['user_type'] ?? '') !== 'teacher'
) {
    json_response([
        'success' => false,
        'message' => 'Unauthorized – teacher access required.'
    ], 401);
}

/* ---------- 3️⃣  Groq config ---------- */
$groqKey   = getenv('GROQ_LESSON_API_KEY') ?: getenv('GROQ_API_KEY');
$groqUrl   = getenv('GROQ_API_URL') ?: 'https://api.groq.com/openai/v1/chat/completions';
$groqModel = getenv('GROQ_LESSON_MODEL')
           ?: getenv('GROQ_MODEL')
           ?: 'llama-3.1-8b-instant';

if (!$groqKey) {
    json_response([
        'success' => false,
        'message' => 'Groq API key not configured. Ask the admin to add GROQ_LESSON_API_KEY to .env.',
        'error_type' => 'CONFIG_ERROR'
    ], 500);
}

/* ---------- 4️⃣  CSRF protection (optional but recommended) ---------- */
// For now we only enforce CSRF if the backend has a token set in the session.
// This avoids hard failures if the front-end is not yet sending a csrf_token field.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success'=>false,'message'=>'Method not allowed'], 405);
}
if (isset($_SESSION['csrf_token'])) {
    if (empty($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        json_response(['success'=>false,'message'=>'Invalid CSRF token'], 403);
    }
}

/* ---------- 5️⃣  File upload validation ---------- */
if (
    empty($_FILES['pdf_file']) ||
    $_FILES['pdf_file']['error'] !== UPLOAD_ERR_OK
) {
    json_response([
        'success' => false,
        'message' => 'No PDF uploaded or upload error.'
    ], 400);
}

$file = $_FILES['pdf_file'];

// ---- MIME / extension check ----
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime  = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if ($mime !== 'application/pdf') {
    json_response([
        'success' => false,
        'message' => 'Only PDF files are accepted.'
    ], 400);
}

// ---- size check ----
if ($file['size'] > MAX_PDF_SIZE) {
    json_response([
        'success' => false,
        'message' => 'File exceeds the maximum size of 10 MiB.'
    ], 400);
}

/* ---------- 6️⃣  Extract PDF text ---------- */
$lessonTitle   = trim($_POST['lesson_title'] ?? 'Untitled Lesson');
$topicCategory = trim($_POST['topic_category'] ?? 'custom');
$teacherId     = (int) $_SESSION['teacher_id'];

ensure_teacher_lessons_schema($pdo);

/* Resolve target class IDs: all classes, JSON list, or legacy single class_id */
$classIds = [];
$assignAll = isset($_POST['assign_all_classes'])
    && $_POST['assign_all_classes'] !== ''
    && $_POST['assign_all_classes'] !== '0'
    && strtolower((string) $_POST['assign_all_classes']) !== 'false';

if ($assignAll) {
    $classIds = get_teacher_active_class_ids($pdo, $teacherId);
} elseif (!empty($_POST['class_ids'])) {
    $raw = $_POST['class_ids'];
    if (is_string($raw)) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $classIds = array_map('intval', $decoded);
        }
    } elseif (is_array($raw)) {
        $classIds = array_map('intval', $raw);
    }
} elseif (isset($_POST['class_id']) && (int) $_POST['class_id'] > 0) {
    $classIds = [(int) $_POST['class_id']];
}

$classIds = array_values(array_unique(array_filter($classIds, static function ($v) {
    return (int) $v > 0;
})));

if (empty($classIds)) {
    $msg = $assignAll
        ? 'You have no active classes. Create a class under Class Management first.'
        : 'Select at least one class, or choose “All my classes”.';
    json_response([
        'success' => false,
        'message' => $msg,
        'error_type' => 'MISSING_CLASS'
    ], 400);
}

if (!validate_class_ids_for_teacher($pdo, $teacherId, $classIds)) {
    json_response([
        'success' => false,
        'message' => 'One or more classes are invalid or not yours.',
        'error_type' => 'INVALID_CLASS'
    ], 403);
}

sort($classIds);
$primaryClassId = count($classIds) === 1 ? $classIds[0] : null;

try {
    $pdfText = extractPdfText($file['tmp_name']);
} catch (Throwable $e) {
    log_msg('PDF extraction error: ' . $e->getMessage());
    json_response([
        'success' => false,
        'message' => $e->getMessage(),
        'error_type' => 'PDF_EXTRACTION'
    ], 500);
}

/* ---------- 7️⃣  Quick sanity check – is it math? ---------- */
$isMath = containsMathKeywords($pdfText);
if (!$isMath) {
    json_response([
        'success' => false,
        'message' => 'The uploaded PDF does not appear to contain General Mathematics content.',
        'error_type' => 'INVALID_CONTENT',
        'debug_info' => 'Keyword check failed – no math‑related terms found.'
    ], 400);
}

/* ---------- 8️⃣  Prepare content for LLM ---------- */
$pdfForGroq = strlen($pdfText) > MAX_PDF_TEXT_FOR_LLM
    ? truncateUtf8Bytes($pdfText, MAX_PDF_TEXT_FOR_LLM)
        . "\n\n[Long PDF truncated before AI — first portion only.]"
    : $pdfText;

/* ---------- 9️⃣  Generate lesson via Groq ---------- */
try {
    $lessonHtml = generateLessonViaGroq(
        $pdfForGroq,
        $lessonTitle,
        $topicCategory,
        $groqKey,
        $groqModel,
        $groqUrl
    );
} catch (Throwable $e) {
    log_msg('Lesson generation error: ' . $e->getMessage());
    json_response([
        'success' => false,
        'message' => $e->getMessage(),
        'error_type' => 'AI_GENERATION'
    ], 500);
}

/* ---------- 10️⃣  Sanitize HTML (prevent XSS) ---------- */
if (class_exists('HTMLPurifier')) {
    $purifier = new HTMLPurifier();
    $lessonHtml = $purifier->purify($lessonHtml);
}

/* ---------- 11️⃣  Persist lesson ---------- */
try {
    $lessonId = storeLesson(
        $pdo,
        $teacherId,
        $primaryClassId,
        $lessonTitle,
        $topicCategory,
        $lessonHtml,
        1
    );
    replace_teacher_lesson_class_assignments($pdo, $lessonId, $classIds);
} catch (Throwable $e) {
    log_msg('DB insert error: ' . $e->getMessage());
    json_response([
        'success' => false,
        'message' => 'Could not save lesson to the database.',
        'error_type' => 'DB_ERROR'
    ], 500);
}

$classSummary = $assignAll
    ? 'all active classes'
    : (count($classIds) === 1 ? 'class ID ' . $classIds[0] : count($classIds) . ' classes');
log_teacher_activity(
    $pdo,
    $teacherId,
    'lesson_created',
    'Created lesson "' . $lessonTitle . '" (ID ' . $lessonId . ', topic: ' . $topicCategory . ') for ' . $classSummary . '.'
);

/* ---------- 12️⃣  Success response ---------- */
json_response([
    'success'       => true,
    'message'       => 'Lesson generated successfully!',
    'lesson_id'     => $lessonId,
    'lesson_html'   => $lessonHtml,
    'lesson_title'  => $lessonTitle
]);

/* ================================================================
   ========================  FUNCTIONS  ============================
   ================================================================ */

/**
 * Run Poppler's pdftotext if available (Unix + Windows).
 *
 * Windows: Poppler ships `pdftotext.exe`. `where pdftotext` often finds nothing unless PATHEXT
 * resolves it; we also try `where pdftotext.exe`, optional .env paths, then bare names.
 *
 * .env (optional, project root):
 *   PDFTOTEXT_PATH=C:\path\to\pdftotext.exe
 *   POPPLER_BIN=C:\path\to\poppler\Library\bin   (folder containing pdftotext.exe)
 */
function extractPdfTextViaPdftotext(string $path): ?string
{
    if (!function_exists('shell_exec')) {
        return null;
    }
    $disabled = (string) ini_get('disable_functions');
    if ($disabled !== '' && str_contains($disabled, 'shell_exec')) {
        return null;
    }

    $pathArg = escapeshellarg($path);
    $candidates = [];
    $isWin = stripos(PHP_OS_FAMILY, 'Windows') === 0 || stripos(PHP_OS, 'WIN') === 0;

    if ($isWin) {
        $envExe = getenv('PDFTOTEXT_PATH');
        if (is_string($envExe) && $envExe !== '') {
            $envExe = trim($envExe, " \t\"'");
            if (is_file($envExe)) {
                $candidates[] = $envExe;
            }
        }
        $popplerBin = getenv('POPPLER_BIN');
        if (is_string($popplerBin) && $popplerBin !== '') {
            $popplerBin = rtrim(trim($popplerBin, " \t\"'"), '/\\');
            foreach (['pdftotext.exe', 'pdftotext'] as $name) {
                $try = $popplerBin . DIRECTORY_SEPARATOR . $name;
                if (is_file($try)) {
                    $candidates[] = $try;
                    break;
                }
            }
        }

        foreach (['pdftotext.exe', 'pdftotext'] as $alias) {
            $where = shell_exec('where ' . $alias . ' 2>nul');
            if (is_string($where)) {
                foreach (preg_split('/\R/', trim($where)) as $line) {
                    $line = trim($line);
                    if ($line !== '' && !str_starts_with(strtolower($line), 'info:')) {
                        $candidates[] = $line;
                    }
                }
            }
        }
        $candidates[] = 'pdftotext.exe';
        $candidates[] = 'pdftotext';
    } else {
        $cmdv = trim((string) shell_exec('command -v pdftotext 2>/dev/null'));
        if ($cmdv !== '') {
            $candidates[] = $cmdv;
        }
        $candidates[] = 'pdftotext';
    }

    $candidates = array_values(array_unique($candidates));
    foreach ($candidates as $bin) {
        if ($isWin) {
            $bare = ($bin === 'pdftotext' || $bin === 'pdftotext.exe');
            $binArg = $bare ? $bin : escapeshellarg($bin);
            $cmd = $binArg . ' ' . $pathArg . ' - 2>nul';
        } else {
            $cmd = escapeshellarg($bin) . ' ' . $pathArg . ' - 2>/dev/null';
        }
        $out = shell_exec($cmd);
        if (is_string($out) && strlen(trim($out)) > 80) {
            return trim($out);
        }
    }

    return null;
}

/**
 * Pull literal strings from PDF bytes (parenthesis + hex) — works without Poppler/Composer.
 */
function extractPdfTextFromRawPdf(string $raw): string
{
    $chunks = [];

    // --- PDF literal strings: ( ... ) with \( \) escapes ---
    $len = strlen($raw);
    for ($i = 0; $i < $len; $i++) {
        if ($raw[$i] !== '(') {
            continue;
        }
        $i++;
        $depth = 1;
        $buf = '';
        while ($i < $len && $depth > 0) {
            $c = $raw[$i];
            if ($c === '\\' && $i + 1 < $len) {
                $buf .= $raw[$i + 1];
                $i += 2;
                continue;
            }
            if ($c === '(') {
                $depth++;
                $buf .= $c;
                $i++;
                continue;
            }
            if ($c === ')') {
                $depth--;
                if ($depth === 0) {
                    $i++;
                    break;
                }
                $buf .= $c;
                $i++;
                continue;
            }
            $buf .= $c;
            $i++;
        }
        $t = trim($buf);
        if (strlen($t) >= 2 && preg_match('/[a-zA-Z0-9]/', $t)) {
            $chunks[] = $t;
        }
    }

    // --- Hex strings: <48656C6C6F> ---
    if (preg_match_all('/<([0-9A-Fa-f\s\r\n]+)>/', $raw, $hexMatches)) {
        foreach ($hexMatches[1] as $hex) {
            $hex = preg_replace('/\s+/', '', $hex);
            if (strlen($hex) < 4 || (strlen($hex) % 2) !== 0) {
                continue;
            }
            $bin = @hex2bin($hex);
            if ($bin === false) {
                continue;
            }
            $txt = preg_replace('/[^\x09\x0a\x0d\x20-\x7E]/', ' ', $bin);
            $txt = trim(preg_replace('/\s+/', ' ', $txt));
            if (strlen($txt) >= 2 && preg_match('/[a-zA-Z0-9]/', $txt)) {
                $chunks[] = $txt;
            }
        }
    }

    $text = implode("\n", $chunks);
    $text = preg_replace('/[ \t]+/', ' ', $text);
    $text = preg_replace('/\n{3,}/', "\n\n", $text);
    return trim($text);
}

/**
 * Extract text from a PDF.
 *
 * Tries, in order:
 *   1️⃣  `pdftotext` (Poppler — Unix + Windows if on PATH)
 *   2️⃣  `Smalot\PdfParser\Parser` (composer: smalot/pdfparser — run `composer install`)
 *   3️⃣  Pure-PHP scan of literal / hex strings in the file
 *
 * @throws Exception when extraction fails
 */
function extractPdfText(string $path): string
{
    $viaPoppler = extractPdfTextViaPdftotext($path);
    if ($viaPoppler !== null) {
        return $viaPoppler;
    }

    if (class_exists('Smalot\\PdfParser\\Parser')) {
        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf = $parser->parseFile($path);
            $txt = $pdf->getText();
            if ($txt !== null && strlen(trim($txt)) > 80) {
                return trim($txt);
            }
        } catch (Throwable $e) {
            log_msg('Smalot parser error: ' . $e->getMessage());
        }
    }

    $raw = @file_get_contents($path);
    if ($raw === false) {
        throw new Exception('Unable to read the uploaded PDF file.');
    }

    $candidate = extractPdfTextFromRawPdf($raw);

    if (strlen($candidate) < 120) {
        throw new Exception(
            'Could not extract enough readable text from this PDF (it may be image-only or encrypted). '
            . 'Run "composer install" in the MathEase project folder (adds smalot/pdfparser), '
            . 'or install Poppler for Windows and set PDFTOTEXT_PATH (full path to pdftotext.exe) or POPPLER_BIN '
            . '(Poppler Library\\bin folder) in .env, or add that folder to your system PATH.'
        );
    }

    return $candidate;
}

/**
 * Very cheap “is this math?” check – looks for any of the
 * keywords defined in the constant `MATH_KEYWORDS`.
 *
 * Returns true if **at least one** keyword is present.
 */
function containsMathKeywords(string $text): bool
{
    $lower = strtolower($text);
    foreach (MATH_KEYWORDS as $kw) {
        if (strpos($lower, $kw) !== false) {
            return true;
        }
    }
    return false;
}

/**
 * Call Groq to build the lesson. Retries with smaller PDF excerpts / lower max_tokens
 * when the API returns HTTP 413 (request too large for on_demand TPM limits).
 *
 * @throws Exception on any HTTP / JSON / content error
 */
function generateLessonViaGroq(
    string $pdfContent,
    string $title,
    string $topic,
    string $apiKey,
    string $model,
    string $apiUrl
): string {
    if (!function_exists('curl_init')) {
        throw new Exception('cURL extension is not enabled on the server.');
    }

    // Larger excerpt + max_tokens first (fuller lessons). Smaller attempts retry on Groq 413/TPM limits.
    $attempts = [
        ['label' => 'standard', 'maxChars' => 7200, 'max_tokens' => 6144],
        ['label' => 'compact', 'maxChars' => 4000, 'max_tokens' => 4096],
        ['label' => 'minimal', 'maxChars' => 2200, 'max_tokens' => 3072],
    ];

    $lastException = null;
    foreach ($attempts as $attempt) {
        $excerpt = $pdfContent;
        if (strlen($excerpt) > $attempt['maxChars']) {
            $excerpt = truncateUtf8Bytes($excerpt, $attempt['maxChars'])
                . "\n\n[Excerpt truncated for API limits — use only the text above.]";
        }

        try {
            return generateLessonViaGroqOnce(
                $excerpt,
                $title,
                $topic,
                $apiKey,
                $model,
                $apiUrl,
                (int) $attempt['max_tokens']
            );
        } catch (Exception $e) {
            $lastException = $e;
            $msg = $e->getMessage();
            $is413 = (strpos($msg, '413') !== false)
                || stripos($msg, 'too large') !== false
                || stripos($msg, 'TPM') !== false;
            if ($is413) {
                log_msg('Groq attempt ' . $attempt['label'] . ' failed (size): ' . $msg);
                continue;
            }
            throw $e;
        }
    }

    throw $lastException ?? new Exception('Groq lesson generation failed after all attempts.');
}

/**
 * Single Groq request for one PDF excerpt.
 *
 * @throws Exception on any HTTP / JSON / content error
 */
function generateLessonViaGroqOnce(
    string $pdfContent,
    string $title,
    string $topic,
    string $apiKey,
    string $model,
    string $apiUrl,
    int $maxTokens
): string {
    $topicMap = [
        'functions'                        => 'Functions – introduction, notation, domain & range, operations',
        'evaluating-functions'           => 'Evaluating Functions – substitution, types of functions',
        'operations-on-functions'        => 'Operations on Functions – sum, product, quotient, composition',
        'solving-real-life-problems'     => 'Solving Real-Life Problems – modeling with functions',
        'rational-functions'             => 'Rational Functions – graphs, asymptotes, equations',
        'solving-rational-equations-inequalities' => 'Rational Equations & Inequalities – algebraic and graphical solutions',
        'representations-of-rational-functions'   => 'Representations of Rational Functions – graphs, intercepts, asymptotes',
        'domain-range-rational-functions'         => 'Domain & Range of Rational Functions',
        'one-to-one-functions'           => 'One-to-One Functions – horizontal line test, inverses',
        'domain-range-inverse-functions' => 'Domain & Range of Inverse Functions',
        'simple-interest'                => 'Simple Interest – I = Prt, maturity & present value',
        'compound-interest'              => 'Compound Interest – compounding, future & present value',
        'simple-and-compound-values'     => 'Interest, Maturity, Future & Present Values',
        'solving-interest-problems'      => 'Interest Word Problems – simple & compound contexts',
        'custom'                         => 'Custom Topic – general Grade 11 General Mathematics',
    ];
    $topicDesc = $topicMap[$topic] ?? 'General Mathematics Topic';

    $pdfContent = utf8SafeForJson($pdfContent);
    $title = utf8SafeForJson($title);
    $topic = utf8SafeForJson($topic);
    $topicDesc = utf8SafeForJson($topicDesc);

    $prompt = <<<PROMPT
You are a professional mathematics educator.

Your task is to generate a COMPLETE and DETAILED lesson for Grade 11 General Mathematics.

Topic: {$topicDesc}

Requirements:
- Write at least 2000-2500 words of teaching content (headings, lists, and HTML structure add length beyond the word count—prioritize completeness).
- Format the lesson as HTML using the OUTPUT FORMAT below so it matches MathEase built-in topic lessons (same card layout, icons, and Tailwind styling).
- Use clear explanations.
- Include:
  1. Introduction
  2. Concept explanation
  3. Step-by-step examples
  4. Practice problems (with solutions and answers)
  5. Activities (with solutions and answers)
  6. Summary

Rules:
- Be detailed and educational
- Do NOT shorten explanations
- Do NOT skip steps
- Continue writing until the lesson is complete
- Ensure each section is fully explained

Depth Requirement: Each concept must be explained in at least 2–3 paragraphs before moving to the next idea.

---

OUTPUT FORMAT (required HTML — no markdown fences, no text before the first tag):
- Output valid HTML only. Start directly with the opening <div> below (no “Here is your lesson”, no meta commentary).
- Root structure (one section, six cards in this exact order):

<div class="lesson-content">
  <section class="lesson-section active">
    <!-- Card 1: Introduction — use icon e.g. fa-book-open -->
    <!-- Card 2: Concept explanation — e.g. fa-lightbulb -->
    <!-- Card 3: Step-by-step examples — e.g. fa-list-ol -->
    <!-- Card 4: Practice problems (every item: problem + full solution + final answer) — e.g. fa-pencil-alt -->
    <!-- Card 5: Activities (every item: activity + full solution + final answer) — e.g. fa-tasks -->
    <!-- Card 6: Summary — e.g. fa-check-circle -->
  </section>
</div>

- For EACH of the six parts, use this card pattern (vary the Font Awesome icon per card; keep indigo/purple styling consistent with MathEase):

<div class="bg-white rounded-2xl shadow-lg p-8 mb-8">
  <div class="flex items-start gap-4 mb-6">
    <div class="w-14 h-14 shrink-0 bg-indigo-600 text-white rounded-full flex items-center justify-center">
      <i class="fas fa-ICON_NAME text-xl"></i>
    </div>
    <h2 class="text-2xl font-bold text-gray-800">Exact section title</h2>
  </div>
  <div class="text-gray-700 leading-relaxed space-y-4">
    <!-- paragraphs, lists, inner boxes -->
  </div>
</div>

- Use Tailwind utility classes throughout (text-gray-700, space-y-4, rounded-lg, shadow-lg, border, etc.). For worked examples or key ideas you may nest boxes such as:
  <div class="bg-white rounded-lg p-6 shadow-lg border-l-4 border-indigo-500">...</div>
- Use <p>, <ul>, <ol>, <li>, <strong>; use <code> or <pre> for expressions when helpful.
- Do not duplicate the lesson hero title inside the cards unless it fits naturally in the Introduction.

Use the text below (extracted from the teacher’s PDF) as the primary source: align definitions, examples, and scope with it. Where the excerpt is brief, add standard Grade 11 General Mathematics content consistent with the topic above.

--- PDF source ---
{$pdfContent}
---

Reference: lesson title "{$title}"; topic code "{$topic}".
PROMPT;

    $payload = [
        'model'       => $model,
        'messages'    => [
            ['role' => 'system',  'content' => 'You are a professional mathematics educator for Grade 11 General Mathematics (DepEd-aligned). Output only the lesson as HTML: six sections in order (Introduction; Concept explanation; Step-by-step examples; Practice problems with full solutions; Activities with full solutions; Summary). Use Tailwind CSS classes and Font Awesome (fas) icons as described in the user message so cards match MathEase lesson styling. No assistant preamble (“Here is…”), no closing chit-chat, no markdown code fences. Ground the lesson in the PDF source when provided.'],
            ['role' => 'user',    'content' => $prompt]
        ],
        'temperature' => 0.6,
        'max_tokens'  => $maxTokens
    ];

    $jsonBody = json_encode($payload, groqRequestJsonEncodeFlags());
    if ($jsonBody === false || $jsonBody === '') {
        throw new Exception(
            'Failed to build Groq request JSON: ' . json_last_error_msg()
            . ' (try another PDF export or re-save the file; some PDFs contain binary junk in extracted text.)'
        );
    }

    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $jsonBody,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_TIMEOUT        => GROQ_LESSON_TIMEOUT_SEC,
        CURLOPT_CONNECTTIMEOUT => 10
    ]);

    $rawResponse = curl_exec($ch);
    $httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError   = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new Exception('Network error while calling Groq: ' . $curlError);
    }
    if ($httpCode !== 200) {
        $msg = "Groq returned HTTP {$httpCode}";
        $decoded = json_decode((string) $rawResponse, true);
        if (is_array($decoded) && isset($decoded['error']['message'])) {
            $msg .= ': ' . $decoded['error']['message'];
        }
        throw new Exception($msg);
    }

    $data = json_decode((string) $rawResponse, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Failed to parse Groq response JSON: ' . json_last_error_msg());
    }

    $content = $data['choices'][0]['message']['content'] ?? '';
    if (trim($content) === '') {
        throw new Exception('Groq returned empty lesson content.');
    }

    $finishReason = $data['choices'][0]['finish_reason'] ?? '';
    if ($finishReason === 'length') {
        log_msg('Groq lesson: finish_reason=length (model hit max_tokens—lesson may be cut off).');
    }

    $content = trim($content);

    return finalize_teacher_lesson_html($content, $title);
}

/**
 * Persist the lesson in the DB and return its auto‑generated ID.
 *
 * @throws PDOException on any DB error
 */
function storeLesson(PDO $pdo, int $teacherId, ?int $classId, string $title, string $topic, string $html, int $published = 1): int
{
    ensure_teacher_lessons_schema($pdo);

    $stmt = $pdo->prepare(
        "INSERT INTO teacher_lessons (teacher_id, class_id, title, topic, html_content, published)
         VALUES (:tid, :cid, :title, :topic, :html, :pub)"
    );

    $stmt->execute([
        ':tid'   => $teacherId,
        ':cid'   => $classId,
        ':title' => $title,
        ':topic' => $topic,
        ':html'  => $html,
        ':pub'   => $published ? 1 : 0,
    ]);

    return (int) $pdo->lastInsertId();
}
?>