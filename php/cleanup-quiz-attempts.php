<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Only allow teachers to run this cleanup
if (!is_teacher_logged_in()) {
    echo json_encode([
        'success' => false,
        'message' => 'Teacher authentication required'
    ]);
    exit;
}

try {
    // Check for problematic quiz attempts
    $stmt = $pdo->prepare("
        SELECT id, student_id, quiz_type, status, completed_at, score, total_questions, created_at
        FROM quiz_attempts 
        WHERE quiz_type = 'operations-on-functions' 
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $attempts = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'message' => 'Operations on Functions Quiz attempts found',
        'attempts' => $attempts,
        'count' => count($attempts)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error checking quiz attempts: ' . $e->getMessage()
    ]);
}
?>
