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
    
    // Check if email_verified column exists
    $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers LIKE 'email_verified'");
    $stmt->execute();
    $hasEmailVerified = $stmt->rowCount() > 0;
    
    // Get ALL pending teachers (regardless of email verification status)
    // Admin should see all pending teachers to verify accounts
    $whereClause = "{$statusColumn} = 'pending'";
    
    // Build SELECT to include email_verified if column exists
    $selectFields = "id, first_name, last_name, email, teacher_id, department, subject, created_at";
    if ($hasEmailVerified) {
        $selectFields .= ", email_verified, COALESCE(email_verified, 0) as is_email_verified";
    } else {
        $selectFields .= ", NULL as email_verified, 0 as is_email_verified";
    }
    
    $stmt = $pdo->prepare("
        SELECT {$selectFields}
        FROM teachers 
        WHERE {$whereClause}
        ORDER BY 
            CASE WHEN email_verified = 1 THEN 0 ELSE 1 END,
            created_at ASC
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
