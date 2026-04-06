<?php
/**
 * Export a canonical topic lesson (topics/{slug}.html) to .pptx via Groq outline + PhpPresentation.
 * API key: GROQ_PPT_API_KEY only (see resolveGroqKeyForPpt) — never exposed to client.
 */

declare(strict_types=1);

use PhpOffice\PhpPresentation\IOFactory;
use PhpOffice\PhpPresentation\PhpPresentation;
use PhpOffice\PhpPresentation\Shape\AutoShape;
use PhpOffice\PhpPresentation\Slide\Background\Color as SlideBackgroundColor;
use PhpOffice\PhpPresentation\Style\Alignment;
use PhpOffice\PhpPresentation\Style\Border;
use PhpOffice\PhpPresentation\Style\Bullet;
use PhpOffice\PhpPresentation\Style\Color;
use PhpOffice\PhpPresentation\Style\Fill;
use PhpOffice\PhpPresentation\Shape\RichText as RichTextShape;

/** Keep extracted lesson text bounded so Groq request stays under free/on_demand per-request limits (~6k TPM). */
const MAX_HTML_CHARS = 5000;
const MAX_LESSON_PROMPT_CHARS = 2200;
const GROQ_TIMEOUT_SEC = 120;

/** PPTX theme: ARGB + Calibri. Set paragraph font BEFORE createTextRun() or text stays black. */
const PPT_FONT_HEADLINE = 'Calibri Light';
const PPT_FONT_BODY = 'Calibri';
const PPT_COVER_BG = 'FF1E3A8A';
const PPT_COVER_ACCENT_WIDE = 'FFFBBF24';
const PPT_COVER_SUB = 'FFE0E7FF';
const PPT_COVER_BRAND = 'FFC7D2FE';
const PPT_COVER_DECO_BOTTOM = 'FF172554';
const PPT_SLIDE_BG = 'FFF8FAFC';
const PPT_HEADER_BG = 'FF2563EB';
const PPT_LEFT_STRIPE = 'FFF59E0B';
const PPT_TITLE_ON_HEADER = 'FFFFFFFF';
const PPT_BODY_LEAD = 'FF0F172A';
const PPT_BULLET = 'FF1E293B';
const PPT_FOOTER = 'FF64748B';
const PPT_EMPTY_HINT = 'FF94A3B8';

/** Header band height (px coords); must match stripe offset. */
const PPT_HEADER_H = 104;

/**
 * Apply font to paragraph, then add text run (required for correct OOXML color).
 */
function ppt_paragraph_text_run(RichTextShape $shape, string $text, string $fontName, int $sizePt, string $argb, bool $bold = false, bool $italic = false): void
{
    $f = $shape->getActiveParagraph()->getFont();
    if ($f === null) {
        return;
    }
    $f->setName($fontName)->setSize($sizePt)->setColor(new Color($argb));
    $f->setBold($bold);
    $f->setItalic($italic);
    $shape->getActiveParagraph()->createTextRun($text);
}

/**
 * Cover title: line spacing + optional split on " - " so lines do not stack on one blob.
 */
function ppt_format_cover_main_title(string $title): string
{
    $t = trim($title);
    if (preg_match('/^(.+?)\s+-\s+(.+)$/u', $t, $m)) {
        return trim($m[1]) . "\n" . trim($m[2]);
    }

    return $t;
}

/**
 * Pick title font size from string length (long titles need smaller pt to avoid overflow).
 */
function ppt_cover_title_size_pt(string $title): int
{
    $len = strlen($title);
    if ($len > 95) {
        return 26;
    }
    if ($len > 70) {
        return 30;
    }
    if ($len > 45) {
        return 34;
    }

    return 38;
}

/**
 * Main cover headline with readable line spacing (PhpPresentation clones font before run).
 */
function ppt_cover_title_paragraph(RichTextShape $shape, string $text, int $sizePt, string $argb): void
{
    $p = $shape->getActiveParagraph();
    $p->setLineSpacingMode(\PhpOffice\PhpPresentation\Shape\RichText\Paragraph::LINE_SPACING_MODE_PERCENT);
    $p->setLineSpacing(135);
    $p->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
    $f = $p->getFont();
    if ($f === null) {
        return;
    }
    $f->setName(PPT_FONT_HEADLINE)->setSize($sizePt)->setColor(new Color($argb));
    $f->setBold(true);
    $p->createTextRun($text);
}

