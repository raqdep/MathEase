<?php
// Script to check and create required database tables for lesson completion
require_once 'config.php';

echo "<h2>Database Table Check and Creation</h2>\n";

try {
    // Check if lesson_completion table exists
    $tablesCheck = $pdo->query("SHOW TABLES LIKE 'lesson_completion'");
    if ($tablesCheck->rowCount() == 0) {
        echo "<p style='color: red;'>❌ lesson_completion table does not exist. Creating it...</p>\n";
        
        // Create lesson_completion table
        $createLessonCompletion = "
        CREATE TABLE IF NOT EXISTS lesson_completion (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            topic_name VARCHAR(255) NOT NULL,
            lesson_number INT NOT NULL,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_lesson_completion (user_id, topic_name, lesson_number),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_topic (user_id, topic_name),
            INDEX idx_topic_lesson (topic_name, lesson_number),
            INDEX idx_completed_at (completed_at)
        )";
        
        $pdo->exec($createLessonCompletion);
        echo "<p style='color: green;'>✅ lesson_completion table created successfully!</p>\n";
    } else {
        echo "<p style='color: green;'>✅ lesson_completion table exists.</p>\n";
    }
    
    // Check if topic_progress table exists
    $tablesCheck2 = $pdo->query("SHOW TABLES LIKE 'topic_progress'");
    if ($tablesCheck2->rowCount() == 0) {
        echo "<p style='color: red;'>❌ topic_progress table does not exist. Creating it...</p>\n";
        
        // Create topic_progress table
        $createTopicProgress = "
        CREATE TABLE IF NOT EXISTS topic_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            topic_name VARCHAR(255) NOT NULL,
            lessons_completed INT DEFAULT 0,
            total_lessons INT DEFAULT 4,
            progress_percentage DECIMAL(5,2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_topic_progress (user_id, topic_name),
            INDEX idx_user_topic_progress (user_id),
            INDEX idx_topic_progress (topic_name)
        )";
        
        $pdo->exec($createTopicProgress);
        echo "<p style='color: green;'>✅ topic_progress table created successfully!</p>\n";
    } else {
        echo "<p style='color: green;'>✅ topic_progress table exists.</p>\n";
    }
    
    // Check if user_progress table exists
    $tablesCheck3 = $pdo->query("SHOW TABLES LIKE 'user_progress'");
    if ($tablesCheck3->rowCount() == 0) {
        echo "<p style='color: red;'>❌ user_progress table does not exist. Creating it...</p>\n";
        
        // Create user_progress table
        $createUserProgress = "
        CREATE TABLE IF NOT EXISTS user_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            total_score INT DEFAULT 0,
            completed_lessons INT DEFAULT 0,
            current_topic VARCHAR(255) DEFAULT 'functions',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_progress (user_id),
            INDEX idx_user_progress (user_id)
        )";
        
        $pdo->exec($createUserProgress);
        echo "<p style='color: green;'>✅ user_progress table created successfully!</p>\n";
    } else {
        echo "<p style='color: green;'>✅ user_progress table exists.</p>\n";
    }
    
    // Insert initial progress records for existing users
    $usersCheck = $pdo->query("SELECT COUNT(*) as count FROM users");
    $userCount = $usersCheck->fetch()['count'];
    
    if ($userCount > 0) {
        echo "<p style='color: blue;'>📊 Found {$userCount} users. Creating initial progress records...</p>\n";
        
        // Insert initial progress records for users who don't have them
        $insertProgress = "
        INSERT IGNORE INTO user_progress (user_id, total_score, completed_lessons, current_topic)
        SELECT 
            u.id,
            0,
            0,
            'functions'
        FROM users u
        WHERE u.id NOT IN (SELECT user_id FROM user_progress)
        ";
        
        $result = $pdo->exec($insertProgress);
        echo "<p style='color: green;'>✅ Created {$result} initial progress records.</p>\n";
        
        // Insert initial topic progress records
        $insertTopicProgress = "
        INSERT IGNORE INTO topic_progress (user_id, topic_name, lessons_completed, total_lessons, progress_percentage)
        SELECT 
            u.id,
            'functions',
            0,
            4,
            0.00
        FROM users u
        WHERE u.id NOT IN (SELECT user_id FROM topic_progress WHERE topic_name = 'functions')
        ";
        
        $result2 = $pdo->exec($insertTopicProgress);
        echo "<p style='color: green;'>✅ Created {$result2} initial topic progress records.</p>\n";
    }
    
    echo "<h3 style='color: green;'>🎉 Database setup completed successfully!</h3>\n";
    echo "<p>The 'Mark as Completed' button should now work properly.</p>\n";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>\n";
}

echo "<hr>";
echo "<p><a href='../topics/functions.html'>← Back to Functions Topic</a></p>";
?>
