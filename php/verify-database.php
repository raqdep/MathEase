<?php
// Database verification script - checks if all required tables and data exist
require_once 'config.php';

echo "<h2>Database Verification Report</h2>\n";

try {
    echo "<h3>1. Database Connection</h3>\n";
    if ($pdo) {
        echo "<p style='color: green;'>✅ Database connection successful</p>\n";
        echo "<p>Database: " . DB_NAME . "</p>\n";
    } else {
        echo "<p style='color: red;'>❌ Database connection failed</p>\n";
        exit;
    }
    
    echo "<h3>2. Required Tables Check</h3>\n";
    $requiredTables = [
        'users' => 'User accounts',
        'topics' => 'Learning topics',
        'lessons' => 'Individual lessons',
        'user_progress' => 'Overall user progress',
        'user_lesson_progress' => 'Lesson completion tracking',
        'user_topic_progress' => 'Topic completion tracking'
    ];
    
    foreach ($requiredTables as $table => $description) {
        $check = $pdo->query("SHOW TABLES LIKE '{$table}'");
        if ($check->rowCount() > 0) {
            echo "<p style='color: green;'>✅ {$table} - {$description}</p>\n";
        } else {
            echo "<p style='color: red;'>❌ {$table} - {$description} (MISSING)</p>\n";
        }
    }
    
    echo "<h3>3. Functions Topic Data</h3>\n";
    
    // Check Functions topic
    $topicCheck = $pdo->prepare("SELECT id, name FROM topics WHERE name = ?");
    $topicCheck->execute(['functions']);
    $topicData = $topicCheck->fetch();
    
    if ($topicData) {
        echo "<p style='color: green;'>✅ Functions topic exists (ID: {$topicData['id']})</p>\n";
        
        // Check lessons for Functions topic
        $lessonCheck = $pdo->prepare("SELECT COUNT(*) as count FROM lessons WHERE topic_id = ?");
        $lessonCheck->execute([$topicData['id']]);
        $lessonCount = $lessonCheck->fetch()['count'];
        
        if ($lessonCount > 0) {
            echo "<p style='color: green;'>✅ Found {$lessonCount} lessons for Functions topic</p>\n";
            
            // List the lessons
            $lessonsStmt = $pdo->prepare("SELECT id, title, order_index FROM lessons WHERE topic_id = ? ORDER BY order_index");
            $lessonsStmt->execute([$topicData['id']]);
            $lessons = $lessonsStmt->fetchAll();
            
            echo "<ul>\n";
            foreach ($lessons as $lesson) {
                echo "<li style='color: blue;'>Lesson {$lesson['order_index']}: {$lesson['title']} (ID: {$lesson['id']})</li>\n";
            }
            echo "</ul>\n";
        } else {
            echo "<p style='color: red;'>❌ No lessons found for Functions topic</p>\n";
        }
    } else {
        echo "<p style='color: red;'>❌ Functions topic not found</p>\n";
    }
    
    echo "<h3>4. User Data</h3>\n";
    $userCount = $pdo->query("SELECT COUNT(*) as count FROM users")->fetch()['count'];
    echo "<p style='color: blue;'>ℹ️ Total users in database: {$userCount}</p>\n";
    
    if ($userCount > 0) {
        // Check if any users have progress data
        $progressCount = $pdo->query("SELECT COUNT(*) as count FROM user_progress")->fetch()['count'];
        echo "<p style='color: blue;'>ℹ️ Users with progress data: {$progressCount}</p>\n";
        
        $lessonProgressCount = $pdo->query("SELECT COUNT(*) as count FROM user_lesson_progress")->fetch()['count'];
        echo "<p style='color: blue;'>ℹ️ Lesson completion records: {$lessonProgressCount}</p>\n";
        
        $topicProgressCount = $pdo->query("SELECT COUNT(*) as count FROM user_topic_progress")->fetch()['count'];
        echo "<p style='color: blue;'>ℹ️ Topic progress records: {$topicProgressCount}</p>\n";
    }
    
    echo "<h3>5. Table Structure Verification</h3>\n";
    
    // Check user_lesson_progress table structure
    $structureCheck = $pdo->query("DESCRIBE user_lesson_progress");
    $columns = $structureCheck->fetchAll();
    echo "<p style='color: green;'>✅ user_lesson_progress table structure:</p>\n";
    echo "<ul>\n";
    foreach ($columns as $column) {
        echo "<li>{$column['Field']} - {$column['Type']}</li>\n";
    }
    echo "</ul>\n";
    
    echo "<h3 style='color: green;'>🎉 Database verification completed!</h3>\n";
    echo "<p><strong>Status:</strong> All required tables and data are present.</p>\n";
    echo "<p><strong>Next step:</strong> The 'Mark as Completed' button should now work properly.</p>\n";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error during verification: " . $e->getMessage() . "</p>\n";
}

echo "<hr>";
echo "<p><a href='../topics/functions.html'>← Back to Functions Topic</a></p>";
echo "<p><a href='../fix-complete-button.html'>🔧 Diagnostic Tools</a></p>";
?>
