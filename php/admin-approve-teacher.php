<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Check if admin is logged in
if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$teacherId = $input['teacher_id'] ?? null;

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
    
    $pdo->beginTransaction();
    
    // Update teacher approval status
    $stmt = $pdo->prepare("
        UPDATE teachers 
        SET {$statusColumn} = 'approved', 
            approved_by = ?, 
            approved_at = NOW() 
        WHERE id = ? AND {$statusColumn} = 'pending'
    ");
    $stmt->execute([$_SESSION['admin_id'], $teacherId]);
    
    if ($stmt->rowCount() === 0) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Teacher not found or already processed']);
        exit;
    }
    
    // Log admin activity
    $stmt = $pdo->prepare("
        INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address, user_agent) 
        VALUES (?, 'approve_teacher', 'teacher', ?, ?, ?, ?)
    ");
    $stmt->execute([
        $_SESSION['admin_id'],
        $teacherId,
        'Teacher account approved',
        $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ]);
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Teacher account approved successfully'
    ]);
    
} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Admin approve teacher error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to approve teacher']);
}
?>
