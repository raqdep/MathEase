<?php
/**
 * Groq AI Performance Analysis
 * Analyzes student performance using Groq API
 */

// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output
ini_set('log_errors', 1);

// Start output buffering to catch any errors
ob_start();

// Register shutdown function to catch any fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        // Only output JSON if headers haven't been sent
        if (!headers_sent()) {
            // Clean any existing output
            while (ob_get_level() > 0) {
                ob_end_clean();
            }
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Fatal error: ' . $error['message'] . ' in ' . basename($error['file']) . ' on line ' . $error['line'],
                'error_type' => 'SHUTDOWN_FATAL_ERROR'
            ]);
        }
    }
});

// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Set JSON header early to prevent any other output
if (!headers_sent()) {
    header('Content-Type: application/json');
}

// Require config after session start
// Use output buffering to catch any potential output from config.php
try {
    require_once 'config.php';
} catch (Exception $e) {
    ob_clean();
    if (!headers_sent()) {
        http_response_code(500);
    }
    echo json_encode([
        'success' => false,
        'message' => 'Configuration error: ' . $e->getMessage(),
        'error_type' => 'CONFIG_ERROR'
    ]);
    exit;
} catch (Error $e) {
    ob_clean();
    if (!headers_sent()) {
        http_response_code(500);
    }
    echo json_encode([
        'success' => false,
        'message' => 'Configuration fatal error: ' . $e->getMessage(),
        'error_type' => 'CONFIG_FATAL_ERROR'
    ]);
    exit;
}

// Check for any output from config.php (like from die() statements)
$output = '';
if (ob_get_level() > 0) {
    $output = ob_get_contents();
}
if (!empty(trim($output))) {
    // If config.php produced output (like from die()), handle it
    ob_clean();
    if (!headers_sent()) {
        http_response_code(500);
    }
    echo json_encode([
        'success' => false,
        'message' => 'Configuration error: ' . trim($output),
        'error_type' => 'CONFIG_OUTPUT_ERROR'
    ]);
    exit;
}
// Clear the buffer after checking (no output found)
ob_clean();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    ob_clean();
    if (!headers_sent()) {
        http_response_code(401);
    }
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Check if database connection exists
if (!isset($pdo) || !$pdo) {
    ob_clean();
    if (!headers_sent()) {
        http_response_code(500);
    }
    echo json_encode([
        'success' => false,
        'message' => 'Database connection not available. Please check config.php and ensure database is properly configured.',
        'error_type' => 'DB_CONNECTION_MISSING'
    ]);
    exit;
}

// Test database connection
try {
    $pdo->query("SELECT 1");
} catch (PDOException $e) {
    ob_clean();
    if (!headers_sent()) {
        http_response_code(500);
    }
    echo json_encode([
        'success' => false,
        'message' => 'Database connection test failed: ' . $e->getMessage(),
        'error_type' => 'DB_CONNECTION_FAILED'
    ]);
    exit;
}

// Load environment variables
require_once __DIR__ . '/load-env.php';

// Groq API Configuration - loaded from .env file
$GROQ_API_KEY = getenv('GROQ_API_KEY');
$GROQ_API_URL = getenv('GROQ_API_URL') ?: 'https://api.groq.com/openai/v1/chat/completions';
$GROQ_MODEL = getenv('GROQ_MODEL') ?: 'llama-3.1-8b-instant'; // Default model from .env

