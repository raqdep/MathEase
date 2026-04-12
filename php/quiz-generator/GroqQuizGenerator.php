<?php

declare(strict_types=1);

require_once __DIR__ . '/pdf_extract.php';
require_once __DIR__ . '/ContentSegmenter.php';

/**
 * Groq quiz generation — tuned for on_demand TPM (~6k tokens/request budget).
 * Uses batched calls per cognitive level + tiered truncation (critical for 413 errors).
 */

if (!function_exists('quiz_gen_truncateUtf8')) {
    function quiz_gen_truncateUtf8(string $s, int $maxBytes): string
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

    function quiz_gen_utf8Safe(string $s): string
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
}

final class QuizGen_GroqQuizGenerator
{
    private const TIMEOUT = 90;
    /**
     * Groq json_object mode must finish a full JSON object; too-low max_tokens → HTTP 400 json_validate_failed.
     * Keep completion budget comfortably above 2 short MC items.
     */
    private const MAX_OUTPUT_TOKENS_CAP = 1536;
    /** Minimum completion tokens whenever using response_format json_object */
    private const JSON_MODE_MIN_COMPLETION_TOKENS = 768;
    private const TOPIC_BODY_MAX = 100;
    private const TOPICS_MAX = 5;
    /** Full composed SOURCE before per-batch slicing (larger = better PDF grounding). */
    private const SOURCE_FULL_MAX_BYTES = 5200;
    /** Smaller batches = lower max_tokens and smaller completions */
    private const QUESTIONS_PER_API_CALL = 2;
    /** Space Groq calls so bursts stay under rolling TPM */
    private const SECONDS_BETWEEN_GROQ_CALLS = 2.5;
    private const RATE_LIMIT_MAX_ATTEMPTS = 10;

    /**
     * @param list<array{title: string, content: string}> $topicsIgnored Legacy parameter (topics are re-segmented from cleaned PDF text).
     * @param array<string, mixed> $tos
     * @return list<array<string, mixed>>
     */
    public static function generate(
        array $topicsIgnored,
        array $tos,
        string $extractedText,
        string $apiKey,
        string $model,
        string $apiUrl
    ): array {
        if (!function_exists('curl_init')) {
            throw new Exception('cURL is not enabled.');
        }

        $levels = [
            'remembering' => max(0, min(30, (int) ($tos['remembering'] ?? 0))),
            'understanding' => max(0, min(30, (int) ($tos['understanding'] ?? 0))),
            'applying' => max(0, min(30, (int) ($tos['applying'] ?? 0))),
            'analyzing' => max(0, min(30, (int) ($tos['analyzing'] ?? 0))),
        ];

        $total = $levels['remembering'] + $levels['understanding'] + $levels['applying'] + $levels['analyzing'];
        if ($total < 1) {
            throw new Exception('No questions requested in the Table of Specification.');
        }

        if (function_exists('set_time_limit')) {
            @set_time_limit(300);
        }

        $extractedSafe = quiz_gen_prepareLessonTextForQuizGeneration(quiz_gen_utf8Safe($extractedText));
        if (trim($extractedSafe) === '') {
            throw new Exception('No usable text from the uploaded PDF to generate questions.');
        }
        $topics = QuizGen_ContentSegmenter::segment($extractedSafe);
        $slimTopics = self::slimTopicsForPrompt($topics);
        $sourceFull = self::composeLessonSourceForModel($topics, $extractedSafe);
        if (trim($sourceFull) === '') {
            throw new Exception('No usable text from the uploaded PDF to generate questions.');
        }

        $all = [];
        $firstGroqCall = true;
        $batchOrdinal = 0;
        foreach ($levels as $levelName => $count) {
            if ($count < 1) {
                continue;
            }
            $chunks = self::splitCountIntoChunks($count, self::QUESTIONS_PER_API_CALL);
            foreach ($chunks as $n) {
                if (!$firstGroqCall) {
                    usleep((int) (self::SECONDS_BETWEEN_GROQ_CALLS * 1_000_000));
                }
                $firstGroqCall = false;
                $merged = self::generateForLevelWithRetries(
                    $levelName,
                    $n,
                    $slimTopics,
                    $sourceFull,
                    $batchOrdinal,
                    $apiKey,
                    $model,
                    $apiUrl
                );
                $batchOrdinal++;
                foreach ($merged as &$q) {
                    if (is_array($q)) {
                        $q['cognitive_level'] = $levelName;
                    }
                    $all[] = $q;
                }
                unset($q);
            }
        }

        $normalized = self::normalizeQuestions($all);
        if (count($normalized) < 1) {
            throw new Exception('The model returned no usable questions. Try a shorter PDF or fewer items.');
        }
        return $normalized;
    }

