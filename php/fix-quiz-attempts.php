<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Only allow teachers to run this fix
if (!is_teacher_logged_in()) {
    echo json_encode([
        'success' => false,
        'message' => 'Teacher authentication required'
    ]);
    exit;
}

try {
    // Check for quiz attempts that might have incorrect status
    $stmt = $pdo->prepare("
        SELECT id, student_id, quiz_type, status, completed_at, score, total_questions
        FROM quiz_attempts 
        WHERE status = 'completed' AND (completed_at IS NULL OR score = 0)
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $problematicAttempts = $stmt->fetchAll();
    
    $fixedCount = 0;
    
    foreach ($problematicAttempts as $attempt) {
        // Check if this attempt should be marked as abandoned instead of completed
        if ($attempt['completed_at'] === null || $attempt['score'] == 0) {
            // Update status to abandoned
            $updateStmt = $pdo->prepare("
                UPDATE quiz_attempts 
                SET status = 'abandoned' 
                WHERE id = ?
            ");
            $updateStmt->execute([$attempt['id']]);
            $fixedCount++;
            
            echo "Fixed attempt ID {$attempt['id']} for student {$attempt['student_id']} in quiz {$attempt['quiz_type']}\n";
        }
    }
    
    // Also check for any attempts that are marked as completed but have no answers
    $stmt = $pdo->prepare("
        SELECT qa.id, qa.student_id, qa.quiz_type, qa.status
        FROM quiz_attempts qa
        LEFT JOIN quiz_answers qans ON qa.id = qans.attempt_id
        WHERE qa.status = 'completed' AND qans.id IS NULL
    ");
    $stmt->execute();
    $noAnswersAttempts = $stmt->fetchAll();
    
    foreach ($noAnswersAttempts as $attempt) {
        // Update status to abandoned since there are no answers
        $updateStmt = $pdo->prepare("
            UPDATE quiz_attempts 
            SET status = 'abandoned' 
            WHERE id = ?
        ");
        $updateStmt->execute([$attempt['id']]);
        $fixedCount++;
        
        echo "Fixed attempt ID {$attempt['id']} for student {$attempt['student_id']} in quiz {$attempt['quiz_type']} (no answers)\n";
    }
    
    echo json_encode([
        'success' => true,
        'message' => "Fixed $fixedCount problematic quiz attempts",
        'fixed_count' => $fixedCount
    ]);
    
} catch (Exception $e) {
    error_log("Error fixing quiz attempts: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fix quiz attempts: ' . $e->getMessage()
    ]);
}
?>
