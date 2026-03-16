<?php
/* -------------------------------------------------------------
   create_lesson.php  –  Teacher PDF → Math Lesson (Groq)
   ------------------------------------------------------------- */

/* ---------- 0️⃣  Constants & helpers ---------- */
define('MAX_PDF_SIZE', 10 * 1024 * 1024);      // 10 MiB
define('MAX_CONTENT_CHARS', 12_000);          // characters sent to the LLM
define('MAX_TOKENS', 4000);                   // max tokens for lesson generation
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
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success'=>false,'message'=>'Method not allowed'], 405);
}
if (empty($_POST['csrf_token']) || $_POST['csrf_token'] !== ($_SESSION['csrf_token'] ?? '')) {
    json_response(['success'=>false,'message'=>'Invalid CSRF token'], 403);
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
$promptContent = (strlen($pdfText) > MAX_CONTENT_CHARS)
    ? substr($pdfText, 0, MAX_CONTENT_CHARS) .
      "\n\n[Content truncated for processing – only the first part of the PDF was used.]"
    : $pdfText;

/* ---------- 9️⃣  Generate lesson via Groq ---------- */
try {
    $lessonHtml = generateLessonViaGroq(
        $promptContent,
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
        (int)$_SESSION['teacher_id'],
        $lessonTitle,
        $topicCategory,
        $lessonHtml
    );
} catch (Throwable $e) {
    log_msg('DB insert error: ' . $e->getMessage());
    json_response([
        'success' => false,
        'message' => 'Could not save lesson to the database.',
        'error_type' => 'DB_ERROR'
    ], 500);
}

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
 * Extract text from a PDF.
 *
 * Tries, in order:
 *   1️⃣  `pdftotext` (system binary – fast, reliable)
 *   2️⃣  `Smalot\PdfParser\Parser` (composer package)
 *   3️⃣  Very basic regex fallback (only for extremely simple PDFs)
 *
 * @throws Exception when extraction fails
 */
function extractPdfText(string $path): string
{
    // ---- 1️⃣  pdftotext binary (poppler) ----
    if (function_exists('shell_exec')) {
        $which = trim(shell_exec('which pdftotext 2>/dev/null'));
        if ($which) {
            $out = shell_exec("pdftotext " . escapeshellarg($path) . " - 2>/dev/null");
            if ($out && strlen(trim($out)) > 100) {
                return trim($out);
            }
        }
    }

    // ---- 2️⃣  Composer PDF parser ----
    if (class_exists('\Smalot\PdfParser\Parser')) {
        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf    = $parser->parseFile($path);
            $txt    = $pdf->getText();
            if ($txt && strlen(trim($txt)) > 100) {
                return trim($txt);
            }
        } catch (Throwable $e) {
            log_msg('Smalot parser error: ' . $e->getMessage());
        }
    }

    // ---- 3️⃣  Very naive regex fallback ----
    $raw = @file_get_contents($path);
    if ($raw === false) {
        throw new Exception('Unable to read the uploaded PDF file.');
    }

    // Pull out text objects that look like "(some text)"
    preg_match_all('/$([^)]{3,})$/', $raw, $matches);
    $candidate = implode(' ', $matches[1] ?? []);
    $candidate = preg_replace('/[^\x20-\x7E\n\r]/', ' ', $candidate);
    $candidate = preg_replace('/\s+/', ' ', $candidate);
    $candidate = trim($candidate);

    if (strlen($candidate) < 200) {
        throw new Exception('Could not extract readable text from the PDF. '
            . 'Install `pdftotext` or the `smalot/pdfparser` package for reliable extraction.');
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
 * Call Groq (or any compatible OpenAI‑style endpoint) to build the lesson.
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

    // Human‑readable descriptions for the supported categories
    $topicMap = [
        'functions'               => 'Functions – introduction, notation, domain & range',
        'evaluating-functions'    => 'Evaluating Functions – plugging values into functions',
        'operations-on-functions' => 'Operations on Functions – addition, subtraction, etc.',
        'rational-functions'      => 'Rational Functions – ratios of polynomials',
        'solving-real-life-problems'=> 'Real‑Life Problems – applying functions to everyday scenarios',
        'custom'                  => 'Custom Topic – general mathematics'
    ];
    $topicDesc = $topicMap[$topic] ?? 'General Mathematics Topic';

    $prompt = <<<PROMPT
You are an expert mathematics educator tasked with turning the following PDF excerpt into a **single, self‑contained HTML lesson** for Grade 11 students.

**IMPORTANT**: Use **only** the information that appears in the PDF excerpt below. Do **not** hallucinate new content. Expand every explanation, add step‑by‑step reasoning, and make the text as clear as possible. The final output must be **pure HTML fragment** (no <html>, <head>, <body> tags).

--- PDF EXCERPT (source material) ---
{$pdfContent}
--- End of excerpt ---

**Lesson metadata**
- Title: {$title}
- Topic category: {$topic} ({$topicDesc})

**Output format**
- Begin with a `<div class="lesson">` container.
- Separate logical sections with `<section>` tags.
- Use `<h2>` for major headings, `<h3>` for sub‑headings.
- Present formulas inside `<code class="math">…</code>` or `<pre>` blocks.
- Include **example problems** from the PDF (if any) and provide **full worked‑out solutions**.
- End with a short **summary** and **self‑check questions** (again, taken from the PDF if they exist).

Generate the HTML now.
PROMPT;

    $payload = [
        'model'       => $model,
        'messages'    => [
            ['role' => 'system',  'content' => 'You are a helpful assistant specialized in educational content creation.'],
            ['role' => 'user',    'content' => $prompt]
        ],
        'temperature' => 0.6,
        'max_tokens'  => MAX_TOKENS
    ];

    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_TIMEOUT        => 60,
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
        $decoded = json_decode($rawResponse, true);
        if (isset($decoded['error']['message'])) {
            $msg .= ': ' . $decoded['error']['message'];
        }
        throw new Exception($msg);
    }

    $data = json_decode($rawResponse, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Failed to parse Groq response JSON: ' . json_last_error_msg());
    }

    $content = $data['choices'][0]['message']['content'] ?? '';
    if (trim($content) === '') {
        throw new Exception('Groq returned empty lesson content.');
    }

    return trim($content);
}

/**
 * Persist the lesson in the DB and return its auto‑generated ID.
 *
 * @throws PDOException on any DB error
 */
function storeLesson(PDO $pdo, int $teacherId, string $title, string $topic, string $html): int
{
    // Table creation – run once per deployment (kept here for demo purposes)
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS teacher_lessons (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id  INT NOT NULL,
            title       VARCHAR(255) NOT NULL,
            topic       VARCHAR(100) NOT NULL,
            html_content LONGTEXT NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_teacher (teacher_id),
            INDEX idx_topic (topic)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );

    $stmt = $pdo->prepare(
        "INSERT INTO teacher_lessons (teacher_id, title, topic, html_content)
         VALUES (:tid, :title, :topic, :html)"
    );

    $stmt->execute([
        ':tid'   => $teacherId,
        ':title' => $title,
        ':topic' => $topic,
        ':html'  => $html
    ]);

    return (int)$pdo->lastInsertId();
}
?>