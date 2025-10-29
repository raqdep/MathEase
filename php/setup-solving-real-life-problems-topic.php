<?php
// Script to populate topics and lessons tables for the Solving Real-Life Problems Involving Functions topic
require_once 'config.php';

echo "<h2>Database Setup for Solving Real-Life Problems Involving Functions Topic</h2>\n";

try {
    // Check if topics table exists
    $tablesCheck = $pdo->query("SHOW TABLES LIKE 'topics'");
    if ($tablesCheck->rowCount() == 0) {
        echo "<p style='color: red;'>❌ Topics table does not exist. Please run the main database migration first.</p>\n";
        exit;
    }
    
    // Check if lessons table exists
    $tablesCheck2 = $pdo->query("SHOW TABLES LIKE 'lessons'");
    if ($tablesCheck2->rowCount() == 0) {
        echo "<p style='color: red;'>❌ Lessons table does not exist. Please run the main database migration first.</p>\n";
        exit;
    }
    
    echo "<p style='color: green;'>✅ Required tables exist.</p>\n";
    
    // Check if Solving Real-Life Problems topic exists
    $topicCheck = $pdo->prepare("SELECT id FROM topics WHERE name = ?");
    $topicCheck->execute(['solving-real-life-problems']);
    $topicData = $topicCheck->fetch();
    
    if (!$topicData) {
        echo "<p style='color: orange;'>⚠️ Solving Real-Life Problems topic does not exist. Creating it...</p>\n";
        
        // Insert Solving Real-Life Problems topic
        $insertTopic = $pdo->prepare("
            INSERT INTO topics (name, description, difficulty_level, order_index, is_active)
            VALUES ('solving-real-life-problems', 'Master the application of functions in real-world scenarios through four comprehensive lessons designed for Grade 11 students', 'advanced', 4, TRUE)
        ");
        $insertTopic->execute();
        
        $topic_id = $pdo->lastInsertId();
        echo "<p style='color: green;'>✅ Solving Real-Life Problems topic created with ID: {$topic_id}</p>\n";
    } else {
        $topic_id = $topicData['id'];
        echo "<p style='color: green;'>✅ Solving Real-Life Problems topic exists with ID: {$topic_id}</p>\n";
    }
    
    // Check if lessons exist for Solving Real-Life Problems topic
    $lessonCheck = $pdo->prepare("SELECT COUNT(*) as count FROM lessons WHERE topic_id = ?");
    $lessonCheck->execute([$topic_id]);
    $lessonCount = $lessonCheck->fetch()['count'];
    
    if ($lessonCount == 0) {
        echo "<p style='color: orange;'>⚠️ No lessons found for Solving Real-Life Problems topic. Creating them...</p>\n";
        
        // Define the 4 lessons for Solving Real-Life Problems topic
        $lessons = [
            [
                'title' => 'Real-World Function Models',
                'content' => 'Learn how to identify and model real-life situations using functions, including piecewise functions.',
                'order_index' => 1
            ],
            [
                'title' => 'Business & Economics Applications',
                'content' => 'Apply functions to solve business problems including profit, cost, revenue, and economic models.',
                'order_index' => 2
            ],
            [
                'title' => 'Science & Technology Applications',
                'content' => 'Explore how functions model scientific phenomena, population growth, and technological applications.',
                'order_index' => 3
            ],
            [
                'title' => 'Complex Problem Solving',
                'content' => 'Master advanced problem-solving techniques using multiple functions and real-world scenarios.',
                'order_index' => 4
            ]
        ];
        
        // Insert each lesson
        foreach ($lessons as $lesson) {
            $insertLesson = $pdo->prepare("
                INSERT INTO lessons (topic_id, title, content, order_index, is_active)
                VALUES (?, ?, ?, ?, TRUE)
            ");
            $insertLesson->execute([
                $topic_id,
                $lesson['title'],
                $lesson['content'],
                $lesson['order_index']
            ]);
            
            $lesson_id = $pdo->lastInsertId();
            echo "<p style='color: green;'>✅ Created lesson: {$lesson['title']} (ID: {$lesson_id})</p>\n";
        }
    } else {
        echo "<p style='color: green;'>✅ Found {$lessonCount} lessons for Solving Real-Life Problems topic.</p>\n";
    }
    
    // Check if user_lesson_progress table exists
    $tablesCheck3 = $pdo->query("SHOW TABLES LIKE 'user_lesson_progress'");
    if ($tablesCheck3->rowCount() == 0) {
        echo "<p style='color: red;'>❌ user_lesson_progress table does not exist. Creating it...</p>\n";
        
        // Create user_lesson_progress table
        $createTable = "
        CREATE TABLE IF NOT EXISTS user_lesson_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            lesson_id INT NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            time_spent_minutes INT DEFAULT 0,
            last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_lesson (user_id, lesson_id),
            INDEX idx_user_id (user_id),
            INDEX idx_lesson_id (lesson_id)
        )";
        
        $pdo->exec($createTable);
        echo "<p style='color: green;'>✅ user_lesson_progress table created successfully!</p>\n";
    } else {
        echo "<p style='color: green;'>✅ user_lesson_progress table exists.</p>\n";
    }
    
    // Check if user_topic_progress table exists
    $tablesCheck4 = $pdo->query("SHOW TABLES LIKE 'user_topic_progress'");
    if ($tablesCheck4->rowCount() == 0) {
        echo "<p style='color: red;'>❌ user_topic_progress table does not exist. Creating it...</p>\n";
        
        // Create user_topic_progress table
        $createTable2 = "
        CREATE TABLE IF NOT EXISTS user_topic_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            topic_id INT NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            best_score INT DEFAULT 0,
            attempts INT DEFAULT 0,
            last_attempt DATETIME,
            last_step VARCHAR(32),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_topic (user_id, topic_id),
            INDEX idx_user_id (user_id),
            INDEX idx_topic_id (topic_id)
        )";
        
        $pdo->exec($createTable2);
        echo "<p style='color: green;'>✅ user_topic_progress table created successfully!</p>\n";
    } else {
        echo "<p style='color: green;'>✅ user_topic_progress table exists.</p>\n";
    }
    
    // Check if user_progress table exists
    $tablesCheck5 = $pdo->query("SHOW TABLES LIKE 'user_progress'");
    if ($tablesCheck5->rowCount() == 0) {
        echo "<p style='color: red;'>❌ user_progress table does not exist. Creating it...</p>\n";
        
        // Create user_progress table
        $createTable3 = "
        CREATE TABLE IF NOT EXISTS user_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            total_score INT DEFAULT 0,
            completed_lessons INT DEFAULT 0,
            current_topic VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id)
        )";
        
        $pdo->exec($createTable3);
        echo "<p style='color: green;'>✅ user_progress table created successfully!</p>\n";
    } else {
        echo "<p style='color: green;'>✅ user_progress table exists.</p>\n";
    }
    
    echo "<h3 style='color: green;'>🎉 Database setup completed successfully!</h3>\n";
    echo "<p>The 'Mark as Completed' button should now work properly for the Solving Real-Life Problems Involving Functions topic.</p>\n";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>\n";
}

echo "<hr>";
echo "<p><a href='../topics/solving-real-life-problems.html'>← Back to Solving Real-Life Problems Topic</a></p>";
echo "<p><a href='test-lesson-completion.php'>🧪 Test Lesson Completion</a></p>";
?>
