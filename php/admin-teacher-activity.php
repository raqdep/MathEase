<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Check if admin is logged in
if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

try {
    $teacherId = $_GET['teacher_id'] ?? null;
    
    if (!$teacherId) {
        echo json_encode(['success' => false, 'message' => 'Teacher ID is required']);
        exit;
    }
    
    // Ensure teacher_activity_log table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS teacher_activity_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            action VARCHAR(100) NOT NULL,
            details TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_teacher (teacher_id),
            INDEX idx_action (action),
            INDEX idx_created (created_at)
        )
    ");
    
    // Get teacher activity
    $stmt = $pdo->prepare("
        SELECT 
            tal.id,
            tal.action,
            tal.details,
            tal.ip_address,
            tal.user_agent,
            tal.created_at,
            t.first_name,
            t.last_name,
            t.email
        FROM teacher_activity_log tal
        JOIN teachers t ON tal.teacher_id = t.id
        WHERE tal.teacher_id = ?
        ORDER BY tal.created_at DESC
        LIMIT 100
    ");
    $stmt->execute([$teacherId]);
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get teacher info
    $stmt = $pdo->prepare("
        SELECT id, first_name, last_name, email, teacher_id, department, subject, created_at, last_login
        FROM teachers
        WHERE id = ?
    ");
    $stmt->execute([$teacherId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get activity statistics
    $stmt = $pdo->prepare("
        SELECT 
            action,
            COUNT(*) as count
        FROM teacher_activity_log
        WHERE teacher_id = ?
        GROUP BY action
        ORDER BY count DESC
    ");
    $stmt->execute([$teacherId]);
    $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'teacher' => $teacher,
        'activities' => $activities,
        'statistics' => $stats,
        'total_activities' => count($activities)
    ]);
    
} catch (Exception $e) {
    error_log("Admin teacher activity error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to load teacher activity']);
}
?>
