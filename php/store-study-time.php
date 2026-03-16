<?php
/**
 * Store Study Time for AI Analysis
 * Tracks how long students spend on each lesson
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

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

$user_id = $_SESSION['user_id'];
// Use user_id so AI performance and analytics can find data (session student_id is student number)
$student_id = $user_id;
$topic = $input['topic'] ?? '';
$study_time = $input['study_time'] ?? []; // Array of lesson => seconds

try {
    // Check database connection
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }
    
    // Create study_time table if it doesn't exist
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
    
    // Store/update study time for each lesson
    // IMPORTANT: Validate seconds value to prevent unrealistic accumulation
    foreach ($study_time as $lessonNum => $seconds) {
        // CRITICAL: Check if lesson is already completed
        // If completed, only allow final save (when is_final flag is set)
        $isFinal = $input['is_final'] ?? false;
        
        $completionCheckStmt = $pdo->prepare("
            SELECT id FROM lesson_completion 
            WHERE user_id = ? AND topic_name = ? AND lesson_number = ?
        ");
        $completionCheckStmt->execute([$student_id, $topic, $lessonNum]);
        $isCompleted = $completionCheckStmt->rowCount() > 0;
        
        // If lesson is completed and this is not a final save, skip it
        if ($isCompleted && !$isFinal) {
            error_log("WARNING: Attempted to update study time for completed lesson $lessonNum (topic: $topic, user: $student_id). Skipping update.");
            continue; // Skip this lesson
        }
        
        // Validate: ensure seconds is reasonable (not milliseconds, not negative, not too large)
        $seconds = (int)$seconds;
        
        // If seconds > 86400 (24 hours), might be in milliseconds - convert
        if ($seconds > 86400 && $seconds < 86400000) {
            error_log("WARNING: Study time for lesson $lessonNum appears to be in milliseconds ($seconds), converting to seconds");
            $seconds = round($seconds / 1000);
        }
        
        // Cap at reasonable maximum (10 hours = 36000 seconds per lesson)
        if ($seconds > 36000) {
            error_log("WARNING: Study time for lesson $lessonNum is unrealistic ($seconds seconds = " . round($seconds/3600, 2) . " hours), capping at 10 hours");
            $seconds = 36000;
        }
        
        // Ensure non-negative
        if ($seconds < 0) {
            $seconds = 0;
        }
        
        // Check current value to prevent excessive accumulation
        $checkStmt = $pdo->prepare("
            SELECT time_spent_seconds 
            FROM study_time 
            WHERE student_id = ? AND topic = ? AND lesson_number = ?
        ");
        $checkStmt->execute([$student_id, $topic, $lessonNum]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            $currentSeconds = (int)$existing['time_spent_seconds'];
            
            // If lesson is completed and this is a final save, update to the final value (don't accumulate)
            if ($isCompleted && $isFinal) {
                error_log("Final save for completed lesson $lessonNum: Setting time to $seconds seconds (was $currentSeconds)");
                $stmt = $pdo->prepare("
                    UPDATE study_time 
                    SET time_spent_seconds = ?, last_updated = NOW()
                    WHERE student_id = ? AND topic = ? AND lesson_number = ?
                ");
                $stmt->execute([$seconds, $student_id, $topic, $lessonNum]);
            } else if ($input['delta'] ?? false) {
                // Client sends DELTA only (e.g. evaluating-functions) — ADD to avoid double count
                $stmt = $pdo->prepare("
                    INSERT INTO study_time (student_id, topic, lesson_number, time_spent_seconds, last_updated)
                    VALUES (?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                        time_spent_seconds = time_spent_seconds + VALUES(time_spent_seconds),
                        last_updated = NOW()
                ");
                $stmt->execute([$student_id, $topic, $lessonNum, $seconds]);
            } else if (($currentSeconds + $seconds) > 36000) {
                // If adding would exceed 10 hours, just update to the new value (don't accumulate)
                error_log("WARNING: Accumulated study time would exceed 10 hours for lesson $lessonNum, updating instead of accumulating");
                $stmt = $pdo->prepare("
                    UPDATE study_time 
                    SET time_spent_seconds = ?, last_updated = NOW()
                    WHERE student_id = ? AND topic = ? AND lesson_number = ?
                ");
                $stmt->execute([$seconds, $student_id, $topic, $lessonNum]);
            } else {
                // Client sends TOTAL (e.g. functions.html) — SET with GREATEST so we never decrease
                $stmt = $pdo->prepare("
                    INSERT INTO study_time (student_id, topic, lesson_number, time_spent_seconds, last_updated)
                    VALUES (?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                        time_spent_seconds = GREATEST(time_spent_seconds, ?),
                        last_updated = NOW()
                ");
                $stmt->execute([$student_id, $topic, $lessonNum, $seconds, $seconds]);
            }
        } else {
            // New entry
            $stmt = $pdo->prepare("
                INSERT INTO study_time (student_id, topic, lesson_number, time_spent_seconds, last_updated)
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$student_id, $topic, $lessonNum, $seconds]);
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Study time stored successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Store Study Time Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to store study time: ' . $e->getMessage()
    ]);
}
?>
