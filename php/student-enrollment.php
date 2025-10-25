<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

class StudentEnrollment {
    private $pdo;
    
    public function __construct() {
        global $pdo;
        $this->pdo = $pdo;
    }
    
    // Check if student is enrolled in any approved class
    public function checkStudentEnrollment($studentId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    ce.enrollment_status,
                    c.class_name,
                    c.class_code,
                    c.subject,
                    c.grade_level,
                    c.strand,
                    t.first_name as teacher_first_name,
                    t.last_name as teacher_last_name,
                    ce.enrolled_at,
                    ce.approved_at
                FROM class_enrollments ce
                JOIN classes c ON ce.class_id = c.id
                JOIN teachers t ON c.teacher_id = t.id
                WHERE ce.student_id = ? AND c.is_active = TRUE
                ORDER BY ce.enrolled_at DESC
            ");
            $stmt->execute([$studentId]);
            $enrollments = $stmt->fetchAll();
            
            $hasApprovedEnrollment = false;
            
            foreach ($enrollments as $row) {
                if ($row['enrollment_status'] === 'approved') {
                    $hasApprovedEnrollment = true;
                }
            }
            
            return [
                'success' => true,
                'has_approved_enrollment' => $hasApprovedEnrollment,
                'enrollments' => $enrollments,
                'can_access_content' => $hasApprovedEnrollment
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Get student's approved classes
    public function getApprovedClasses($studentId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    c.id as class_id,
                    c.class_name,
                    c.class_code,
                    c.subject,
                    c.grade_level,
                    c.strand,
                    c.description,
                    t.first_name as teacher_first_name,
                    t.last_name as teacher_last_name,
                    ce.approved_at
                FROM class_enrollments ce
                JOIN classes c ON ce.class_id = c.id
                JOIN teachers t ON c.teacher_id = t.id
                WHERE ce.student_id = ? AND ce.enrollment_status = 'approved' AND c.is_active = TRUE
                ORDER BY ce.approved_at DESC
            ");
            $stmt->execute([$studentId]);
            $classes = $stmt->fetchAll();
            
            return [
                'success' => true,
                'classes' => $classes
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}

// Handle API requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    $enrollmentManager = new StudentEnrollment();
    
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Not authenticated']);
        exit;
    }
    
    switch ($action) {
        case 'check_enrollment':
            $result = $enrollmentManager->checkStudentEnrollment($_SESSION['user_id']);
            echo json_encode($result);
            break;
            
        case 'get_approved_classes':
            $result = $enrollmentManager->getApprovedClasses($_SESSION['user_id']);
            echo json_encode($result);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
