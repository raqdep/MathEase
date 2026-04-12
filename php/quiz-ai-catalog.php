<?php
/**
 * Lesson URLs (relative to /quiz/*.html → ../topics/) for AI quiz analysis.
 * Keys must match what quiz-ai-assistant asks the model to output.
 */
function quiz_ai_lesson_catalog(string $quizType): array
{
    $base = [
        'functions' => [
            ['key' => 'functions_intro', 'en' => 'Introduction to Functions', 'fil' => 'Mga Batayan ng Function', 'url' => '../topics/functions.html'],
            ['key' => 'evaluating', 'en' => 'Evaluating Functions', 'fil' => 'Pag-evaluate ng Function', 'url' => '../topics/evaluating-functions.html'],
            ['key' => 'operations', 'en' => 'Operations on Functions', 'fil' => 'Operasyon sa Functions', 'url' => '../topics/operations-on-functions.html'],
            ['key' => 'one_to_one', 'en' => 'One-to-One Functions', 'fil' => 'One-to-One na Function', 'url' => '../topics/one-to-one-functions.html'],
        ],
        'one-to-one-functions' => [
            ['key' => 'one_to_one', 'en' => 'One-to-One Functions', 'fil' => 'One-to-One na Function', 'url' => '../topics/one-to-one-functions.html'],
            ['key' => 'functions_intro', 'en' => 'Functions (review)', 'fil' => 'Review: Function', 'url' => '../topics/functions.html'],
        ],
        'evaluating-functions' => [
            ['key' => 'evaluating', 'en' => 'Evaluating Functions', 'fil' => 'Pag-evaluate ng Function', 'url' => '../topics/evaluating-functions.html'],
            ['key' => 'functions_intro', 'en' => 'Introduction to Functions', 'fil' => 'Mga Batayan ng Function', 'url' => '../topics/functions.html'],
        ],
        'operations-on-functions' => [
            ['key' => 'operations', 'en' => 'Operations on Functions', 'fil' => 'Operasyon sa Functions', 'url' => '../topics/operations-on-functions.html'],
            ['key' => 'evaluating', 'en' => 'Evaluating Functions', 'fil' => 'Pag-evaluate ng Function', 'url' => '../topics/evaluating-functions.html'],
            ['key' => 'functions_intro', 'en' => 'Introduction to Functions', 'fil' => 'Mga Batayan ng Function', 'url' => '../topics/functions.html'],
        ],
        'domain-range-rational-functions' => [
            ['key' => 'domain_range_rational', 'en' => 'Domain & Range (Rational)', 'fil' => 'Domain at Range (Rational)', 'url' => '../topics/domain-range-rational-functions.html'],
            ['key' => 'rational_functions', 'en' => 'Rational Functions', 'fil' => 'Rational Functions', 'url' => '../topics/rational-functions.html'],
        ],
        'domain-range-inverse-functions' => [
            ['key' => 'domain_range_inverse', 'en' => 'Domain & Range (Inverse)', 'fil' => 'Domain at Range (Inverse)', 'url' => '../topics/domain-range-inverse-functions.html'],
            ['key' => 'one_to_one', 'en' => 'One-to-One & Inverses', 'fil' => 'One-to-One at Inverse', 'url' => '../topics/one-to-one-functions.html'],
        ],
        'rational-functions' => [
            ['key' => 'rational_functions', 'en' => 'Rational Functions', 'fil' => 'Rational Functions', 'url' => '../topics/rational-functions.html'],
            ['key' => 'domain_range_rational', 'en' => 'Domain & Range (Rational)', 'fil' => 'Domain at Range', 'url' => '../topics/domain-range-rational-functions.html'],
        ],
        'solving-rational-equations-inequalities' => [
            ['key' => 'solving_rational', 'en' => 'Solving Rational Equations & Inequalities', 'fil' => 'Rational Equations at Inequalities', 'url' => '../topics/solving-rational-equations-inequalities.html'],
            ['key' => 'rational_functions', 'en' => 'Rational Functions (review)', 'fil' => 'Review: Rational Functions', 'url' => '../topics/rational-functions.html'],
        ],
        'representations-of-rational-functions' => [
            ['key' => 'representations', 'en' => 'Representations of Rational Functions', 'fil' => 'Mga Representasyon ng Rational Function', 'url' => '../topics/representations-of-rational-functions.html'],
            ['key' => 'rational_functions', 'en' => 'Rational Functions', 'fil' => 'Rational Functions', 'url' => '../topics/rational-functions.html'],
        ],
        'real-life-problems' => [
            ['key' => 'real_life', 'en' => 'Solving Real-Life Problems', 'fil' => 'Real-Life Problems', 'url' => '../topics/solving-real-life-problems.html'],
            ['key' => 'compound_interest', 'en' => 'Compound Interest', 'fil' => 'Compound Interest', 'url' => '../topics/compound-interest.html'],
            ['key' => 'simple_interest', 'en' => 'Simple Interest', 'fil' => 'Simple Interest', 'url' => '../topics/simple-interest.html'],
        ],
    ];

    return $base[$quizType] ?? $base['functions'];
}

/**
 * External study links: require https (recommended resources only).
 */
function quiz_ai_is_allowed_external_url(string $url): bool
{
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return false;
    }
    if (!preg_match('#^https://#i', $url)) {
        return false;
    }
    $host = (string) parse_url($url, PHP_URL_HOST);
    if ($host === '' || stripos($host, 'localhost') !== false) {
        return false;
    }

    return true;
}

/**
 * @param array<int, array<string, mixed>> $weaknesses
 * @return array<int, array<string, string>>
 */
function quiz_ai_resolve_lesson_keys(string $quizType, array $weaknesses): array
{
    $catalog = quiz_ai_lesson_catalog($quizType);
    $byKey = [];
    foreach ($catalog as $row) {
        $byKey[$row['key']] = $row;
    }
    $out = [];
    foreach ($weaknesses as $w) {
        if (!is_array($w)) {
            continue;
        }
        $key = (string) ($w['lesson_key'] ?? '');
        if ($key !== '' && isset($byKey[$key])) {
            $row = $byKey[$key];
        } else {
            $row = $catalog[0];
        }
        $out[] = array_merge($w, [
            'lesson_url' => $row['url'],
            'lesson_label_en' => $row['en'],
            'lesson_label_fil' => $row['fil'],
            'resolved_lesson_key' => $row['key'],
        ]);
    }

    return $out;
}
