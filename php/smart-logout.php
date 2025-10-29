<?php
require_once 'config.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Debug: Log current session data
error_log("Smart logout - Session data: " . print_r($_SESSION, true));

// Determine what type of logout this is based on the request
$logoutType = $_GET['type'] ?? $_POST['type'] ?? 'auto';

// Check current session state
$isStudent = isset($_SESSION['user_id']) && (!isset($_SESSION['user_type']) || $_SESSION['user_type'] !== 'teacher');
$isTeacher = isset($_SESSION['teacher_id']) && isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'teacher';

error_log("Smart logout - Type: $logoutType, isStudent: " . ($isStudent ? 'true' : 'false') . ", isTeacher: " . ($isTeacher ? 'true' : 'false'));

// Handle different logout scenarios
if ($logoutType === 'student' || ($logoutType === 'auto' && $isStudent)) {
    // Student logout
    error_log("Performing student logout");
    
    $userId = $_SESSION['user_id'] ?? null;
    $userEmail = $_SESSION['user_email'] ?? null;
    
    // Mark quiz attempts as cheating (logout during quiz)
    if ($userId) {
        try {
            // First, check if there are any in-progress attempts
            $checkStmt = $pdo->prepare("
                SELECT id FROM quiz_attempts 
                WHERE student_id = ? AND status = 'in_progress'
            ");
            $checkStmt->execute([$userId]);
            $inProgressAttempts = $checkStmt->fetchAll();
            
            if (count($inProgressAttempts) > 0) {
                // Mark as cheating instead of abandoned
                $stmt = $pdo->prepare("
                    UPDATE quiz_attempts 
                    SET status = 'cheating', 
                        score = 0, 
                        percentage = 0,
                        completed_at = CURRENT_TIMESTAMP,
                        cheating_reason = 'logout_during_quiz'
                    WHERE student_id = ? AND status = 'in_progress'
                ");
                $stmt->execute([$userId]);
                
                if ($stmt->rowCount() > 0) {
                    error_log("Marked " . $stmt->rowCount() . " quiz attempts as CHEATING (logout) for user: " . $userEmail);
                    
                    // Log cheating incidents
                    foreach ($inProgressAttempts as $attempt) {
                        $logStmt = $pdo->prepare("
                            INSERT INTO cheating_incidents (attempt_id, reason, detected_at)
                            VALUES (?, 'logout_during_quiz', CURRENT_TIMESTAMP)
                        ");
                        $logStmt->execute([$attempt['id']]);
                    }
                }
            }
        } catch (Exception $e) {
            error_log("Error marking quiz attempts as cheating on logout: " . $e->getMessage());
        }
    }
    
    // Clear student remember me token
    if (isset($_COOKIE['remember_token'])) {
        $token = $_COOKIE['remember_token'];
        $stmt = $pdo->prepare("DELETE FROM remember_tokens WHERE token = ?");
        $stmt->execute([$token]);
        setcookie('remember_token', '', time() - 3600, '/');
    }
    
    // Clear student session data
    clear_student_session();
    
    if ($userEmail) {
        error_log("Student logged out: " . $userEmail);
    }
    
    // If no teacher session, destroy entire session
    if (!isset($_SESSION['teacher_id'])) {
        session_destroy();
        $_SESSION = array();
    }
    
    header('Location: ../index.html');
    exit;
    
} elseif ($logoutType === 'teacher' || ($logoutType === 'auto' && $isTeacher)) {
    // Teacher logout
    error_log("Performing teacher logout");
    
    $teacherEmail = $_SESSION['teacher_email'] ?? null;
    
    // Clear teacher remember me token
    if (isset($_COOKIE['teacher_remember_token'])) {
        $token = $_COOKIE['teacher_remember_token'];
        $stmt = $pdo->prepare("DELETE FROM teacher_remember_tokens WHERE token = ?");
        $stmt->execute([$token]);
        setcookie('teacher_remember_token', '', time() - 3600, '/', '', true, true);
    }
    
    // Clear teacher session data
    clear_teacher_session();
    
    if ($teacherEmail) {
        error_log("Teacher logged out: " . $teacherEmail);
    }
    
    // If no student session, destroy entire session
    if (!isset($_SESSION['user_id'])) {
        session_destroy();
        $_SESSION = array();
    }
    
    header('Location: ../teacher-login.html');
    exit;
    
} elseif ($logoutType === 'both') {
    // Logout both student and teacher
    error_log("Performing complete logout");
    
    // Clear all remember me tokens
    if (isset($_COOKIE['remember_token'])) {
        $token = $_COOKIE['remember_token'];
        $stmt = $pdo->prepare("DELETE FROM remember_tokens WHERE token = ?");
        $stmt->execute([$token]);
        setcookie('remember_token', '', time() - 3600, '/');
    }
    
    if (isset($_COOKIE['teacher_remember_token'])) {
        $token = $_COOKIE['teacher_remember_token'];
        $stmt = $pdo->prepare("DELETE FROM teacher_remember_tokens WHERE token = ?");
        $stmt->execute([$token]);
        setcookie('teacher_remember_token', '', time() - 3600, '/', '', true, true);
    }
    
    // Mark quiz attempts as abandoned if student was logged in
    if (isset($_SESSION['user_id'])) {
        try {
            $stmt = $pdo->prepare("
                UPDATE quiz_attempts 
                SET status = 'abandoned', completed_at = CURRENT_TIMESTAMP
                WHERE student_id = ? AND status = 'in_progress'
            ");
            $stmt->execute([$_SESSION['user_id']]);
        } catch (Exception $e) {
            error_log("Error marking quiz attempts as abandoned: " . $e->getMessage());
        }
    }
    
    // Destroy entire session
    session_destroy();
    $_SESSION = array();
    
    error_log("Complete logout performed");
    header('Location: ../index.html');
    exit;
    
} else {
    // No valid logout type or user
    error_log("Invalid logout request - no valid user type detected");
    header('Location: ../index.html');
    exit;
}
?>
