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
    // Check if approval_status column exists, if not use status column
    $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers LIKE 'approval_status'");
    $stmt->execute();
    $hasApprovalStatus = $stmt->rowCount() > 0;
    
    $statusColumn = $hasApprovalStatus ? 'approval_status' : 'status';
    
    // Get pending teachers
    $stmt = $pdo->prepare("
        SELECT id, first_name, last_name, email, teacher_id, department, subject, created_at 
        FROM teachers 
        WHERE {$statusColumn} = 'pending' 
        ORDER BY created_at ASC
    ");
    $stmt->execute();
    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'teachers' => $teachers
    ]);
    
} catch (Exception $e) {
    error_log("Admin pending teachers error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to load pending teachers']);
}
?>
