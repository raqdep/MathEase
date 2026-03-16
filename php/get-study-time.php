<?php
/**
 * Get Study Time for AI Analysis
 * Retrieves study time data for a specific topic
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
// Use user_id so AI performance and analytics can find data (session student_id is student number)
$student_id = $user_id;
$topic = $_GET['topic'] ?? 'functions';

try {
    // Check database connection
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }
    
    // Query study time data
    $stmt = $pdo->prepare("
        SELECT 
            lesson_number,
            time_spent_seconds
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
    
    // Organize by lesson number
    $studyTime = [];
    foreach ($studyTimeData as $time) {
        $studyTime[$time['lesson_number']] = (int) $time['time_spent_seconds'];
    }
    
    echo json_encode([
        'success' => true,
        'studyTime' => $studyTime,
        'topic' => $topic
    ]);
    
} catch (Exception $e) {
    error_log("Get Study Time Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to get study time: ' . $e->getMessage(),
        'studyTime' => []
    ]);
}
?>
