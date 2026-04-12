<?php

declare(strict_types=1);

require_once __DIR__ . '/builtin-lesson-catalog-data.php';

function quiz_gen_compress_ws(string $s): string
{
    $s = trim($s);
    $s = preg_replace('/\s+/', ' ', $s);

    return $s ?? '';
}

/**
 * Same DOM extraction strategy as php/flashcards.php extractLessonContextFromTopicHtml.
 *
 * @return array{objective: string, example: string, reference: string, error?: string}
 */
function quiz_gen_extract_lesson_nodes_from_topic_html(string $topicFilePath, int $lessonNum): array
{
    if (!file_exists($topicFilePath)) {
        return ['objective' => '', 'example' => '', 'reference' => '', 'error' => 'Topic file not found'];
    }

    $html = file_get_contents($topicFilePath);
    if ($html === false) {
        return ['objective' => '', 'example' => '', 'reference' => '', 'error' => 'Failed to read topic file'];
    }

    if (!class_exists('DOMDocument') || !class_exists('DOMXPath')) {
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
        $out[$key] = $node ? quiz_gen_compress_ws($node->textContent) : '';
    }

    return $out;
}

/**
 * @return array{ok: bool, text: string, message: string}
 */
function quiz_gen_text_from_builtin_lesson(string $slug, int $lessonIndex1): array
{
    $modules = quiz_gen_builtin_modules();
    $cfg = $modules[$slug] ?? null;
    if ($cfg === null) {
        return ['ok' => false, 'text' => '', 'message' => 'Unknown lesson module.'];
    }

    $n = count($cfg['topics']);
    if ($lessonIndex1 < 1 || $lessonIndex1 > $n) {
        return ['ok' => false, 'text' => '', 'message' => 'Invalid topic index for this lesson.'];
    }

    $root = dirname(__DIR__, 2);
    $path = $root . DIRECTORY_SEPARATOR . 'topics' . DIRECTORY_SEPARATOR . $cfg['file'];
    $ctx = quiz_gen_extract_lesson_nodes_from_topic_html($path, $lessonIndex1);

    $parts = [];
    if (($ctx['objective'] ?? '') !== '') {
        $parts[] = 'Objective / concepts: ' . $ctx['objective'];
    }
    if (($ctx['example'] ?? '') !== '') {
        $parts[] = 'Examples: ' . $ctx['example'];
    }
    if (($ctx['reference'] ?? '') !== '') {
        $parts[] = 'Reference / practice: ' . $ctx['reference'];
    }

    $label = $cfg['topics'][$lessonIndex1 - 1] ?? ('Topic ' . $lessonIndex1);
    $header = 'Lesson: ' . $cfg['lessonTitle'] . "\nTopic: " . $label . "\n\n";
    $text = $header . implode("\n\n", $parts);

    if (isset($ctx['error']) && $ctx['error'] !== '' && trim(implode('', $parts)) === '') {
        return ['ok' => false, 'text' => '', 'message' => $ctx['error']];
    }

    if (strlen(trim($text)) < 80) {
        return [
            'ok' => false,
            'text' => '',
            'message' => 'Not enough text in this topic section. Try another topic or use a PDF / your created lesson.',
        ];
    }

    return ['ok' => true, 'text' => $text, 'message' => ''];
}

function quiz_gen_html_to_plain_for_quiz(string $html): string
{
    $html = preg_replace('/<script\b[^>]*>[\s\S]*?<\/script>/i', '', $html) ?? '';
    $html = preg_replace('/<style\b[^>]*>[\s\S]*?<\/style>/i', '', $html) ?? '';
    $t = strip_tags($html);
    $t = html_entity_decode($t, ENT_QUOTES | ENT_HTML5, 'UTF-8');

    return quiz_gen_compress_ws($t);
}
