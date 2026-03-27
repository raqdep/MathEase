<?php
// Flashcards Generator - Generates 10 AI flashcards for a specific lesson/topic.
// Security: The AI API key is ONLY read from server-side .env via load-env.php (never exposed to the browser).

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Output JSON only.
header('Content-Type: application/json; charset=utf-8');

// Start session + load config (also loads .env through load-env.php).
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

try {
    // Force DB name to match the intended database for MathEase.
    // This avoids accidental usage of a different DB_NAME from environment on this machine.
    putenv('DB_NAME=mathease_database3');
    $_ENV['DB_NAME'] = 'mathease_database3';
    $_SERVER['DB_NAME'] = 'mathease_database3';

    require_once __DIR__ . '/config.php';
    // config.php already requires load-env.php
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Configuration error: ' . $e->getMessage()]);
    exit;
}

function respond_error(int $status, string $message, array $extra = []): void {
    http_response_code($status);
    echo json_encode(array_merge(['success' => false, 'message' => $message], $extra));
    exit;
}

function read_json_input(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function read_str(array $src, array $keys): string {
    foreach ($keys as $k) {
        if (isset($src[$k]) && $src[$k] !== null) {
            return trim((string)$src[$k]);
        }
    }
    return '';
}

function read_int(array $src, array $keys): int {
    foreach ($keys as $k) {
        if (isset($src[$k]) && $src[$k] !== null && $src[$k] !== '') {
            return (int)$src[$k];
        }
    }
    return 0;
}

function mapTopicIdToDbName(string $topicId): string {
    $mapping = [
        'functions' => 'Functions',
        'evaluating-functions' => 'Evaluating Functions',
        'operations-on-functions' => 'Operations on Functions',
        'solving-real-life-problems' => 'Solving Real-Life Problems',
        'rational-functions' => 'Rational Functions',
        'representations-of-rational-functions' => 'Representations of Rational Functions',
        'domain-range-rational-functions' => 'Domain and Range of Rational Functions',
        'solving-rational-equations-inequalities' => 'Solving Rational Equations and Inequalities',
        'domain-range-inverse-functions' => 'Domain and Range of Inverse Functions',
        'one-to-one-functions' => 'One-to-One Functions',
        'simple-interest' => 'Simple Interest',
        'compound-interest' => 'Compound Interest',
        'simple-and-compound-values' => 'Interest, Maturity, Future, and Present Values',
        'solving-interest-problems' => 'Solving Problems: Simple and Compound Interest'
    ];

    return $mapping[$topicId] ?? $topicId;
}

function getAllowedTopics(): array {
    // lessonCount must match the existing topic pages (lesson subitems).
    return [
        'functions' => ['dbName' => 'Functions', 'lessons' => 4, 'file' => 'functions.html'],
        'evaluating-functions' => ['dbName' => 'Evaluating Functions', 'lessons' => 4, 'file' => 'evaluating-functions.html'],
        'operations-on-functions' => ['dbName' => 'Operations on Functions', 'lessons' => 5, 'file' => 'operations-on-functions.html'],
        'solving-real-life-problems' => ['dbName' => 'Solving Real-Life Problems', 'lessons' => 4, 'file' => 'solving-real-life-problems.html'],
        'rational-functions' => ['dbName' => 'Rational Functions', 'lessons' => 4, 'file' => 'rational-functions.html'],
        'solving-rational-equations-inequalities' => ['dbName' => 'Solving Rational Equations and Inequalities', 'lessons' => 4, 'file' => 'solving-rational-equations-inequalities.html'],
        'representations-of-rational-functions' => ['dbName' => 'Representations of Rational Functions', 'lessons' => 4, 'file' => 'representations-of-rational-functions.html'],
        'domain-range-rational-functions' => ['dbName' => 'Domain and Range of Rational Functions', 'lessons' => 4, 'file' => 'domain-range-rational-functions.html'],
        'domain-range-inverse-functions' => ['dbName' => 'Domain and Range of Inverse Functions', 'lessons' => 4, 'file' => 'domain-range-inverse-functions.html'],
        'one-to-one-functions' => ['dbName' => 'One-to-One Functions', 'lessons' => 4, 'file' => 'one-to-one-functions.html'],
        'simple-interest' => ['dbName' => 'Simple Interest', 'lessons' => 4, 'file' => 'simple-interest.html'],
        'compound-interest' => ['dbName' => 'Compound Interest', 'lessons' => 5, 'file' => 'compound-interest.html'],
        'simple-and-compound-values' => ['dbName' => 'Interest, Maturity, Future, and Present Values', 'lessons' => 5, 'file' => 'simple-and-compound-values.html'],
        'solving-interest-problems' => ['dbName' => 'Solving Problems: Simple and Compound Interest', 'lessons' => 5, 'file' => 'solving-interest-problems.html'],
    ];
}

function ensure_student_access(string $topicDbName, PDO $pdo): void {
    if (!isset($_SESSION['user_id'])) {
        respond_error(401, 'Not authenticated');
    }

    // Check for approved enrollment.
    $stmt = $pdo->prepare("
        SELECT ce.id, ce.class_id, c.teacher_id
        FROM class_enrollments ce
        JOIN classes c ON ce.class_id = c.id
        WHERE ce.student_id = ? AND ce.enrollment_status = 'approved'
        LIMIT 1
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $enrollment = $stmt->fetch();

    if (!$enrollment) {
        respond_error(403, 'You are not enrolled in any class');
    }

    // Check if the topic is locked.
    $stmt = $pdo->prepare("
        SELECT ctl.is_locked
        FROM class_topic_locks ctl
        JOIN topics t ON ctl.topic_id = t.id
        WHERE ctl.class_id = ? AND t.name = ?
        LIMIT 1
    ");
    $stmt->execute([$enrollment['class_id'], $topicDbName]);
    $lock = $stmt->fetch();

    if ($lock && !empty($lock['is_locked'])) {
        respond_error(403, 'This topic is currently locked by your teacher');
    }
}

function compress_ws(string $s): string {
    $s = trim($s);
    $s = preg_replace('/\s+/', ' ', $s);
    return $s ?? '';
}

function extractLessonContextFromTopicHtml(string $topicFilePath, int $lessonNum): array {
    if (!file_exists($topicFilePath)) {
        return ['objective' => '', 'example' => '', 'reference' => '', 'error' => 'Topic file not found'];
    }

    $html = file_get_contents($topicFilePath);
    if ($html === false) {
        return ['objective' => '', 'example' => '', 'reference' => '', 'error' => 'Failed to read topic file'];
    }

    // Some servers may not have the PHP XML extension enabled.
    // Fall back to empty extracted context instead of crashing.
    if (!class_exists('DOMDocument') || !class_exists('DOMXPath')) {
        error_log('flashcards.php: DOM extension unavailable; skipping lesson HTML parsing');
        return ['objective' => '', 'example' => '', 'reference' => '', 'error' => 'DOM extension unavailable'];
    }

    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $loaded = $dom->loadHTML($html, LIBXML_NOERROR | LIBXML_NOWARNING);
    libxml_clear_errors();

    if (!$loaded) {
        return ['objective' => '', 'example' => '', 'reference' => '', 'error' => 'Failed to parse topic HTML'];
    }

    $xpath = new DOMXPath($dom);

    $ids = [
        'objective' => "lesson{$lessonNum}-objective",
        'example' => "lesson{$lessonNum}-example",
        'reference' => "lesson{$lessonNum}-reference",
    ];

    $out = [];
    foreach ($ids as $key => $id) {
        $node = $xpath->query("//*[@id='{$id}']")->item(0);
        if ($node) {
            $out[$key] = compress_ws($node->textContent);
        } else {
            $out[$key] = '';
        }
    }

    return $out;
}

function truncate_chars(string $s, int $maxChars): string {
    if (mb_strlen($s) <= $maxChars) return $s;
    return mb_substr($s, 0, $maxChars) . '...';
}

function extract_first_json_object(string $text): ?string {
    if ($text === '') return null;
    $start = strpos($text, '{');
    if ($start === false) return null;
    $end = strrpos($text, '}');
    if ($end === false || $end <= $start) return null;
    return substr($text, $start, $end - $start + 1);
}

// ----------------------------
// Request handling
// ----------------------------
$input = read_json_input();
$action = $input['action'] ?? $_GET['action'] ?? 'generate';

if ($action !== 'generate') {
    respond_error(400, 'Unsupported action');
}

if (!isset($_SESSION['user_id'])) {
    respond_error(401, 'Not authenticated');
}

$topicSlug = read_str($input, ['topic', 'topicSlug', 'topic_slug', 'topic_id']);
if ($topicSlug === '') {
    $topicSlug = read_str($_POST, ['topic', 'topicSlug', 'topic_slug', 'topic_id']);
}
if ($topicSlug === '') {
    $topicSlug = read_str($_GET, ['topic', 'topicSlug', 'topic_slug', 'topic_id']);
}

$lessonNum = read_int($input, ['lesson', 'lessonNum', 'lesson_number']);
if ($lessonNum <= 0) {
    $lessonNum = read_int($_POST, ['lesson', 'lessonNum', 'lesson_number']);
}
if ($lessonNum <= 0) {
    $lessonNum = read_int($_GET, ['lesson', 'lessonNum', 'lesson_number']);
}

if ($topicSlug === '' || $lessonNum <= 0) {
    respond_error(400, 'Missing topic or lesson');
}

$topics = getAllowedTopics();
if (!isset($topics[$topicSlug])) {
    respond_error(400, 'Invalid topic');
}

if ($lessonNum < 1 || $lessonNum > (int)$topics[$topicSlug]['lessons']) {
    respond_error(400, 'Invalid lesson for selected topic');
}

// Enforce access: enrollment + lock.
ensure_student_access($topics[$topicSlug]['dbName'], $pdo);

// Load lesson context (objective/example/reference) from the topic HTML page.
$topicFilePath = __DIR__ . '/../topics/' . $topics[$topicSlug]['file'];
if (!file_exists($topicFilePath)) {
    respond_error(500, 'Lesson content file missing');
}

$ctx = extractLessonContextFromTopicHtml($topicFilePath, $lessonNum);
$objective = $ctx['objective'] ?? '';
$example = $ctx['example'] ?? '';
$reference = $ctx['reference'] ?? '';

// Avoid huge prompts.
$objective = truncate_chars($objective, 1200);
$example = truncate_chars($example, 1200);
$reference = truncate_chars($reference, 1200);

$contextBlock = "TOPIC: " . $topics[$topicSlug]['dbName'] . "\n";
$contextBlock .= "LESSON: " . $lessonNum . "\n\n";
$contextBlock .= "OBJECTIVE (student-friendly):\n" . $objective . "\n\n";
$contextBlock .= "EXAMPLE (key ideas & steps):\n" . $example . "\n\n";
$contextBlock .= "REFERENCE (formulas/notes):\n" . $reference . "\n\n";
$contextBlock .= "IMPORTANT: Use the content above to create flashcards that match this lesson.\n";

// ----------------------------
// Call Groq AI (server-side)
// ----------------------------
$GROQ_API_KEY = getenv('GROQ_API_KEY') ?: getenv('GROQ_PERF_API_KEY');
$GROQ_API_URL = getenv('GROQ_API_URL') ?: 'https://api.groq.com/openai/v1/chat/completions';
$GROQ_MODEL = getenv('GROQ_MODEL') ?: 'llama-3.1-8b-instant';

if (empty($GROQ_API_KEY)) {
    respond_error(500, 'AI feedback is not configured (GROQ_API_KEY missing).');
}

$systemPrompt = "You are Cassy, a friendly AI math tutor for Grade 11 General Mathematics.
You help students study with accurate, well-designed flashcards.
Return ONLY strict JSON. No markdown, no explanations outside the JSON.";

$baseUserPrompt = "Create flashcards for the lesson described below.

Each flashcard MUST be for Grade 11.
The flashcards must cover: key definitions, key formulas/relationships, and common mistakes.
At least 3 flashcards should be concept-check questions (\"What is/why/how\").
At least 3 flashcards should be problem-style questions that require a computation or step-by-step reasoning.

For each flashcard, output this structure:
{
  \"front\": string (a short question or concept statement; <= 180 chars),
  \"back\": string (the direct answer or final result; include essential formula/steps if needed),
  \"explanation\": string (friendly 4-8 sentence explanation; include a quick example if helpful)
}

Return this final JSON object (and NOTHING else):
{
  \"flashcards\": [ ten objects as above ]
}

CONTENT TO STUDY:
----------------------------
$contextBlock
----------------------------
";

function normalize_flashcards(array $flashcards): array {
    // If AI returns more than 10, slice. If fewer, keep as-is (we can retry or fail later).
    $flashcards = array_values($flashcards);
    if (count($flashcards) > 10) $flashcards = array_slice($flashcards, 0, 10);

    $out = [];
    foreach ($flashcards as $idx => $card) {
        if (!is_array($card)) continue;
        $out[] = [
            'front' => isset($card['front']) ? (string)$card['front'] : '',
            'back' => isset($card['back']) ? (string)$card['back'] : '',
            'explanation' => isset($card['explanation']) ? (string)$card['explanation'] : '',
        ];
    }
    return $out;
}

function call_groq_flashcards(string $systemPrompt, string $userPrompt, string $GROQ_API_URL, string $GROQ_API_KEY, string $GROQ_MODEL): array {
    $postData = [
        'model' => $GROQ_MODEL,
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt],
        ],
        'temperature' => 0.55,
        'max_tokens' => 2200,
    ];

    $ch = curl_init($GROQ_API_URL);
    if ($ch === false) {
        throw new Exception('Failed to initialize AI request.');
    }

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($postData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $GROQ_API_KEY,
        ],
        CURLOPT_TIMEOUT => 60,
        CURLOPT_CONNECTTIMEOUT => 15,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new Exception('AI request failed: ' . $curlError);
    }

    if ($httpCode !== 200) {
        throw new Exception('AI API error (HTTP ' . $httpCode . ').');
    }

    $apiResponse = json_decode($response, true);
    if (!is_array($apiResponse)) {
        throw new Exception('Invalid AI response from server.');
    }

    $aiText = $apiResponse['choices'][0]['message']['content'] ?? '';
    if (!is_string($aiText) || trim($aiText) === '') {
        throw new Exception('AI returned empty content.');
    }

    $jsonStr = extract_first_json_object($aiText);
    if ($jsonStr === null) {
        throw new Exception('AI response was not valid JSON.');
    }

    $flashPayload = json_decode($jsonStr, true);
    if (!is_array($flashPayload) || empty($flashPayload['flashcards']) || !is_array($flashPayload['flashcards'])) {
        throw new Exception('AI response JSON missing flashcards.');
    }

    return normalize_flashcards($flashPayload['flashcards']);
}

$attempts = 2;
$flashcards = [];
$lastErr = null;

for ($attempt = 1; $attempt <= $attempts; $attempt++) {
    $extraStrict = $attempt === 2
        ? "\nSTRICT REQUIREMENT: Output EXACTLY 10 flashcards in the JSON array. Do not output any extra objects.\n"
        : "\nPlease follow the structure exactly.\n";

    $userPrompt = $baseUserPrompt;
    // Ensure the strict requirement is present on both attempts.
    $userPrompt = str_replace(
        'Return this final JSON object (and NOTHING else):',
        'You MUST return exactly 10 flashcards.\n\nReturn this final JSON object (and NOTHING else):',
        $userPrompt
    );
    $userPrompt .= $extraStrict;

    try {
        $flashcards = call_groq_flashcards($systemPrompt, $userPrompt, $GROQ_API_URL, $GROQ_API_KEY, $GROQ_MODEL);
        if (count($flashcards) === 10) {
            break;
        }
        $lastErr = 'AI returned ' . count($flashcards) . ' flashcards.';
        if ($attempt === $attempts) break;
        // Retry if count mismatch.
    } catch (Exception $e) {
        $lastErr = $e->getMessage();
        $flashcards = [];
        if ($attempt === $attempts) break;
    }
}

// Final validation: ensure we have 10 with required keys.
if (count($flashcards) !== 10) {
    respond_error(500, 'AI did not return exactly 10 flashcards. ' . ($lastErr ? ('Last error: ' . $lastErr) : ''));
}

foreach ($flashcards as $idx => $card) {
    if (trim($card['front'] ?? '') === '' || trim($card['back'] ?? '') === '' || trim($card['explanation'] ?? '') === '') {
        respond_error(500, 'AI flashcard format invalid at index ' . $idx);
    }
}

echo json_encode([
    'success' => true,
    'topic' => $topicSlug,
    'topic_title' => $topics[$topicSlug]['dbName'],
    'lesson' => $lessonNum,
    'flashcards' => $flashcards
]);

exit;

?>

