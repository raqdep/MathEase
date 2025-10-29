<?php
/**
 * Helper function to create notifications for teachers
 * This can be included and called from other PHP files
 */

function createTeacherNotification($teacher_id, $type, $title, $message, $class_id = null) {
    $host = 'localhost';
    $dbname = 'mathease';
    $username = 'root';
    $password = '';
    
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->prepare("
            INSERT INTO teacher_notifications (teacher_id, class_id, type, title, message, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, 0, NOW())
        ");
        
        return $stmt->execute([$teacher_id, $class_id, $type, $title, $message]);
        
    } catch (PDOException $e) {
        error_log("Failed to create notification: " . $e->getMessage());
        return false;
    }
}

/**
 * Create notification for new student enrollment request
 */
function notifyNewEnrollment($teacher_id, $class_id, $student_name, $class_name) {
    return createTeacherNotification(
        $teacher_id,
        'enrollment',
        'New Enrollment Request',
        "Student $student_name has requested to join your class \"$class_name\"",
        $class_id
    );
}

/**
 * Create notification for quiz submission
 */
function notifyQuizSubmission($teacher_id, $class_id, $student_name, $quiz_name, $class_name) {
    return createTeacherNotification(
        $teacher_id,
        'quiz_submitted',
        'New Quiz Submission',
        "$student_name completed the $quiz_name in \"$class_name\"",
        $class_id
    );
}

/**
 * Create notification for quiz deadline approaching
 */
function notifyQuizDeadline($teacher_id, $class_id, $quiz_name, $class_name, $hours_remaining) {
    return createTeacherNotification(
        $teacher_id,
        'deadline',
        'Quiz Deadline Approaching',
        "The deadline for $quiz_name in \"$class_name\" is in $hours_remaining hours",
        $class_id
    );
}

/**
 * Create notification for class performance update
 */
function notifyClassPerformance($teacher_id, $class_id, $class_name, $performance_message) {
    return createTeacherNotification(
        $teacher_id,
        'performance',
        'Class Performance Update',
        "Your class \"$class_name\" - $performance_message",
        $class_id
    );
}

/**
 * Create notification for approved enrollment
 */
function notifyEnrollmentApproved($teacher_id, $class_id, $student_name, $class_name) {
    return createTeacherNotification(
        $teacher_id,
        'enrollment',
        'Enrollment Approved',
        "You approved $student_name to join your class \"$class_name\"",
        $class_id
    );
}

/**
 * Create system notification
 */
function notifySystem($teacher_id, $title, $message) {
    return createTeacherNotification(
        $teacher_id,
        'system',
        $title,
        $message,
        null
    );
}

/**
 * Batch create notifications for all teachers in a class
 */
function notifyClassTeachers($class_id, $type, $title, $message) {
    $host = 'localhost';
    $dbname = 'mathease';
    $username = 'root';
    $password = '';
    
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Get teacher_id from class
        $stmt = $pdo->prepare("SELECT teacher_id FROM classes WHERE id = ?");
        $stmt->execute([$class_id]);
        $class = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($class) {
            return createTeacherNotification(
                $class['teacher_id'],
                $type,
                $title,
                $message,
                $class_id
            );
        }
        
        return false;
        
    } catch (PDOException $e) {
        error_log("Failed to notify class teachers: " . $e->getMessage());
        return false;
    }
}
