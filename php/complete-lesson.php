<?php
// Disable error display to prevent HTML output
error_reporting(0);
ini_set('display_errors', 0);

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

$action = $input['action'] ?? '';
$topic = $input['topic'] ?? '';
$lesson = $input['lesson'] ?? null;
$user_id = $_SESSION['user_id'];

try {
    // Check database connection
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }
    
    // Check if required tables exist
    $tablesCheck = $pdo->query("SHOW TABLES LIKE 'lesson_completion'");
    if ($tablesCheck->rowCount() == 0) {
        throw new Exception('Database tables not found. Please run the database migration first.');
    }
    
    switch ($action) {
        case 'complete':
            if (!$topic || !$lesson) {
                throw new Exception('Topic and lesson are required');
            }
            
            // Check if lesson completion already exists
            $checkStmt = $pdo->prepare("
                SELECT id FROM lesson_completion 
                WHERE user_id = ? AND topic_name = ? AND lesson_number = ?
            ");
            $checkStmt->execute([$user_id, $topic, $lesson]);
            
            if ($checkStmt->rowCount() > 0) {
                // Update existing completion
                $updateStmt = $pdo->prepare("
                    UPDATE lesson_completion 
                    SET completed_at = NOW()
                    WHERE user_id = ? AND topic_name = ? AND lesson_number = ?
                ");
                $updateStmt->execute([$user_id, $topic, $lesson]);
            } else {
                // Insert new completion
                $insertStmt = $pdo->prepare("
                    INSERT INTO lesson_completion (user_id, topic_name, lesson_number, completed_at)
                    VALUES (?, ?, ?, NOW())
                ");
                $insertStmt->execute([$user_id, $topic, $lesson]);
            }
            
            // Update user progress
            updateUserProgress($pdo, $user_id, $topic);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Lesson completed successfully',
                'lesson' => $lesson,
                'topic' => $topic
            ]);
            break;
            
        case 'get_completed':
            if (!$topic) {
                throw new Exception('Topic is required');
            }
            
            $stmt = $pdo->prepare("
                SELECT lesson_number 
                FROM lesson_completion 
                WHERE user_id = ? AND topic_name = ?
                ORDER BY lesson_number
            ");
            $stmt->execute([$user_id, $topic]);
            $completed_lessons = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            echo json_encode([
                'success' => true,
                'completed_lessons' => $completed_lessons,
                'total_completed' => count($completed_lessons)
            ]);
            break;
            
        case 'get_progress':
            if (!$topic) {
                throw new Exception('Topic is required');
            }
            
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as completed_count,
                    MAX(lesson_number) as last_completed_lesson
                FROM lesson_completion 
                WHERE user_id = ? AND topic_name = ?
            ");
            $stmt->execute([$user_id, $topic]);
            $progress = $stmt->fetch();
            
            echo json_encode([
                'success' => true,
                'progress' => $progress
            ]);
            break;
            
        case 'complete_topic':
            if (!$topic) {
                throw new Exception('Topic is required');
            }
            
            // Check if all lessons are completed
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as completed_count
                FROM lesson_completion 
                WHERE user_id = ? AND topic_name = ?
            ");
            $stmt->execute([$user_id, $topic]);
            $completedCount = $stmt->fetch()['completed_count'];
            
            // Define total lessons per topic
            $totalLessons = [
                'functions' => 4,
                'evaluating-functions' => 4,
                'operations-on-functions' => 5,
                'solving-real-life-problems' => 4,
                'rational-functions' => 4
            ];
            
            $total = $totalLessons[$topic] ?? 4;
            
            if ($completedCount < $total) {
                throw new Exception("Please complete all lessons before marking the topic as complete. You have completed {$completedCount} of {$total} lessons.");
            }
            
            // Check if user has already received points for this topic (BEFORE updating)
            $checkStmt = $pdo->prepare("
                SELECT progress_percentage FROM topic_progress 
                WHERE user_id = ? AND topic_name = ? AND progress_percentage >= 100
            ");
            $checkStmt->execute([$user_id, $topic]);
            $existingProgress = $checkStmt->fetch();
            
            // Only award points if this is the first time completing the topic
            $pointsToAdd = 0;
            if (!$existingProgress) {
                $pointsToAdd = 50; // Bonus points for completing a topic for the first time
            }
            
            // Mark topic as completed in topic_progress table
            $stmt = $pdo->prepare("
                INSERT INTO topic_progress (user_id, topic_name, lessons_completed, total_lessons, progress_percentage, created_at, updated_at) 
                VALUES (?, ?, ?, ?, 100.00, NOW(), NOW())
                ON DUPLICATE KEY UPDATE 
                    lessons_completed = ?,
                    total_lessons = ?,
                    progress_percentage = 100.00,
                    updated_at = NOW()
            ");
            $stmt->execute([$user_id, $topic, $total, $total, $total, $total]);
            
            // Update main user_progress table
            $stmt = $pdo->prepare("
                UPDATE user_progress 
                SET 
                    total_score = total_score + ?,
                    completed_lessons = (SELECT COUNT(*) FROM lesson_completion WHERE user_id = ?),
                    current_topic = ?,
                    updated_at = NOW()
                WHERE user_id = ?
            ");
            $stmt->execute([$pointsToAdd, $user_id, $topic, $user_id]);
            
            $message = "Topic '{$topic}' marked as complete!";
            if ($pointsToAdd > 0) {
                $message .= " You earned {$pointsToAdd} bonus points!";
            } else {
                $message .= " (No additional points - already completed before)";
            }
            
            echo json_encode([
                'success' => true,
                'message' => $message,
                'completed_lessons' => $completedCount,
                'total_lessons' => $total,
                'points_awarded' => $pointsToAdd
            ]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage()
    ]);
}

// Function to update user progress
function updateUserProgress($pdo, $user_id, $topic) {
    // Get total lessons completed for this topic
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as completed_count
        FROM lesson_completion 
        WHERE user_id = ? AND topic_name = ?
    ");
    $stmt->execute([$user_id, $topic]);
    $count = $stmt->fetch()['completed_count'];
    
    // Define total lessons per topic
    $total_lessons = [
        'functions' => 4,
        'evaluating-functions' => 4,
        'operations-on-functions' => 5,
        'solving-real-life-problems' => 4,
        'rational-functions' => 4
    ];
    
    $total = $total_lessons[$topic] ?? 4;
    $progress_percentage = ($count / $total) * 100;
    
    // Update main user_progress table (existing structure)
    $checkStmt = $pdo->prepare("
        SELECT id FROM user_progress 
        WHERE user_id = ?
    ");
    $checkStmt->execute([$user_id]);
    
    if ($checkStmt->rowCount() > 0) {
        // Update existing progress
        $updateStmt = $pdo->prepare("
            UPDATE user_progress 
            SET completed_lessons = ?, current_topic = ?, updated_at = NOW()
            WHERE user_id = ?
        ");
        $updateStmt->execute([$count, $topic, $user_id]);
    } else {
        // Insert new progress record
        $insertStmt = $pdo->prepare("
            INSERT INTO user_progress (user_id, completed_lessons, current_topic, created_at, updated_at)
            VALUES (?, ?, ?, NOW(), NOW())
        ");
        $insertStmt->execute([$user_id, $count, $topic]);
    }
    
    // Update topic-specific progress table
    $checkTopicStmt = $pdo->prepare("
        SELECT id FROM topic_progress 
        WHERE user_id = ? AND topic_name = ?
    ");
    $checkTopicStmt->execute([$user_id, $topic]);
    
    if ($checkTopicStmt->rowCount() > 0) {
        // Update existing topic progress
        $updateTopicStmt = $pdo->prepare("
            UPDATE topic_progress 
            SET lessons_completed = ?, progress_percentage = ?, updated_at = NOW()
            WHERE user_id = ? AND topic_name = ?
        ");
        $updateTopicStmt->execute([$count, $progress_percentage, $user_id, $topic]);
    } else {
        // Insert new topic progress record
        $insertTopicStmt = $pdo->prepare("
            INSERT INTO topic_progress (user_id, topic_name, lessons_completed, total_lessons, progress_percentage, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $insertTopicStmt->execute([$user_id, $topic, $count, $total, $progress_percentage]);
    }
}

?>
