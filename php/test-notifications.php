<?php
session_start();

// Simple authentication check
if (!isset($_SESSION['teacher_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated. Please login first.'
    ]);
    exit;
}

$teacher_id = $_SESSION['teacher_id'];

// Include notification helper
require_once 'create-notification.php';

// Database connection
$host = 'localhost';
$dbname = 'mathease';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get a class for this teacher
    $stmt = $pdo->prepare("SELECT id, class_name FROM classes WHERE teacher_id = ? LIMIT 1");
    $stmt->execute([$teacher_id]);
    $class = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $notifications_created = [];
    
    // Create test notifications
    if ($class) {
        $class_id = $class['id'];
        $class_name = $class['class_name'];
        
        // Test 1: New Enrollment
        if (notifyNewEnrollment($teacher_id, $class_id, "John Doe", $class_name)) {
            $notifications_created[] = "New enrollment notification";
        }
        
        // Test 2: Quiz Submission
        if (notifyQuizSubmission($teacher_id, $class_id, "Jane Smith", "Functions Quiz", $class_name)) {
            $notifications_created[] = "Quiz submission notification";
        }
        
        // Test 3: Quiz Deadline
        if (notifyQuizDeadline($teacher_id, $class_id, "Operations Quiz", $class_name, 24)) {
            $notifications_created[] = "Quiz deadline notification";
        }
        
        // Test 4: Class Performance
        if (notifyClassPerformance($teacher_id, $class_id, $class_name, "has achieved an average score of 85%!")) {
            $notifications_created[] = "Class performance notification";
        }
        
        // Test 5: Class Update
        if (createTeacherNotification($teacher_id, 'class_update', 'Class Update', "Your class \"$class_name\" has 5 new quiz submissions", $class_id)) {
            $notifications_created[] = "Class update notification";
        }
    }
    
    // Test 6: System notification
    if (notifySystem($teacher_id, "System Test", "Your notification system is working correctly!")) {
        $notifications_created[] = "System notification";
    }
    
    // Check if notifications table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'teacher_notifications'");
    $tableExists = $stmt->rowCount() > 0;
    
    // Get notification count
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM teacher_notifications WHERE teacher_id = ?");
    $stmt->execute([$teacher_id]);
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Notification system test completed',
        'table_exists' => $tableExists,
        'notifications_created' => $notifications_created,
        'total_notifications' => (int)$count['total'],
        'teacher_id' => $teacher_id,
        'class_info' => $class
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage(),
        'suggestion' => 'Please run setup-notifications-table.sql to create the notifications table'
    ]);
}
