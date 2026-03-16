<?php
/**
 * Debug script to check if quiz data is being saved properly
 * Run this to verify quiz attempts and answers_data are stored correctly
 */

session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];
$topic = $_GET['topic'] ?? 'functions';

try {
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }
    
    // Check if quiz_attempts table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'quiz_attempts'");
    $tableExists = $tableCheck->rowCount() > 0;
    
    $result = [
        'success' => true,
        'user_id' => $user_id,
        'topic' => $topic,
        'table_exists' => $tableExists,
        'attempts' => []
    ];
    
    if ($tableExists) {
        // Check if answers_data column exists
        $columnCheck = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'answers_data'");
        $hasAnswersData = $columnCheck->rowCount() > 0;
        $result['has_answers_data_column'] = $hasAnswersData;
        
        // Get all quiz attempts
        $quizTypePattern = $topic === 'functions' ? 'functions_topic_%' : $topic . '%';
        $stmt = $pdo->prepare("
            SELECT 
                id,
                quiz_type,
                score,
                total_questions,
                time_taken_seconds,
                LENGTH(answers_data) as answers_data_length,
                answers_data IS NULL as answers_data_is_null,
                answers_data = '' as answers_data_is_empty,
                completed_at
            FROM quiz_attempts
            WHERE student_id = ? 
            AND quiz_type LIKE ?
            ORDER BY completed_at DESC
            LIMIT 10
        ");
        
        $stmt->execute([$user_id, $quizTypePattern]);
        $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($attempts as $attempt) {
            $attemptInfo = [
                'id' => $attempt['id'],
                'quiz_type' => $attempt['quiz_type'],
                'score' => $attempt['score'],
                'total_questions' => $attempt['total_questions'],
                'answers_data_length' => $attempt['answers_data_length'] ?? 0,
                'answers_data_is_null' => (bool)$attempt['answers_data_is_null'],
                'answers_data_is_empty' => (bool)$attempt['answers_data_is_empty'],
                'completed_at' => $attempt['completed_at']
            ];
            
            // Try to decode answers_data if it exists
            if (!$attempt['answers_data_is_null'] && !$attempt['answers_data_is_empty']) {
                $stmt2 = $pdo->prepare("SELECT answers_data FROM quiz_attempts WHERE id = ?");
                $stmt2->execute([$attempt['id']]);
                $row = $stmt2->fetch(PDO::FETCH_ASSOC);
                
                if ($row && !empty($row['answers_data'])) {
                    $decoded = json_decode($row['answers_data'], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $attemptInfo['answers_count'] = is_array($decoded) ? count($decoded) : 0;
                        $attemptInfo['json_valid'] = true;
                        
                        // Check structure of first answer
                        if (is_array($decoded) && count($decoded) > 0) {
                            $firstAnswer = $decoded[0];
                            $attemptInfo['first_answer_structure'] = [
                                'has_question' => isset($firstAnswer['question']),
                                'has_isCorrect' => isset($firstAnswer['isCorrect']),
                                'has_selectedText' => isset($firstAnswer['selectedText']),
                                'has_correctText' => isset($firstAnswer['correctText']),
                                'isCorrect_value' => $firstAnswer['isCorrect'] ?? null
                            ];
                        }
                    } else {
                        $attemptInfo['json_valid'] = false;
                        $attemptInfo['json_error'] = json_last_error_msg();
                    }
                }
            }
            
            $result['attempts'][] = $attemptInfo;
        }
        
        $result['total_attempts_found'] = count($attempts);
    }
    
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error' => $e->getMessage()
    ]);
}
?>
