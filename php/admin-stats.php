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
    // Get dashboard statistics
    $stats = [];
    
    // Check if approval_status column exists, if not use status column
    $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers LIKE 'approval_status'");
    $stmt->execute();
    $hasApprovalStatus = $stmt->rowCount() > 0;
    
    $statusColumn = $hasApprovalStatus ? 'approval_status' : 'status';
    
    // Pending teachers count
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM teachers WHERE {$statusColumn} = 'pending'");
    $stmt->execute();
    $stats['pending_teachers'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Approved teachers count
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM teachers WHERE {$statusColumn} = 'approved'");
    $stmt->execute();
    $stats['approved_teachers'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Rejected teachers count
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM teachers WHERE {$statusColumn} = 'rejected'");
    $stmt->execute();
    $stats['rejected_teachers'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Total students count
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE email_verified = 1");
    $stmt->execute();
    $stats['total_students'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo json_encode([
        'success' => true,
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    error_log("Admin stats error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to load statistics']);
}
?>