function ppt_json_error(string $message, int $http = 400, ?string $code = null): void
{
    if (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code($http);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => $message,
        'error_code' => $code,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * PPT export uses only GROQ_PPT_API_KEY (not GROQ_API_KEY / lesson / perf) so you can isolate usage.
 * Also reads project root .env directly if getenv() is empty (some Apache/Windows setups hide putenv).
 */
function resolveGroqKeyForPpt(): string
{
    $envNames = ['GROQ_PPT_API_KEY'];
    foreach ($envNames as $name) {
        $v = getenv($name);
        if ($v !== false && is_string($v)) {
            $t = trim($v);
            if ($t !== '') {
                return $t;
            }
        }
        if (isset($_ENV[$name]) && is_string($_ENV[$name]) && trim($_ENV[$name]) !== '') {
            return trim($_ENV[$name]);
        }
        if (isset($_SERVER[$name]) && is_string($_SERVER[$name]) && trim($_SERVER[$name]) !== '') {
            return trim($_SERVER[$name]);
        }
    }

    $fromFile = readGroqKeysFromEnvFile(__DIR__ . '/../.env', $envNames);
    if ($fromFile !== '') {
        return $fromFile;
    }

    return '';
}

/**
 * Parse .env manually (same rules as load-env.php) for keys only.
 */
function readGroqKeysFromEnvFile(string $path, array $keyPriority): string
{
    if (!is_readable($path)) {
        return '';
    }
    $raw = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($raw === false) {
        return '';
    }
    $map = [];
    foreach ($raw as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) {
            continue;
        }
        if (strpos($line, '=') === false) {
            continue;
        }
        [$k, $val] = explode('=', $line, 2);
        $k = trim($k);
        $val = trim($val);
        if ($val !== '' && ((substr($val, 0, 1) === '"' && substr($val, -1) === '"') ||
            (substr($val, 0, 1) === "'" && substr($val, -1) === "'"))) {
            $val = substr($val, 1, -1);
        }
        if ($k !== '') {
            $map[$k] = $val;
        }
    }
    foreach ($keyPriority as $name) {
        if (!empty($map[$name]) && trim((string) $map[$name]) !== '') {
            return trim((string) $map[$name]);
        }
    }

    return '';
}

ob_start();

if (!is_file(__DIR__ . '/../vendor/autoload.php')) {
    ppt_json_error('Composer dependencies missing. From the project root run: composer install', 500, 'NO_VENDOR');
}

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/bootstrap-session-env.php';
require_once __DIR__ . '/topics-canonical.php';

@set_time_limit(300);
@ini_set('max_execution_time', '300');

try {
    export_topic_ppt_main();
} catch (Throwable $e) {
    error_log('[export-topic-ppt] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'message' => 'Export failed. If this persists, check the PHP error log.',
            'error_code' => 'INTERNAL',
            'detail' => (getenv('APP_DEBUG') === '1' || getenv('MATHEASE_DEBUG') === '1') ? $e->getMessage() : null,
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

/**
 * Main request handler (wrapped so uncaught errors return JSON instead of blank 500).
 */
function export_topic_ppt_main(): void
{
if (empty($_SESSION['teacher_id'])) {
    ppt_json_error('Teacher authentication required', 401, 'TEACHER_AUTH_REQUIRED');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    ppt_json_error('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
}

$topicSlug = isset($_POST['topic_slug']) ? trim((string) $_POST['topic_slug']) : '';
if ($topicSlug === '') {
    ppt_json_error('topic_slug is required', 400, 'MISSING_SLUG');
}

$canonical = getCanonicalTopicsList();
$allowedSlugs = array_column($canonical, 'slug');
if (!in_array($topicSlug, $allowedSlugs, true)) {
    ppt_json_error('Invalid or unsupported topic', 400, 'INVALID_SLUG');
}

$topicsDir = realpath(__DIR__ . '/../topics');
if ($topicsDir === false) {
    ppt_json_error('Topics directory not found', 500, 'SERVER_CONFIG');
}

$htmlPath = realpath($topicsDir . DIRECTORY_SEPARATOR . $topicSlug . '.html');
if ($htmlPath === false || strpos($htmlPath, $topicsDir) !== 0 || !is_readable($htmlPath)) {
    ppt_json_error('Lesson file not found for this topic', 404, 'FILE_NOT_FOUND');
}

$html = file_get_contents($htmlPath);
if ($html === false || $html === '') {
    ppt_json_error('Could not read lesson file', 500, 'READ_ERROR');
}

$plainText = extractLessonTextForPpt($html);
if (strlen($plainText) > MAX_HTML_CHARS) {
    $plainText = substr($plainText, 0, MAX_HTML_CHARS) . "\n\n[Content truncated for AI processing.]";
}

$topicName = '';
foreach ($canonical as $row) {
    if ($row['slug'] === $topicSlug) {
        $topicName = $row['name'];
        break;
    }
}

$groqKey = resolveGroqKeyForPpt();
$groqUrl = getenv('GROQ_API_URL') ?: 'https://api.groq.com/openai/v1/chat/completions';
$groqModel = getenv('GROQ_PPT_MODEL')
    ?: getenv('GROQ_MODEL')
    ?: getenv('GROQ_LESSON_MODEL')
    ?: getenv('GROQ_PERF_MODEL')
    ?: 'llama-3.1-8b-instant';

if ($groqKey === '') {
    ppt_json_error(
        'Groq API key not configured for PPT. Add GROQ_PPT_API_KEY to .env in the project root (same folder as index.html), then restart Apache.',
        503,
        'CONFIG_ERROR'
    );
}

if (!extension_loaded('zip')) {
    ppt_json_error(
        'PowerPoint export needs the PHP zip extension. In XAMPP, edit php\\php.ini, uncomment extension=zip, save, and restart Apache.',
        500,
        'PPTX_ERROR'
    );
}

try {
    $deck = requestSlideDeckFromGroq($plainText, $topicName, $groqKey, $groqUrl, $groqModel);
} catch (Throwable $e) {
    error_log('[export-topic-ppt] Groq: ' . $e->getMessage());
    // 422 = content/generation issue (not nginx/gateway 502)
    ppt_json_error('Could not generate slides: ' . $e->getMessage(), 422, 'GROQ_ERROR');
}

try {
    $pptxBinary = buildPptxFromDeck($deck, $topicName ?: $topicSlug);
} catch (Throwable $e) {
    error_log('[export-topic-ppt] PPTX: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    $detail = trim(preg_replace('/\s+/', ' ', $e->getMessage()));
    ppt_json_error('Could not build presentation file: ' . $detail, 500, 'PPTX_ERROR');
}

if (ob_get_level()) {
    ob_end_clean();
}

$safeFile = preg_replace('/[^a-zA-Z0-9_-]+/', '-', $topicSlug) . '-lesson.pptx';
header('Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation');
header('Content-Disposition: attachment; filename="' . $safeFile . '"');
header('Cache-Control: no-store');
header('Content-Length: ' . (string) strlen($pptxBinary));
echo $pptxBinary;
exit;
}

/**
 * Strip video / visual aids / scripts; return plain text for the model.
 */
function extractLessonTextForPpt(string $html): string
{
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $wrapped = '<?xml encoding="UTF-8"><div id="ppt-root-import">' . $html . '</div>';
    $loaded = $dom->loadHTML($wrapped, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    if (!$loaded) {
        return trim(preg_replace('/\s+/u', ' ', strip_tags($html)));
    }

    $xpath = new DOMXPath($dom);

    $stripQueries = [
        "//*[contains(concat(' ', normalize-space(@class), ' '), ' topic-video-section ')]",
        "//*[contains(concat(' ', normalize-space(@class), ' '), ' topic-visual-aids-section ')]",
        '//script',
        '//style',
        '//iframe',
        '//video',
        '//source',
        '//noscript',
    ];

    foreach ($stripQueries as $q) {
        $nodes = $xpath->query($q);
        if (!$nodes) {
            continue;
        }
        $remove = [];
        foreach ($nodes as $n) {
            $remove[] = $n;
        }
        foreach ($remove as $n) {
            if ($n->parentNode) {
                $n->parentNode->removeChild($n);
            }
        }
    }

    $root = $dom->getElementById('ppt-root-import');
    if (!$root) {
        return trim(preg_replace('/\s+/u', ' ', strip_tags($html)));
    }

    $text = $root->textContent;

    return trim(preg_replace('/\s+/u', ' ', $text));
}

/**
 * @return array{title: string, slides: array<int, array{title: string, bullets: array<int, string>}>}
 */
function requestSlideDeckFromGroq(
    string $lessonText,
    string $topicTitle,
    string $apiKey,
    string $apiUrl,
    string $model
): array {
    if (!function_exists('curl_init')) {
        throw new RuntimeException('cURL is not available on the server.');
    }

    $lessonText = trim($lessonText);
    if (strlen($lessonText) > MAX_LESSON_PROMPT_CHARS) {
        $lessonText = substr($lessonText, 0, MAX_LESSON_PROMPT_CHARS) . "\n[Lesson text truncated for AI.]";
    }

    // Per-request token budget includes prompt + max_tokens; large max_tokens + long lesson triggers HTTP 413 on on_demand (e.g. 6000 TPM cap).
    $attempts = [
        ['label' => 'standard', 'text' => $lessonText, 'slideMin' => 10, 'slideMax' => 12, 'max_tokens' => 2800],
        ['label' => 'compact', 'text' => substr($lessonText, 0, min(1400, strlen($lessonText))), 'slideMin' => 8, 'slideMax' => 10, 'max_tokens' => 2200],
        ['label' => 'minimal', 'text' => substr($lessonText, 0, min(700, strlen($lessonText))), 'slideMin' => 6, 'slideMax' => 8, 'max_tokens' => 1800],
    ];

    $lastParseError = null;
    foreach ($attempts as $attempt) {
        $body = $attempt['text'];
        if ($body === '') {
            $body = $topicTitle;
        }
        $prompt = buildSlideDeckPrompt($body, $topicTitle, $attempt['slideMin'], $attempt['slideMax']);
        $payload = [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => 'Reply with one JSON object only. No markdown.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.15,
            'max_tokens' => $attempt['max_tokens'],
        ];

        try {
            $rawResponse = groqChatCompletionJsonModeFirst($apiUrl, $apiKey, $payload);
            $data = json_decode((string) $rawResponse, true);
            if (!is_array($data)) {
                throw new RuntimeException('Invalid Groq envelope JSON.');
            }
            $finish = $data['choices'][0]['finish_reason'] ?? '';
            if ($finish === 'length') {
                error_log('[export-topic-ppt] Groq finish_reason=length on attempt ' . $attempt['label']);
            }
            $content = $data['choices'][0]['message']['content'] ?? '';
            if (!is_string($content) || trim($content) === '') {
                throw new RuntimeException('Empty model content.');
            }
            return parseDeckJson($content);
        } catch (RuntimeException $e) {
            $lastParseError = $e->getMessage();
            error_log('[export-topic-ppt] attempt ' . $attempt['label'] . ': ' . $e->getMessage());
        }
    }

    try {
        return requestSlideDeckOutlineFallback($topicTitle, $apiKey, $apiUrl, $model);
    } catch (Throwable $e) {
        error_log('[export-topic-ppt] fallback failed: ' . $e->getMessage());
    }

    throw new RuntimeException($lastParseError ?: 'Model did not return valid slide JSON.');
}

/**
 * Build user prompt for slide deck JSON.
 */
function buildSlideDeckPrompt(string $lessonExcerpt, string $topicTitle, int $slideMin, int $slideMax): string
{
    return <<<PROMPT
Grade 11 General Mathematics — PPT outline JSON only.

Topic: "{$topicTitle}"

Lesson excerpt:
---
{$lessonExcerpt}
---

Return ONE JSON object: "title" (string), "slides" (array length {$slideMin}-{$slideMax}).
Each slide: "title", "bullets" (3–5 short strings). Be concise. No markdown, no code fences, only JSON.
PROMPT;
}

/**
 * If lesson-based JSON keeps failing, generate a minimal valid outline from the topic title only.
 *
 * @return array{title: string, slides: array<int, array{title: string, bullets: array<int, string>}>}
 */
function requestSlideDeckOutlineFallback(
    string $topicTitle,
    string $apiKey,
    string $apiUrl,
    string $model
): array {
    $prompt = <<<PROMPT
Topic: "{$topicTitle}" (Grade 11 General Mathematics).
Return one JSON object: {"title":"string","slides":[{"title":"string","bullets":["a","b","c"]}]}
Use exactly 10 slides. Each bullets array has 3 short items. No markdown. No prose outside JSON.
PROMPT;
    $payload = [
        'model' => $model,
        'messages' => [
            ['role' => 'system', 'content' => 'Reply with JSON only.'],
            ['role' => 'user', 'content' => $prompt],
        ],
        'temperature' => 0.1,
        'max_tokens' => 2400,
        'response_format' => ['type' => 'json_object'],
    ];
    $raw = groqChatCompletionJsonModeFirst($apiUrl, $apiKey, $payload);
    $data = json_decode((string) $raw, true);
    if (!is_array($data)) {
        throw new RuntimeException('Invalid Groq response.');
    }
    $content = $data['choices'][0]['message']['content'] ?? '';
    if (!is_string($content) || trim($content) === '') {
        throw new RuntimeException('Empty fallback content.');
    }

    return parseDeckJson($content);
}

/**
 * Prefer JSON mode; on HTTP 400 (unsupported), retry without response_format.
 */
function groqChatCompletionJsonModeFirst(string $apiUrl, string $apiKey, array $payload): string
{
    $withJson = $payload;
    $withJson['response_format'] = ['type' => 'json_object'];

    try {
        return groqChatCompletionRaw($apiUrl, $apiKey, $withJson);
    } catch (RuntimeException $e) {
        if (strpos($e->getMessage(), 'Groq HTTP 400') !== false) {
            return groqChatCompletionRaw($apiUrl, $apiKey, $payload);
        }
        throw $e;
    }
}

/**
 * POST to Groq; returns raw response body.
 */
function groqChatCompletionRaw(string $apiUrl, string $apiKey, array $payload): string
{
    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_TIMEOUT => GROQ_TIMEOUT_SEC,
        CURLOPT_CONNECTTIMEOUT => 15,
    ]);

    $raw = curl_exec($ch);
    $http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($err !== '') {
        throw new RuntimeException('Network error: ' . $err);
    }
    if ($http !== 200) {
        $msg = 'Groq HTTP ' . $http;
        $decoded = json_decode((string) $raw, true);
        if (is_array($decoded) && isset($decoded['error']['message'])) {
            $msg .= ': ' . $decoded['error']['message'];
        }
        throw new RuntimeException($msg);
    }

    return (string) $raw;
}

/**
 * Remove ```json ... ``` wrappers that models often add.
 */
function stripMarkdownCodeFencesFromLlm(string $raw): string
{
    $t = trim($raw);
    if (preg_match('/^```(?:json)?\s*\R?([\s\S]*?)\R?```\s*$/i', $t, $m)) {
        return trim($m[1]);
    }
    if (preg_match('/```(?:json)?\s*(\{[\s\S]*\})\s*```/i', $t, $m)) {
        return trim($m[1]);
    }

    return $t;
}

/**
 * Extract first JSON object with balanced braces (handles nested {}, respects "strings").
 */
function extractBalancedJsonObject(string $text): ?string
{
    $t = $text;
    $start = strpos($t, '{');
    if ($start === false) {
        return null;
    }
    $depth = 0;
    $inString = false;
    $escape = false;
    $len = strlen($t);
    for ($i = $start; $i < $len; $i++) {
        $c = $t[$i];
        if ($inString) {
            if ($escape) {
                $escape = false;
            } elseif ($c === '\\') {
                $escape = true;
            } elseif ($c === '"') {
                $inString = false;
            }
        } else {
            if ($c === '"') {
                $inString = true;
            } elseif ($c === '{') {
                $depth++;
            } elseif ($c === '}') {
                $depth--;
                if ($depth === 0) {
                    return substr($t, $start, $i - $start + 1);
                }
            }
        }
    }

    return null;
}

/**
 * Strip BOM / odd whitespace that breaks json_decode.
 */
function sanitizeJsonString(string $s): string
{
    $s = preg_replace('/^\xEF\xBB\xBF/', '', $s);
    $s = str_replace("\xC2\xA0", ' ', $s);
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $s);

    return trim($s);
}

/**
 * Heuristic: close unbalanced [] and {} when Groq truncates mid-stream (finish_reason=length).
 */
function tryRepairTruncatedJson(string $s): string
{
    $t = rtrim($s);
    $t = preg_replace('/,\s*$/', '', $t);
    $openBr = substr_count($t, '[') - substr_count($t, ']');
    $openCu = substr_count($t, '{') - substr_count($t, '}');
    while ($openBr > 0) {
        $t .= ']';
        $openBr--;
    }
    while ($openCu > 0) {
        $t .= '}';
        $openCu--;
    }

    return $t;
}

/**
 * @return array<string, mixed>|null
 */
function tryDecodeJsonString(string $jsonStr): ?array
{
    $jsonStr = sanitizeJsonString($jsonStr);
    if ($jsonStr === '') {
        return null;
    }

    $flags = JSON_BIGINT_AS_STRING;
    if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
        $flags |= JSON_INVALID_UTF8_SUBSTITUTE;
    }

    $try = function (string $s) use ($flags): ?array {
        $decoded = json_decode($s, true, 512, $flags);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }

        return null;
    };

    $decoded = $try($jsonStr);
    if ($decoded !== null) {
        return $decoded;
    }

    $repaired = tryRepairTruncatedJson($jsonStr);
    if ($repaired !== $jsonStr) {
        $decoded = $try($repaired);
        if ($decoded !== null) {
            return $decoded;
        }
    }

    $fixed = preg_replace('/,\s*([\]}])/', '$1', $jsonStr);
    if ($fixed !== $jsonStr) {
        $decoded = $try($fixed);
        if ($decoded !== null) {
            return $decoded;
        }
    }

    return null;
}

/**
 * Accept several common shapes (slides / Slides / slide list / alt keys).
 *
 * @return array{title: string, slides: array<int, array{title: string, bullets: array<int, string>}>}|null
 */
function normalizeDeckFromArray(array $j): ?array
{
    $title = 'Lesson';
    if (isset($j['title']) && is_string($j['title']) && trim($j['title']) !== '') {
        $title = trim($j['title']);
    } elseif (isset($j['deckTitle']) && is_string($j['deckTitle'])) {
        $title = trim($j['deckTitle']);
    }

    $rawSlides = null;
    if (isset($j['slides']) && is_array($j['slides'])) {
        $rawSlides = $j['slides'];
    } elseif (isset($j['Slides']) && is_array($j['Slides'])) {
        $rawSlides = $j['Slides'];
    } elseif (isset($j['presentation']) && is_array($j['presentation']['slides'] ?? null)) {
        $rawSlides = $j['presentation']['slides'];
    } elseif (isset($j['slide_deck']) && is_array($j['slide_deck'])) {
        $rawSlides = $j['slide_deck'];
    } elseif (array_is_list($j) && isset($j[0]) && is_array($j[0])) {
        $rawSlides = $j;
    }

    if ($rawSlides === null || !is_array($rawSlides)) {
        return null;
    }

    $slides = [];
    foreach ($rawSlides as $slide) {
        if (is_string($slide)) {
            $line = trim($slide);
            if ($line !== '') {
                $slides[] = ['title' => $line, 'bullets' => []];
            }
            continue;
        }
        if (!is_array($slide)) {
            continue;
        }
        $st = 'Slide';
        foreach (['title', 'heading', 'name', 'slide_title'] as $tk) {
            if (isset($slide[$tk]) && is_string($slide[$tk]) && trim($slide[$tk]) !== '') {
                $st = trim($slide[$tk]);
                break;
            }
        }
        $bullets = [];
        $bulletSource = null;
        if (isset($slide['bullets']) && is_array($slide['bullets'])) {
            $bulletSource = $slide['bullets'];
        } elseif (isset($slide['bullet']) && is_array($slide['bullet'])) {
            $bulletSource = $slide['bullet'];
        } elseif (isset($slide['bullet_points']) && is_array($slide['bullet_points'])) {
            $bulletSource = $slide['bullet_points'];
        } elseif (isset($slide['points']) && is_array($slide['points'])) {
            $bulletSource = $slide['points'];
        } elseif (isset($slide['content']) && is_string($slide['content'])) {
            foreach (preg_split('/\R+/', $slide['content']) as $line) {
                $line = trim($line);
                if ($line !== '') {
                    $bullets[] = $line;
                }
            }
        }
        if ($bulletSource !== null) {
            foreach ($bulletSource as $b) {
                if (is_string($b)) {
                    $line = trim($b);
                    if ($line !== '') {
                        $bullets[] = $line;
                    }
                } elseif (is_numeric($b)) {
                    $bullets[] = (string) $b;
                }
            }
        }
        if ($st !== '' || $bullets !== []) {
            $slides[] = ['title' => $st !== '' ? $st : 'Slide', 'bullets' => $bullets];
        }
    }

    if ($slides === []) {
        return null;
    }

    return ['title' => $title, 'slides' => $slides];
}

/**
 * @return array{title: string, slides: array<int, array{title: string, bullets: array<int, string>}>}
 */
function parseDeckJson(string $content): array
{
    $content = sanitizeJsonString($content);
    $stripped = stripMarkdownCodeFencesFromLlm($content);
    $candidates = array_values(array_unique(array_filter([
        $stripped,
        trim($content),
        extractBalancedJsonObject($stripped),
        extractBalancedJsonObject(trim($content)),
    ])));

    $lastError = 'could not parse JSON';
    foreach ($candidates as $candidate) {
        if ($candidate === null || $candidate === '') {
            continue;
        }
        $decoded = tryDecodeJsonString((string) $candidate);
        if ($decoded === null) {
            continue;
        }
        $variants = [$decoded];
        foreach (['response', 'data', 'result', 'output'] as $wrap) {
            if (isset($decoded[$wrap]) && is_array($decoded[$wrap])) {
                $variants[] = $decoded[$wrap];
            }
        }
        foreach ($variants as $variant) {
            $deck = normalizeDeckFromArray($variant);
            if ($deck !== null) {
                return $deck;
            }
        }
        $lastError = 'parsed JSON but no slides array found';
    }

    error_log('[export-topic-ppt] parseDeckJson failed; sample: ' . substr($stripped, 0, 800));
    throw new RuntimeException('Model did not return valid slide JSON (' . $lastError . ').');
}


/**
 * Remove characters that break OOXML / PhpPresentation writers; cap length per field.
 */
function ppt_sanitize_ppt_text(string $text, int $maxLen = 4000): string
{
    $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $text) ?? '';
    $text = str_replace(["\r\n", "\r"], "\n", $text);
    if (function_exists('mb_strlen') && function_exists('mb_substr')) {
        if (mb_strlen($text) > $maxLen) {
            return mb_substr($text, 0, $maxLen) . '…';
        }
    } elseif (strlen($text) > $maxLen) {
        return substr($text, 0, $maxLen) . '…';
    }

    return $text;
}

