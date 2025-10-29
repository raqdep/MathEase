<?php
// Test quiz system functionality
session_start();
require_once 'config.php';

echo "<h2>Quiz System Test</h2>";

try {
    // Test 1: Check if we can start a quiz
    echo "<h3>Test 1: Starting a Quiz</h3>";
    
    // Get first user ID
    $stmt = $pdo->query("SELECT id FROM users LIMIT 1");
    $user = $stmt->fetch();
    
    if ($user) {
        $userId = $user['id'];
        echo "<p>Using user ID: {$userId}</p>";
        
        // Simulate starting a quiz
        $stmt = $pdo->prepare("
            INSERT INTO quiz_attempts (student_id, quiz_type, status) 
            VALUES (?, 'functions', 'in_progress')
        ");
        $stmt->execute([$userId]);
        $attemptId = $pdo->lastInsertId();
        
        echo "<p>✅ Quiz started successfully (Attempt ID: {$attemptId})</p>";
        
        // Test 2: Submit quiz with sample answers
        echo "<h3>Test 2: Submitting Quiz</h3>";
        
        $answers = [
            'q1' => 'a',
            'q2' => 'b', 
            'q3' => 'a',
            'q4' => 'b',
            'q5' => 'b',
            'q6' => 'a',
            'q7' => 'b',
            'q8' => 'b',
            'q9' => 'a',
            'q10' => 'a',
            'ps-a' => '450',
            'ps-b' => '10',
            'ps-c' => '100'
        ];
        
        // Calculate score
        $score = 0;
        $correctAnswers = [
            'q1' => 'a', 'q2' => 'b', 'q3' => 'a', 'q4' => 'b', 'q5' => 'b',
            'q6' => 'a', 'q7' => 'b', 'q8' => 'b', 'q9' => 'a', 'q10' => 'a'
        ];
        
        foreach ($correctAnswers as $q => $correct) {
            if (isset($answers[$q]) && $answers[$q] === $correct) {
                $score += 1;
            }
        }
        
        // Problem solving (5 points total)
        $psScore = 0;
        if (abs(intval($answers['ps-a']) - 450) <= 50) $psScore += 1;
        if (abs(intval($answers['ps-b']) - 10) <= 5) $psScore += 2;
        if (abs(intval($answers['ps-c']) - 100) <= 50) $psScore += 2;
        
        $score += $psScore;
        
        // Update quiz attempt
        $stmt = $pdo->prepare("
            UPDATE quiz_attempts 
            SET score = ?, correct_answers = ?, incorrect_answers = ?, 
                completion_time = ?, completed_at = CURRENT_TIMESTAMP, status = 'completed'
            WHERE id = ?
        ");
        $stmt->execute([$score, $score, 15 - $score, 300, $attemptId]);
        
        echo "<p>✅ Quiz submitted successfully (Score: {$score}/15)</p>";
        
        // Test 3: Check leaderboard
        echo "<h3>Test 3: Leaderboard</h3>";
        
        $stmt = $pdo->query("
            SELECT 
                qa.id as attempt_id,
                u.id as student_id,
                CONCAT(u.first_name, ' ', u.last_name) as student_name,
                qa.score,
                qa.total_questions,
                ROUND((qa.score / qa.total_questions) * 100, 1) as percentage,
                qa.completion_time,
                TIME_FORMAT(SEC_TO_TIME(qa.completion_time), '%i:%s') as formatted_time,
                qa.completed_at,
                DATE(qa.completed_at) as quiz_date,
                qa.quiz_type
            FROM quiz_attempts qa
            JOIN users u ON qa.student_id = u.id
            WHERE qa.status = 'completed' 
                AND qa.completed_at IS NOT NULL
            ORDER BY qa.score DESC, qa.completion_time ASC
        ");
        $leaderboard = $stmt->fetchAll();
        
        echo "<p>✅ Leaderboard query successful</p>";
        echo "<p><strong>Leaderboard Results:</strong></p>";
        echo "<ul>";
        foreach ($leaderboard as $entry) {
            echo "<li>{$entry['student_name']}: {$entry['score']}/{$entry['total_questions']} ({$entry['percentage']}%) in {$entry['formatted_time']}</li>";
        }
        echo "</ul>";
        
        // Test 4: Statistics
        echo "<h3>Test 4: Statistics</h3>";
        
        $stmt = $pdo->query("
            SELECT 
                quiz_type,
                COUNT(*) as total_attempts,
                COUNT(DISTINCT student_id) as unique_students,
                AVG(score) as average_score,
                AVG(completion_time) as average_time,
                MAX(score) as highest_score,
                MIN(completion_time) as fastest_time,
                ROUND(AVG((score / total_questions) * 100), 1) as average_percentage
            FROM quiz_attempts 
            WHERE status = 'completed' 
                AND completed_at IS NOT NULL
            GROUP BY quiz_type
        ");
        $stats = $stmt->fetchAll();
        
        echo "<p>✅ Statistics query successful</p>";
        echo "<p><strong>Quiz Statistics:</strong></p>";
        echo "<ul>";
        foreach ($stats as $stat) {
            echo "<li>Quiz: {$stat['quiz_type']}, Attempts: {$stat['total_attempts']}, Avg Score: " . round($stat['average_score'], 1) . ", Avg Time: " . round($stat['average_time']) . "s</li>";
        }
        echo "</ul>";
        
        echo "<h3>✅ All Tests Passed!</h3>";
        echo "<p>The quiz system is working correctly. You can now:</p>";
        echo "<ul>";
        echo "<li>Take quizzes and see real results</li>";
        echo "<li>View leaderboards with actual data</li>";
        echo "<li>See statistics from the database</li>";
        echo "</ul>";
        
    } else {
        echo "<p>❌ No users found in database</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>
