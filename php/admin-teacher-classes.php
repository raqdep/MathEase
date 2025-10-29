<?php
// Clean, simple admin-teacher-classes.php
require_once 'config.php';

// Set content type to JSON
header('Content-Type: application/json');

// Check if user is logged in as admin
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
if (!isset($_SESSION['admin_id'])) {
    echo json_encode([
        'success' => false, 
        'message' => 'Unauthorized access',
        'debug' => [
            'session_status' => session_status(),
            'session_id' => session_id(),
            'session_data' => $_SESSION ?? 'No session data'
        ]
    ]);
    exit;
}

try {
    $teacherId = $_GET['teacher_id'] ?? null;
    
    if (!$teacherId) {
        echo json_encode(['success' => false, 'message' => 'Teacher ID required']);
        exit;
    }
    
    // Get teacher info
    $stmt = $pdo->prepare("SELECT * FROM teachers WHERE id = ?");
    $stmt->execute([$teacherId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$teacher) {
        echo json_encode(['success' => false, 'message' => 'Teacher not found']);
        exit;
    }
    
    // Get classes for this teacher from the classes table
    $stmt = $pdo->prepare("SELECT * FROM classes WHERE teacher_id = ?");
    $stmt->execute([$teacherId]);
    $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get students enrolled in these classes
    $students = [];
    
    foreach ($classes as $class) {
        // Get students from student_class_enrollments table
        $stmt = $pdo->prepare("
            SELECT 
                student_id as id,
                first_name,
                last_name,
                student_number as student_id,
                email,
                '' as grade_level,
                '' as strand,
                enrolled_at as enrollment_date,
                enrollment_status,
                'student_class_enrollments' as enrollment_table,
                ? as class_id,
                ? as class_name
            FROM student_class_enrollments 
            WHERE class_id = ?
        ");
        $stmt->execute([$class['id'], $class['class_name'], $class['id']]);
        $classStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $students = array_merge($students, $classStudents);
    }
    
    // Return clean response
    echo json_encode([
        'success' => true,
        'teacher' => $teacher,
        'classes' => $classes,
        'students' => $students,
        'debug' => [
            'teacher_id' => $teacherId,
            'classes_count' => count($classes),
            'students_count' => count($students),
            'enrolled_students' => count(array_filter($students, function($s) { return !empty($s['enrollment_date']); }))
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error in admin-teacher-classes.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => $e->getMessage()
    ]);
}
?>