    /**
     * @return list<int>
     */
    private static function splitCountIntoChunks(int $count, int $maxPerChunk): array
    {
        if ($count <= 0) {
            return [];
        }
        $out = [];
        $left = $count;
        while ($left > 0) {
            $take = min($maxPerChunk, $left);
            $out[] = $take;
            $left -= $take;
        }
        return $out;
    }

    /**
     * @param list<array{title: string, content: string}> $topics
     * @return list<array{title: string, content: string}>
     */
    private static function slimTopicsForPrompt(array $topics): array
    {
        $out = [];
        $i = 0;
        foreach ($topics as $t) {
            if ($i >= self::TOPICS_MAX) {
                break;
            }
            $title = trim((string) ($t['title'] ?? ''));
            $body = quiz_gen_truncateUtf8(trim((string) ($t['content'] ?? '')), self::TOPIC_BODY_MAX);
            if ($title === '' && $body === '') {
                continue;
            }
            $out[] = ['title' => $title !== '' ? $title : 'Topic', 'content' => $body];
            $i++;
        }
        if ($out === []) {
            $out[] = ['title' => 'Source', 'content' => ''];
        }
        return $out;
    }

    /**
     * Full lesson SOURCE (capped) used to build rotating windows per API call — not always "first N bytes".
     *
     * @param list<array{title: string, content: string}> $topics
     */
    private static function composeLessonSourceForModel(array $topics, string $extractedText): string
    {
        $extractedText = trim($extractedText);
        if ($extractedText === '') {
            return '';
        }

        $intro = "[Lesson material — General Mathematics / senior high school. "
            . "Ignore file format, metadata, language codes (e.g. en-PH), XML, and document properties.]\n\n";
        $strat = self::stratifiedPdfExcerpts($extractedText, 420);
        $stitched = self::stitchTopicBodies($topics, 1400);

        if ($stitched === '') {
            $merged = $intro . $strat;
        } else {
            $merged = $intro . $strat . "\n\n--- Segments ---\n" . $stitched;
        }

        return quiz_gen_truncateUtf8($merged, self::SOURCE_FULL_MAX_BYTES);
    }

    /**
     * Take a sliding window into SOURCE so each batch sees different PDF text (avoids duplicate generic items).
     */
    private static function sliceSourceForBatch(string $sourceFull, int $batchOrdinal, int $maxBytes): string
    {
        $sourceFull = quiz_gen_utf8Safe(trim($sourceFull));
        if ($sourceFull === '' || $maxBytes < 64) {
            return '';
        }
        $bl = strlen($sourceFull);
        if ($bl <= $maxBytes) {
            return $sourceFull;
        }
        $maxStart = $bl - $maxBytes;
        if ($maxStart < 1) {
            return quiz_gen_truncateUtf8($sourceFull, $maxBytes);
        }
        $prime = 677;
        $start = ($batchOrdinal * $prime) % ($maxStart + 1);
        $chunk = substr($sourceFull, $start, $maxBytes);
        $chunk = quiz_gen_utf8Safe($chunk);

        return "[SOURCE window " . ($batchOrdinal + 1) . " — questions MUST use facts, numbers, terms, or examples from THIS window]\n\n"
            . $chunk;
    }

    /**
     * @param list<array{title: string, content: string}> $topics
     */
    private static function stitchTopicBodies(array $topics, int $maxBytes): string
    {
        $chunks = [];
        $total = 0;
        foreach ($topics as $t) {
            if (!is_array($t)) {
                continue;
            }
            $title = trim((string) ($t['title'] ?? ''));
            $body = trim((string) ($t['content'] ?? ''));
            if ($body === '') {
                continue;
            }
            $block = ($title !== '' ? "### {$title}\n" : '') . $body;
            $sep = $chunks === [] ? 0 : 2;
            $need = strlen($block) + $sep;
            if ($total + $need > $maxBytes) {
                $remain = $maxBytes - $total - 4;
                if ($remain > 120) {
                    $chunks[] = quiz_gen_truncateUtf8($block, $remain);
                }
                break;
            }
            $chunks[] = $block;
            $total += $need;
        }

        return trim(implode("\n\n", $chunks));
    }

