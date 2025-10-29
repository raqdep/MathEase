<?php
// Test script for lesson completion functionality
session_start();
require_once 'config.php';

echo "<h2>Lesson Completion Test</h2>\n";

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo "<p style='color: red;'>❌ No user logged in. Please log in first.</p>\n";
    echo "<p><a href='../login.html'>Go to Login</a></p>\n";
    exit;
}

$user_id = $_SESSION['user_id'];
echo "<p style='color: green;'>✅ User logged in: User ID {$user_id}</p>\n";

try {
    // Test 1: Check if tables exist
    echo "<h3>Test 1: Database Tables Check</h3>\n";
    
    $tables = ['lesson_completion', 'topic_progress', 'user_progress'];
    foreach ($tables as $table) {
        $check = $pdo->query("SHOW TABLES LIKE '{$table}'");
        if ($check->rowCount() > 0) {
            echo "<p style='color: green;'>✅ Table '{$table}' exists</p>\n";
        } else {
            echo "<p style='color: red;'>❌ Table '{$table}' does not exist</p>\n";
        }
    }
    
    // Test 2: Check current lesson completions
    echo "<h3>Test 2: Current Lesson Completions</h3>\n";
    
    $stmt = $pdo->prepare("
        SELECT topic_name, lesson_number, completed_at 
        FROM lesson_completion 
        WHERE user_id = ? 
        ORDER BY topic_name, lesson_number
    ");
    $stmt->execute([$user_id]);
    $completions = $stmt->fetchAll();
    
    if (count($completions) > 0) {
        echo "<p style='color: green;'>✅ Found " . count($completions) . " completed lessons:</p>\n";
        echo "<ul>\n";
        foreach ($completions as $completion) {
            echo "<li>{$completion['topic_name']} - Lesson {$completion['lesson_number']} (completed at {$completion['completed_at']})</li>\n";
        }
        echo "</ul>\n";
    } else {
        echo "<p style='color: orange;'>⚠️ No completed lessons found for this user.</p>\n";
    }
    
    // Test 3: Test lesson completion
    echo "<h3>Test 3: Test Lesson Completion</h3>\n";
    
    // Simulate completing lesson 1 of functions topic
    $testTopic = 'functions';
    $testLesson = 1;
    
    // Check if already completed
    $checkStmt = $pdo->prepare("
        SELECT id FROM lesson_completion 
        WHERE user_id = ? AND topic_name = ? AND lesson_number = ?
    ");
    $checkStmt->execute([$user_id, $testTopic, $testLesson]);
    
    if ($checkStmt->rowCount() > 0) {
        echo "<p style='color: blue;'>ℹ️ Lesson {$testLesson} of topic '{$testTopic}' is already completed.</p>\n";
    } else {
        // Insert new completion
        $insertStmt = $pdo->prepare("
            INSERT INTO lesson_completion (user_id, topic_name, lesson_number, completed_at)
            VALUES (?, ?, ?, NOW())
        ");
        $insertStmt->execute([$user_id, $testTopic, $testLesson]);
        
        echo "<p style='color: green;'>✅ Successfully completed lesson {$testLesson} of topic '{$testTopic}'!</p>\n";
    }
    
    // Test 4: Check user progress
    echo "<h3>Test 4: User Progress Check</h3>\n";
    
    $progressStmt = $pdo->prepare("
        SELECT * FROM user_progress WHERE user_id = ?
    ");
    $progressStmt->execute([$user_id]);
    $progress = $progressStmt->fetch();
    
    if ($progress) {
        echo "<p style='color: green;'>✅ User progress found:</p>\n";
        echo "<ul>\n";
        echo "<li>Total Score: {$progress['total_score']}</li>\n";
        echo "<li>Completed Lessons: {$progress['completed_lessons']}</li>\n";
        echo "<li>Current Topic: {$progress['current_topic']}</li>\n";
        echo "</ul>\n";
    } else {
        echo "<p style='color: red;'>❌ No user progress found.</p>\n";
    }
    
    // Test 5: Check topic progress
    echo "<h3>Test 5: Topic Progress Check</h3>\n";
    
    $topicProgressStmt = $pdo->prepare("
        SELECT * FROM topic_progress WHERE user_id = ? AND topic_name = ?
    ");
    $topicProgressStmt->execute([$user_id, $testTopic]);
    $topicProgress = $topicProgressStmt->fetch();
    
    if ($topicProgress) {
        echo "<p style='color: green;'>✅ Topic progress for '{$testTopic}' found:</p>\n";
        echo "<ul>\n";
        echo "<li>Lessons Completed: {$topicProgress['lessons_completed']}</li>\n";
        echo "<li>Total Lessons: {$topicProgress['total_lessons']}</li>\n";
        echo "<li>Progress Percentage: {$topicProgress['progress_percentage']}%</li>\n";
        echo "</ul>\n";
    } else {
        echo "<p style='color: red;'>❌ No topic progress found for '{$testTopic}'.</p>\n";
    }
    
    echo "<h3 style='color: green;'>🎉 All tests completed!</h3>\n";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>\n";
}

echo "<hr>";
echo "<p><a href='../topics/functions.html'>← Back to Functions Topic</a></p>";
echo "<p><a href='check-and-create-tables.php'>🔧 Run Database Setup</a></p>";
?>
