<?php
session_start();
require_once 'config.php';

// Only allow teachers to run this script
if (!is_teacher_logged_in()) {
    echo json_encode(['success' => false, 'message' => 'Teacher authentication required']);
    exit;
}

try {
    // Clear all evaluating-functions quiz attempts
    $stmt = $pdo->prepare("DELETE FROM quiz_attempts WHERE quiz_type = 'evaluating-functions'");
    $stmt->execute();
    
    $deletedCount = $stmt->rowCount();
    
    echo json_encode([
        'success' => true, 
        'message' => "Cleared $deletedCount evaluating-functions quiz attempts",
        'deleted_count' => $deletedCount
    ]);
    
} catch (Exception $e) {
    error_log("Error clearing evaluating-functions attempts: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to clear attempts: ' . $e->getMessage()]);
}
?>
