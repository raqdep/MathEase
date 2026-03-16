<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Check if user is logged in (student or teacher)
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Please log in.']);
    exit;
}

try {
    $student_id = $_SESSION['user_id'];
    
    // Get student's enrolled class - use correct table name and column
    $stmt = $pdo->prepare("
        SELECT class_id 
        FROM class_enrollments 
        WHERE student_id = ? AND enrollment_status = 'approved'
        LIMIT 1
    ");
    $stmt->execute([$student_id]);
    $enrollment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$enrollment) {
        echo json_encode([
            'success' => true,
            'lessons' => [],
            'message' => 'No approved enrollment found'
        ]);
        exit;
    }
    
    $class_id = $enrollment['class_id'];
    
    // Get teacher ID from class
    $stmt = $pdo->prepare("
        SELECT teacher_id 
        FROM classes 
        WHERE id = ? AND is_active = TRUE
    ");
    $stmt->execute([$class_id]);
    $class = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$class) {
        echo json_encode([
            'success' => true,
            'lessons' => [],
            'message' => 'Class not found or inactive'
        ]);
        exit;
    }
    
    $teacher_id = $class['teacher_id'];
    
    // Ensure teacher_lessons table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS teacher_lessons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            topic VARCHAR(100) NOT NULL,
            html_content LONGTEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_teacher (teacher_id),
            INDEX idx_topic (topic),
            FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
        )
    ");
    
    // Get teacher-created lessons
    $stmt = $pdo->prepare("
        SELECT id, title, topic, created_at, updated_at
        FROM teacher_lessons
        WHERE teacher_id = ?
        ORDER BY created_at DESC
    ");
    
    $stmt->execute([$teacher_id]);
    $lessons = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("Found " . count($lessons) . " teacher lessons for teacher_id: " . $teacher_id);
    
    echo json_encode([
        'success' => true,
        'lessons' => $lessons,
        'teacher_id' => $teacher_id,
        'class_id' => $class_id
    ]);

} catch (PDOException $e) {
    error_log("Get Student Teacher Lessons Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load lessons: ' . $e->getMessage()
    ]);
}
?>
