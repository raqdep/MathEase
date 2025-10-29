<?php
require_once 'config.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Debug: Log current session data
error_log("Teacher logout - Session data: " . print_r($_SESSION, true));

// Check if this is a teacher logout (not a student)
$isStudent = isset($_SESSION['user_id']) && (!isset($_SESSION['user_type']) || $_SESSION['user_type'] !== 'teacher');
$isTeacher = isset($_SESSION['teacher_id']);

error_log("Teacher logout - isStudent: " . ($isStudent ? 'true' : 'false') . ", isTeacher: " . ($isTeacher ? 'true' : 'false'));

// Only proceed with teacher logout if this is actually a teacher
if (!$isTeacher) {
    // If it's a student trying to access teacher logout, redirect to student logout
    if ($isStudent) {
        error_log("Student detected in teacher logout - redirecting to student logout");
        header('Location: logout.php');
        exit;
    }
    
    // If neither student nor teacher, redirect to teacher login
    error_log("No valid user detected in teacher logout - redirecting to teacher login");
    header('Location: ../teacher-login.html');
    exit;
}

// Get teacher info before clearing session data
$teacherEmail = $_SESSION['teacher_email'] ?? null;

error_log("Teacher logout - Teacher Email: " . $teacherEmail);

// Clear teacher remember me token if exists
if (isset($_COOKIE['teacher_remember_token'])) {
    $token = $_COOKIE['teacher_remember_token'];
    
    // Remove token from database
    $stmt = $pdo->prepare("DELETE FROM teacher_remember_tokens WHERE token = ?");
    $stmt->execute([$token]);
    
    // Clear cookie
    setcookie('teacher_remember_token', '', time() - 3600, '/', '', true, true);
}

// Log teacher logout
if ($teacherEmail) {
    error_log("Teacher logged out: " . $teacherEmail);
}

// Store student session data before clearing teacher data
$studentSessionData = [];
if (isset($_SESSION['user_id'])) {
    $studentSessionData = [
        'user_id' => $_SESSION['user_id'],
        'user_email' => $_SESSION['user_email'],
        'user_name' => $_SESSION['user_name'],
        'student_id' => $_SESSION['student_id'],
        'grade_level' => $_SESSION['grade_level'],
        'strand' => $_SESSION['strand']
    ];
    error_log("Preserving student session data: " . print_r($studentSessionData, true));
}

// Clear only teacher session variables (preserve student session if exists)
clear_teacher_session();

// Restore student session data if it existed
if (!empty($studentSessionData)) {
    foreach ($studentSessionData as $key => $value) {
        $_SESSION[$key] = $value;
    }
    error_log("Restored student session data after teacher logout");
}

// If no student session exists, destroy the entire session
if (!isset($_SESSION['user_id'])) {
    error_log("No student session found - destroying entire session");
    session_destroy();
    $_SESSION = array();
} else {
    error_log("Student session preserved - session not destroyed");
}

// Redirect to teacher login page
header('Location: ../teacher-login.html');
exit;
?>