/**
 * Apply solid slide background (ARGB hex).
 */
function ppt_set_slide_background(\PhpOffice\PhpPresentation\Slide $slide, string $argb): void
{
    $bg = new SlideBackgroundColor();
    $bg->setColor(new Color($argb));
    $slide->setBackground($bg);
}

/**
 * Full-width header strip for content slides (drawn first = behind text).
 */
function ppt_add_header_bar(\PhpOffice\PhpPresentation\Slide $slide, string $fillArgb): AutoShape
{
    $bar = $slide->createAutoShape();
    $bar->setType(AutoShape::TYPE_RECTANGLE);
    $bar->setName('Header');
    $bar->setOffsetX(0);
    $bar->setOffsetY(0);
    $bar->setWidth(960);
    $bar->setHeight(PPT_HEADER_H);
    $bar->getBorder()->setLineStyle(Border::LINE_NONE);
    $bar->getFill()->setFillType(Fill::FILL_SOLID);
    $bar->getFill()->getStartColor()->setARGB($fillArgb);

    return $bar;
}

/**
 * MathEase logo PNG paths (same assets as teacher-login). First readable wins.
 */
function ppt_resolve_mathease_logo_path(): string
{
    foreach ([
        __DIR__ . '/../Img/logo/logo-gradient.png',
        __DIR__ . '/../Img/logo/logo-white.png',
    ] as $p) {
        if (is_readable($p)) {
            return $p;
        }
    }

    return '';
}

