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
        // 1st Quarter Topics
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
        // 2nd Quarter Topics
        'simple-interest' => 4,
        'compound-interest' => 5,
        'simple-and-compound-values' => 5,
        'solving-interest-problems' => 5
    ];
    
    // Create mapping from URL-friendly names to display names
    $topicNameMap = [
        'functions' => 'Functions',
        'evaluating-functions' => 'Evaluating Functions',
        'operations-on-functions' => 'Operations on Functions',
        'solving-real-life-problems' => 'Solving Real-Life Problems',
        'rational-functions' => 'Rational Functions',
        'representations-of-rational-functions' => 'Representations of Rational Functions',
        'domain-range-rational-functions' => 'Domain and Range of Rational Functions',
        'domain-range-inverse-functions' => 'Domain and Range of Inverse Functions',
        'one-to-one-functions' => 'One-to-One Functions',
        'solving-rational-equations-inequalities' => 'Solving Rational Equations and Inequalities',
        'simple-interest' => 'Simple Interest',
        'compound-interest' => 'Compound Interest',
        'simple-and-compound-values' => 'Interest, Maturity, Future, and Present Values',
        'interest-maturity-future-present-values' => 'Interest, Maturity, Future, and Present Values',
        'solving-interest-problems' => 'Solving Problems: Simple and Compound Interest',
        'solving-problems-simple-compound-interest' => 'Solving Problems: Simple and Compound Interest'
    ];
    
    $totalLessons = 0;
    $completedLessons = 0;
    $completedTopics = 0;
    $totalTopics = count($topics);
    
    // Get progress for each topic
    foreach ($topics as $topic => $lessonCount) {
        $totalLessons += $lessonCount;
        
        // Get the proper topic name using mapping
        $properTopicName = $topicNameMap[$topic] ?? $topic;
        
        // Get topic_id first
        $topicStmt = $pdo->prepare("SELECT id FROM topics WHERE name = ?");
        $topicStmt->execute([$properTopicName]);
        $topicData = $topicStmt->fetch();
        
        if (!$topicData) {
            // Topic doesn't exist in database, skip it
            continue;
        }
        
        $topic_id = $topicData['id'];
        
        // Check if topic is completed (100% progress)
        $stmt = $pdo->prepare("
            SELECT completed 
            FROM user_topic_progress 
            WHERE user_id = ? AND topic_id = ? AND completed = TRUE
        ");
        $stmt->execute([$user_id, $topic_id]);
        $topicProgress = $stmt->fetch();
        
        if ($topicProgress) {
            $completedTopics++;
            $completedLessons += $lessonCount;
            $progressData[$topic] = [
                'completed' => true,
                'progress' => 100,
                'lessons_completed' => $lessonCount,
                'total_lessons' => $lessonCount
            ];
        } else {
            // Get lesson completions from user_lesson_progress (dashboard/lessons table)
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as completed_count
                FROM user_lesson_progress ulp
                JOIN lessons l ON ulp.lesson_id = l.id
                WHERE ulp.user_id = ? AND l.topic_id = ? AND ulp.completed = TRUE
            ");
            $stmt->execute([$user_id, $topic_id]);
            $fromUlp = (int) ($stmt->fetch()['completed_count'] ?? 0);

            // Also get from lesson_completion (used by topics/functions.html and other topic pages)
            $fromLessonCompletion = 0;
            try {
                // Try both the topic key and the proper topic name
                $lcStmt = $pdo->prepare("
                    SELECT COUNT(DISTINCT lesson_number) as completed_count
                    FROM lesson_completion
                    WHERE user_id = ? AND (topic_name = ? OR topic_name = ?)
                ");
                $properTopicName = $topicNameMap[$topic] ?? $topic;
                $lcStmt->execute([$user_id, $topic, $properTopicName]);
                $fromLessonCompletion = (int) ($lcStmt->fetch()['completed_count'] ?? 0);
            } catch (PDOException $e) {
                // lesson_completion table may not exist for all setups
                error_log("Error checking lesson_completion: " . $e->getMessage());
            }

            // Use the higher count so progress from topic pages (e.g. functions.html) is reflected
            $lessonCountCompleted = max($fromUlp, $fromLessonCompletion);
            $lessonCountCompleted = min($lessonCountCompleted, $topics[$topic]); // cap at total

            $completedLessons += $lessonCountCompleted;
            $progress = $lessonCountCompleted > 0 ? ($lessonCountCompleted / $topics[$topic]) * 100 : 0;

            if ($lessonCountCompleted >= $topics[$topic]) {
                // All lessons complete: mark as completed and sync user_topic_progress to completed
                $completedTopics++;
                $progressData[$topic] = [
                    'completed' => true,
                    'progress' => 100,
                    'lessons_completed' => $lessonCountCompleted,
                    'total_lessons' => $topics[$topic]
                ];

                $syncStmt = $pdo->prepare(
                    "INSERT INTO user_topic_progress (user_id, topic_id, completed, last_attempt, created_at, updated_at)
                     VALUES (?, ?, TRUE, NOW(), NOW(), NOW())
                     ON DUPLICATE KEY UPDATE
                        completed = TRUE,
                        last_attempt = NOW(),
                        updated_at = NOW()"
                );
                $syncStmt->execute([$user_id, $topic_id]);
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
