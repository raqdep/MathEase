<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

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
    // Log the incoming request
    error_log("Complete lesson request: " . json_encode($input));
    
    // Check database connection
    if (!$pdo) {
        error_log("Database connection failed");
        throw new Exception('Database connection failed');
    }
    
    // Ensure lesson_completion table exists
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS lesson_completion (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                topic_name VARCHAR(255) NOT NULL,
                lesson_number INT NOT NULL,
                completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_lesson_completion (user_id, topic_name, lesson_number),
                INDEX idx_user_topic (user_id, topic_name),
                INDEX idx_topic_lesson (topic_name, lesson_number),
                INDEX idx_completed_at (completed_at)
            )
        ");
    } catch (PDOException $e) {
        error_log("Error creating lesson_completion table: " . $e->getMessage());
        // Continue anyway - table might already exist
    }
    
    error_log("Processing action: " . $action . " for topic: " . $topic . " lesson: " . $lesson);
    
    switch ($action) {
        case 'complete':
            if (!$topic || !$lesson) {
                error_log("Missing topic or lesson: topic=" . $topic . ", lesson=" . $lesson);
                throw new Exception('Topic and lesson are required');
            }
            
            error_log("Completing lesson: user_id=" . $user_id . ", topic=" . $topic . ", lesson=" . $lesson);
            
            // Use lesson_completion table directly (simpler approach)
            // Check if lesson completion already exists
            $checkStmt = $pdo->prepare("
                SELECT id FROM lesson_completion 
                WHERE user_id = ? AND topic_name = ? AND lesson_number = ?
            ");
            $checkStmt->execute([$user_id, $topic, $lesson]);
            
            if ($checkStmt->rowCount() > 0) {
                error_log("Updating existing lesson completion");
                // Update existing completion timestamp
                $updateStmt = $pdo->prepare("
                    UPDATE lesson_completion 
                    SET completed_at = NOW()
                    WHERE user_id = ? AND topic_name = ? AND lesson_number = ?
                ");
                $updateStmt->execute([$user_id, $topic, $lesson]);
            } else {
                error_log("Creating new lesson completion");
                // Insert new completion
                $insertStmt = $pdo->prepare("
                    INSERT INTO lesson_completion (user_id, topic_name, lesson_number, completed_at)
                    VALUES (?, ?, ?, NOW())
                ");
                $insertStmt->execute([$user_id, $topic, $lesson]);
            }
            
            error_log("Lesson completion successful");
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
            
            // Get completed lessons directly from lesson_completion table
            $stmt = $pdo->prepare("
                SELECT lesson_number
                FROM lesson_completion
                WHERE user_id = ? AND topic_name = ?
                ORDER BY lesson_number ASC
            ");
            $stmt->execute([$user_id, $topic]);
            $completed_lessons = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Convert to integers
            $completed_lessons = array_map('intval', $completed_lessons);
            
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
            
            // Get topic_id
            $topicStmt = $pdo->prepare("SELECT id FROM topics WHERE name = ?");
            $topicStmt->execute([$topic]);
            $topicData = $topicStmt->fetch();
            
            if (!$topicData) {
                throw new Exception('Topic not found: ' . $topic);
            }
            
            $topic_id = $topicData['id'];
            
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as completed_count,
                    MAX(l.order_index) as last_completed_lesson
                FROM user_lesson_progress ulp
                JOIN lessons l ON ulp.lesson_id = l.id
                WHERE ulp.user_id = ? AND l.topic_id = ? AND ulp.completed = TRUE
            ");
            $stmt->execute([$user_id, $topic_id]);
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
            
            // Define expected lessons for each topic
            $topicLessonCounts = [
                'functions' => 4,
                'evaluating-functions' => 4,
                'operations-on-functions' => 5,
                'solving-real-life-problems' => 4,
                'rational-functions' => 4,
                'solving-rational-equations-inequalities' => 4,
                'representations-of-rational-functions' => 4,
                'domain-range-rational-functions' => 4,
                'one-to-one-functions' => 4,
                'domain-range-inverse-functions' => 4,
            'simple-interest' => 4,
            'compound-interest' => 5,
            'simple-and-compound-values' => 5,
            'solving-interest-problems' => 5
            ];
            
            $expectedLessons = $topicLessonCounts[$topic] ?? 4;
            
            // Get completed lessons count from lesson_completion table
            $stmt = $pdo->prepare("
                SELECT COUNT(DISTINCT lesson_number) as completed_count
                FROM lesson_completion
                WHERE user_id = ? AND topic_name = ?
            ");
            $stmt->execute([$user_id, $topic]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $completedCount = $result['completed_count'] ?? 0;
            
            if ($completedCount < $expectedLessons) {
                throw new Exception("Please complete all lessons before marking the topic as complete. You have completed {$completedCount} of {$expectedLessons} lessons.");
            }
            
            // Sync to user_topic_progress so dashboard shows topic as completed
            $topicNameMap = [
                'functions' => 'Functions',
                'evaluating-functions' => 'Evaluating Functions',
                'operations-on-functions' => 'Operations on Functions',
                'solving-real-life-problems' => 'Solving Real-Life Problems',
                'rational-functions' => 'Rational Functions',
                'solving-rational-equations-inequalities' => 'Solving Rational Equations and Inequalities',
                'representations-of-rational-functions' => 'Representations of Rational Functions',
                'domain-range-rational-functions' => 'Domain and Range of Rational Functions',
                'one-to-one-functions' => 'One-to-One Functions',
                'domain-range-inverse-functions' => 'Domain and Range of Inverse Functions',
                'simple-interest' => 'Simple Interest',
                'compound-interest' => 'Compound Interest',
                'simple-and-compound-values' => 'Interest, Maturity, Future, and Present Values',
                'solving-interest-problems' => 'Solving Problems: Simple and Compound Interest'
            ];
            $properName = $topicNameMap[$topic] ?? ucfirst(str_replace('-', ' ', $topic));
            $topicStmt = $pdo->prepare("SELECT id FROM topics WHERE name = ?");
            $topicStmt->execute([$properName]);
            $topicRow = $topicStmt->fetch(PDO::FETCH_ASSOC);
            if ($topicRow) {
                try {
                    $syncStmt = $pdo->prepare("
                        INSERT INTO user_topic_progress (user_id, topic_id, completed, last_attempt, created_at, updated_at)
                        VALUES (?, ?, TRUE, NOW(), NOW(), NOW())
                        ON DUPLICATE KEY UPDATE completed = TRUE, last_attempt = NOW(), updated_at = NOW()
                    ");
                    $syncStmt->execute([$user_id, $topicRow['id']]);
                } catch (PDOException $e) {
                    error_log("complete_topic: sync user_topic_progress failed: " . $e->getMessage());
                }
            }
            
            $message = "Topic '{$topic}' marked as complete! All {$completedCount} lessons completed.";
            
            echo json_encode([
                'success' => true,
                'message' => $message,
                'completed_lessons' => $completedCount,
                'total_lessons' => $expectedLessons
            ]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    error_log("Complete lesson error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage(),
        'debug_info' => [
            'action' => $action,
            'topic' => $topic,
            'lesson' => $lesson,
            'user_id' => $user_id ?? 'not_set'
        ]
    ]);
}

// Function to update user progress (simplified - no longer needed but kept for compatibility)
function updateUserProgress($pdo, $user_id, $topic) {
    // This function is kept for compatibility but doesn't need to do anything
    // since we're using lesson_completion table directly
    error_log("updateUserProgress called for user_id: $user_id, topic: $topic");
    // No action needed - lesson_completion table is the source of truth
}

?>
