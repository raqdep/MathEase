<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Check if admin is logged in
if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$teacherId = $_GET['id'] ?? null;

if (!$teacherId) {
    echo json_encode(['success' => false, 'message' => 'Teacher ID is required']);
    exit;
}

try {
    // Check if approval_status column exists, if not use status column
    $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers LIKE 'approval_status'");
    $stmt->execute();
    $hasApprovalStatus = $stmt->rowCount() > 0;
    
    $statusColumn = $hasApprovalStatus ? 'approval_status' : 'status';
    
    // Get teacher details
    $stmt = $pdo->prepare("
        SELECT id, first_name, last_name, email, teacher_id, department, subject, created_at, {$statusColumn} as status
        FROM teachers 
        WHERE id = ?
    ");
    $stmt->execute([$teacherId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$teacher) {
        echo json_encode(['success' => false, 'message' => 'Teacher not found']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'teacher' => $teacher
    ]);
    
} catch (Exception $e) {
    error_log("Admin teacher details error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to load teacher details']);
}
?>
