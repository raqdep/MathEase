<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Please log in.']);
    exit;
}

try {
    $student_id = $_SESSION['user_id'];
    $lesson_id = $_GET['lesson_id'] ?? null;
    
    if (!$lesson_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Lesson ID required.']);
        exit;
    }
    
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
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'You must be enrolled in a class to view lessons.']);
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
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Class not found or inactive.']);
        exit;
    }
    
    $teacher_id = $class['teacher_id'];
    
    // Get lesson content
    $stmt = $pdo->prepare("
        SELECT id, title, topic, html_content, created_at
        FROM teacher_lessons
        WHERE id = ? AND teacher_id = ?
    ");
    
    $stmt->execute([$lesson_id, $teacher_id]);
    $lesson = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$lesson) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Lesson not found or you do not have access.']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'lesson' => $lesson
    ]);

} catch (PDOException $e) {
    error_log("Get Teacher Lesson Content Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load lesson content.'
    ]);
}
?>
