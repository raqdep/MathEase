<?php
/**
 * Diagnostic script to identify why AI shows 0% metrics
 * Run this to see what data exists and what's missing
 */

session_start();
require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    die('Not logged in');
}

$user_id = $_SESSION['user_id'];
$student_id = $user_id;
$topic = $_GET['topic'] ?? 'functions';

echo "<h1>AI Data Diagnostic Report</h1>";
echo "<h2>User ID: $user_id | Student ID: $student_id | Topic: $topic</h2>";
echo "<hr>";

try {
    // 1. Check Quiz Data
    echo "<h3>1. Quiz Data Check</h3>";
    
    // Check all quiz attempts
    $stmt = $pdo->prepare("
        SELECT 
            id,
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
    $stmt->execute([$student_id]);
    $allQuizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p><strong>Total quiz attempts found:</strong> " . count($allQuizzes) . "</p>";
    
    if (empty($allQuizzes)) {
        echo "<p style='color: red;'>❌ NO QUIZ ATTEMPTS FOUND!</p>";
    } else {
        echo "<table border='1' cellpadding='5'>";
        echo "<tr><th>ID</th><th>Quiz Type</th><th>Score</th><th>Total</th><th>Completed</th><th>Has Answers</th></tr>";
        foreach ($allQuizzes as $quiz) {
            $hasAnswers = !empty($quiz['answers_length']) && $quiz['answers_length'] > 0;
            $matchFunctions = strpos($quiz['quiz_type'], 'functions_topic_') === 0 ? '✅' : '❌';
            echo "<tr>";
            echo "<td>" . $quiz['id'] . "</td>";
            echo "<td>" . htmlspecialchars($quiz['quiz_type']) . " $matchFunctions</td>";
            echo "<td>" . $quiz['score'] . "</td>";
            echo "<td>" . $quiz['total_questions'] . "</td>";
            echo "<td>" . $quiz['completed_at'] . "</td>";
            echo "<td>" . ($hasAnswers ? 'YES' : 'NO') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    // Check Functions topic quizzes specifically
    $stmt = $pdo->prepare("
        SELECT 
            id,
            quiz_type,
            score,
            total_questions,
            completed_at,
            LENGTH(answers_data) as answers_length
        FROM quiz_attempts
        WHERE student_id = ? AND quiz_type LIKE 'functions_topic_%'
        ORDER BY completed_at DESC
    ");
    $stmt->execute([$student_id]);
    $functionsQuizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p><strong>Functions topic quizzes (functions_topic_%):</strong> " . count($functionsQuizzes) . "</p>";
    
    if (empty($functionsQuizzes)) {
        echo "<p style='color: red;'>❌ NO FUNCTIONS TOPIC QUIZZES FOUND!</p>";
        echo "<p>This is why Average Score shows 0%</p>";
    } else {
        $totalScore = 0;
        $totalQuestions = 0;
        foreach ($functionsQuizzes as $quiz) {
            $totalScore += (int)$quiz['score'];
            $totalQuestions += (int)$quiz['total_questions'];
        }
        $avgScore = $totalQuestions > 0 ? round(($totalScore / $totalQuestions) * 100, 1) : 0;
        echo "<p><strong>Calculated Average Score:</strong> $avgScore% (Score: $totalScore / Questions: $totalQuestions)</p>";
    }
    
    echo "<hr>";
    
    // 2. Check Study Time
    echo "<h3>2. Study Time Check</h3>";
    
    $stmt = $pdo->prepare("
        SELECT 
            lesson_number,
            time_spent_seconds,
            last_updated
        FROM study_time
        WHERE student_id = ? AND topic = ?
        ORDER BY lesson_number ASC
    ");
    $stmt->execute([$student_id, $topic]);
    $studyTimeData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p><strong>Study time records found:</strong> " . count($studyTimeData) . "</p>";
    
    if (empty($studyTimeData)) {
        echo "<p style='color: orange;'>⚠️ No study time data found</p>";
    } else {
        $totalSeconds = 0;
        echo "<table border='1' cellpadding='5'>";
        echo "<tr><th>Lesson</th><th>Seconds</th><th>Minutes</th><th>Hours</th><th>Last Updated</th></tr>";
        foreach ($studyTimeData as $time) {
            $seconds = (int)$time['time_spent_seconds'];
            $minutes = round($seconds / 60, 1);
            $hours = round($seconds / 3600, 2);
            $totalSeconds += $seconds;
            
            $isUnrealistic = $seconds > 36000 ? ' style="color: red;"' : '';
            echo "<tr$isUnrealistic>";
            echo "<td>Topic " . $time['lesson_number'] . "</td>";
            echo "<td>" . number_format($seconds) . "</td>";
            echo "<td>" . number_format($minutes, 1) . "</td>";
            echo "<td>" . number_format($hours, 2) . "</td>";
            echo "<td>" . $time['last_updated'] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        $totalHours = round($totalSeconds / 3600, 2);
        echo "<p><strong>Total Study Time:</strong> " . number_format($totalHours, 2) . " hours (" . number_format($totalSeconds) . " seconds)</p>";
        
        if ($totalHours > 50) {
            echo "<p style='color: red;'>⚠️ WARNING: Study time seems unrealistic (>50 hours). Data might be accumulating incorrectly or in wrong units.</p>";
        }
    }
    
    echo "<hr>";
    
    // 3. Check Lesson Completion
    echo "<h3>3. Lesson Completion Check</h3>";
    
    $stmt = $pdo->prepare("
        SELECT 
            lesson_number,
            completed_at
        FROM lesson_completion
        WHERE user_id = ? AND topic_name = ?
        ORDER BY lesson_number ASC
    ");
    $stmt->execute([$user_id, $topic]);
    $lessonData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p><strong>Lessons completed:</strong> " . count($lessonData) . " out of 4</p>";
    
    if (empty($lessonData)) {
        echo "<p style='color: orange;'>⚠️ No lesson completion data found</p>";
    } else {
        echo "<ul>";
        foreach ($lessonData as $lesson) {
            echo "<li>Topic " . $lesson['lesson_number'] . " completed on " . $lesson['completed_at'] . "</li>";
        }
        echo "</ul>";
    }
    
    echo "<hr>";
    
    // 4. Summary and Recommendations
    echo "<h3>4. Summary & Recommendations</h3>";
    
    $issues = [];
    
    if (empty($functionsQuizzes)) {
        $issues[] = "❌ No Functions topic quizzes found - This is why Average Score = 0%";
        $issues[] = "   → Solution: Take quizzes in topics/functions.html";
        $issues[] = "   → Quiz types should be: functions_topic_1, functions_topic_2, etc.";
    }
    
    if (!empty($studyTimeData)) {
        $totalSeconds = array_sum(array_column($studyTimeData, 'time_spent_seconds'));
        $totalHours = round($totalSeconds / 3600, 2);
        if ($totalHours > 50) {
            $issues[] = "⚠️ Study time seems unrealistic ($totalHours hours)";
            $issues[] = "   → Solution: Check if data is accumulating incorrectly";
            $issues[] = "   → Check php/store-study-time.php for accumulation logic";
        }
    }
    
    if (empty($issues)) {
        echo "<p style='color: green;'>✅ All data looks good!</p>";
    } else {
        echo "<ul>";
        foreach ($issues as $issue) {
            echo "<li>$issue</li>";
        }
        echo "</ul>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Database Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}

?>
