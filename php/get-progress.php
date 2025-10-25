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

$user_id = $_SESSION['user_id'];

// Debug: Add user_id to response for debugging
$debug_info = [
    'session_id' => session_id(),
    'user_id' => $user_id,
    'session_data' => $_SESSION
];

try {
    // Check database connection
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }
    
    // Get overall progress data
    $progressData = [];
    
    // Define all topics and their lesson counts (course-wide)
    $topics = [
        'functions' => 4,
        'evaluating-functions' => 4,
        'operations-on-functions' => 5,
        'solving-real-life-problems' => 4,
        'rational-functions' => 4,
        // Additional topics
        'solving-rational-equations-inequalities' => 4,
        'representations-of-rational-functions' => 4,
        'domain-range-rational-functions' => 4,
        'one-to-one-functions' => 4,
        'domain-range-inverse-functions' => 4
    ];
    
    $totalLessons = 0;
    $completedLessons = 0;
    $completedTopics = 0;
    $totalTopics = count($topics);
    
    // Get progress for each topic
    foreach ($topics as $topic => $lessonCount) {
        $totalLessons += $lessonCount;
        
        // Check if topic is completed (100% progress)
        $stmt = $pdo->prepare("
            SELECT progress_percentage 
            FROM topic_progress 
            WHERE user_id = ? AND topic_name = ?
        ");
        $stmt->execute([$user_id, $topic]);
        $topicProgress = $stmt->fetch();
        
        if ($topicProgress && $topicProgress['progress_percentage'] >= 100) {
            $completedTopics++;
            $completedLessons += $lessonCount;
            $progressData[$topic] = [
                'completed' => true,
                'progress' => 100,
                'lessons_completed' => $lessonCount,
                'total_lessons' => $lessonCount
            ];
        } else {
            // Get individual lesson completions for this topic
            $stmt = $pdo->prepare(
                "SELECT COUNT(*) as completed_count
                FROM lesson_completion 
                WHERE user_id = ? AND topic_name = ?"
            );
            $stmt->execute([$user_id, $topic]);
            $lessonCountCompleted = $stmt->fetch()['completed_count'];

            $completedLessons += $lessonCountCompleted;
            $progress = $lessonCountCompleted > 0 ? ($lessonCountCompleted / $topics[$topic]) * 100 : 0;

            if ($lessonCountCompleted >= $topics[$topic]) {
                // All lessons complete: mark as completed and sync topic_progress to 100%
                $completedTopics++;
                $progressData[$topic] = [
                    'completed' => true,
                    'progress' => 100,
                    'lessons_completed' => $lessonCountCompleted,
                    'total_lessons' => $topics[$topic]
                ];

                $syncStmt = $pdo->prepare(
                    "INSERT INTO topic_progress (user_id, topic_name, lessons_completed, total_lessons, progress_percentage, created_at, updated_at)
                     VALUES (?, ?, ?, ?, 100.00, NOW(), NOW())
                     ON DUPLICATE KEY UPDATE
                        lessons_completed = VALUES(lessons_completed),
                        total_lessons = VALUES(total_lessons),
                        progress_percentage = 100.00,
                        updated_at = NOW()"
                );
                $syncStmt->execute([$user_id, $topic, $lessonCountCompleted, $topics[$topic]]);
            } else {
                $progressData[$topic] = [
                    'completed' => false,
                    'progress' => round($progress, 1),
                    'lessons_completed' => $lessonCountCompleted,
                    'total_lessons' => $topics[$topic]
                ];
            }
        }
    }
    
    // Calculate overall progress
    $overallProgress = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 1) : 0;
    $topicProgress = $totalTopics > 0 ? round(($completedTopics / $totalTopics) * 100, 1) : 0;
    
    // Get user stats
    $stmt = $pdo->prepare("
        SELECT total_score, current_topic 
        FROM user_progress 
        WHERE user_id = ?
    ");
    $stmt->execute([$user_id]);
    $userStats = $stmt->fetch();
    
    // Use the calculated completed_lessons instead of the one from user_progress table
    $userStatsData = $userStats ?: [
        'total_score' => 0,
        'current_topic' => 'functions'
    ];
    $userStatsData['completed_lessons'] = $completedLessons; // Use calculated value
    
    echo json_encode([
        'success' => true,
        'overall_progress' => $overallProgress,
        'topic_progress' => $topicProgress,
        'completed_lessons' => $completedLessons,
        'total_lessons' => $totalLessons,
        'completed_topics' => $completedTopics,
        'total_topics' => $totalTopics,
        'topics' => $progressData,
        'user_stats' => $userStatsData,
        'debug' => $debug_info
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
