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
    // Ensure archive columns exist (older DBs won't have these yet)
    $cols = [
        'is_archived' => "ALTER TABLE teachers ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0",
        'archived_at' => "ALTER TABLE teachers ADD COLUMN archived_at DATETIME NULL",
        'archived_by_admin_id' => "ALTER TABLE teachers ADD COLUMN archived_by_admin_id INT NULL",
        'archive_reason' => "ALTER TABLE teachers ADD COLUMN archive_reason TEXT NULL",
    ];
    foreach ($cols as $col => $ddl) {
        $check = $pdo->prepare("
            SELECT COUNT(*) AS c
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'teachers'
              AND COLUMN_NAME = ?
        ");
        $check->execute([$col]);
        $exists = (int) ($check->fetchColumn() ?: 0) > 0;
        if (!$exists) {
            $pdo->exec($ddl);
        }
    }

    $archivedParam = $_GET['archived'] ?? null;
    $wantArchived = (string) $archivedParam === '1' || (string) $archivedParam === 'true';

    // First, let's check what columns actually exist in the teachers table
    $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_column($columns, 'Field');
    
    // Determine which status column to use
    $statusColumn = 'status'; // Default
    if (in_array('approval_status', $columnNames)) {
        $statusColumn = 'approval_status';
    } elseif (in_array('status', $columnNames)) {
        $statusColumn = 'status';
    }
    
    // Build the SELECT query dynamically based on available columns
    $selectFields = [
        'id', 'teacher_id', 'first_name', 'last_name', 'email', 
        'department', 'subject', 'created_at'
    ];
    
    // Add status column - ensure it's always called 'status' for JavaScript
    $selectFields[] = "{$statusColumn} as status";
    
    // Also add the original column for debugging
    if ($statusColumn !== 'status') {
        $selectFields[] = "{$statusColumn} as approval_status";
    }
    
    // Add optional columns if they exist
    if (in_array('approved_at', $columnNames)) {
        $selectFields[] = 'approved_at';
    }
    if (in_array('rejected_at', $columnNames)) {
        $selectFields[] = 'rejected_at';
    }
    if (in_array('rejection_reason', $columnNames)) {
        $selectFields[] = 'rejection_reason';
    }
    
    $selectQuery = implode(', ', $selectFields);
    
    // Get teachers with actual class and student counts
    $whereArchived = $wantArchived
        ? "COALESCE(t.is_archived, 0) = 1"
        : "COALESCE(t.is_archived, 0) = 0";

    $stmt = $pdo->prepare("
        SELECT 
            t.id,
            t.teacher_id,
            t.first_name,
            t.last_name,
            t.email,
            t.department,
            t.subject,
            {$statusColumn} as status,
            t.created_at,
            COALESCE(t.is_archived, 0) as is_archived,
            t.archived_at,
            t.archived_by_admin_id,
            t.archive_reason,
            COALESCE(class_stats.classes_count, 0) as classes_count,
            COALESCE(student_stats.students_count, 0) as students_count,
            COALESCE(student_stats.students_count, 0) * 10 as performance_score
        FROM teachers t
        LEFT JOIN (
            SELECT 
                teacher_id,
                COUNT(*) as classes_count
            FROM classes 
            GROUP BY teacher_id
        ) class_stats ON t.id = class_stats.teacher_id
        LEFT JOIN (
            SELECT 
                c.teacher_id,
                COUNT(DISTINCT COALESCE(sce.student_id, ce.student_id)) as students_count
            FROM classes c
            LEFT JOIN student_class_enrollments sce ON c.id = sce.class_id
            LEFT JOIN class_enrollments ce ON c.id = ce.class_id
            GROUP BY c.teacher_id
        ) student_stats ON t.id = student_stats.teacher_id
        WHERE {$whereArchived}
        ORDER BY t.created_at DESC
    ");
    
    $stmt->execute();
    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the data and add default values
    foreach ($teachers as &$teacher) {
        $teacher['full_name'] = $teacher['first_name'] . ' ' . $teacher['last_name'];
        
        // Add default values for missing fields
        $teacher['classes_count'] = $teacher['classes_count'] ?? 0;
        $teacher['students_count'] = $teacher['students_count'] ?? 0;
        $teacher['performance_score'] = $teacher['performance_score'] ?? 0;
        
        // Normalize status values
        $status = strtolower(trim($teacher['status'] ?? ''));
        
        // Format status for display
        switch ($status) {
            case 'pending':
                $teacher['status_badge'] = 'pending';
                $teacher['status_text'] = 'Pending';
                break;
            case 'approved':
                $teacher['status_badge'] = 'approved';
                $teacher['status_text'] = 'Approved';
                break;
            case 'rejected':
                $teacher['status_badge'] = 'rejected';
                $teacher['status_text'] = 'Rejected';
                break;
            default:
                $teacher['status_badge'] = 'unknown';
                $teacher['status_text'] = 'Unknown';
                $teacher['status'] = 'unknown'; // Normalize the status
        }
    }
    
    echo json_encode([
        'success' => true,
        'teachers' => $teachers,
        'count' => count($teachers),
        'debug_info' => [
            'status_column_used' => $statusColumn,
            'available_columns' => $columnNames,
            'total_teachers' => count($teachers),
            'sample_teacher' => $teachers[0] ?? null,
            'status_counts' => [
                'pending' => count(array_filter($teachers, fn($t) => $t['status'] === 'pending')),
                'approved' => count(array_filter($teachers, fn($t) => $t['status'] === 'approved')),
                'rejected' => count(array_filter($teachers, fn($t) => $t['status'] === 'rejected'))
            ]
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in admin-all-teachers.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred: ' . $e->getMessage(),
        'debug' => [
            'error_code' => $e->getCode(),
            'error_message' => $e->getMessage(),
            'status_column' => $statusColumn ?? 'unknown'
        ]
    ]);
} catch (Exception $e) {
    error_log("General error in admin-all-teachers.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error occurred: ' . $e->getMessage()
    ]);
}
?>
