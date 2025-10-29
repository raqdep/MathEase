<?php
require_once 'config.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Debug: Log current session data
error_log("Student logout - Session data: " . print_r($_SESSION, true));

// Check if this is a student logout (not a teacher)
$isStudent = isset($_SESSION['user_id']) && (!isset($_SESSION['user_type']) || $_SESSION['user_type'] !== 'teacher');
$isTeacher = isset($_SESSION['teacher_id']) && isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'teacher';

error_log("Student logout - isStudent: " . ($isStudent ? 'true' : 'false') . ", isTeacher: " . ($isTeacher ? 'true' : 'false'));

// Only proceed with student logout if this is actually a student
if (!$isStudent) {
    // If it's a teacher trying to access student logout, redirect to teacher logout
    if ($isTeacher) {
        error_log("Teacher detected in student logout - redirecting to teacher logout");
        header('Location: teacher-logout.php');
        exit;
    }
    
    // If neither student nor teacher, redirect to home
    error_log("No valid user detected in student logout - redirecting to home");
    header('Location: ../index.html');
    exit;
}

// Get user ID before clearing session data
$userId = $_SESSION['user_id'] ?? null;
$userEmail = $_SESSION['user_email'] ?? null;

error_log("Student logout - User ID: " . $userId . ", Email: " . $userEmail);

// Mark any in-progress quiz attempts as abandoned
if ($userId) {
    try {
        $stmt = $pdo->prepare("
            UPDATE quiz_attempts 
            SET status = 'abandoned', completed_at = CURRENT_TIMESTAMP
            WHERE student_id = ? AND status = 'in_progress'
        ");
        $stmt->execute([$userId]);
        
        if ($stmt->rowCount() > 0) {
            error_log("Marked " . $stmt->rowCount() . " quiz attempts as abandoned for user: " . $userEmail);
        }
    } catch (Exception $e) {
        error_log("Error marking quiz attempts as abandoned: " . $e->getMessage());
    }
}

// Clear student remember me token if exists
if (isset($_COOKIE['remember_token'])) {
    $token = $_COOKIE['remember_token'];
    
    // Remove token from database
    $stmt = $pdo->prepare("DELETE FROM remember_tokens WHERE token = ?");
    $stmt->execute([$token]);
    
    // Clear cookie
    setcookie('remember_token', '', time() - 3600, '/');
}

// Log student logout
if ($userEmail) {
    error_log("Student logged out: " . $userEmail);
}

// Store teacher session data before clearing student data
$teacherSessionData = [];
if (isset($_SESSION['teacher_id'])) {
    $teacherSessionData = [
        'teacher_id' => $_SESSION['teacher_id'],
        'teacher_email' => $_SESSION['teacher_email'],
        'teacher_name' => $_SESSION['teacher_name'],
        'teacher_id_number' => $_SESSION['teacher_id_number'],
        'department' => $_SESSION['department'],
        'subject' => $_SESSION['subject'],
        'user_type' => $_SESSION['user_type']
    ];
    error_log("Preserving teacher session data: " . print_r($teacherSessionData, true));
}

// Clear only student session variables (preserve teacher session if exists)
clear_student_session();

// Restore teacher session data if it existed
if (!empty($teacherSessionData)) {
    foreach ($teacherSessionData as $key => $value) {
        $_SESSION[$key] = $value;
    }
    error_log("Restored teacher session data after student logout");
}

// If no teacher session exists, destroy the entire session
if (!isset($_SESSION['teacher_id'])) {
    error_log("No teacher session found - destroying entire session");
    session_destroy();
    $_SESSION = array();
} else {
    error_log("Teacher session preserved - session not destroyed");
}

// Redirect to home page
header('Location: ../index.html');
exit;
?>
