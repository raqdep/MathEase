<?php

declare(strict_types=1);

function quiz_gen_json_encode(mixed $data): string
{
    $f = JSON_UNESCAPED_UNICODE;
    if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
        $f |= JSON_INVALID_UTF8_SUBSTITUTE;
    }
    return json_encode($data, $f) ?: '{}';
}

function quiz_gen_json(array $payload, int $httpCode = 200): void
{
    if (ob_get_level()) {
        @ob_clean();
    }
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo quiz_gen_json_encode($payload);
    exit;
}

function quiz_gen_require_teacher(): int
{
    if (empty($_SESSION['teacher_id']) || ($_SESSION['user_type'] ?? '') !== 'teacher') {
        quiz_gen_json(['success' => false, 'message' => 'Teacher login required.'], 401);
    }
    return (int) $_SESSION['teacher_id'];
}

function quiz_gen_require_student(): int
{
    if (empty($_SESSION['user_id']) || ($_SESSION['user_type'] ?? '') === 'teacher') {
        quiz_gen_json(['success' => false, 'message' => 'Student login required.'], 401);
    }
    return (int) $_SESSION['user_id'];
}

function quiz_gen_groq_config(): array
{
    // Prefer a quiz-only key when set so it actually wins over GROQ_API_KEY (optional isolation / quotas).
    $key = getenv('GROQ_QUIZ_GENERATOR_API_KEY')
        ?: getenv('GROQ_API_KEY')
        ?: getenv('GROQ_LESSON_API_KEY');
    $url = getenv('GROQ_API_URL') ?: 'https://api.groq.com/openai/v1/chat/completions';
    $model = getenv('GROQ_MODEL')
        ?: getenv('GROQ_QUIZ_MODEL')
        ?: getenv('GROQ_LESSON_MODEL')
        ?: 'llama-3.1-8b-instant';
    return [$key, $model, $url];
}