/**
 * Embed an image on a slide (behind text if added before rich text shapes).
 */
function ppt_try_add_drawing_image(\PhpOffice\PhpPresentation\Slide $slide, string $absolutePath, int $offsetX, int $offsetY, int $width, int $height): bool
{
    if ($absolutePath === '' || !is_readable($absolutePath)) {
        return false;
    }
    try {
        $img = $slide->createDrawingShape();
        $img->setPath($absolutePath);
        $img->setName(pathinfo($absolutePath, PATHINFO_FILENAME));
        $img->setOffsetX($offsetX);
        $img->setOffsetY($offsetY);
        $img->setWidth($width);
        $img->setHeight($height);

        return true;
    } catch (Throwable $e) {
        error_log('[export-topic-ppt] drawing: ' . $e->getMessage());

        return false;
    }
}

/**
 * Thin vertical accent on content slides (drawn after header, before text).
 */
function ppt_add_content_left_stripe(\PhpOffice\PhpPresentation\Slide $slide, string $fillArgb): void
{
    $stripe = $slide->createAutoShape();
    $stripe->setType(AutoShape::TYPE_RECTANGLE);
    $stripe->setName('AccentStripe');
    $stripe->setOffsetX(0);
    $stripe->setOffsetY(PPT_HEADER_H);
    $stripe->setWidth(6);
    $stripe->setHeight(436);
    $stripe->getBorder()->setLineStyle(Border::LINE_NONE);
    $stripe->getFill()->setFillType(Fill::FILL_SOLID);
    $stripe->getFill()->getStartColor()->setARGB($fillArgb);
}

