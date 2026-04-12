<?php

declare(strict_types=1);

final class QuizGen_Grader
{
    /**
     * @param array<string, mixed> $q
     * @return array{ok: bool, feedback: string}
     */
    public static function grade(array $q, string $studentAnswer): array
    {
        $type = $q['type'] ?? 'identification';
        $correct = trim((string) ($q['answer'] ?? ''));
        $given = trim($studentAnswer);

        if ($correct === '') {
            return ['ok' => false, 'feedback' => 'No reference answer stored for this item.'];
        }

        if ($type === 'multiple_choice') {
            $ok = self::answersLooselyMatch($given, $correct)
                || self::letterMatch($given, $correct, $q['choices'] ?? []);
            return [
                'ok' => $ok,
                'feedback' => $ok ? ($q['feedback'] ?? 'Correct.') : ($q['feedback'] ? 'Review: ' . $q['feedback'] : 'Incorrect.'),
            ];
        }

        if ($type === 'problem_solving') {
            $ok = self::answersLooselyMatch($given, $correct);
            return [
                'ok' => $ok,
                'feedback' => $ok ? ($q['feedback'] ?? 'Correct.') : ($q['feedback'] ? 'Hint: ' . $q['feedback'] : 'Incorrect.'),
            ];
        }

        $ok = self::answersLooselyMatch($given, $correct);
        return [
            'ok' => $ok,
            'feedback' => $ok ? ($q['feedback'] ?? 'Correct.') : ($q['feedback'] ?? 'Incorrect.'),
        ];
    }

    /**
     * Text equality ignoring case/spaces, plus numeric tolerance for $, commas, parentheses, etc.
     */
    private static function answersLooselyMatch(string $given, string $correct): bool
    {
        if (self::norm($given) === self::norm($correct)) {
            return true;
        }
        $g = self::parseFlexibleNumber($given);
        $c = self::parseFlexibleNumber($correct);
        if ($g !== null && $c !== null) {
            return self::floatsNearlyEqual($g, $c);
        }
        // Same text after stripping common decorative symbols (not commas inside words)
        if (self::norm(self::stripAnswerDecorations($given)) === self::norm(self::stripAnswerDecorations($correct))) {
            return true;
        }

        return false;
    }

    private static function norm(string $s): string
    {
        $s = mb_strtolower($s);
        $s = preg_replace('/\s+/', ' ', $s) ?? $s;

        return trim($s);
    }

    /**
     * Remove currency, outer parentheses, and thousands commas for comparison (keeps inner text structure).
     */
    private static function stripAnswerDecorations(string $s): string
    {
        $s = trim($s);
        $s = str_replace(['$', '€', '£', '¥'], '', $s);
        $s = trim($s);
        if (preg_match('/^\((.+)\)$/su', $s, $m)) {
            $s = trim($m[1]);
        }
        // Thousands separators: 5,637.08 → 5637.08 when clearly numeric-like
        if (preg_match('/^-?[\d,.\s]+$/', str_replace(['$', '€', '£', '¥', '(', ')'], '', $s))) {
            $s = str_replace(',', '', preg_replace('/\s+/', '', $s));
        }

        return trim($s);
    }

    /**
     * Parse a number from strings like "$5,637.08", "(5,637.08)", " 5637.08 ".
     */
    private static function parseFlexibleNumber(string $s): ?float
    {
        $t = trim($s);
        if ($t === '') {
            return null;
        }
        $t = str_replace(['$', '€', '£', '¥'], '', $t);
        $t = trim($t);
        if (preg_match('/^\((.+)\)$/su', $t, $m)) {
            $t = trim($m[1]);
        }
        $t = preg_replace('/\s+/', '', $t);
        $t = str_replace(',', '', $t);
        if ($t === '' || !is_numeric($t)) {
            return null;
        }

        return (float) $t;
    }

    private static function floatsNearlyEqual(float $a, float $b): bool
    {
        return abs($a - $b) < 0.0001 + 1e-9 * max(1.0, abs($b));
    }

    /**
     * @param list<string> $choices
     */
    private static function letterMatch(string $given, string $correct, array $choices): bool
    {
        if (!preg_match('/^[a-dA-D]$/', trim($given))) {
            return false;
        }
        $idx = ord(strtolower($given)) - ord('a');
        if (!isset($choices[$idx])) {
            return false;
        }

        return self::answersLooselyMatch((string) $choices[$idx], $correct);
    }
}
