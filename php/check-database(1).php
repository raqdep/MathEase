<?php
// Database connection check and fix script
require_once 'config.php';

echo "<h2>Database Connection Check</h2>";

try {
    // Test database connection
    $stmt = $pdo->query("SELECT DATABASE() as current_db");
    $result = $stmt->fetch();
    echo "<p><strong>Current Database:</strong> " . $result['current_db'] . "</p>";
    
    // Check if users table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    $usersTable = $stmt->fetch();
    
    if ($usersTable) {
        echo "<p><strong>Users table:</strong> ✅ Exists</p>";
        
        // Check user count
        $stmt = $pdo->query("SELECT COUNT(*) as user_count FROM users");
        $userCount = $stmt->fetch();
        echo "<p><strong>User count:</strong> " . $userCount['user_count'] . "</p>";
        
        // Show first few users
        $stmt = $pdo->query("SELECT id, first_name, last_name, email FROM users LIMIT 5");
        $users = $stmt->fetchAll();
        echo "<p><strong>Sample users:</strong></p>";
        echo "<ul>";
        foreach ($users as $user) {
            echo "<li>ID: {$user['id']}, Name: {$user['first_name']} {$user['last_name']}, Email: {$user['email']}</li>";
        }
        echo "</ul>";
        
    } else {
        echo "<p><strong>Users table:</strong> ❌ Does not exist</p>";
        echo "<p>Please run the main database schema first: <code>database/mathease_schema.sql</code></p>";
    }
    
    // Check if quiz_attempts table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'quiz_attempts'");
    $quizAttemptsTable = $stmt->fetch();
    
    if ($quizAttemptsTable) {
        echo "<p><strong>Quiz attempts table:</strong> ✅ Exists</p>";
        
        // Check quiz attempts count
        $stmt = $pdo->query("SELECT COUNT(*) as attempt_count FROM quiz_attempts");
        $attemptCount = $stmt->fetch();
        echo "<p><strong>Quiz attempts count:</strong> " . $attemptCount['attempt_count'] . "</p>";
        
    } else {
        echo "<p><strong>Quiz attempts table:</strong> ❌ Does not exist</p>";
        echo "<p>Please run the quiz migration: <code>database/quiz_system_migration_fixed.sql</code></p>";
    }
    
    // Test foreign key constraint
    if ($usersTable && $quizAttemptsTable) {
        echo "<h3>Testing Foreign Key Constraint</h3>";
        
        // Get first user ID
        $stmt = $pdo->query("SELECT id FROM users LIMIT 1");
        $firstUser = $stmt->fetch();
        
        if ($firstUser) {
            try {
                // Try to insert a test quiz attempt
                $stmt = $pdo->prepare("
                    INSERT INTO quiz_attempts (student_id, quiz_type, status) 
                    VALUES (?, 'test', 'in_progress')
                ");
                $stmt->execute([$firstUser['id']]);
                $attemptId = $pdo->lastInsertId();
                
                echo "<p><strong>Foreign key test:</strong> ✅ Success (Attempt ID: {$attemptId})</p>";
                
                // Clean up test record
                $stmt = $pdo->prepare("DELETE FROM quiz_attempts WHERE id = ?");
                $stmt->execute([$attemptId]);
                echo "<p><strong>Test cleanup:</strong> ✅ Completed</p>";
                
            } catch (Exception $e) {
                echo "<p><strong>Foreign key test:</strong> ❌ Failed - " . $e->getMessage() . "</p>";
            }
        }
    }
    
} catch (Exception $e) {
    echo "<p><strong>Database Error:</strong> " . $e->getMessage() . "</p>";
}

echo "<h3>Next Steps:</h3>";
echo "<ol>";
echo "<li>If users table doesn't exist, run: <code>mysql -u root -p mathease_db < database/mathease_schema.sql</code></li>";
echo "<li>If quiz_attempts table doesn't exist, run: <code>mysql -u root -p mathease_db < database/quiz_system_migration_fixed.sql</code></li>";
echo "<li>Make sure you're logged in as a student before taking the quiz</li>";
echo "<li>Test the quiz functionality</li>";
echo "</ol>";
?>