    private static function stratifiedPdfExcerpts(string $text, int $maxEach): string
    {
        $text = trim($text);
        if ($text === '') {
            return '';
        }

        $parts = ["[Start of lesson text]\n" . quiz_gen_truncateUtf8($text, $maxEach)];

        if (function_exists('mb_strlen') && function_exists('mb_substr')) {
            $ml = mb_strlen($text, 'UTF-8');
            if ($ml > 1200) {
                $startCh = max(0, (int) floor($ml / 2) - 500);
                $mid = mb_substr($text, $startCh, 1600, 'UTF-8');
                $parts[] = "[Middle of lesson text]\n" . quiz_gen_truncateUtf8($mid, $maxEach);
            }
            if ($ml > 2400) {
                $end = mb_substr($text, max(0, $ml - 1400), 1400, 'UTF-8');
                $parts[] = "[End of lesson text]\n" . quiz_gen_truncateUtf8($end, $maxEach);
            }
        } else {
            $bl = strlen($text);
            if ($bl > 6000) {
                $mid = substr($text, (int) floor($bl / 2) - 2000, 4000);
                $parts[] = "[Middle of lesson text]\n" . quiz_gen_truncateUtf8($mid, $maxEach);
            }
            if ($bl > 10000) {
                $end = substr($text, max(0, $bl - 5000));
                $parts[] = "[End of lesson text]\n" . quiz_gen_truncateUtf8($end, $maxEach);
            }
        }

        return implode("\n\n", $parts);
    }

    /**
     * @param list<array{title: string, content: string}> $slimTopics
     * @return list<array<string, mixed>>
     */
    private static function generateForLevelWithRetries(
        string $levelName,
        int $count,
        array $slimTopics,
        string $sourceFull,
        int $batchOrdinal,
        string $apiKey,
        string $model,
        string $apiUrl
    ): array {
        $tiers = [
            ['window' => 1400, 'max_tokens' => 200 + $count * 180],
            ['window' => 1100, 'max_tokens' => 180 + $count * 160],
            ['window' => 850, 'max_tokens' => 160 + $count * 140],
            ['window' => 650, 'max_tokens' => 140 + $count * 120],
        ];

        $lastErr = null;
        foreach ($tiers as $tier) {
            $win = max(200, (int) $tier['window']);
            $excerpt = self::sliceSourceForBatch($sourceFull, $batchOrdinal, $win);
            if ($excerpt === '') {
                $excerpt = quiz_gen_truncateUtf8($sourceFull, $win);
            }
            $maxTok = (int) $tier['max_tokens'];
            $maxTok = max(256, min(self::MAX_OUTPUT_TOKENS_CAP, $maxTok));
            try {
                return self::generateOneLevelCall(
                    $levelName,
                    $count,
                    $slimTopics,
                    $excerpt,
                    $maxTok,
                    $batchOrdinal,
                    $apiKey,
                    $model,
                    $apiUrl
                );
            } catch (Throwable $e) {
                $lastErr = $e;
                $msg = $e->getMessage();
                $is413 = (strpos($msg, '413') !== false)
                    || stripos($msg, 'too large') !== false
                    || stripos($msg, 'TPM') !== false
                    || stripos($msg, 'tokens') !== false
                    || stripos($msg, 'rate_limit') !== false;
                if (!$is413) {
                    throw $e;
                }
            }
        }
        throw $lastErr ?? new Exception('Groq request failed after size retries.');
    }

