<?php
/**
 * Quick test to see if quiz data is being saved
 * Run this after taking a quiz to verify data was saved
 */

session_start();
require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    die('Not logged in. Please log in first.');
}

$user_id = $_SESSION['user_id'];

echo "<h1>Quiz Data Test</h1>";
echo "<p>User ID: $user_id</p>";
echo "<hr>";

try {
    // Check ALL quiz attempts for this user
    $stmt = $pdo->prepare("
        SELECT 
            id,
            student_id,
            quiz_type,
            score,
            total_questions,
            completed_at,
            LENGTH(answers_data) as answers_length
        FROM quiz_attempts
        WHERE student_id = ?
        ORDER BY completed_at DESC
        LIMIT 20
    ");
    $stmt->execute([$user_id]);
    $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h2>All Quiz Attempts for User ID: $user_id</h2>";
    echo "<p>Found: " . count($quizzes) . " quiz attempts</p>";
    
    if (empty($quizzes)) {
        echo "<p style='color: red; font-size: 20px;'>❌ NO QUIZ ATTEMPTS FOUND!</p>";
        echo "<p>This means:</p>";
        echo "<ul>";
        echo "<li>Either no quizzes have been taken yet</li>";
        echo "<li>Or quizzes are being saved with a different student_id</li>";
        echo "<li>Or there's an error preventing quiz data from being saved</li>";
        echo "</ul>";
        echo "<p><strong>Action:</strong> Take a quiz in topics/functions.html and check PHP error logs</p>";
    } else {
        echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th>ID</th><th>Student ID</th><th>Quiz Type</th><th>Score</th><th>Total</th><th>Completed</th><th>Has Answers</th>";
        echo "</tr>";
        
        $functionsCount = 0;
        foreach ($quizzes as $quiz) {
            $isFunctions = strpos($quiz['quiz_type'], 'functions_topic_') === 0;
            if ($isFunctions) $functionsCount++;
            
            $hasAnswers = !empty($quiz['answers_length']) && $quiz['answers_length'] > 0;
            $rowColor = $isFunctions ? '#e8f5e9' : '#fff';
            
            echo "<tr style='background: $rowColor;'>";
            echo "<td>" . $quiz['id'] . "</td>";
            echo "<td>" . $quiz['student_id'] . "</td>";
            echo "<td><strong>" . htmlspecialchars($quiz['quiz_type']) . "</strong>" . ($isFunctions ? ' ✅' : '') . "</td>";
            echo "<td>" . $quiz['score'] . "</td>";
            echo "<td>" . $quiz['total_questions'] . "</td>";
            echo "<td>" . $quiz['completed_at'] . "</td>";
            echo "<td>" . ($hasAnswers ? '✅ YES (' . $quiz['answers_length'] . ' bytes)' : '❌ NO') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        echo "<hr>";
        echo "<h3>Summary</h3>";
        echo "<p><strong>Total quiz attempts:</strong> " . count($quizzes) . "</p>";
        echo "<p><strong>Functions topic quizzes (functions_topic_%):</strong> $functionsCount</p>";
        
        if ($functionsCount == 0) {
            echo "<p style='color: red;'>⚠️ No Functions topic quizzes found!</p>";
            echo "<p>This is why AI shows 0 attempts.</p>";
            echo "<p><strong>Possible reasons:</strong></p>";
            echo "<ul>";
            echo "<li>Quizzes are being saved with different quiz_type format</li>";
            echo "<li>Quizzes are being saved with different student_id</li>";
            echo "<li>Check PHP error logs for errors during quiz save</li>";
            echo "</ul>";
        } else {
            echo "<p style='color: green;'>✅ Found $functionsCount Functions topic quizzes!</p>";
            echo "<p>If AI still shows 0, check groq-ai-performance.php query logic.</p>";
        }
    }
    
    echo "<hr>";
    echo "<h3>Next Steps</h3>";
    echo "<ol>";
    echo "<li>If no quizzes found: Take a quiz and check PHP error logs</li>";
    echo "<li>If quizzes found but wrong quiz_type: Check topics/functions.html quiz_type format</li>";
    echo "<li>If quizzes found but wrong student_id: Check store-quiz-data.php student_id assignment</li>";
    echo "<li>Run: <a href='diagnose-ai-data.php?topic=functions'>diagnose-ai-data.php</a> for full diagnostic</li>";
    echo "</ol>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Database Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}

?>