if (empty($GROQ_API_KEY)) {
    ob_clean();
    if (!headers_sent()) {
        header('Content-Type: application/json');
    }
    echo json_encode([
        'success' => false,
        'message' => 'AI feedback is not configured. Your quiz results are saved; detailed AI analysis (Cassy) is optional and can be enabled by your teacher.',
        'error_type' => 'CONFIGURATION_ERROR',
        'config_hint' => 'GROQ_API_KEY is not set in .env. See GEMINI_AI_SETUP.md or add GROQ_API_KEY for AI analysis.'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];
// Use user_id for quiz_attempts (session student_id is student number string; quiz_attempts.student_id stores user id)
$student_id = $user_id;
$topic = $_POST['topic'] ?? $_GET['topic'] ?? 'functions';
$action = $_POST['action'] ?? $_GET['action'] ?? 'analyze_performance';
$model = $_POST['model'] ?? $_GET['model'] ?? $GROQ_MODEL; // Use model from .env or request parameter

try {

    // Get student information
    $stmt = $pdo->prepare("SELECT id, first_name, last_name, student_id, email FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $studentInfo = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$studentInfo) {
        throw new Exception('Student not found');
    }

    // Get lesson completion data - try to get from all topics
    $lessonData = [];
    try {
        // First, ensure the table exists
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS lesson_completion (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                topic_name VARCHAR(100) NOT NULL,
                lesson_number INT NOT NULL,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_topic (user_id, topic_name),
                INDEX idx_topic_lesson (topic_name, lesson_number)
            )
        ");
        
        // Query for lesson completions from the specified topic
        $stmt = $pdo->prepare("
            SELECT 
                lesson_number,
                completed_at,
                topic_name
            FROM lesson_completion
            WHERE user_id = ? AND topic_name = ?
            ORDER BY lesson_number ASC
        ");
        $stmt->execute([$user_id, $topic]);
        $lessonData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Found " . count($lessonData) . " lesson completions for user_id: $user_id, topic: $topic");
    } catch (PDOException $e) {
        // Table might not exist or have different structure, that's okay
        error_log("Lesson completion query failed: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        $lessonData = [];
    }

    // Get study time data
    $studyTimeData = [];
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS study_time (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                topic VARCHAR(100) NOT NULL,
                lesson_number INT NOT NULL,
                time_spent_seconds INT DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_student_topic_lesson (student_id, topic, lesson_number),
                INDEX idx_student_topic (student_id, topic)
            )
        ");
        
        $stmt = $pdo->prepare("
            SELECT 
                lesson_number,
                time_spent_seconds,
                last_updated
            FROM study_time
            WHERE student_id = ? AND topic = ?
            ORDER BY lesson_number ASC
        ");
        $stmt->execute([$student_id, $topic]);
        $studyTimeData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // If no results with student_id, try user_id
        if (empty($studyTimeData) && $student_id != $user_id) {
            $stmt->execute([$user_id, $topic]);
            $studyTimeData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        error_log("Found " . count($studyTimeData) . " study time records for student_id: $student_id, topic: $topic");
    } catch (PDOException $e) {
        error_log("Study time query failed: " . $e->getMessage());
        $studyTimeData = [];
    }

    // Get quiz performance data - FILTER to Functions topic only when analyzing Functions
    // Quiz types: functions_topic_%, operations_on_functions_lesson_%, solving_real_life_problems_lesson_%
    $quizData = [];
    try {
        // First, ensure the table exists
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                quiz_type VARCHAR(100) NOT NULL,
                score INT NOT NULL DEFAULT 0,
                total_questions INT NOT NULL DEFAULT 5,
                time_taken_seconds INT DEFAULT 0,
                attempt_number INT DEFAULT 1,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                answers_data TEXT,
                INDEX idx_student_quiz (student_id, quiz_type),
                INDEX idx_completed_at (completed_at)
            )
        ");
        
        // If analyzing Functions topic, only get Functions topic quizzes
        if ($topic === 'functions') {
            // Check which time column exists
            $timeColumn = 'time_taken_seconds';
            try {
                $colCheck = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'time_taken_seconds'");
                if ($colCheck->rowCount() == 0) {
                    $colCheck = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'completion_time'");
                    if ($colCheck->rowCount() > 0) {
                        $timeColumn = 'completion_time';
                    }
                }
            } catch (PDOException $e) {
                // Use default
            }
            
            // Query for Functions topic quizzes only (functions_topic_%)
            // Use COALESCE to handle both time_taken_seconds and completion_time
            error_log("=== QUIZ DATA QUERY DEBUG ===");
            error_log("Querying for student_id: $student_id, user_id: $user_id, topic: $topic");
            error_log("Looking for quiz_type LIKE 'functions_topic_%'");
            
            // First, check ALL quiz attempts for this user to see what exists
            $allQuizzesStmt = $pdo->prepare("
                SELECT 
                    id,
                    student_id,
                    quiz_type,
                    score,
                    total_questions,
                    completed_at
                FROM quiz_attempts
                WHERE student_id = ? OR student_id = ?
                ORDER BY completed_at DESC
                LIMIT 50
            ");
            $allQuizzesStmt->execute([$student_id, $user_id]);
            $allQuizzes = $allQuizzesStmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("DEBUG: Found " . count($allQuizzes) . " total quiz attempts for student_id/user_id");
            foreach ($allQuizzes as $q) {
                error_log("  - Quiz ID: " . $q['id'] . ", Type: " . $q['quiz_type'] . ", student_id: " . $q['student_id']);
            }
            
            // CRITICAL: Query matches exactly what's saved in topics/functions.html via store-quiz-data.php
            // - student_id: Uses $_SESSION['user_id'] (same as store-quiz-data.php)
            // - quiz_type: Looks for 'functions_topic_%' pattern (matches functions_topic_1, functions_topic_2, etc.)
            // - This query retrieves quiz data saved by storeQuizData() function in topics/functions.html
            $stmt = $pdo->prepare("
                SELECT 
                    id,
                    quiz_type,
                    score,
                    total_questions,
                    COALESCE(time_taken_seconds, completion_time, 0) as time_taken_seconds,
                    completed_at,
                    answers_data,
                    LENGTH(answers_data) as answers_data_length
                FROM quiz_attempts
                WHERE student_id = ? AND quiz_type LIKE 'functions_topic_%'
                ORDER BY completed_at DESC
                LIMIT 50
            ");
            $stmt->execute([$student_id]);
            $quizData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("Query executed with student_id: $student_id, found " . count($quizData) . " quiz attempts matching 'functions_topic_%'");
            
            // If no results, try with user_id
            if (empty($quizData)) {
                error_log("No quizzes found with student_id, trying user_id...");
                $stmt->execute([$user_id]);
                $quizData = $stmt->fetchAll(PDO::FETCH_ASSOC);
                error_log("Query with user_id: $user_id, found " . count($quizData) . " quiz attempts matching 'functions_topic_%'");
            }
            
            // If still no results, try broader search - any quiz_type containing "functions"
            if (empty($quizData)) {
                error_log("Still no results, trying broader search for any quiz_type containing 'functions'...");
                $broadStmt = $pdo->prepare("
                    SELECT 
                        id,
                        quiz_type,
                        score,
                        total_questions,
                        COALESCE(time_taken_seconds, completion_time, 0) as time_taken_seconds,
                        completed_at,
                        answers_data,
                        LENGTH(answers_data) as answers_data_length
                    FROM quiz_attempts
                    WHERE (student_id = ? OR student_id = ?) AND quiz_type LIKE '%functions%'
                    ORDER BY completed_at DESC
                    LIMIT 50
                ");
                $broadStmt->execute([$student_id, $user_id]);
                $quizData = $broadStmt->fetchAll(PDO::FETCH_ASSOC);
                error_log("Broad search found " . count($quizData) . " quiz attempts containing 'functions'");
            }
            
            // Debug: Check what quiz types actually exist
            if (empty($quizData)) {
                $debugStmt = $pdo->prepare("
                    SELECT DISTINCT quiz_type, COUNT(*) as count 
                    FROM quiz_attempts 
                    WHERE student_id IN (?, ?)
                    GROUP BY quiz_type
                    LIMIT 20
                ");
                $debugStmt->execute([$student_id, $user_id]);
                $allQuizTypes = $debugStmt->fetchAll(PDO::FETCH_ASSOC);
                error_log("DEBUG: All quiz types found for student_id/user_id: " . json_encode($allQuizTypes));
                
                // Also check ALL quiz attempts regardless of student_id
                $allStmt = $pdo->query("
                    SELECT DISTINCT quiz_type, COUNT(*) as count 
                    FROM quiz_attempts 
                    GROUP BY quiz_type
                    LIMIT 20
                ");
                $allQuizTypesAll = $allStmt->fetchAll(PDO::FETCH_ASSOC);
                error_log("DEBUG: All quiz types in database (all students): " . json_encode($allQuizTypesAll));
            }
            
            // Log details about each quiz found
            foreach ($quizData as $idx => $quiz) {
                $hasAnswers = !empty($quiz['answers_data']) && $quiz['answers_data'] !== 'null' && trim($quiz['answers_data']) !== '';
                $answersLength = $quiz['answers_data_length'] ?? 0;
                error_log("Quiz #" . ($idx + 1) . ": Type=" . $quiz['quiz_type'] . ", Score=" . $quiz['score'] . "/" . $quiz['total_questions'] . ", HasAnswers=" . ($hasAnswers ? 'YES' : 'NO') . ", AnswersLength=" . $answersLength);
                
                if (!$hasAnswers) {
                    error_log("WARNING: Quiz " . $quiz['quiz_type'] . " (ID: " . ($quiz['id'] ?? 'unknown') . ") has empty or null answers_data - AI cannot analyze this quiz");
                }
            }
            
            // Fallback: try with user_id if no results
            if (empty($quizData)) {
                $stmt->execute([$user_id]);
                $quizData = $stmt->fetchAll(PDO::FETCH_ASSOC);
                error_log("Fallback query with user_id: $user_id, found " . count($quizData) . " quiz attempts");
            }
            
            // Fallback: old rows may have been stored with intval(student_number) when session had student_id as string
            if (empty($quizData) && isset($_SESSION['student_id']) && is_numeric($_SESSION['student_id'])) {
                $legacyId = (int) $_SESSION['student_id'];
                if ($legacyId > 0 && $legacyId != $user_id) {
                    $stmt->execute([$legacyId]);
                    $quizData = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    error_log("Legacy query with numeric student_id: $legacyId, found " . count($quizData) . " quiz attempts");
                }
            }
            if (empty($quizData) && isset($_SESSION['student_id']) && !is_numeric($_SESSION['student_id'])) {
                $legacyId = (int) $_SESSION['student_id']; // PHP intval: "2024-001" -> 2024, matches MySQL INT conversion
                if ($legacyId > 0) {
                    $stmt->execute([$legacyId]);
                    $quizData = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    error_log("Legacy query with non-numeric student_id: $legacyId, found " . count($quizData) . " quiz attempts");
                }
            }
            
            // Final check: if still no quiz data, log all available quiz types for this student
            if (empty($quizData)) {
                $debugStmt = $pdo->prepare("
                    SELECT DISTINCT quiz_type, COUNT(*) as count 
                    FROM quiz_attempts 
                    WHERE student_id = ? 
                    GROUP BY quiz_type
                ");
                $debugStmt->execute([$student_id]);
                $availableQuizzes = $debugStmt->fetchAll(PDO::FETCH_ASSOC);
                error_log("DEBUG: Available quiz types for student_id $student_id: " . json_encode($availableQuizzes));
                
                // Also try user_id
                $debugStmt->execute([$user_id]);
                $availableQuizzes2 = $debugStmt->fetchAll(PDO::FETCH_ASSOC);
                error_log("DEBUG: Available quiz types for user_id $user_id: " . json_encode($availableQuizzes2));
            }
        } else {
            // For other topics, get all quizzes
            $stmt = $pdo->prepare("
                SELECT 
                    quiz_type,
                    score,
                    total_questions,
                    time_taken_seconds,
                    completed_at,
                    answers_data
                FROM quiz_attempts
                WHERE student_id = ?
                ORDER BY completed_at DESC
                LIMIT 50
            ");
            $stmt->execute([$student_id]);
            $quizData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($quizData) && isset($_SESSION['student_id'])) {
                $legacyId = (int) $_SESSION['student_id']; // matches legacy DB value (e.g. "2024-001" -> 2024)
                if ($legacyId > 0) {
                    $stmt->execute([$legacyId]);
                    $quizData = $stmt->fetchAll(PDO::FETCH_ASSOC);
                }
            }
        }
        
        error_log("Found " . count($quizData) . " quiz attempts for user_id: $user_id, topic: $topic");
    } catch (PDOException $e) {
        error_log("Quiz data query failed: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        // Continue with empty quiz data - analysis can still work
        $quizData = [];
    }

    // Organize quizzes by topic
    $quizzesByTopic = [
        'functions' => [],
        'evaluating-functions' => [],
        'operations_on_functions' => [],
        'solving_real_life_problems' => []
    ];
    
    foreach ($quizData as $quiz) {
        $quizType = $quiz['quiz_type'];
        if (strpos($quizType, 'functions_topic_') === 0) {
            $quizzesByTopic['functions'][] = $quiz;
        } elseif (strpos($quizType, 'evaluating_functions_topic_') === 0) {
            $quizzesByTopic['evaluating-functions'][] = $quiz;
        } elseif (strpos($quizType, 'operations_on_functions_lesson_') === 0) {
            $quizzesByTopic['operations_on_functions'][] = $quiz;
        } elseif (strpos($quizType, 'solving_real_life_problems_lesson_') === 0) {
            $quizzesByTopic['solving_real_life_problems'][] = $quiz;
        }
    }
    
    // Calculate performance metrics - focus on Functions topic if analyzing Functions
    // Add detailed logging for debugging
    error_log("=== METRICS CALCULATION DEBUG ===");
    error_log("Topic: $topic");
    error_log("Total quizData count: " . count($quizData));
    error_log("quizzesByTopic['functions'] count: " . count($quizzesByTopic['functions']));
    
    if ($topic === 'functions') {
        $functionsQuizzes = $quizzesByTopic['functions'];
        $totalQuizzes = count($functionsQuizzes);
        $totalScore = 0;
        $totalQuestions = 0;
        
        error_log("Processing " . $totalQuizzes . " Functions topic quizzes");
        
        foreach ($functionsQuizzes as $idx => $quiz) {
            $quizScore = (int)($quiz['score'] ?? 0);
            $quizTotal = (int)($quiz['total_questions'] ?? 0);
            $totalScore += $quizScore;
            $totalQuestions += $quizTotal;
            error_log("Quiz #" . ($idx + 1) . ": Type=" . ($quiz['quiz_type'] ?? 'unknown') . ", Score=$quizScore/$quizTotal");
        }
        
        $averageScore = $totalQuestions > 0 ? round(($totalScore / $totalQuestions) * 100, 1) : 0;
        error_log("Calculated: totalScore=$totalScore, totalQuestions=$totalQuestions, averageScore=$averageScore%");
    } else {
        // For other topics, calculate from all quizzes
        $totalQuizzes = count($quizData);
        $totalScore = 0;
        $totalQuestions = 0;
        
        error_log("Processing " . $totalQuizzes . " quizzes for other topic");
        
        foreach ($quizData as $idx => $quiz) {
            $quizScore = (int)($quiz['score'] ?? 0);
            $quizTotal = (int)($quiz['total_questions'] ?? 0);
            $totalScore += $quizScore;
            $totalQuestions += $quizTotal;
        }
        
        $averageScore = $totalQuestions > 0 ? round(($totalScore / $totalQuestions) * 100, 1) : 0;
        error_log("Calculated: totalScore=$totalScore, totalQuestions=$totalQuestions, averageScore=$averageScore%");
    }
    
    $lessonsCompleted = count($lessonData);
    
    // Build performance summary for AI - Focus on Functions topic when analyzing Functions
    $performanceSummary = "Student Performance Analysis for " . $studentInfo['first_name'] . " " . $studentInfo['last_name'] . "\n\n";
    
    if ($topic === 'functions') {
        $performanceSummary .= "IMPORTANT: This data is ONLY from the in-lesson quizzes (Topics 1–4) on the Functions lesson page (topics/functions.html). It does NOT include any quizzes from the separate quiz pages (e.g. quiz/functions-quiz.html). Analyze ONLY the questions and answers provided below.\n\n";
        $performanceSummary .= "FUNCTIONS TOPIC - Detailed Performance Analysis (in-topic quizzes only)\n\n";
        $performanceSummary .= "Total Quiz Attempts (Functions Topic Only): " . $totalQuizzes . "\n";
        $performanceSummary .= "Average Score (Functions Topic): " . $averageScore . "%\n";
        $performanceSummary .= "Lessons Completed: " . $lessonsCompleted . " out of 4\n\n";
    } else {
        $performanceSummary .= "General Mathematics 11 - Comprehensive Performance Analysis\n\n";
        $performanceSummary .= "Total Quiz Attempts Across All Topics: " . $totalQuizzes . "\n";
        $performanceSummary .= "Overall Average Score: " . $averageScore . "%\n";
        $performanceSummary .= "Lessons Completed: " . $lessonsCompleted . "\n\n";
    }
    
    // Add quiz details by topic
    if ($topic === 'functions') {
        $performanceSummary .= "=== FUNCTIONS TOPIC QUIZ PERFORMANCE ===\n\n";
    } else {
        $performanceSummary .= "=== QUIZ PERFORMANCE BY TOPIC ===\n\n";
    }
    
    // Functions topic quizzes with detailed answers
    if (!empty($quizzesByTopic['functions'])) {
        if ($topic === 'functions') {
            $performanceSummary .= "FUNCTIONS TOPIC QUIZZES (Detailed):\n";
        } else {
            $performanceSummary .= "FUNCTIONS TOPIC QUIZZES:\n";
        }
        foreach ($quizzesByTopic['functions'] as $index => $quiz) {
            $percentage = $quiz['total_questions'] > 0 ? round(($quiz['score'] / $quiz['total_questions']) * 100, 1) : 0;
            $lessonNum = str_replace('functions_topic_', '', $quiz['quiz_type']);
            
            // Calculate time taken (allow 0; clamp absurd values)
            $timeTaken = isset($quiz['time_taken_seconds']) ? (int) $quiz['time_taken_seconds'] : 0;
            if ($timeTaken > 7200) $timeTaken = 0; // >2 hrs treat as invalid
            $timeMin = $timeTaken > 0 ? round($timeTaken / 60, 1) : 'N/A';
            
            $performanceSummary .= "  - Topic " . $lessonNum . " Quiz: " . $quiz['score'] . "/" . $quiz['total_questions'] . " (" . $percentage . "%)";
            
            // Decode and include answers_data if available
            $answersData = null;
            if (!empty($quiz['answers_data'])) {
                $answersData = json_decode($quiz['answers_data'], true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    error_log("Failed to decode answers_data for quiz_type: " . $quiz['quiz_type'] . ", error: " . json_last_error_msg());
                    $answersData = null;
                }
            }
            
            if ($answersData && is_array($answersData) && count($answersData) > 0) {
                $performanceSummary .= "\n    Questions and Answers:\n";
                foreach ($answersData as $qIdx => $answer) {
                    $qNum = $qIdx + 1;
                    $question = isset($answer['question']) ? $answer['question'] : "Question $qNum";
                    $selected = isset($answer['selectedText']) ? $answer['selectedText'] : (isset($answer['selected']) ? "Option " . ($answer['selected'] + 1) : 'N/A');
                    $correct = isset($answer['correctText']) ? $answer['correctText'] : (isset($answer['correct']) ? "Option " . ($answer['correct'] + 1) : 'N/A');
                    $isCorrect = isset($answer['isCorrect']) ? $answer['isCorrect'] : false;
                    
                    $performanceSummary .= "      Q$qNum: $question\n";
                    $performanceSummary .= "        Student Answer: $selected " . ($isCorrect ? "✓ CORRECT" : "✗ WRONG") . "\n";
                    $performanceSummary .= "        Correct Answer: $correct\n";
                }
            }
            if ($timeMin !== 'N/A') {
                $performanceSummary .= " - Time taken: " . $timeMin . " minutes";
            }
            $performanceSummary .= " - Completed: " . $quiz['completed_at'] . "\n";
            
            // Include detailed answers if available - FOR FUNCTIONS TOPIC ONLY
            if (empty($quiz['answers_data']) || trim($quiz['answers_data']) === '' || $quiz['answers_data'] === 'null') {
                error_log("WARNING: answers_data is empty or null for quiz_type: " . $quiz['quiz_type'] . ", student_id: " . $student_id . ", attempt_id: " . ($quiz['id'] ?? 'unknown'));
                $performanceSummary .= "    ⚠️⚠️⚠️ CRITICAL: Detailed answer data is missing for this quiz attempt. The AI cannot analyze individual questions without this data.\n";
                $performanceSummary .= "    This quiz attempt (Score: " . $quiz['score'] . "/" . $quiz['total_questions'] . ") cannot be fully analyzed.\n";
                $performanceSummary .= "    Please retake this quiz to enable AI analysis.\n\n";
            } else {
                $answers = json_decode($quiz['answers_data'], true);
                $jsonError = json_last_error();
                
                if ($jsonError !== JSON_ERROR_NONE) {
                    error_log("ERROR: JSON decode error for quiz answers_data: " . json_last_error_msg() . " (Error code: $jsonError)");
                    error_log("Raw answers_data (first 500 chars): " . substr($quiz['answers_data'], 0, 500));
                    $performanceSummary .= "    ⚠️⚠️⚠️ ERROR: Failed to decode answer data for this quiz. JSON Error: " . json_last_error_msg() . "\n\n";
                } elseif (!is_array($answers) || empty($answers)) {
                    error_log("WARNING: Decoded answers_data is not a valid array or is empty for quiz_type: " . $quiz['quiz_type']);
                    $performanceSummary .= "    ⚠️ Note: Answer data format is invalid for this quiz attempt.\n\n";
                } else {
                    error_log("SUCCESS: Processing " . count($answers) . " detailed answers for quiz_type: " . $quiz['quiz_type'] . ", student_id: " . $student_id);
                    $performanceSummary .= "\n    ════════════════════════════════════════════════════════════\n";
                    $performanceSummary .= "    DETAILED QUESTION-BY-QUESTION ANALYSIS FOR TOPIC " . $lessonNum . ":\n";
                    $performanceSummary .= "    ════════════════════════════════════════════════════════════\n\n";
                    $performanceSummary .= "    IMPORTANT: Analyze EACH question below individually. For each incorrect answer, explain why it was wrong and what the student should review.\n\n";
                    
                    foreach ($answers as $ansIndex => $answer) {
                        if (is_array($answer)) {
                            $question = $answer['question'] ?? "Question " . ($ansIndex + 1);
                            $selected = $answer['selected'] ?? 'N/A';
                            $correct = $answer['correct'] ?? 'N/A';
                            $selectedText = $answer['selectedText'] ?? (isset($answer['options']) && isset($answer['options'][$selected]) ? $answer['options'][$selected] : 'N/A');
                            $correctText = $answer['correctText'] ?? (isset($answer['options']) && isset($answer['options'][$correct]) ? $answer['options'][$correct] : 'N/A');
                            $isCorrect = isset($answer['isCorrect']) ? ($answer['isCorrect'] ? true : false) : null;
                            $options = $answer['options'] ?? [];
                            
                            $performanceSummary .= "    ────────────────────────────────────────────────────────────────\n";
                            $performanceSummary .= "    QUESTION " . ($ansIndex + 1) . " of " . count($answers) . ":\n";
                            $performanceSummary .= "    ────────────────────────────────────────────────────────────────\n";
                            $performanceSummary .= "    Question Text: " . $question . "\n\n";
                            
                            // Show all options if available
                            if (!empty($options) && is_array($options)) {
                                $performanceSummary .= "    Answer Options:\n";
                                foreach ($options as $optIndex => $option) {
                                    $marker = '';
                                    if ($optIndex == $selected) $marker = ' ← [STUDENT SELECTED THIS]';
                                    if ($optIndex == $correct) $marker .= ' ← [CORRECT ANSWER]';
                                    $performanceSummary .= "      " . ($optIndex + 1) . ". " . $option . $marker . "\n";
                                }
                                $performanceSummary .= "\n";
                            }
                            
                            $performanceSummary .= "    Student's Selected Answer: " . $selectedText . " (Option " . ($selected + 1) . ")\n";
                            $performanceSummary .= "    Correct Answer: " . $correctText . " (Option " . ($correct + 1) . ")\n";
                            $performanceSummary .= "    Result: " . ($isCorrect === true ? '✓ CORRECT' : ($isCorrect === false ? '✗ INCORRECT' : 'UNKNOWN')) . "\n";
                            
                            // Add analysis note for incorrect answers with topic identification
                            if ($isCorrect === false) {
                                $performanceSummary .= "\n    ⚠️⚠️⚠️ THIS QUESTION WAS ANSWERED INCORRECTLY ⚠️⚠️⚠️\n";
                                $performanceSummary .= "    The AI MUST analyze this question and explain:\n";
                                $performanceSummary .= "    1. Why the student's answer (" . $selectedText . ") is wrong\n";
                                $performanceSummary .= "    2. Why the correct answer (" . $correctText . ") is correct\n";
                                $performanceSummary .= "    3. What mathematical concept this question tested\n";
                                
                                // Identify which topic this question belongs to
                                $questionLower = strtolower($question);
                                $identifiedTopic = '';
                                if (stripos($questionLower, 'function') !== false && (stripos($questionLower, 'what is') !== false || stripos($questionLower, 'read') !== false || stripos($questionLower, 'notation') !== false || stripos($questionLower, 'machine') !== false)) {
                                    $identifiedTopic = 'Topic 1 - Introduction to Functions';
                                } elseif (stripos($questionLower, 'domain') !== false || stripos($questionLower, 'range') !== false) {
                                    $identifiedTopic = 'Topic 2 - Domain and Range';
                                } elseif (stripos($questionLower, 'operation') !== false || stripos($questionLower, 'add') !== false || stripos($questionLower, 'multiply') !== false || stripos($questionLower, 'divide') !== false || stripos($questionLower, 'subtract') !== false) {
                                    $identifiedTopic = 'Topic 3 - Function Operations';
                                } elseif (stripos($questionLower, 'composition') !== false || stripos($questionLower, 'inverse') !== false || stripos($questionLower, 'f⁻¹') !== false || stripos($questionLower, 'f-1') !== false) {
                                    $identifiedTopic = 'Topic 4 - Function Composition & Inverses';
                                } else {
                                    $identifiedTopic = 'Topic ' . $lessonNum; // Fallback to quiz topic number
                                }
                                
                                $performanceSummary .= "    4. Topic: " . $identifiedTopic . "\n";
                                $performanceSummary .= "    5. Specific recommendations for reviewing this topic\n";
                            } else if ($isCorrect === true) {
                                $performanceSummary .= "\n    ✓ This question was answered correctly. Good job!\n";
                            }
                            
                            $performanceSummary .= "\n";
                        } else {
                            // Simple array format (fallback)
                            $performanceSummary .= "    Q" . ($ansIndex + 1) . ": Answer " . $answer . "\n\n";
                        }
                    }
                    $performanceSummary .= "    ════════════════════════════════════════════════════════════\n";
                    $performanceSummary .= "    END OF QUESTION-BY-QUESTION ANALYSIS FOR TOPIC " . $lessonNum . "\n";
                    $performanceSummary .= "    ════════════════════════════════════════════════════════════\n\n";
                }
            }
        }
        $performanceSummary .= "\n";
    }
    
    // Evaluating Functions topic quizzes with detailed answers
    if (!empty($quizzesByTopic['evaluating-functions'])) {
        $performanceSummary .= "EVALUATING FUNCTIONS TOPIC QUIZZES:\n";
        foreach ($quizzesByTopic['evaluating-functions'] as $index => $quiz) {
            $percentage = $quiz['total_questions'] > 0 ? round(($quiz['score'] / $quiz['total_questions']) * 100, 1) : 0;
            $lessonNum = str_replace('evaluating_functions_topic_', '', $quiz['quiz_type']);
            
            // Calculate time taken
            $timeTaken = 0;
            if (isset($quiz['time_taken_seconds']) && $quiz['time_taken_seconds'] > 0) {
                $timeTaken = $quiz['time_taken_seconds'];
            }
            $timeMin = $timeTaken > 0 ? round($timeTaken / 60, 1) : 'N/A';
            
            $performanceSummary .= "  - Lesson " . $lessonNum . " Quiz: " . $quiz['score'] . "/" . $quiz['total_questions'] . " (" . $percentage . "%)";
            if ($timeMin !== 'N/A') {
                $performanceSummary .= " - Time taken: " . $timeMin . " minutes";
            }
            $performanceSummary .= " - Completed: " . $quiz['completed_at'] . "\n";
            
            // Include detailed answers if available
            if (!empty($quiz['answers_data'])) {
                $answers = json_decode($quiz['answers_data'], true);
                if (is_array($answers) && !empty($answers)) {
                    $performanceSummary .= "    Detailed Answers:\n";
                    foreach ($answers as $ansIndex => $answer) {
                        if (is_array($answer)) {
                            $question = $answer['question'] ?? "Question " . ($ansIndex + 1);
                            $selected = $answer['selected'] ?? 'N/A';
                            $correct = $answer['correct'] ?? 'N/A';
                            $isCorrect = isset($answer['isCorrect']) ? ($answer['isCorrect'] ? '✓' : '✗') : '';
                            
                            $performanceSummary .= "      Q" . ($ansIndex + 1) . ": " . $question . "\n";
                            $performanceSummary .= "        Selected: " . $selected . " | Correct: " . $correct . " " . $isCorrect . "\n";
                        } else {
                            // Simple array format
                            $performanceSummary .= "      Q" . ($ansIndex + 1) . ": Answer " . $answer . "\n";
                        }
                    }
                }
            }
        }
        $performanceSummary .= "\n";
    }
    
    // Operations on Functions topic quizzes
    if (!empty($quizzesByTopic['operations_on_functions'])) {
        $performanceSummary .= "OPERATIONS ON FUNCTIONS TOPIC:\n";
        foreach ($quizzesByTopic['operations_on_functions'] as $index => $quiz) {
            $percentage = $quiz['total_questions'] > 0 ? round(($quiz['score'] / $quiz['total_questions']) * 100, 1) : 0;
            $lessonNum = str_replace('operations_on_functions_lesson_', '', $quiz['quiz_type']);
            $performanceSummary .= "  - Lesson " . $lessonNum . " Quiz: " . $quiz['score'] . "/" . $quiz['total_questions'] . " (" . $percentage . "%) - " . $quiz['completed_at'] . "\n";
        }
        $performanceSummary .= "\n";
    }
    
    // Solving Real-Life Problems topic quizzes
    if (!empty($quizzesByTopic['solving_real_life_problems'])) {
        $performanceSummary .= "SOLVING REAL-LIFE PROBLEMS TOPIC:\n";
        foreach ($quizzesByTopic['solving_real_life_problems'] as $index => $quiz) {
            $percentage = $quiz['total_questions'] > 0 ? round(($quiz['score'] / $quiz['total_questions']) * 100, 1) : 0;
            $lessonNum = str_replace('solving_real_life_problems_lesson_', '', $quiz['quiz_type']);
            $performanceSummary .= "  - Lesson " . $lessonNum . " Quiz: " . $quiz['score'] . "/" . $quiz['total_questions'] . " (" . $percentage . "%) - " . $quiz['completed_at'] . "\n";
        }
        $performanceSummary .= "\n";
    }
    
    // Add study time details - Show in hours per topic/lesson
    if (!empty($studyTimeData)) {
        if ($topic === 'functions') {
            $performanceSummary .= "=== STUDY TIME BY TOPIC (FUNCTIONS) ===\n";
        } else {
            $performanceSummary .= "=== STUDY TIME BY LESSON ===\n";
        }
        $totalStudySeconds = 0;
        foreach ($studyTimeData as $time) {
            $minutes = round($time['time_spent_seconds'] / 60, 1);
            $hours = round($time['time_spent_seconds'] / 3600, 2);
            $totalStudySeconds += $time['time_spent_seconds'];
            
            if ($topic === 'functions') {
                if ($hours >= 1) {
                    $performanceSummary .= "- Topic " . $time['lesson_number'] . ": " . number_format($hours, 2) . " hours (" . number_format($minutes, 1) . " minutes)\n";
                } else {
                    $performanceSummary .= "- Topic " . $time['lesson_number'] . ": " . number_format($minutes, 1) . " minutes\n";
                }
            } else {
                if ($hours >= 1) {
                    $performanceSummary .= "- Lesson " . $time['lesson_number'] . ": " . number_format($hours, 2) . " hours (" . number_format($minutes, 1) . " minutes)\n";
                } else {
                    $performanceSummary .= "- Lesson " . $time['lesson_number'] . ": " . number_format($minutes, 1) . " minutes\n";
                }
            }
        }
        
        $totalMinutes = round($totalStudySeconds / 60, 1);
        $totalHours = round($totalStudySeconds / 3600, 2);
        if ($totalHours >= 1) {
            $performanceSummary .= "Total Study Time: " . number_format($totalHours, 2) . " hours (" . number_format($totalMinutes, 1) . " minutes)\n";
        } else {
            $performanceSummary .= "Total Study Time: " . number_format($totalMinutes, 1) . " minutes\n";
        }
        $performanceSummary .= "\n";
    } else {
        $performanceSummary .= "=== STUDY TIME ===\n";
        $performanceSummary .= "No study time data available yet.\n\n";
    }
    
    // Add lesson completion details
    if (!empty($lessonData)) {
        $performanceSummary .= "=== LESSONS COMPLETED ===\n";
        foreach ($lessonData as $lesson) {
            $performanceSummary .= "- Lesson " . $lesson['lesson_number'] . " completed on " . $lesson['completed_at'] . "\n";
        }
        $performanceSummary .= "\n";
    }
    
    // If no quiz data, provide helpful message
    if (empty($quizData)) {
        $performanceSummary .= "\nNOTE: No quiz attempts found yet. The student should complete quizzes to get detailed performance analysis.\n";
    }

    // Prepare prompt for Groq AI
    $systemPrompt = "You are Cassy, a friendly and supportive AI mathematics tutor specializing in Grade 11 General Mathematics. ";
    $systemPrompt .= "Always introduce yourself as Cassy at the beginning of your analysis. ";
    if ($topic === 'functions') {
        $systemPrompt .= "You are analyzing the student's performance ONLY for the in-lesson quizzes (Topics 1-4) inside the Functions lesson page (topics/functions.html). Do NOT use or reference any data from the separate quiz pages (e.g. quiz/functions-quiz.html). All question and answer data provided to you are from those in-topic quizzes only (Introduction to Functions, Domain & Range, Function Operations, and Function Composition & Inverses).";
    } else {
        $systemPrompt .= "Analyze the student's performance data and provide a comprehensive analysis.";
    }
    $systemPrompt .= "\n\nIMPORTANT: Start your response by introducing yourself as Cassy. For example: 'Hi! I'm Cassy, your AI mathematics tutor. I've analyzed your performance and I'm here to help you improve...'";
    $systemPrompt .= "\n\nFormat your response with these sections (use these exact headings):";
    $systemPrompt .= "\n\n## EXECUTIVE SUMMARY";
    if ($topic === 'functions') {
        $systemPrompt .= "\nProvide a brief overview of the student's overall performance in the Functions topic (4 topics total). Start with: 'Hi! I'm Cassy, your AI mathematics tutor...'";
    } else {
        $systemPrompt .= "\nProvide a brief overview of the student's overall performance. Start with: 'Hi! I'm Cassy, your AI mathematics tutor...'";
    }
    $systemPrompt .= "\n\n## STRENGTHS";
    if ($topic === 'functions') {
        $systemPrompt .= "\nIdentify what the student is doing well in the Functions topic. Mention specific topics (1-4) where they excel.";
    } else {
        $systemPrompt .= "\nIdentify what the student is doing well.";
    }
    $systemPrompt .= "\n\n## AREAS NEEDING IMPROVEMENT";
    if ($topic === 'functions') {
        $systemPrompt .= "\nList specific weak areas in the Functions topic that need attention. Identify which specific topics (1-4) or question types need improvement.";
    } else {
        $systemPrompt .= "\nList specific weak areas that need attention.";
    }
    $systemPrompt .= "\n\n## PERSONALIZED RECOMMENDATIONS";
    if ($topic === 'functions') {
        $systemPrompt .= "\nProvide actionable recommendations for improvement in the Functions topic. Suggest specific topics to review.";
    } else {
        $systemPrompt .= "\nProvide actionable recommendations for improvement.";
    }
    $systemPrompt .= "\n\n## LEARNING PATTERN ANALYSIS";
    $systemPrompt .= "\nAnalyze the student's learning patterns and study habits. Include analysis of:";
    if ($topic === 'functions') {
        $systemPrompt .= "\n- Study time spent on each topic (1-4) in hours and minutes";
        $systemPrompt .= "\n- Time efficiency per topic (quiz score vs time spent on each topic)";
        $systemPrompt .= "\n- Quiz performance patterns across the 4 topics";
        $systemPrompt .= "\n- Specific question types or topics where the student struggled";
        $systemPrompt .= "\n- Which topics took the most/least time and why";
    } else {
        $systemPrompt .= "\n- Study time spent on each lesson (minutes/hours)";
        $systemPrompt .= "\n- Time efficiency (score vs time spent)";
        $systemPrompt .= "\n- Quiz performance patterns";
        $systemPrompt .= "\n- Specific question types that were answered incorrectly";
    }
    $systemPrompt .= "\n\n## NEXT STEPS";
    if ($topic === 'functions') {
        $systemPrompt .= "\nSuggest concrete next steps for the student based on their Functions topic study time and quiz performance. Recommend which topics to focus on.";
    } else {
        $systemPrompt .= "\nSuggest concrete next steps for the student based on their study time and quiz performance.";
    }
    $systemPrompt .= "\n\nCRITICAL: You MUST analyze EACH individual question the student answered. The performance data includes detailed question-by-question information showing:";
    $systemPrompt .= "\n- The exact question text";
    $systemPrompt .= "\n- All answer options";
    $systemPrompt .= "\n- Which option the student selected";
    $systemPrompt .= "\n- Which option was correct";
    $systemPrompt .= "\n- Whether the answer was correct or incorrect";
    $systemPrompt .= "\n\nFor EACH question the student answered incorrectly, you MUST:";
    $systemPrompt .= "\n1. Quote the exact question text";
    $systemPrompt .= "\n2. Identify the specific mathematical concept or topic that question tested";
    if ($topic === 'functions') {
        $systemPrompt .= "\n3. Identify which of the 4 Functions topics it belongs to (Topic 1: Introduction to Functions, Topic 2: Domain & Range, Topic 3: Function Operations, Topic 4: Function Composition & Inverses)";
        $systemPrompt .= "\n4. Explain WHY the student's selected answer was wrong (compare their answer to the correct answer)";
        $systemPrompt .= "\n5. Explain what the correct answer is and why it's correct";
        $systemPrompt .= "\n6. Provide specific recommendations for reviewing that topic";
        $systemPrompt .= "\n7. Group incorrect answers by topic (Topic 1, 2, 3, or 4) to identify patterns";
    } else {
        $systemPrompt .= "\n3. Explain WHY the student's selected answer was wrong (compare their answer to the correct answer)";
        $systemPrompt .= "\n4. Explain what the correct answer is and why it's correct";
        $systemPrompt .= "\n5. Provide specific recommendations for improving understanding of that concept";
    }
    $systemPrompt .= "\n\nIMPORTANT: In your 'AREAS NEEDING IMPROVEMENT' section, list EACH incorrect question individually with:";
    $systemPrompt .= "\n- The question text";
    $systemPrompt .= "\n- The topic/concept it tested";
    $systemPrompt .= "\n- Why the student's answer was wrong";
    $systemPrompt .= "\n- What they should review";
    $systemPrompt .= "\n\nDo NOT just summarize. You MUST go through each question one by one and provide specific feedback.";
    $systemPrompt .= "\nUse bullet points for lists. Be friendly, supportive, and educational. Focus on helping the student improve.";
    $systemPrompt .= "\nInclude specific examples from their quiz answers when providing recommendations.";
    if ($topic === 'functions') {
        $systemPrompt .= " Reference specific topics (Topic 1, Topic 2, Topic 3, Topic 4) when discussing performance.";
        $systemPrompt .= " For each incorrect answer, identify which topic it relates to and suggest reviewing that specific topic.";
    }

    $userPrompt = $performanceSummary;
    
    // Add context based on data availability
    if (empty($quizData) && empty($lessonData)) {
        $userPrompt .= "\n\nNOTE: This student has not yet completed any quizzes or lessons. Provide encouraging guidance on getting started and emphasize the importance of completing lessons and quizzes to track progress.";
    } elseif (empty($quizData)) {
        $userPrompt .= "\n\nNOTE: The student has completed lessons but no quiz data is available yet. Encourage them to take quizzes to assess their understanding.";
    } elseif (empty($lessonData)) {
        $userPrompt .= "\n\nNOTE: The student has taken quizzes but lesson completion data is not available. Focus on quiz performance analysis.";
    }
    
    $userPrompt .= "\n\n════════════════════════════════════════════════════════════";
    $userPrompt .= "\nCRITICAL INSTRUCTION:";
    $userPrompt .= "\n════════════════════════════════════════════════════════════";
    $userPrompt .= "\n\nYou MUST analyze EACH individual question shown in the 'DETAILED QUESTION-BY-QUESTION ANALYSIS' sections above.";
    $userPrompt .= "\n\nFor EVERY question marked as '✗ INCORRECT', you MUST:";
    $userPrompt .= "\n1. Quote the exact question text in your response";
    $userPrompt .= "\n2. Explain why the student's selected answer was wrong";
    $userPrompt .= "\n3. Explain why the correct answer is correct";
    $userPrompt .= "\n4. Identify the mathematical concept and topic it tested";
    $userPrompt .= "\n5. Provide specific recommendations for reviewing that concept";
    if ($topic === 'functions') {
        $userPrompt .= "\n6. Group all incorrect questions by topic (Topic 1, 2, 3, or 4)";
    }
    $userPrompt .= "\n\nDO NOT just summarize. You MUST go through each incorrect question one by one and provide detailed, specific feedback.";
    $userPrompt .= "\n\nPlease provide a comprehensive performance analysis following the format above with actionable recommendations.";

    // Call Groq API
    if (!function_exists('curl_init')) {
        throw new Exception('cURL extension is not enabled on this server');
    }
    
    $ch = curl_init($GROQ_API_URL);
    
    if ($ch === false) {
        throw new Exception('Failed to initialize cURL');
    }
    
    $postData = [
        'model' => $model, // Use model from request parameter or default from .env (GROQ_MODEL)
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
        'max_tokens' => 2000
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
        error_log("cURL Error: " . $curlError);
        throw new Exception('API request failed: ' . $curlError);
    }

    if ($httpCode !== 200) {
        error_log("Groq API HTTP Error: " . $httpCode);
        error_log("Response: " . substr($response, 0, 500));
        $errorData = json_decode($response, true);
        $errorMessage = isset($errorData['error']['message']) ? $errorData['error']['message'] : 'HTTP ' . $httpCode;
        throw new Exception('Groq API error: ' . $errorMessage);
    }

    if (empty($response)) {
        throw new Exception('Empty response from Groq API');
    }

    $apiResponse = json_decode($response, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON Decode Error: " . json_last_error_msg());
        error_log("Response: " . substr($response, 0, 500));
        throw new Exception('Failed to parse API response: ' . json_last_error_msg());
    }

    if (!isset($apiResponse['choices'][0]['message']['content'])) {
        error_log("Invalid API response structure: " . json_encode($apiResponse));
        throw new Exception('Invalid API response format - missing content');
    }

    $aiAnalysis = $apiResponse['choices'][0]['message']['content'];

    // Extract weak areas and recommendations (improved parsing)
    $weakAreas = [];
    $recommendations = [];
    
    // Try to extract sections from AI response (handle both markdown and plain text)
    // Look for "AREAS NEEDING IMPROVEMENT" or "WEAK AREAS" section
    if (preg_match('/(?:##\s*)?(?:AREAS NEEDING IMPROVEMENT|WEAK AREAS)[:\-]?\s*\n(.*?)(?=\n##\s*(?:STRENGTHS|PERSONALIZED RECOMMENDATIONS|LEARNING PATTERN|NEXT STEPS)|$)/is', $aiAnalysis, $matches)) {
        $weakText = $matches[1];
        $lines = preg_split('/\n/', $weakText);
        foreach ($lines as $line) {
            $line = trim($line);
            if (!empty($line) && !preg_match('/^#/', $line)) {
                $line = preg_replace('/^[-•*]\s*/', '', $line);
                if (!empty($line)) {
                    $weakAreas[] = $line;
                }
            }
        }
    }
    
    // Look for "PERSONALIZED RECOMMENDATIONS" or "RECOMMENDATIONS" section
    if (preg_match('/(?:##\s*)?(?:PERSONALIZED RECOMMENDATIONS|RECOMMENDATIONS)[:\-]?\s*\n(.*?)(?=\n##\s*(?:LEARNING PATTERN|NEXT STEPS|$)|$)/is', $aiAnalysis, $matches)) {
        $recText = $matches[1];
        $lines = preg_split('/\n/', $recText);
        foreach ($lines as $line) {
            $line = trim($line);
            if (!empty($line) && !preg_match('/^#/', $line)) {
                $line = preg_replace('/^[-•*]\s*/', '', $line);
                if (!empty($line)) {
                    $recommendations[] = $line;
                }
            }
        }
    }

    // Store analysis in database (optional - create table if needed)
    try {
        // Create table if it doesn't exist
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS ai_performance_analysis (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                topic VARCHAR(100) NOT NULL,
                analysis_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_student_topic (student_id, topic)
            )
        ");
        
        $stmt = $pdo->prepare("
            INSERT INTO ai_performance_analysis (student_id, topic, analysis_text, created_at)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
                analysis_text = VALUES(analysis_text),
                updated_at = NOW()
        ");
        $stmt->execute([$student_id, $topic, $aiAnalysis]);
    } catch (PDOException $e) {
        // Table creation or insert failed, that's okay - analysis still works
        error_log("Could not store analysis: " . $e->getMessage());
    }

    // Calculate study time metrics
    // Add validation to prevent unrealistic study times (e.g., if data is in wrong units)
    $totalStudySeconds = 0;
    $studyTimeByLesson = [];
    
    error_log("=== STUDY TIME CALCULATION DEBUG ===");
    error_log("Found " . count($studyTimeData) . " study time records");
    
    foreach ($studyTimeData as $time) {
        $seconds = (int)($time['time_spent_seconds'] ?? 0);
        $lessonNum = (int)($time['lesson_number'] ?? 0);
        
        // Validate: if seconds > 86400 (24 hours), might be in wrong units (milliseconds?)
        // Cap at reasonable maximum (e.g., 10 hours per lesson = 36000 seconds)
        if ($seconds > 36000) {
            error_log("WARNING: Unrealistic study time for lesson $lessonNum: $seconds seconds (" . round($seconds/3600, 2) . " hours) - capping at 10 hours");
            $seconds = 36000; // Cap at 10 hours per lesson
        }
        
        // If seconds is very large (might be milliseconds), convert
        if ($seconds > 86400000) { // More than 1 day in milliseconds
            error_log("WARNING: Study time appears to be in milliseconds, converting: $seconds ms -> " . round($seconds/1000) . " seconds");
            $seconds = round($seconds / 1000);
        }
        
        $totalStudySeconds += $seconds;
        $studyTimeByLesson[$lessonNum] = $seconds;
        
        error_log("Lesson $lessonNum: " . round($seconds/60, 1) . " minutes (" . round($seconds/3600, 2) . " hours)");
    }
    
    $totalStudyMinutes = round($totalStudySeconds / 60, 1);
    $totalStudyHours = round($totalStudySeconds / 3600, 2);
    
    error_log("Total study time: $totalStudySeconds seconds = $totalStudyMinutes minutes = $totalStudyHours hours");
    
    // Calculate improvement rate (compare first vs last quiz scores)
    $improvementRate = 0;
    if (count($quizData) >= 2 && $topic === 'functions') {
        $functionsQuizzes = $quizzesByTopic['functions'] ?? [];
        if (count($functionsQuizzes) >= 2) {
            // Sort by date
            usort($functionsQuizzes, function($a, $b) {
                return strtotime($a['completed_at']) - strtotime($b['completed_at']);
            });
            $firstScore = ($functionsQuizzes[0]['score'] / $functionsQuizzes[0]['total_questions']) * 100;
            $lastScore = ($functionsQuizzes[count($functionsQuizzes) - 1]['score'] / $functionsQuizzes[count($functionsQuizzes) - 1]['total_questions']) * 100;
            $improvementRate = round($lastScore - $firstScore, 1);
        }
    }
    
    // Calculate consistency score (standard deviation of scores)
    $consistencyScore = $averageScore; // Default
    if (count($quizData) > 1 && $topic === 'functions') {
        $functionsQuizzes = $quizzesByTopic['functions'] ?? [];
        if (count($functionsQuizzes) > 1) {
            $scores = [];
            foreach ($functionsQuizzes as $quiz) {
                $scores[] = ($quiz['score'] / $quiz['total_questions']) * 100;
            }
            $mean = array_sum($scores) / count($scores);
            $variance = 0;
            foreach ($scores as $score) {
                $variance += pow($score - $mean, 2);
            }
            $stdDev = sqrt($variance / count($scores));
            // Consistency = 100 - (stdDev * 2), clamped to 0-100
            $consistencyScore = max(0, min(100, round(100 - ($stdDev * 2), 1)));
        }
    }
    
    // Calculate additional metrics for display
    $metrics = [
        'overallAverage' => $averageScore,
        'totalQuizzes' => $totalQuizzes,
        'lessonsCompleted' => $lessonsCompleted,
        'improvementRate' => $improvementRate,
        'consistencyScore' => $consistencyScore,
        'totalStudyMinutes' => $totalStudyMinutes,
        'totalStudyHours' => $totalStudyHours,
        'studyTimeByLesson' => $studyTimeByLesson
    ];

    // Generate chart data for Functions topic
    $chartData = [];
    
    if ($topic === 'functions') {
        // 1. Topic Performance Chart (Bar Chart) - Score per Topic/Lesson
        $topicPerformanceLabels = [];
        $topicPerformanceScores = [];
        $topicPerformanceColors = [];
        
        // Group quizzes by topic number (1-4)
        $topicScores = [];
        foreach ($quizzesByTopic['functions'] as $quiz) {
            // Extract topic number from quiz_type (e.g., "functions_topic_1" -> 1)
            if (preg_match('/functions_topic_(\d+)/', $quiz['quiz_type'], $matches)) {
                $topicNum = intval($matches[1]);
                if (!isset($topicScores[$topicNum])) {
                    $topicScores[$topicNum] = [];
                }
                $percentage = ($quiz['score'] / $quiz['total_questions']) * 100;
                $topicScores[$topicNum][] = $percentage;
            }
        }
        
        // Calculate average score per topic
        ksort($topicScores);
        foreach ($topicScores as $topicNum => $scores) {
            $avgScore = round(array_sum($scores) / count($scores), 1);
            $topicPerformanceLabels[] = "Topic $topicNum";
            $topicPerformanceScores[] = $avgScore;
            
            // Color based on score: green (80+), yellow (60-79), red (<60)
            if ($avgScore >= 80) {
                $topicPerformanceColors[] = '#10b981'; // green
            } elseif ($avgScore >= 60) {
                $topicPerformanceColors[] = '#f59e0b'; // yellow
            } else {
                $topicPerformanceColors[] = '#ef4444'; // red
            }
        }
        
        $chartData['topicPerformance'] = [
            'labels' => $topicPerformanceLabels,
            'scores' => $topicPerformanceScores,
            'colors' => $topicPerformanceColors
        ];
        
        // 2. Study Time Distribution Chart (Doughnut Chart) - Hours per Lesson
        $timeDistributionLabels = [];
        $timeDistributionMinutes = [];
        $timeDistributionColors = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];
        
        ksort($studyTimeByLesson);
        foreach ($studyTimeByLesson as $lessonNum => $seconds) {
            $hours = round($seconds / 3600, 2);
            $minutes = round($seconds / 60, 1);
            
            if ($hours >= 1) {
                $timeDistributionLabels[] = "Topic $lessonNum (" . number_format($hours, 2) . " hrs)";
            } else {
                $timeDistributionLabels[] = "Topic $lessonNum (" . number_format($minutes, 1) . " min)";
            }
            $timeDistributionMinutes[] = round($minutes, 1);
        }
        
        $chartData['timeDistribution'] = [
            'labels' => $timeDistributionLabels,
            'minutes' => $timeDistributionMinutes,
            'colors' => array_slice($timeDistributionColors, 0, count($timeDistributionLabels))
        ];
        
        // 3. Performance Trend Chart (Line Chart) - Score over time
        $performanceTrendDates = [];
        $performanceTrendScores = [];
        
        // Sort quizzes by date
        $sortedQuizzes = $quizzesByTopic['functions'];
        usort($sortedQuizzes, function($a, $b) {
            return strtotime($a['completed_at']) - strtotime($b['completed_at']);
        });
        
        foreach ($sortedQuizzes as $quiz) {
            $date = date('M d', strtotime($quiz['completed_at']));
            $percentage = ($quiz['score'] / $quiz['total_questions']) * 100;
            
            // Extract topic number for label
            $topicNum = 'Topic ?';
            if (preg_match('/functions_topic_(\d+)/', $quiz['quiz_type'], $matches)) {
                $topicNum = 'Topic ' . $matches[1];
            }
            
            $performanceTrendDates[] = $date . " ($topicNum)";
            $performanceTrendScores[] = round($percentage, 1);
        }
        
        $chartData['performanceTrend'] = [
            'dates' => $performanceTrendDates,
            'scores' => $performanceTrendScores
        ];
    }

    // Return success response matching expected format
    $response = json_encode([
        'success' => true,
        'analysis' => $aiAnalysis,
        'student' => [
            'name' => $studentInfo['first_name'] . ' ' . $studentInfo['last_name'],
            'student_id' => $studentInfo['student_id'],
            'first_name' => $studentInfo['first_name'],
            'last_name' => $studentInfo['last_name']
        ],
        'metrics' => $metrics,
        'chartData' => $chartData,
        'weakAreas' => array_values($weakAreas),
        'recommendations' => array_values($recommendations),
        'studyTime' => [
            'totalMinutes' => $totalStudyMinutes,
            'totalHours' => $totalStudyHours,
            'byLesson' => $studyTimeByLesson
        ],
        'quizDetails' => $quizzesByTopic['functions'] ?? [], // Include detailed quiz data
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
    // Ensure output buffer is clean before sending response
    ob_clean();
    echo $response;
    
    // Flush output to ensure it's sent
    if (ob_get_level() > 0) {
        ob_end_flush();
    }

} catch (PDOException $e) {
    // Database-specific errors
    error_log("Groq AI Performance PDO Error: " . $e->getMessage());
    error_log("SQL State: " . $e->getCode());
    error_log("File: " . $e->getFile() . " Line: " . $e->getLine());
    
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage(),
        'error_type' => 'DATABASE_ERROR'
    ]);
    exit;
} catch (Exception $e) {
    // Log detailed error information
    $errorDetails = [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
    error_log("Groq AI Performance Error: " . json_encode($errorDetails));
    error_log("Stack trace: " . $e->getTraceAsString());
    
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to analyze performance: ' . $e->getMessage(),
        'error_type' => 'GENERAL_ERROR',
        'error_details' => $errorDetails
    ]);
    exit;
} catch (Error $e) {
    // PHP 7+ fatal errors
    error_log("Groq AI Performance Fatal Error: " . $e->getMessage());
    error_log("File: " . $e->getFile() . " Line: " . $e->getLine());
    
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Fatal error: ' . $e->getMessage(),
        'error_type' => 'FATAL_ERROR'
    ]);
    exit;
} catch (Throwable $e) {
    // Catch any other throwable errors
    error_log("Groq AI Performance Throwable Error: " . $e->getMessage());
    error_log("File: " . $e->getFile() . " Line: " . $e->getLine());
    
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Unexpected error: ' . $e->getMessage(),
        'error_type' => 'UNEXPECTED_ERROR'
    ]);
    exit;
}

// Final safety check - ensure we output valid JSON
if (ob_get_level() > 0) {
    $output = ob_get_clean();
    if (!empty(trim($output))) {
        // If there's any output, it means JSON wasn't sent properly
        error_log("Warning: Unexpected output detected: " . substr($output, 0, 500));
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Server error: Unexpected output detected',
            'error_type' => 'OUTPUT_ERROR'
        ]);
        exit;
    }
}
?>
