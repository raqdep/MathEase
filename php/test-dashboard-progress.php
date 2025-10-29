<?php
// Test script for dashboard progress functionality
session_start();
require_once 'config.php';

echo "<h2>Dashboard Progress Test</h2>\n";

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo "<p style='color: red;'>❌ No user logged in. Please log in first.</p>\n";
    echo "<p><a href='../login.html'>Go to Login</a></p>\n";
    exit;
}

$user_id = $_SESSION['user_id'];
echo "<p style='color: green;'>✅ User logged in: User ID {$user_id}</p>\n";

try {
    echo "<h3>Test 1: Functions Topic Progress</h3>\n";
    
    // Get Functions topic ID
    $topicStmt = $pdo->prepare("SELECT id FROM topics WHERE name = ?");
    $topicStmt->execute(['functions']);
    $topicData = $topicStmt->fetch();
    
    if ($topicData) {
        $topic_id = $topicData['id'];
        echo "<p style='color: green;'>✅ Functions topic found (ID: {$topic_id})</p>\n";
        
        // Check lesson completions
        $lessonStmt = $pdo->prepare("
            SELECT COUNT(*) as completed_count
            FROM user_lesson_progress ulp
            JOIN lessons l ON ulp.lesson_id = l.id
            WHERE ulp.user_id = ? AND l.topic_id = ? AND ulp.completed = TRUE
        ");
        $lessonStmt->execute([$user_id, $topic_id]);
        $completedCount = $lessonStmt->fetch()['completed_count'];
        
        echo "<p style='color: blue;'>ℹ️ Completed lessons: {$completedCount}</p>\n";
        
        // Check topic completion
        $topicStmt = $pdo->prepare("
            SELECT completed FROM user_topic_progress 
            WHERE user_id = ? AND topic_id = ? AND completed = TRUE
        ");
        $topicStmt->execute([$user_id, $topic_id]);
        $topicCompleted = $topicStmt->fetch();
        
        if ($topicCompleted) {
            echo "<p style='color: green;'>✅ Functions topic is marked as completed</p>\n";
        } else {
            echo "<p style='color: orange;'>⚠️ Functions topic is not marked as completed</p>\n";
        }
        
        // List individual lesson completions
        $detailStmt = $pdo->prepare("
            SELECT l.order_index, l.title, ulp.completed, ulp.last_accessed
            FROM lessons l
            LEFT JOIN user_lesson_progress ulp ON l.id = ulp.lesson_id AND ulp.user_id = ?
            WHERE l.topic_id = ?
            ORDER BY l.order_index
        ");
        $detailStmt->execute([$user_id, $topic_id]);
        $lessons = $detailStmt->fetchAll();
        
        echo "<h4>Lesson Details:</h4>\n";
        echo "<ul>\n";
        foreach ($lessons as $lesson) {
            $status = $lesson['completed'] ? '✅ Completed' : '❌ Not completed';
            $lastAccess = $lesson['last_accessed'] ? " (Last: {$lesson['last_accessed']})" : '';
            echo "<li>Lesson {$lesson['order_index']}: {$lesson['title']} - {$status}{$lastAccess}</li>\n";
        }
        echo "</ul>\n";
        
    } else {
        echo "<p style='color: red;'>❌ Functions topic not found</p>\n";
    }
    
    echo "<h3>Test 2: Overall Progress Calculation</h3>\n";
    
    // Test the progress calculation logic
    $topics = [
        'functions' => 4,
        'evaluating-functions' => 4,
        'operations-on-functions' => 5,
        'solving-real-life-problems' => 4,
        'rational-functions' => 4
    ];
    
    $totalLessons = 0;
    $completedLessons = 0;
    $completedTopics = 0;
    
    foreach ($topics as $topic => $lessonCount) {
        $totalLessons += $lessonCount;
        
        // Get topic_id
        $topicStmt = $pdo->prepare("SELECT id FROM topics WHERE name = ?");
        $topicStmt->execute([$topic]);
        $topicData = $topicStmt->fetch();
        
        if ($topicData) {
            $topic_id = $topicData['id'];
            
            // Check if topic is completed
            $topicStmt = $pdo->prepare("
                SELECT completed FROM user_topic_progress 
                WHERE user_id = ? AND topic_id = ? AND completed = TRUE
            ");
            $topicStmt->execute([$user_id, $topic_id]);
            $topicCompleted = $topicStmt->fetch();
            
            if ($topicCompleted) {
                $completedTopics++;
                $completedLessons += $lessonCount;
                echo "<p style='color: green;'>✅ {$topic}: Completed ({$lessonCount} lessons)</p>\n";
            } else {
                // Get individual lesson completions
                $lessonStmt = $pdo->prepare("
                    SELECT COUNT(*) as completed_count
                    FROM user_lesson_progress ulp
                    JOIN lessons l ON ulp.lesson_id = l.id
                    WHERE ulp.user_id = ? AND l.topic_id = ? AND ulp.completed = TRUE
                ");
                $lessonStmt->execute([$user_id, $topic_id]);
                $lessonCountCompleted = $lessonStmt->fetch()['completed_count'];
                
                $completedLessons += $lessonCountCompleted;
                $progress = $lessonCountCompleted > 0 ? ($lessonCountCompleted / $lessonCount) * 100 : 0;
                
                echo "<p style='color: blue;'>ℹ️ {$topic}: {$lessonCountCompleted}/{$lessonCount} lessons ({$progress}%)</p>\n";
            }
        }
    }
    
    $overallProgress = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 1) : 0;
    $topicProgress = count($topics) > 0 ? round(($completedTopics / count($topics)) * 100, 1) : 0;
    
    echo "<h4>Summary:</h4>\n";
    echo "<ul>\n";
    echo "<li>Total Lessons: {$totalLessons}</li>\n";
    echo "<li>Completed Lessons: {$completedLessons}</li>\n";
    echo "<li>Completed Topics: {$completedTopics}</li>\n";
    echo "<li>Overall Progress: {$overallProgress}%</li>\n";
    echo "<li>Topic Progress: {$topicProgress}%</li>\n";
    echo "</ul>\n";
    
    echo "<h3>Test 3: API Response Test</h3>\n";
    
    // Test the actual API endpoint
    $apiUrl = 'php/get-progress.php';
    echo "<p><a href='{$apiUrl}' target='_blank'>Test API Response</a></p>\n";
    
    echo "<h3 style='color: green;'>🎉 Progress test completed!</h3>\n";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>\n";
}

echo "<hr>";
echo "<p><a href='../dashboard.html'>← Back to Dashboard</a></p>";
echo "<p><a href='../topics/functions.html'>📚 Go to Functions Topic</a></p>";
?>
