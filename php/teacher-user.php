<?php
require_once 'config.php';

// Check if teacher is logged in
if (!isset($_SESSION['teacher_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

try {
    // Get teacher information
    $stmt = $pdo->prepare("
        SELECT id, first_name, last_name, email, teacher_id, department, subject, last_login, created_at
        FROM teachers 
        WHERE id = ?
    ");
    $stmt->execute([$_SESSION['teacher_id']]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception("Teacher not found");
    }
    
    $teacher = $stmt->fetch();
    
    // Get teacher profile data
    $stmt = $pdo->prepare("
        SELECT total_students, active_assignments, average_score
        FROM teacher_profiles 
        WHERE teacher_id = ?
    ");
    $stmt->execute([$_SESSION['teacher_id']]);
    $profile = $stmt->fetch();
    
    // Get class statistics
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(DISTINCT u.id) as total_students,
            COUNT(DISTINCT CASE WHEN up.completed_lessons > 0 THEN u.id END) as active_students,
            AVG(up.total_score) as average_score
        FROM users u
        LEFT JOIN user_progress up ON u.id = up.user_id
        WHERE u.strand = 'STEM' AND u.grade_level = '11'
    ");
    $stmt->execute();
    $classStats = $stmt->fetch();
    
    $response = [
        'success' => true,
        'teacher' => [
            'id' => $teacher['id'],
            'first_name' => $teacher['first_name'],
            'last_name' => $teacher['last_name'],
            'email' => $teacher['email'],
            'teacher_id' => $teacher['teacher_id'],
            'department' => $teacher['department'],
            'subject' => $teacher['subject'],
            'last_login' => $teacher['last_login'],
            'created_at' => $teacher['created_at']
        ],
        'profile' => [
            'total_students' => $profile['total_students'] ?? 0,
            'active_assignments' => $profile['active_assignments'] ?? 0,
            'average_score' => $profile['average_score'] ?? 0
        ],
        'class_stats' => [
            'total_students' => $classStats['total_students'] ?? 0,
            'active_students' => $classStats['active_students'] ?? 0,
            'average_score' => round($classStats['average_score'] ?? 0, 1)
        ]
    ];
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    
    error_log("Teacher user data error: " . $e->getMessage());
}

header('Content-Type: application/json');
echo json_encode($response);
?>
