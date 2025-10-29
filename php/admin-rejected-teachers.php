<?php
session_start();
require_once 'config.php';

// Check if admin is logged in
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

try {
    // Check if approval_status column exists, if not use status column
    $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers LIKE 'approval_status'");
    $stmt->execute();
    $hasApprovalStatus = $stmt->rowCount() > 0;
    
    $statusColumn = $hasApprovalStatus ? 'approval_status' : 'status';
    
    // Get rejected teachers
    $stmt = $pdo->prepare("
        SELECT 
            id,
            teacher_id,
            first_name,
            last_name,
            email,
            department,
            subject,
            created_at,
            rejected_at,
            rejection_reason
        FROM teachers 
        WHERE {$statusColumn} = 'rejected' 
        ORDER BY rejected_at DESC
    ");
    
    $stmt->execute();
    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the data
    foreach ($teachers as &$teacher) {
        $teacher['full_name'] = $teacher['first_name'] . ' ' . $teacher['last_name'];
        $teacher['status'] = 'rejected';
    }
    
    echo json_encode([
        'success' => true,
        'teachers' => $teachers,
        'count' => count($teachers)
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in admin-rejected-teachers.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
}
?>
