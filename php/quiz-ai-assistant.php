<?php
/**
 * Quiz AI Assistant - Analyzes quiz results and provides motivation
 * Uses Groq API with llama-3.1-8b-instant model
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Start output buffering
ob_start();

// Set JSON header
if (!headers_sent()) {
    header('Content-Type: application/json');
}

// Start session
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Require config
try {
    require_once 'config.php';
    require_once 'load-env.php';
    require_once __DIR__ . '/quiz-ai-catalog.php';
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Configuration error: ' . $e->getMessage()
    ]);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    ob_clean();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Load environment variables (API key should be in .env file)
require_once __DIR__ . '/load-env.php';

// Support multiple configured key names used across this project
$GROQ_API_KEY = getenv('GROQ_API_KEY')
    ?: getenv('GROQ_PERF_API_KEY')
    ?: getenv('GROQ_LESSON_API_KEY');
$GROQ_API_URL = getenv('GROQ_API_URL') ?: 'https://api.groq.com/openai/v1/chat/completions';
$GROQ_MODEL = 'llama-3.1-8b-instant';

if (empty($GROQ_API_KEY)) {
    ob_clean();
    echo json_encode([
        'success' => false,
        'code' => 'AI_UNAVAILABLE',
        'message' => 'AI analysis is temporarily unavailable. No Groq API key is configured (GROQ_API_KEY/GROQ_PERF_API_KEY/GROQ_LESSON_API_KEY).',
        'metrics' => null
    ]);
    exit;
}

try {
    // Get quiz results data from POST
    $quizData = json_decode(file_get_contents('php://input'), true);
    
    if (!$quizData) {
        throw new Exception('No quiz data provided');
    }
    
    $score = isset($quizData['score']) ? (int)$quizData['score'] : 0;
    $totalQuestions = isset($quizData['totalQuestions']) ? (int)$quizData['totalQuestions'] : 15;
    $correct = isset($quizData['correct']) ? (int)$quizData['correct'] : 0;
    $incorrect = isset($quizData['incorrect']) ? (int)$quizData['incorrect'] : 0;
    $percentage = isset($quizData['percentage']) ? (float)$quizData['percentage'] : 0;
    $timeTaken = isset($quizData['timeTaken']) ? $quizData['timeTaken'] : 'N/A';
    $mcCorrect = isset($quizData['mcCorrect']) ? (int)$quizData['mcCorrect'] : 0;
    $mcIncorrect = isset($quizData['mcIncorrect']) ? (int)$quizData['mcIncorrect'] : 0;
    $quizType = isset($quizData['quizType']) ? (string)$quizData['quizType'] : 'functions';
    
    // Get student info
    $user_id = $_SESSION['user_id'];
    $stmt = $pdo->prepare("SELECT first_name, last_name FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $studentInfo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$studentInfo) {
        throw new Exception('Student not found');
    }
    
    $studentName = $studentInfo['first_name'] . ' ' . $studentInfo['last_name'];
    
    // Calculate detailed metrics for better analysis
    $mcPercentage = $totalQuestions > 0 ? round(($mcCorrect / $totalQuestions) * 100, 1) : 0;
    $totalPoints = $totalQuestions; // 15 MC (1 point each)
    
    // Determine performance level
    $performanceLevel = '';
    if ($percentage >= 90) {
        $performanceLevel = 'Excellent';
    } elseif ($percentage >= 80) {
        $performanceLevel = 'Very Good';
    } elseif ($percentage >= 70) {
        $performanceLevel = 'Good';
    } elseif ($percentage >= 60) {
        $performanceLevel = 'Fair';
    } else {
        $performanceLevel = 'Needs Improvement';
    }
    
    $quizTypeLabels = [
        'functions' => 'Functions Quiz',
        'one-to-one-functions' => 'One-to-One Functions Quiz',
        'domain-range-rational-functions' => 'Domain and Range of Rational Functions Quiz',
        'domain-range-inverse-functions' => 'Domain and Range of Inverse Functions Quiz',
        'evaluating-functions' => 'Evaluating Functions Quiz',
        'operations-on-functions' => 'Operations on Functions Quiz',
        'real-life-problems' => 'Solving Real-Life Problems Quiz',
        'rational-functions' => 'Rational Functions Quiz',
        'solving-rational-equations-inequalities' => 'Solving Rational Equations and Inequalities Quiz',
        'representations-of-rational-functions' => 'Representations of Rational Functions Quiz'
    ];
    $quizLabel = $quizTypeLabels[$quizType] ?? 'Functions Quiz';

    $questionAnalysis = isset($quizData['questionAnalysis']) && is_array($quizData['questionAnalysis'])
        ? $quizData['questionAnalysis']
        : [];

    $wrongItems = [];
    $correctByConcept = [];
    foreach ($questionAnalysis as $qa) {
        if (!is_array($qa)) {
            continue;
        }
        $concept = trim((string) ($qa['concept'] ?? ''));
        $num = (int) ($qa['questionNumber'] ?? 0);
        if (!empty($qa['isCorrect'])) {
            if ($concept !== '') {
                $correctByConcept[$concept] = ($correctByConcept[$concept] ?? 0) + 1;
            }
        } else {
            $wrongItems[] = [
                'question' => $num,
                'concept' => $concept,
                'concept_detail' => (string) ($qa['conceptDetail'] ?? ''),
            ];
        }
    }

    $catalog = quiz_ai_lesson_catalog($quizType);
    $catalogLines = [];
    foreach ($catalog as $c) {
        $catalogLines[] = "- lesson_key \"{$c['key']}\" = {$c['en']} / {$c['fil']} (MathEase lesson file: {$c['url']})";
    }
    $catalogText = implode("\n", $catalogLines);

    $systemPrompt = "You are Cassy, a mathematics tutor for senior high school (Philippines). "
        . "Be warm and clear. Use Taglish or Filipino for parts that help the student feel understood (especially weaknesses and next steps), "
        . "but keep math terms accurate in English when standard. "
        . "You MUST base weaknesses on the WRONG-ITEM list when it is non-empty: name the skill (e.g. function, composition, domain) and cite question numbers. "
        . "Never invent question numbers. "
        . "Output must be a single JSON object only (no markdown outside JSON).";

    $wrongJson = json_encode($wrongItems, JSON_UNESCAPED_UNICODE);
    $correctJson = json_encode($correctByConcept, JSON_UNESCAPED_UNICODE);

    $userPrompt = "Quiz: {$quizLabel}\nStudent: {$studentName}\n"
        . "Performance: {$performanceLevel} — " . round($percentage, 1) . "%\n"
        . "Score: {$score}/{$totalPoints}, MC correct {$mcCorrect}/{$totalQuestions}, wrong count {$mcIncorrect}, time {$timeTaken}\n\n"
        . "ITEMS ANSWERED WRONG (use for SPECIFIC weak areas; empty array means perfect or no per-question data):\n{$wrongJson}\n\n"
        . "CORRECT ANSWERS BY CONCEPT (counts):\n{$correctJson}\n\n"
        . "ALLOWED lesson_key values — choose the best match for EACH weakness (copy key exactly):\n{$catalogText}\n\n"
        . "Also suggest 3–5 external_resources with title, https URL, and short note (Khan Academy, GeoGebra, Wikipedia math, etc.).\n\n"
        . "Return JSON with exactly these keys:\n"
        . '{"motivation":"string (2-4 sentences, greet ' . $studentName . ')","strengths":["string",...],'
        . '"weaknesses":[{"skill_en":"string","skill_fil":"string","evidence":"which Q numbers + concept","lesson_key":"one of allowed keys"}],'
        . '"external_resources":[{"title":"string","url":"https://...","note":"string"}],'
        . '"recommendations":["string",...],"next_steps":["string",...]}';

    $metrics = [
        'percentage' => round($percentage, 1),
        'mcPercentage' => $mcPercentage,
        'performanceLevel' => $performanceLevel,
        'mcCorrect' => $mcCorrect,
        'mcIncorrect' => $mcIncorrect
    ];

    $jsonFlags = JSON_UNESCAPED_UNICODE;
    if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
        $jsonFlags |= JSON_INVALID_UTF8_SUBSTITUTE;
    }

    $postData = [
        'model' => $GROQ_MODEL,
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt],
        ],
        'temperature' => 0.35,
        'max_tokens' => 3200,
        'response_format' => ['type' => 'json_object'],
    ];

    $ch = curl_init($GROQ_API_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($postData, $jsonFlags),
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
        throw new Exception('API request failed: ' . $curlError);
    }
    if ($httpCode !== 200) {
        $errorData = json_decode((string) $response, true);
        $errorMessage = isset($errorData['error']['message']) ? $errorData['error']['message'] : 'HTTP ' . $httpCode;
        throw new Exception('Groq API error: ' . $errorMessage);
    }

    $apiResponse = json_decode((string) $response, true);
    if (!isset($apiResponse['choices'][0]['message']['content'])) {
        throw new Exception('Invalid API response format');
    }

    $content = $apiResponse['choices'][0]['message']['content'];
    $struct = json_decode(is_string($content) ? $content : '', true);
    if (!is_array($struct)) {
        throw new Exception('AI returned non-JSON content.');
    }

    $weaknessesIn = isset($struct['weaknesses']) && is_array($struct['weaknesses']) ? $struct['weaknesses'] : [];
    $weaknessesOut = quiz_ai_resolve_lesson_keys($quizType, $weaknessesIn);

    $extOut = [];
    if (!empty($struct['external_resources']) && is_array($struct['external_resources'])) {
        foreach ($struct['external_resources'] as $er) {
            if (!is_array($er)) {
                continue;
            }
            $u = trim((string) ($er['url'] ?? ''));
            if ($u !== '' && quiz_ai_is_allowed_external_url($u)) {
                $extOut[] = [
                    'title' => (string) ($er['title'] ?? 'Resource'),
                    'url' => $u,
                    'note' => (string) ($er['note'] ?? ''),
                ];
            }
        }
    }

    $lines = [];
    $lines[] = 'MOTIVATION';
    $lines[] = (string) ($struct['motivation'] ?? '');
    $lines[] = '';
    $lines[] = 'STRENGTHS';
    foreach ($struct['strengths'] ?? [] as $s) {
        $lines[] = '- ' . (string) $s;
    }
    $lines[] = '';
    $lines[] = 'AREAS FOR IMPROVEMENT';
    foreach ($weaknessesOut as $w) {
        $en = (string) ($w['skill_en'] ?? '');
        $fil = (string) ($w['skill_fil'] ?? '');
        $ev = (string) ($w['evidence'] ?? '');
        $label = $fil !== '' ? $fil : $en;
        $url = (string) ($w['lesson_url'] ?? '');
        $lines[] = '- ' . $label . ($en !== '' && $fil !== '' ? " ({$en})" : '') . ' — ' . $ev;
        $lines[] = '  → Aralin sa MathEase: [' . trim((string) ($w['lesson_label_fil'] ?? $w['lesson_label_en'] ?? 'Open lesson')) . '](' . $url . ')';
    }
    if ($weaknessesOut === []) {
        $lines[] = '- Walang specific na maling konsepto na naitala; ituloy ang pagsasanay.';
    }
    $lines[] = '';
    $lines[] = 'RECOMMENDATIONS';
    foreach ($struct['recommendations'] ?? [] as $i => $r) {
        $lines[] = ((int) $i + 1) . '. ' . (string) $r;
    }
    $lines[] = '';
    $lines[] = 'ONLINE NA MAPAGKUKUNAN (external)';
    foreach ($extOut as $er) {
        $lines[] = '- **' . $er['title'] . '** — ' . $er['note'] . ' [' . $er['title'] . '](' . $er['url'] . ')';
    }
    $lines[] = '';
    $lines[] = 'NEXT STEPS';
    foreach ($struct['next_steps'] ?? [] as $i => $r) {
        $lines[] = ((int) $i + 1) . '. ' . (string) $r;
    }

    $aiAnalysis = implode("\n", $lines);

    $structured = [
        'weaknesses' => $weaknessesOut,
        'external_resources' => $extOut,
        'raw' => $struct,
    ];

    ob_clean();
    echo json_encode([
        'success' => true,
        'analysis' => $aiAnalysis,
        'structured' => $structured,
        'studentName' => $studentName,
        'metrics' => $metrics,
    ], $jsonFlags);
    
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to analyze: ' . $e->getMessage()
    ]);
    exit;
}
?>
