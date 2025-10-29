<?php
session_start();
require_once 'config.php';

// Set content type to JSON
header('Content-Type: application/json');

// Check if user is logged in as teacher
if (!isset($_SESSION['teacher_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error_code' => 'TEACHER_AUTH_REQUIRED',
        'message' => 'Teacher authentication required',
        'redirect' => 'teacher-login.html'
    ]);
    exit;
}

try {
    // Get teacher's classes with student count
    $stmt = $pdo->prepare("
        SELECT 
            c.id,
            c.class_name,
            c.class_code,
            c.grade_level,
            c.strand,
            c.description,
            COUNT(DISTINCT ce.student_id) as student_count
        FROM classes c
        LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.status = 'approved'
        WHERE c.teacher_id = ?
        GROUP BY c.id, c.class_name, c.class_code, c.grade_level, c.strand, c.description
        ORDER BY c.class_name ASC
    ");
    $stmt->execute([$_SESSION['teacher_id']]);
    $classes = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'classes' => $classes
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error loading classes: ' . $e->getMessage()
    ]);
}
?>