/**
 * @param array{title: string, slides: array<int, array{title: string, bullets: array<int, string>}>} $deck
 */
function buildPptxFromDeck(array $deck, string $fallbackTitle): string
{
    if (!extension_loaded('zip')) {
        throw new RuntimeException('PHP zip extension is required to build .pptx files. Enable extension=zip in php.ini.');
    }

    $presentation = new PhpPresentation();
    $presentation->getDocumentProperties()
        ->setTitle(ppt_sanitize_ppt_text($deck['title'] ?: $fallbackTitle, 500))
        ->setSubject('MathEase lesson export')
        ->setCreator('MathEase');

    $layout = $presentation->getLayout();
    if (method_exists($layout, 'setCX')) {
        $layout->setCX(9144000);
        $layout->setCY(6858000);
    }

    $deckTitle = ppt_sanitize_ppt_text($deck['title'] ?: $fallbackTitle, 500);
    $totalSlides = max(1, count($deck['slides']));

    // --- Cover: clean stack (no panel) — split title on " - ", line spacing, footer branding only ---
    $slide = $presentation->getSlide(0);
    ppt_set_slide_background($slide, PPT_COVER_BG);

    $coverBottom = $slide->createAutoShape();
    $coverBottom->setType(AutoShape::TYPE_RECTANGLE);
    $coverBottom->setName('CoverFooterBand');
    $coverBottom->setOffsetX(0);
    $coverBottom->setOffsetY(452);
    $coverBottom->setWidth(960);
    $coverBottom->setHeight(88);
    $coverBottom->getBorder()->setLineStyle(Border::LINE_NONE);
    $coverBottom->getFill()->setFillType(Fill::FILL_SOLID);
    $coverBottom->getFill()->getStartColor()->setARGB(PPT_COVER_DECO_BOTTOM);

    $logoPath = ppt_resolve_mathease_logo_path();
    if ($logoPath !== '') {
        ppt_try_add_drawing_image($slide, $logoPath, 36, 24, 96, 96);
    }
    $cassyPath = __DIR__ . '/../Img/Character/welcome-removebg-preview.png';
    ppt_try_add_drawing_image($slide, $cassyPath, 504, 88, 424, 348);

    $coverTitleText = ppt_format_cover_main_title($deckTitle);
    $titlePt = ppt_cover_title_size_pt($coverTitleText);

    $coverTitle = $slide->createRichTextShape();
    $coverTitle->setHeight(272)->setWidth(452)->setOffsetX(36)->setOffsetY(128);
    ppt_cover_title_paragraph($coverTitle, $coverTitleText, $titlePt, Color::COLOR_WHITE);

    $coverSub = $slide->createRichTextShape();
    $coverSub->setHeight(44)->setWidth(452)->setOffsetX(36)->setOffsetY(408);
    $coverSub->getActiveParagraph()->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
    ppt_paragraph_text_run($coverSub, 'Lesson outline · General Mathematics', PPT_FONT_BODY, 19, PPT_COVER_SUB, false, true);

    $coverFooterLabel = $slide->createRichTextShape();
    $coverFooterLabel->setHeight(40)->setWidth(900)->setOffsetX(30)->setOffsetY(472);
    $coverFooterLabel->getActiveParagraph()->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    ppt_paragraph_text_run($coverFooterLabel, 'MathEase · Grade 11 General Mathematics', PPT_FONT_BODY, 16, PPT_COVER_SUB, false, false);

    foreach ($deck['slides'] as $idx => $slideData) {
        $slide = $presentation->createSlide();
        ppt_set_slide_background($slide, PPT_SLIDE_BG);

        ppt_add_header_bar($slide, PPT_HEADER_BG);
        ppt_add_content_left_stripe($slide, PPT_LEFT_STRIPE);

        $slideNum = $idx + 1;
        $titleBox = $slide->createRichTextShape();
        $titleBox->setHeight(88)->setWidth(860)->setOffsetX(48)->setOffsetY(10);
        $titleBox->getActiveParagraph()->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
        ppt_paragraph_text_run(
            $titleBox,
            ppt_sanitize_ppt_text((string) $slideData['title'], 200),
            PPT_FONT_HEADLINE,
            34,
            PPT_TITLE_ON_HEADER,
            true,
            false
        );

        $body = $slide->createRichTextShape();
        $body->setHeight(392)->setWidth(860)->setOffsetX(52)->setOffsetY(124);
        $body->getActiveParagraph()->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        $first = true;
        foreach ($slideData['bullets'] as $bulletText) {
            if (!$first) {
                $body->createParagraph();
            }
            $first = false;
            $body->getActiveParagraph()->getBulletStyle()->setBulletType(Bullet::TYPE_BULLET);
            $body->getActiveParagraph()->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $body->getActiveParagraph()
                ->setLineSpacingMode(\PhpOffice\PhpPresentation\Shape\RichText\Paragraph::LINE_SPACING_MODE_PERCENT)
                ->setLineSpacing(128);
            $body->getActiveParagraph()->getFont()
                ->setName(PPT_FONT_BODY)
                ->setSize(21)
                ->setColor(new Color(PPT_BULLET));
            $body->createTextRun(ppt_sanitize_ppt_text((string) $bulletText, 2000));
        }

        if ($slideData['bullets'] === []) {
            ppt_paragraph_text_run(
                $body,
                '(No bullet points for this slide.)',
                PPT_FONT_BODY,
                20,
                PPT_EMPTY_HINT,
                false,
                true
            );
        }

        $footer = $slide->createRichTextShape();
        $footer->setHeight(32)->setWidth(440)->setOffsetX(480)->setOffsetY(496);
        $footer->getActiveParagraph()->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        ppt_paragraph_text_run(
            $footer,
            'Slide ' . $slideNum . ' of ' . $totalSlides . ' · MathEase',
            PPT_FONT_BODY,
            14,
            PPT_FOOTER,
            false,
            false
        );
    }

    $tmp = tempnam(sys_get_temp_dir(), 'meppt');
    if ($tmp === false) {
        throw new RuntimeException('Temp file error');
    }
    $pptxPath = $tmp . '.pptx';
    if (!@rename($tmp, $pptxPath)) {
        @unlink($tmp);
        throw new RuntimeException('Could not prepare temp file for PPTX.');
    }

    try {
        $writer = IOFactory::createWriter($presentation, 'PowerPoint2007');
        $writer->save($pptxPath);
    } catch (Throwable $e) {
        @unlink($pptxPath);
        throw new RuntimeException('PPTX writer failed: ' . $e->getMessage(), 0, $e);
    }

    $bin = file_get_contents($pptxPath);
    @unlink($pptxPath);

    if ($bin === false || $bin === '') {
        throw new RuntimeException('Failed to read generated PPTX from disk.');
    }

    return $bin;
}
