<?php
/**
 * Diagnostic script to check if quiz data is being stored correctly
 * Run this to see what data the AI can access
 */

session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];
$student_id = $user_id;

try {
    // Check quiz_attempts table structure
    $columns = $pdo->query("SHOW COLUMNS FROM quiz_attempts")->fetchAll(PDO::FETCH_COLUMN);
    echo "=== QUIZ_ATTEMPTS TABLE COLUMNS ===\n";
    print_r($columns);
    echo "\n";
    
    // Check if answers_data column exists
    $hasAnswersData = in_array('answers_data', $columns);
    echo "Has answers_data column: " . ($hasAnswersData ? 'YES' : 'NO') . "\n\n";
    
    // Get all quiz attempts for this student
    $stmt = $pdo->prepare("
        SELECT 
            id,
            quiz_type,
            score,
            total_questions,
            completed_at,
            answers_data,
            LENGTH(answers_data) as answers_length
        FROM quiz_attempts
        WHERE student_id = ?
        ORDER BY completed_at DESC
        LIMIT 20
    ");
    $stmt->execute([$student_id]);
    $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "=== QUIZ ATTEMPTS FOR STUDENT_ID: $student_id ===\n";
    echo "Total attempts found: " . count($attempts) . "\n\n";
    
    foreach ($attempts as $idx => $attempt) {
        echo "Attempt #" . ($idx + 1) . ":\n";
        echo "  ID: " . $attempt['id'] . "\n";
        echo "  Quiz Type: " . $attempt['quiz_type'] . "\n";
        echo "  Score: " . $attempt['score'] . "/" . $attempt['total_questions'] . "\n";
        echo "  Completed: " . $attempt['completed_at'] . "\n";
        
        $hasAnswers = !empty($attempt['answers_data']) && 
                      $attempt['answers_data'] !== 'null' && 
                      trim($attempt['answers_data']) !== '';
        
        echo "  Has answers_data: " . ($hasAnswers ? 'YES' : 'NO') . "\n";
        echo "  Answers length: " . ($attempt['answers_length'] ?? 0) . " bytes\n";
        
        if ($hasAnswers) {
            $answers = json_decode($attempt['answers_data'], true);
            if ($answers && is_array($answers)) {
                echo "  Answers count: " . count($answers) . "\n";
                if (count($answers) > 0) {
                    echo "  First answer structure: " . json_encode(array_keys($answers[0])) . "\n";
                }
            } else {
                echo "  ERROR: answers_data exists but cannot be decoded as JSON\n";
                echo "  JSON Error: " . json_last_error_msg() . "\n";
            }
        } else {
            echo "  ⚠️ WARNING: No answers_data - AI cannot analyze this quiz!\n";
        }
        echo "\n";
    }
    
    // Check Functions topic quizzes specifically
    $stmt = $pdo->prepare("
        SELECT 
            id,
            quiz_type,
            score,
            total_questions,
            completed_at,
            answers_data,
            LENGTH(answers_data) as answers_length
        FROM quiz_attempts
        WHERE student_id = ? AND quiz_type LIKE 'functions_topic_%'
        ORDER BY completed_at DESC
    ");
    $stmt->execute([$student_id]);
    $functionsQuizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "=== FUNCTIONS TOPIC QUIZZES (functions_topic_%) ===\n";
    echo "Total Functions quizzes: " . count($functionsQuizzes) . "\n\n";
    
    foreach ($functionsQuizzes as $idx => $quiz) {
        $hasAnswers = !empty($quiz['answers_data']) && 
                      $quiz['answers_data'] !== 'null' && 
                      trim($quiz['answers_data']) !== '';
        
        echo "Functions Quiz #" . ($idx + 1) . ":\n";
        echo "  Type: " . $quiz['quiz_type'] . "\n";
        echo "  Score: " . $quiz['score'] . "/" . $quiz['total_questions'] . "\n";
        echo "  Has answers_data: " . ($hasAnswers ? 'YES ✓' : 'NO ✗') . "\n";
        echo "  Answers length: " . ($quiz['answers_length'] ?? 0) . " bytes\n";
        echo "\n";
    }
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    echo "SQL State: " . $e->getCode() . "\n";
}
