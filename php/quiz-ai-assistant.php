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
    
    // Build comprehensive prompt for AI
    $systemPrompt = "You are Cassy, a friendly, encouraging, and highly knowledgeable AI mathematics tutor specializing in Functions. ";
    $systemPrompt .= "You provide accurate, specific, and actionable feedback. Always be positive and supportive while being honest about areas for improvement. ";
    $systemPrompt .= "Use the student's name naturally throughout your response. Be conversational but educational.";
    
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
    $userPrompt = "Analyze this student's {$quizLabel} performance and provide detailed feedback:\n\n";
    $userPrompt .= "STUDENT: " . $studentName . "\n";
    $userPrompt .= "PERFORMANCE LEVEL: " . $performanceLevel . " (" . round($percentage, 1) . "%)\n\n";
    
    $userPrompt .= "DETAILED SCORES:\n";
    $userPrompt .= "- Total Score: " . $score . "/" . $totalPoints . " points (" . round($percentage, 1) . "%)\n";
    $userPrompt .= "- Multiple Choice: " . $mcCorrect . "/" . $totalQuestions . " correct (" . $mcPercentage . "%) - " . ($mcIncorrect > 0 ? $mcIncorrect . " incorrect" : "Perfect!") . "\n";
    $userPrompt .= "- Time Taken: " . $timeTaken . "\n\n";
    
    $userPrompt .= "QUIZ TOPICS COVERED:\n";
    $userPrompt .= "1. Introduction to Functions (what is a function, function notation)\n";
    $userPrompt .= "2. Domain and Range\n";
    $userPrompt .= "3. Function Operations (addition, subtraction, multiplication, division)\n";
    $userPrompt .= "4. Function Composition\n";
    $userPrompt .= "5. Inverse Functions\n";
    $userPrompt .= "6. Applied and mixed function questions\n\n";
    
    $userPrompt .= "ANALYSIS REQUIREMENTS:\n\n";
    
    $userPrompt .= "## MOTIVATION (2-3 sentences)\n";
    $userPrompt .= "Start with: 'Hi " . $studentName . "! I'm Cassy, your AI math tutor...'\n";
    $userPrompt .= "- Acknowledge their effort and performance level\n";
    $userPrompt .= "- Be specific about what they achieved\n";
    $userPrompt .= "- Use encouraging language appropriate to their score\n\n";
    
    $userPrompt .= "## STRENGTHS (List 3-5 specific strengths)\n";
    $userPrompt .= "Based on their scores, identify:\n";
    if ($mcPercentage >= 80) {
        $userPrompt .= "- Strong understanding of multiple choice concepts\n";
    }
    if ($mcCorrect >= 7) {
        $userPrompt .= "- Good grasp of function fundamentals\n";
    }
    $userPrompt .= "- Be specific about which topics they mastered\n";
    $userPrompt .= "- Format as bullet points with specific examples\n\n";
    
    $userPrompt .= "## AREAS FOR IMPROVEMENT (List 3-5 specific areas)\n";
    $userPrompt .= "Identify weaknesses based on:\n";
    if ($mcIncorrect > 0) {
        $userPrompt .= "- Multiple choice errors (" . $mcIncorrect . " questions)\n";
    }
    if ($mcPercentage < 70) {
        $userPrompt .= "- Core function concepts need reinforcement\n";
    }
    $userPrompt .= "- Be specific about which topics need review\n";
    $userPrompt .= "- Explain why these areas are important\n";
    $userPrompt .= "- Format as bullet points with actionable insights\n\n";
    
    $userPrompt .= "## RECOMMENDATIONS (Provide 4-6 specific, actionable recommendations)\n";
    $userPrompt .= "For each weakness, provide:\n";
    $userPrompt .= "- Specific topics to review (e.g., 'Review function composition')\n";
    $userPrompt .= "- Study strategies (e.g., 'Practice more problems on domain and range')\n";
    $userPrompt .= "- Resources or approaches (e.g., 'Focus on understanding the vertex formula')\n";
    $userPrompt .= "- Format as numbered list with clear action items\n\n";
    
    $userPrompt .= "## NEXT STEPS (3-4 concrete next steps)\n";
    $userPrompt .= "Provide specific, immediate actions:\n";
    $userPrompt .= "- What to study next\n";
    $userPrompt .= "- How to practice\n";
    $userPrompt .= "- When to retake the quiz\n";
    $userPrompt .= "- Format as actionable steps\n\n";
    
    $userPrompt .= "IMPORTANT GUIDELINES:\n";
    $userPrompt .= "- Be accurate and specific - reference actual scores and percentages\n";
    $userPrompt .= "- Use the student's name naturally (2-3 times)\n";
    $userPrompt .= "- Balance encouragement with honest feedback\n";
    $userPrompt .= "- Provide mathematical accuracy in your analysis\n";
    $userPrompt .= "- Keep each section concise but informative\n";
    $userPrompt .= "- Use emojis sparingly (1-2 per section max)\n";
    $userPrompt .= "- Make recommendations specific to the current quiz topic\n";
    
    // Return metrics for frontend visualization
    $metrics = [
        'percentage' => round($percentage, 1),
        'mcPercentage' => $mcPercentage,
        'performanceLevel' => $performanceLevel,
        'mcCorrect' => $mcCorrect,
        'mcIncorrect' => $mcIncorrect
    ];
    
    // Call Groq API
    $ch = curl_init($GROQ_API_URL);
    
    $postData = [
        'model' => $GROQ_MODEL,
        'messages' => [
            [
                'role' => 'system',
                'content' => $systemPrompt
            ],
            [
                'role' => 'user',
                'content' => $userPrompt
            ]
        ],
        'temperature' => 0.7,
        'max_tokens' => 1500
    ];
    
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($postData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $GROQ_API_KEY
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        throw new Exception('API request failed: ' . $curlError);
    }
    
    if ($httpCode !== 200) {
        $errorData = json_decode($response, true);
        $errorMessage = isset($errorData['error']['message']) ? $errorData['error']['message'] : 'HTTP ' . $httpCode;
        throw new Exception('Groq API error: ' . $errorMessage);
    }
    
    $apiResponse = json_decode($response, true);
    
    if (!isset($apiResponse['choices'][0]['message']['content'])) {
        throw new Exception('Invalid API response format');
    }
    
    $aiAnalysis = $apiResponse['choices'][0]['message']['content'];
    
    ob_clean();
    echo json_encode([
        'success' => true,
        'analysis' => $aiAnalysis,
        'studentName' => $studentName,
        'metrics' => $metrics
    ]);
    
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
