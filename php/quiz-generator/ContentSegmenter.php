<?php

declare(strict_types=1);

/**
 * Segment flat PDF text into topic blocks using headings, keywords, and paragraphs.
 */
final class QuizGen_ContentSegmenter
{
    private static function subStr(string $s, int $start, int $length): string
    {
        if (function_exists('mb_substr')) {
            return (string) mb_substr($s, $start, $length, 'UTF-8');
        }

        return substr($s, $start, $length);
    }

    private const MATH_KEYWORDS = [
        'function', 'equation', 'formula', 'graph', 'domain', 'range', 'theorem', 'definition',
        'linear', 'quadratic', 'polynomial', 'rational', 'exponent', 'logarithm', 'derivative',
        'integral', 'matrix', 'probability', 'statistics', 'geometry', 'triangle', 'circle',
        'interest', 'proportion', 'ratio', 'fraction', 'inequality', 'solve', 'variable',
    ];

    /**
     * @return list<array{title: string, content: string}>
     */
    public static function segment(string $text, int $maxTopics = 24): array
    {
        $text = preg_replace("/\r\n?/", "\n", $text);
        $text = trim(preg_replace('/[ \t]+/', ' ', $text) ?? '');
        $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? '';

        $lines = preg_split("/\n/", $text) ?: [];
        $blocks = [];
        $currentTitle = 'Introduction';
        $buffer = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }
            if (self::isLikelyHeading($line)) {
                if ($buffer !== []) {
                    $blocks[] = ['title' => $currentTitle, 'content' => trim(implode("\n", $buffer))];
                }
                $currentTitle = self::cleanTitle($line);
                $buffer = [];
                continue;
            }
            $buffer[] = $line;
        }
        if ($buffer !== []) {
            $blocks[] = ['title' => $currentTitle, 'content' => trim(implode("\n", $buffer))];
        }

        if (count($blocks) <= 1 && strlen($text) > 400) {
            $blocks = self::segmentByParagraphs($text);
        }

        $out = [];
        foreach ($blocks as $b) {
            $c = trim($b['content']);
            if (strlen($c) < 40) {
                continue;
            }
            $out[] = [
                'title' => self::subStr($b['title'], 0, 120),
                'content' => $c,
            ];
            if (count($out) >= $maxTopics) {
                break;
            }
        }

        if ($out === []) {
            $out[] = [
                'title' => 'Document',
                'content' => self::subStr($text, 0, 12000),
            ];
        }

        return $out;
    }

    private static function isLikelyHeading(string $line): bool
    {
        if (strlen($line) > 120) {
            return false;
        }
        if (preg_match('/^(chapter|section|lesson|unit|part)\s+[0-9ivx]+[.\s]/i', $line)) {
            return true;
        }
        if (preg_match('/^[0-9]+[.)]\s+\S/', $line)) {
            return true;
        }
        if ($line === strtoupper($line) && strlen($line) > 3 && strlen($line) < 80) {
            return true;
        }
        if (preg_match('/^[A-Z][^.!?]{2,60}$/', $line) && substr_count($line, ' ') <= 8) {
            return true;
        }
        return false;
    }

    private static function cleanTitle(string $line): string
    {
        $line = preg_replace('/^[0-9]+[.)]\s+/', '', $line) ?? $line;
        return trim($line);
    }

    /**
     * @return list<array{title: string, content: string}>
     */
    private static function segmentByParagraphs(string $text): array
    {
        $parts = preg_split("/\n\s*\n/", $text) ?: [];
        $topics = [];
        $i = 1;
        foreach ($parts as $p) {
            $p = trim($p);
            if (strlen($p) < 80) {
                continue;
            }
            $snippet = self::subStr($p, 0, 200);
            $title = 'Topic ' . $i;
            foreach (self::MATH_KEYWORDS as $kw) {
                if (stripos($snippet, $kw) !== false) {
                    $title = ucfirst($kw) . ' (segment ' . $i . ')';
                    break;
                }
            }
            $topics[] = [
                'title' => $title,
                'content' => $p,
            ];
            $i++;
            if ($i > 20) {
                break;
            }
        }
        return $topics;
    }
}
