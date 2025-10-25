<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Ensure student is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$studentId = $_SESSION['user_id'];

try {
    $activities = [];
    
    // Get recent lesson progress
    $stmt = $pdo->prepare("
        SELECT 
            'lesson_completed' as activity_type,
            'Lesson Completed' as title,
            CONCAT('Completed lesson: ', l.lesson_title) as description,
            up.updated_at as activity_date,
            'emerald' as color,
            'fas fa-book-open' as icon
        FROM user_progress up
        JOIN lessons l ON up.lesson_id = l.id
        WHERE up.user_id = ? AND up.completed = 1
        ORDER BY up.updated_at DESC
        LIMIT 5
    ");
    $stmt->execute([$studentId]);
    $lessonActivities = $stmt->fetchAll();
    
    // Get recent quiz attempts
    $stmt = $pdo->prepare("
        SELECT 
            'quiz_completed' as activity_type,
            'Quiz Completed' as title,
            CONCAT('Completed quiz: ', q.quiz_title) as description,
            uqa.completed_at as activity_date,
            'blue' as color,
            'fas fa-question-circle' as icon
        FROM user_quiz_attempts uqa
        JOIN quizzes q ON uqa.quiz_id = q.id
        WHERE uqa.user_id = ? AND uqa.status = 'completed' AND uqa.status != 'reset'
        ORDER BY uqa.completed_at DESC
        LIMIT 5
    ");
    $stmt->execute([$studentId]);
    $quizActivities = $stmt->fetchAll();
    
    // Get recent topic progress
    $stmt = $pdo->prepare("
        SELECT 
            'topic_progress' as activity_type,
            'Topic Progress' as title,
            CONCAT('Made progress in: ', t.topic_name) as description,
            utp.updated_at as activity_date,
            'purple' as color,
            'fas fa-chart-line' as icon
        FROM user_topic_progress utp
        JOIN topics t ON utp.topic_id = t.id
        WHERE utp.user_id = ? AND utp.progress_percentage > 0
        ORDER BY utp.updated_at DESC
        LIMIT 5
    ");
    $stmt->execute([$studentId]);
    $topicActivities = $stmt->fetchAll();
    
    // Get account creation activity
    $stmt = $pdo->prepare("
        SELECT 
            'account_created' as activity_type,
            'Account Created' as title,
            'Welcome to MathEase! Your account has been created successfully.' as description,
            created_at as activity_date,
            'indigo' as color,
            'fas fa-user-plus' as icon
        FROM users
        WHERE id = ?
    ");
    $stmt->execute([$studentId]);
    $accountActivity = $stmt->fetch();
    
    // Combine all activities
    $allActivities = array_merge($lessonActivities, $quizActivities, $topicActivities);
    
    if ($accountActivity) {
        $allActivities[] = $accountActivity;
    }
    
    // Sort by date (most recent first)
    usort($allActivities, function($a, $b) {
        return strtotime($b['activity_date']) - strtotime($a['activity_date']);
    });
    
    // Limit to 10 most recent activities
    $activities = array_slice($allActivities, 0, 10);
    
    // Format dates
    foreach ($activities as &$activity) {
        $activity['time_ago'] = timeAgo($activity['activity_date']);
    }
    
    echo json_encode([
        'success' => true,
        'activities' => $activities
    ]);
    
} catch (Exception $e) {
    error_log("Error fetching student activities: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching activities'
    ]);
}

function timeAgo($datetime) {
    $time = time() - strtotime($datetime);
    
    if ($time < 60) return 'Just now';
    if ($time < 3600) return floor($time/60) . ' minutes ago';
    if ($time < 86400) return floor($time/3600) . ' hours ago';
    if ($time < 2592000) return floor($time/86400) . ' days ago';
    if ($time < 31536000) return floor($time/2592000) . ' months ago';
    return floor($time/31536000) . ' years ago';
}
?>
