<?php
session_start();
require_once 'config.php';

// Set content type to JSON
header('Content-Type: application/json');

try {
    // Check if user is logged in
    if (!isset($_SESSION['user_id']) && !isset($_SESSION['teacher_id'])) {
        echo json_encode([
            'success' => false,
            'user_type' => null,
            'message' => 'Not logged in'
        ]);
        exit;
    }
    
    // Determine user type
    if (isset($_SESSION['teacher_id']) && isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'teacher') {
        echo json_encode([
            'success' => true,
            'user_type' => 'teacher',
            'teacher_id' => $_SESSION['teacher_id'],
            'teacher_name' => $_SESSION['teacher_name'] ?? 'Teacher'
        ]);
    } elseif (isset($_SESSION['user_id'])) {
        echo json_encode([
            'success' => true,
            'user_type' => 'student',
            'user_id' => $_SESSION['user_id'],
            'user_name' => $_SESSION['user_name'] ?? 'Student'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'user_type' => null,
            'message' => 'Unknown user type'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'user_type' => null,
        'message' => 'Error checking user type: ' . $e->getMessage()
    ]);
}
?>
