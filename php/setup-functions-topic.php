<?php
// Script to populate topics and lessons tables for the Functions topic
require_once 'config.php';

echo "<h2>Database Setup for Functions Topic</h2>\n";

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
    
    // Check if Functions topic exists
    $topicCheck = $pdo->prepare("SELECT id FROM topics WHERE name = ?");
    $topicCheck->execute(['functions']);
    $topicData = $topicCheck->fetch();
    
    if (!$topicData) {
        echo "<p style='color: orange;'>⚠️ Functions topic does not exist. Creating it...</p>\n";
        
        // Insert Functions topic
        $insertTopic = $pdo->prepare("
            INSERT INTO topics (name, description, difficulty_level, order_index, is_active)
            VALUES ('functions', 'Introduction to Functions and Function Operations', 'beginner', 1, TRUE)
        ");
        $insertTopic->execute();
        
        $topic_id = $pdo->lastInsertId();
        echo "<p style='color: green;'>✅ Functions topic created with ID: {$topic_id}</p>\n";
    } else {
        $topic_id = $topicData['id'];
        echo "<p style='color: green;'>✅ Functions topic exists with ID: {$topic_id}</p>\n";
    }
    
    // Check if lessons exist for Functions topic
    $lessonCheck = $pdo->prepare("SELECT COUNT(*) as count FROM lessons WHERE topic_id = ?");
    $lessonCheck->execute([$topic_id]);
    $lessonCount = $lessonCheck->fetch()['count'];
    
    if ($lessonCount == 0) {
        echo "<p style='color: orange;'>⚠️ No lessons found for Functions topic. Creating them...</p>\n";
        
        // Define the 4 lessons for Functions topic
        $lessons = [
            [
                'title' => 'Introduction to Functions',
                'content' => 'Learn the fundamental concepts of functions, including notation, evaluation, and the function machine concept.',
                'order_index' => 1
            ],
            [
                'title' => 'Domain and Range',
                'content' => 'Learn how to find the domain (allowed inputs) and range (possible outputs) of functions.',
                'order_index' => 2
            ],
            [
                'title' => 'Function Operations',
                'content' => 'Learn how to add, subtract, multiply, and divide functions to create new functions.',
                'order_index' => 3
            ],
            [
                'title' => 'Function Composition & Inverses',
                'content' => 'Learn how to compose functions and find inverse functions.',
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
        echo "<p style='color: green;'>✅ Found {$lessonCount} lessons for Functions topic.</p>\n";
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
    echo "<p>The 'Mark as Completed' button should now work properly.</p>\n";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>\n";
}

echo "<hr>";
echo "<p><a href='../topics/functions.html'>← Back to Functions Topic</a></p>";
echo "<p><a href='test-lesson-completion.php'>🧪 Test Lesson Completion</a></p>";
?>
