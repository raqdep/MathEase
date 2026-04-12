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
            $ok = self::norm($given) === self::norm($correct)
                || self::letterMatch($given, $correct, $q['choices'] ?? []);
            return [
                'ok' => $ok,
                'feedback' => $ok ? ($q['feedback'] ?? 'Correct.') : ($q['feedback'] ? 'Review: ' . $q['feedback'] : 'Incorrect.'),
            ];
        }

        if ($type === 'problem_solving') {
            $ok = self::numericOrTextMatch($given, $correct);
            return [
                'ok' => $ok,
                'feedback' => $ok ? ($q['feedback'] ?? 'Correct.') : ($q['feedback'] ? 'Hint: ' . $q['feedback'] : 'Incorrect.'),
            ];
        }

        $ok = self::norm($given) === self::norm($correct);
        return [
            'ok' => $ok,
            'feedback' => $ok ? ($q['feedback'] ?? 'Correct.') : ($q['feedback'] ?? 'Incorrect.'),
        ];
    }

    private static function norm(string $s): string
    {
        $s = mb_strtolower($s);
        $s = preg_replace('/\s+/', ' ', $s) ?? $s;
        return trim($s);
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
        return self::norm((string) $choices[$idx]) === self::norm($correct);
    }

    private static function numericOrTextMatch(string $given, string $correct): bool
    {
        if (self::norm($given) === self::norm($correct)) {
            return true;
        }
        if (is_numeric(str_replace(',', '', $given)) && is_numeric(str_replace(',', '', $correct))) {
            $a = (float) str_replace(',', '', $given);
            $b = (float) str_replace(',', '', $correct);
            return abs($a - $b) < 0.0001 + 1e-9 * max(1.0, abs($b));
        }
        return false;
    }
}
