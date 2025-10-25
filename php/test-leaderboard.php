<?php
// Test leaderboard functionality
session_start();
require_once 'config.php';

echo "<h2>Leaderboard Test</h2>";

try {
    // Set a test user session
    $_SESSION['user_id'] = 8; // Use existing user
    
    // Test the leaderboard query
    $stmt = $pdo->prepare("
        SELECT 
            ql.attempt_id,
            ql.student_id,
            ql.student_name,
            ql.score,
            ql.total_questions,
            ql.percentage,
            ql.completion_time,
            ql.formatted_time,
            ql.completed_at,
            ql.quiz_date,
            ql.rank_position,
            CASE WHEN ql.student_id = ? THEN 1 ELSE 0 END as is_current_user
        FROM quiz_leaderboard ql
        WHERE ql.quiz_type = ? 
        ORDER BY ql.rank_position 
        LIMIT 10
    ");
    $stmt->execute([8, 'functions']);
    $leaderboard = $stmt->fetchAll();
    
    echo "<h3>Leaderboard Results:</h3>";
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Rank</th><th>Student</th><th>Score</th><th>Time</th><th>Date</th><th>Current User</th></tr>";
    
    foreach ($leaderboard as $student) {
        $isCurrentUser = $student['is_current_user'] ? 'Yes' : 'No';
        echo "<tr>";
        echo "<td>{$student['rank_position']}</td>";
        echo "<td>{$student['student_name']}</td>";
        echo "<td>{$student['score']}/{$student['total_questions']} ({$student['percentage']}%)</td>";
        echo "<td>{$student['formatted_time']}</td>";
        echo "<td>{$student['quiz_date']}</td>";
        echo "<td>{$isCurrentUser}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Test statistics
    echo "<h3>Statistics:</h3>";
    $stmt = $pdo->prepare("SELECT * FROM quiz_statistics WHERE quiz_type = ?");
    $stmt->execute(['functions']);
    $stats = $stmt->fetch();
    
    if ($stats) {
        echo "<ul>";
        echo "<li>Total Attempts: {$stats['total_attempts']}</li>";
        echo "<li>Unique Students: {$stats['unique_students']}</li>";
        echo "<li>Average Score: " . round($stats['average_score'], 1) . "</li>";
        echo "<li>Average Time: " . round($stats['average_time']) . " seconds</li>";
        echo "<li>Highest Score: {$stats['highest_score']}</li>";
        echo "<li>Fastest Time: {$stats['fastest_time']} seconds</li>";
        echo "<li>Average Percentage: " . round($stats['average_percentage'], 1) . "%</li>";
        echo "</ul>";
    } else {
        echo "<p>No statistics available</p>";
    }
    
    echo "<h3>✅ Leaderboard Test Passed!</h3>";
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>