    /**
     * Groq may return `content` as a string or (rarely) a list of parts.
     */
    private static function normalizeGroqMessageContent(mixed $content): string
    {
        if (is_string($content)) {
            return $content;
        }
        if (!is_array($content)) {
            return '';
        }
        $out = [];
        foreach ($content as $part) {
            if (is_string($part)) {
                $out[] = $part;
                continue;
            }
            if (!is_array($part)) {
                continue;
            }
            if (isset($part['text']) && is_string($part['text'])) {
                $out[] = $part['text'];
            } elseif (isset($part['content']) && is_string($part['content'])) {
                $out[] = $part['content'];
            }
        }

        return implode('', $out);
    }

    /**
     * Strip BOM, NBSP, and control chars that break json_decode (PDF text often leaks bad bytes).
     */
    private static function sanitizeJsonCandidate(string $s): string
    {
        $s = preg_replace('/^\xEF\xBB\xBF/', '', $s);
        $s = str_replace("\xC2\xA0", ' ', $s);
        $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $s);

        return quiz_gen_utf8Safe(trim($s));
    }

    /**
     * Heuristic: close unbalanced brackets when the model hits max_tokens mid-JSON.
     */
    private static function tryRepairTruncatedJson(string $s): string
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
    private static function jsonDecodeLenient(string $s): ?array
    {
        $flags = 0;
        if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
            $flags |= JSON_INVALID_UTF8_SUBSTITUTE;
        }
        $decoded = json_decode($s, true, 512, $flags);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }

        return null;
    }

    /**
     * Curly quotes and BOM-like noise often break json_decode.
     */
    private static function normalizeJsonLikeQuotes(string $s): string
    {
        $repl = [
            "\xE2\x80\x9C" => '"',
            "\xE2\x80\x9D" => '"',
            "\xE2\x80\x98" => "'",
            "\xE2\x80\x99" => "'",
            "\xC2\xA0" => ' ',
        ];

        return strtr($s, $repl);
    }

    /**
     * Cut chatter before the JSON object (models sometimes prepend reasoning).
     */
    private static function cutToJsonObjectStart(string $s): string
    {
        $s = trim($s);
        foreach (['{"questions"', '{ "questions"'] as $needle) {
            $p = strpos($s, $needle);
            if ($p !== false && $p > 0) {
                return substr($s, $p);
            }
        }
        if (preg_match('/\{\s*"questions"\s*:/i', $s, $m, PREG_OFFSET_CAPTURE)) {
            $p = (int) $m[0][1];
            if ($p > 0) {
                return substr($s, $p);
            }
        }

        return $s;
    }

    /**
     * Strip ```json fences and extract first balanced JSON object or array from mixed text.
     */
    private static function stripMarkdownFences(string $content): string
    {
        $content = trim($content);
        if (preg_match('/```(?:json)?\s*([\s\S]*?)```/i', $content, $m)) {
            return trim($m[1]);
        }

        return $content;
    }

    /**
     * Find first complete JSON value (object or array) using bracket matching (string-aware).
     */
    private static function extractFirstJsonSubstring(string $text): ?string
    {
        $text = trim($text);
        $len = strlen($text);
        $start = null;
        for ($i = 0; $i < $len; $i++) {
            $c = $text[$i];
            if ($c === '{' || $c === '[') {
                $start = $i;
                break;
            }
        }
        if ($start === null) {
            return null;
        }

        $stack = [];
        $inString = false;
        $escape = false;
        for ($i = $start; $i < $len; $i++) {
            $c = $text[$i];
            if ($inString) {
                if ($escape) {
                    $escape = false;
                } elseif ($c === '\\') {
                    $escape = true;
                } elseif ($c === '"') {
                    $inString = false;
                }

                continue;
            }
            if ($c === '"') {
                $inString = true;
                continue;
            }
            if ($c === '{') {
                $stack[] = '}';
            } elseif ($c === '[') {
                $stack[] = ']';
            } elseif ($c === '}' || $c === ']') {
                if ($stack === []) {
                    return null;
                }
                $expected = array_pop($stack);
                if ($expected !== $c) {
                    return null;
                }
                if ($stack === []) {
                    return substr($text, $start, $i - $start + 1);
                }
            }
        }

        return null;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function coerceDecodedToQuestionList(array $decoded): array
    {
        if (isset($decoded['questions']) && is_array($decoded['questions'])) {
            return $decoded['questions'];
        }
        if ($decoded === []) {
            return [];
        }
        $isList = function_exists('array_is_list')
            ? array_is_list($decoded)
            : (array_keys($decoded) === range(0, count($decoded) - 1));
        if ($isList) {
            return $decoded;
        }
        if (isset($decoded['question']) || isset($decoded['answer'])) {
            return [$decoded];
        }

        throw new Exception('JSON has no "questions" array and no question objects.');
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function parseAssistantContentToQuestions(string $content): array
    {
        $content = self::sanitizeJsonCandidate($content);
        $content = self::normalizeJsonLikeQuotes($content);
        $content = self::stripMarkdownFences($content);
        $content = self::normalizeJsonLikeQuotes(self::sanitizeJsonCandidate($content));
        $content = self::cutToJsonObjectStart($content);

        $tryDecode = static function (string $s): ?array {
            $s = self::normalizeJsonLikeQuotes(self::sanitizeJsonCandidate($s));
            $d = self::jsonDecodeLenient($s);
            if ($d !== null) {
                return $d;
            }
            $repaired = self::tryRepairTruncatedJson($s);
            if ($repaired !== $s) {
                $d = self::jsonDecodeLenient($repaired);
                if ($d !== null) {
                    return $d;
                }
            }
            $fixed = preg_replace('/,\s*([\]}])/', '$1', $s);
            if ($fixed !== $s) {
                $d = self::jsonDecodeLenient($fixed);
                if ($d !== null) {
                    return $d;
                }
            }
            $fixed2 = preg_replace('/,\s*$/', '', trim($s));
            if ($fixed2 !== $s) {
                $d = self::jsonDecodeLenient($fixed2);
                if ($d !== null) {
                    return $d;
                }
            }

            return null;
        };

        $candidates = [$content];
        $candidates[] = self::cutToJsonObjectStart(self::stripMarkdownFences($content));

        foreach (array_unique($candidates) as $candidate) {
            if ($candidate === '') {
                continue;
            }
            $decoded = $tryDecode($candidate);
            if ($decoded !== null) {
                try {
                    return self::coerceDecodedToQuestionList($decoded);
                } catch (Throwable $e) {
                    // try next
                }
            }
        }

        $slice = self::extractFirstJsonSubstring($content);
        if ($slice !== null) {
            $decoded = $tryDecode($slice);
            if ($decoded !== null) {
                try {
                    return self::coerceDecodedToQuestionList($decoded);
                } catch (Throwable $e) {
                }
            }
        }

        $len = strlen($content);
        $scan = min($len, 14000);
        $braceAttempts = 0;
        for ($i = 0; $i < $scan && $braceAttempts < 72; $i++) {
            if (($content[$i] ?? '') !== '{') {
                continue;
            }
            $braceAttempts++;
            $tail = substr($content, $i);
            $slice = self::extractFirstJsonSubstring($tail);
            if ($slice === null) {
                continue;
            }
            $decoded = $tryDecode($slice);
            if ($decoded === null) {
                continue;
            }
            try {
                return self::coerceDecodedToQuestionList($decoded);
            } catch (Throwable $e) {
                continue;
            }
        }

        if (preg_match('/\{[\s\S]*\}/', $content, $m)) {
            $decoded = $tryDecode($m[0]);
            if ($decoded !== null) {
                try {
                    return self::coerceDecodedToQuestionList($decoded);
                } catch (Throwable $e) {
                }
            }
        }

        $safeSnippet = substr(preg_replace('/\s+/', ' ', $content), 0, 500);
        $safeSnippet = preg_replace('/[^\x20-\x7E]/', '?', $safeSnippet);
        json_decode('{}');

        throw new Exception(
            'Model did not return parseable JSON. '
            . 'json_decode: ' . json_last_error_msg() . '. '
            . 'Snippet: ' . substr($safeSnippet, 0, 400)
        );
    }

    /**
     * @param list<array{title: string, content: string}> $slimTopics
     * @return list<array<string, mixed>>
     */
    private static function generateOneLevelCall(
        string $levelName,
        int $count,
        array $slimTopics,
        string $excerpt,
        int $maxTokens,
        int $batchOrdinal,
        string $apiKey,
        string $model,
        string $apiUrl
    ): array {
        $topicTitles = [];
        foreach ($slimTopics as $t) {
            if (!is_array($t)) {
                continue;
            }
            $topicTitles[] = '- ' . ($t['title'] ?? 'Topic');
        }
        $topicBlock = $topicTitles !== [] ? implode("\n", $topicTitles) : '- (see SOURCE)';

        $system = 'Return ONE JSON object: {"questions":[...]} with exactly ' . $count . ' items. '
            . 'Each item: cognitive_level "' . $levelName . '"; fields question, type (multiple_choice|identification|problem_solving), '
            . 'difficulty (easy|medium|hard), choices (array; 4 strings for multiple_choice else []), answer, topic_title, feedback. '
            . 'Ground every question in SOURCE only (its terms, numbers, examples). No PDF/file metadata. No "unknown" answers.';

        $user = "BATCH " . ($batchOrdinal + 1) . "\nLEVEL {$levelName}\nCOUNT {$count}\nHEADINGS:\n{$topicBlock}\nSOURCE:\n{$excerpt}";
        $user = quiz_gen_truncateUtf8($user, 2200);

        $flags = JSON_UNESCAPED_UNICODE;
        if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
            $flags |= JSON_INVALID_UTF8_SUBSTITUTE;
        }

        $completionTokens = max(self::JSON_MODE_MIN_COMPLETION_TOKENS, min(self::MAX_OUTPUT_TOKENS_CAP, $maxTokens));

        $basePayload = [
            'model' => $model,
            'temperature' => 0.2,
            'max_tokens' => $completionTokens,
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => $user],
            ],
        ];

        $raw = self::curlGroqRespectingRateLimits($apiUrl, $apiKey, $basePayload, $flags);
        $code = $raw['code'];
        $body = $raw['body'];
        $bodyStr = is_string($body) ? $body : '';

        if (($code === 400 || $code === 422)
            && is_string($raw['body'])
            && (stripos($bodyStr, 'response_format') !== false || stripos($bodyStr, 'json_object') !== false)
            && !self::isGroqJsonValidateFailed($bodyStr)) {
            unset($basePayload['response_format']);
            $basePayload['max_tokens'] = max(512, min(self::MAX_OUTPUT_TOKENS_CAP, (int) $basePayload['max_tokens']));
            $raw = self::curlGroqRespectingRateLimits($apiUrl, $apiKey, $basePayload, $flags);
            $code = $raw['code'];
            $body = $raw['body'];
            $bodyStr = is_string($body) ? $body : '';
        }

        if ($code === 400 && self::isGroqJsonValidateFailed($bodyStr)) {
            $bump = $basePayload;
            $bump['max_tokens'] = min(2048, max((int) $completionTokens, 1200));
            $raw = self::curlGroqRespectingRateLimits($apiUrl, $apiKey, $bump, $flags);
            $code = $raw['code'];
            $body = $raw['body'];
            $bodyStr = is_string($body) ? $body : '';
        }

        if (($code === 400 && self::isGroqJsonValidateFailed($bodyStr)) || ($code === 400 && stripos($bodyStr, 'max completion tokens') !== false)) {
            $loose = $basePayload;
            unset($loose['response_format']);
            $loose['max_tokens'] = min(1536, max(900, (int) $completionTokens));
            $raw = self::curlGroqRespectingRateLimits($apiUrl, $apiKey, $loose, $flags);
            $code = $raw['code'];
            $body = $raw['body'];
            $bodyStr = is_string($body) ? $body : '';
        }

        $isRate = self::isGroqRateLimited($code, $bodyStr);
        $isJsonValErr = self::isGroqJsonValidateFailed($bodyStr);
        $isContextTooLarge = !$isRate && !$isJsonValErr && (
            $code === 413
            || stripos($bodyStr, 'Request too large') !== false
            || stripos($bodyStr, 'context_length') !== false
            || (stripos($bodyStr, 'too large') !== false && stripos($bodyStr, 'token') !== false && stripos($bodyStr, 'completion') === false)
        );
        if ($isContextTooLarge) {
            $payloadLite = $basePayload;
            $payloadLite['max_tokens'] = min((int) $payloadLite['max_tokens'], 512);
            if (isset($payloadLite['response_format'])) {
                unset($payloadLite['response_format']);
            }
            $raw2 = self::curlGroqRespectingRateLimits($apiUrl, $apiKey, $payloadLite, $flags);
            $code = $raw2['code'];
            $body = $raw2['body'];
            $bodyStr = is_string($body) ? $body : '';
        }

        if ($body === false || $body === '') {
            throw new Exception('Groq request failed (empty body).');
        }
        if (self::isGroqRateLimited($code, $bodyStr)) {
            throw new Exception(
                'Groq rate limit (TPM): ' . substr($bodyStr, 0, 500)
                . ' If this persists, generate fewer questions at once or wait a minute.'
            );
        }
        if (($code === 413)
            || (stripos($bodyStr, 'Request too large') !== false)) {
            throw new Exception('Groq request too large: ' . substr($bodyStr, 0, 400));
        }
        if ($code < 200 || $code >= 300) {
            throw new Exception('Groq HTTP ' . $code . ': ' . substr($bodyStr, 0, 500));
        }

        $decoded = json_decode((string) $body, true);
        if (!is_array($decoded)) {
            throw new Exception('Invalid Groq response JSON.');
        }
        $content = self::normalizeGroqMessageContent($decoded['choices'][0]['message']['content'] ?? '');
        if ($content === '') {
            throw new Exception('Empty Groq message content.');
        }

        try {
            return self::parseAssistantContentToQuestions($content);
        } catch (Throwable $parseErr) {
            $retry = $basePayload;
            unset($retry['response_format']);
            $retry['max_tokens'] = min(1536, max(1024, (int) $completionTokens));
            $raw2 = self::curlGroqRespectingRateLimits($apiUrl, $apiKey, $retry, $flags);
            $body2 = $raw2['body'];
            $code2 = $raw2['code'];
            $bodyStr2 = is_string($body2) ? $body2 : '';
            if ($body2 === false || $body2 === '' || $code2 < 200 || $code2 >= 300
                || self::isGroqRateLimited($code2, $bodyStr2)
                || (($code2 === 413) && stripos($bodyStr2, 'Rate limit') === false)
                || (stripos($bodyStr2, 'Request too large') !== false)) {
                throw $parseErr;
            }
            $decoded2 = json_decode((string) $body2, true);
            if (!is_array($decoded2)) {
                throw $parseErr;
            }
            $content2 = self::normalizeGroqMessageContent($decoded2['choices'][0]['message']['content'] ?? '');
            if ($content2 === '') {
                throw $parseErr;
            }

            return self::parseAssistantContentToQuestions($content2);
        }
    }

    private static function isGroqJsonValidateFailed(string $body): bool
    {
        $b = strtolower($body);
        if (strpos($b, 'json_validate') !== false) {
            return true;
        }
        if (strpos($b, 'failed_generation') !== false) {
            return true;
        }
        if (strpos($b, 'valid document') !== false && strpos($b, 'json') !== false) {
            return true;
        }

        return false;
    }

    private static function isGroqRateLimited(int $code, string $body): bool
    {
        if ($code === 429) {
            return true;
        }
        $b = strtolower($body);
        if (strpos($b, 'rate_limit_exceeded') !== false) {
            return true;
        }
        if (strpos($b, 'rate limit reached') !== false) {
            return true;
        }
        if (strpos($b, 'tokens per minute') !== false && strpos($b, 'limit') !== false) {
            return true;
        }

        return false;
    }

    private static function parseGroqRetryAfterSeconds(string $body): float
    {
        if (preg_match('/try again in\s*([0-9]+(?:\.[0-9]+)?)\s*s/i', $body, $m)) {
            return max(0.1, (float) $m[1]);
        }
        if (preg_match('/retry[_\s-]*after[:\s]+([0-9]+)/i', $body, $m)) {
            return max(0.1, (float) $m[1]);
        }

        return 0.0;
    }

    /**
     * Retry when Groq returns TPM / rate limits (sleeps using server hint when present).
     *
     * @return array{code: int, body: string|false}
     */
    private static function curlGroqRespectingRateLimits(
        string $apiUrl,
        string $apiKey,
        array $payload,
        int $jsonFlags
    ): array {
        $last = ['code' => 0, 'body' => false];
        for ($i = 0; $i < self::RATE_LIMIT_MAX_ATTEMPTS; $i++) {
            $last = self::curlGroq($apiUrl, $apiKey, $payload, $jsonFlags);
            $code = $last['code'];
            $bodyStr = is_string($last['body']) ? $last['body'] : '';
            if (!self::isGroqRateLimited($code, $bodyStr)) {
                return $last;
            }
            $wait = self::parseGroqRetryAfterSeconds($bodyStr);
            if ($wait <= 0) {
                $wait = min(5.0 + $i * 0.75, 55.0);
            } else {
                $wait += 0.35;
            }
            usleep((int) round($wait * 1_000_000));
        }

        return $last;
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{code: int, body: string|false}
     */
    private static function curlGroq(string $apiUrl, string $apiKey, array $payload, int $jsonFlags): array
    {
        $ch = curl_init($apiUrl);
        $encoded = json_encode($payload, $jsonFlags);
        if ($encoded === false) {
            throw new Exception('Failed to build Groq request JSON: ' . json_last_error_msg());
        }
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
            CURLOPT_POSTFIELDS => $encoded,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => self::TIMEOUT,
            CURLOPT_ENCODING => '',
        ]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ['code' => $code, 'body' => is_string($body) ? $body : false];
    }

    /**
     * Drop items that look like PDF/metadata trivia (model fallback when SOURCE looked like metadata).
     */
    private static function looksLikePdfMetadataQuizItem(array $row): bool
    {
        $q = (string) ($row['question'] ?? '');
        $a = strtolower(trim((string) ($row['answer'] ?? '')));
        if ($a === 'unknown' || $a === 'n/a' || $a === 'not applicable') {
            return true;
        }
        if (preg_match('/\b(pdf\b|metadata|en-ph\b|xmp\b|file format|document properties|adobe\b|'
            . 'language of the (pdf|file|document)|primary purpose of (a )?pdf)\b/i', $q)) {
            return true;
        }
        if (preg_match('/significance of[^\n]{0,40}en-PH/i', $q)) {
            return true;
        }
        if (preg_match('/\b(primary goal|overall goal|main goal)\b.*\b(curriculum|senior high|philippine|deped|k\s*-?\s*12)\b/i', $q)) {
            return true;
        }

        return false;
    }

    /**
     * @param list<array<string, mixed>> $questions
     * @return list<array<string, mixed>>
     */
    private static function normalizeQuestions(array $questions): array
    {
        $out = [];
        $seenQuestions = [];
        foreach ($questions as $q) {
            if (!is_array($q)) {
                continue;
            }
            $type = $q['type'] ?? 'identification';
            if (!in_array($type, ['multiple_choice', 'identification', 'problem_solving'], true)) {
                $type = 'identification';
            }
            $diff = $q['difficulty'] ?? 'medium';
            if (!in_array($diff, ['easy', 'medium', 'hard'], true)) {
                $diff = 'medium';
            }
            $choices = $q['choices'] ?? [];
            if (!is_array($choices)) {
                $choices = [];
            }
            $choices = array_values(array_map('strval', $choices));
            if ($type === 'multiple_choice' && count($choices) < 4) {
                while (count($choices) < 4) {
                    $choices[] = 'Option ' . chr(65 + count($choices));
                }
            }
            $qtext = trim((string) ($q['question'] ?? ''));
            $normKey = strtolower(preg_replace('/\s+/', ' ', $qtext));
            if ($normKey !== '' && isset($seenQuestions[$normKey])) {
                continue;
            }
            if ($normKey !== '') {
                $seenQuestions[$normKey] = true;
            }

            $out[] = [
                'question' => $qtext,
                'type' => $type,
                'cognitive_level' => strtolower((string) ($q['cognitive_level'] ?? 'remembering')),
                'difficulty' => $diff,
                'choices' => $choices,
                'answer' => trim((string) ($q['answer'] ?? '')),
                'topic_title' => trim((string) ($q['topic_title'] ?? '')),
                'feedback' => trim((string) ($q['feedback'] ?? '')),
            ];
        }

        return array_values(array_filter($out, static function ($row) {
            if ($row['question'] === '' || $row['answer'] === '') {
                return false;
            }

            return !self::looksLikePdfMetadataQuizItem($row);
        }));
    }
}
