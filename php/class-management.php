<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

class ClassManagement {
    private $pdo;
    
    public function __construct() {
        global $pdo;
        $this->pdo = $pdo;
        if (!$this->pdo) {
            throw new Exception("Database connection not available");
        }
    }
    
    // Generate a unique class code
    public function generateClassCode() {
        $code = '';
        $exists = true;
        
        while ($exists) {
            $code = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, 4)) . 
                   str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
            
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM classes WHERE class_code = ?");
            $stmt->execute([$code]);
            $exists = $stmt->fetchColumn() > 0;
        }
        
        return $code;
    }
    
    // Create a new class
    public function createClass($teacherId, $className, $description, $subject, $gradeLevel, $strand, $maxStudents = 50) {
        try {
            $classCode = $this->generateClassCode();
            
            $stmt = $this->pdo->prepare("
                INSERT INTO classes (teacher_id, class_name, class_code, description, subject, grade_level, strand, max_students) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            if ($stmt->execute([$teacherId, $className, $classCode, $description, $subject, $gradeLevel, $strand, $maxStudents])) {
                $classId = $this->pdo->lastInsertId();
                return [
                    'success' => true,
                    'class_id' => $classId,
                    'class_code' => $classCode,
                    'message' => 'Class created successfully'
                ];
            } else {
                throw new Exception("Failed to create class");
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Get teacher's classes
    public function getTeacherClasses($teacherId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT c.id, c.teacher_id, c.class_name, c.class_code, c.description, c.subject, 
                       c.grade_level, c.strand, c.is_active, c.max_students, c.created_at, c.updated_at,
                       COUNT(ce.id) as total_enrollments,
                       COUNT(CASE WHEN ce.enrollment_status = 'approved' THEN 1 END) as approved_students,
                       COUNT(CASE WHEN ce.enrollment_status = 'approved' THEN 1 END) as student_count,
                       COUNT(CASE WHEN ce.enrollment_status = 'pending' THEN 1 END) as pending_students
                FROM classes c
                LEFT JOIN class_enrollments ce ON c.id = ce.class_id
                WHERE c.teacher_id = ? AND c.is_active = TRUE
                GROUP BY c.id
                ORDER BY c.created_at DESC
            ");
            $stmt->execute([$teacherId]);
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
    
    // Join class with code
    public function joinClass($studentId, $classCode) {
        try {
            // First, check if class exists and is active
            $stmt = $this->pdo->prepare("
                SELECT c.id as class_id, c.teacher_id, c.class_name, c.max_students, 
                       COUNT(ce.id) as current_enrollments
                FROM classes c
                LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.enrollment_status = 'approved'
                WHERE c.class_code = ? AND c.is_active = TRUE
                GROUP BY c.id
            ");
            $stmt->execute([$classCode]);
            
            if ($stmt->rowCount() === 0) {
                return [
                    'success' => false,
                    'message' => 'Invalid class code or class is not active'
                ];
            }
            
            $class = $stmt->fetch();
            
            // Check if class is full
            if ($class['current_enrollments'] >= $class['max_students']) {
                return [
                    'success' => false,
                    'message' => 'Class is full'
                ];
            }
            
            // Check if student is already enrolled
            $stmt = $this->pdo->prepare("
                SELECT id, enrollment_status 
                FROM class_enrollments 
                WHERE class_id = ? AND student_id = ?
            ");
            $stmt->execute([$class['class_id'], $studentId]);
            
            if ($stmt->rowCount() > 0) {
                $enrollment = $stmt->fetch();
                if ($enrollment['enrollment_status'] === 'approved') {
                    return [
                        'success' => false,
                        'message' => 'You are already enrolled in this class'
                    ];
                } elseif ($enrollment['enrollment_status'] === 'pending') {
                    return [
                        'success' => false,
                        'message' => 'Your enrollment request is pending approval'
                    ];
                }
            }
            
            // Create enrollment request
            $stmt = $this->pdo->prepare("
                INSERT INTO class_enrollments (class_id, student_id, enrollment_status) 
                VALUES (?, ?, 'pending')
                ON DUPLICATE KEY UPDATE 
                enrollment_status = 'pending',
                enrolled_at = CURRENT_TIMESTAMP
            ");
            
            if ($stmt->execute([$class['class_id'], $studentId])) {
                // Get student information for notification
                $studentStmt = $this->pdo->prepare("
                    SELECT first_name, last_name FROM users WHERE id = ?
                ");
                $studentStmt->execute([$studentId]);
                $student = $studentStmt->fetch();
                
                // Create notification for teacher
                try {
                    require_once 'create-notification.php';
                    $studentName = $student['first_name'] . ' ' . $student['last_name'];
                    notifyNewEnrollment($class['teacher_id'], $class['class_id'], $studentName, $class['class_name']);
                } catch (Exception $notifError) {
                    // Log error but don't fail the enrollment
                    error_log("Failed to create teacher notification: " . $notifError->getMessage());
                }
                
                return [
                    'success' => true,
                    'message' => 'Enrollment request sent successfully. Waiting for teacher approval.',
                    'class_name' => $class['class_name']
                ];
            } else {
                throw new Exception("Failed to create enrollment request");
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Get pending enrollments for teacher
    public function getPendingEnrollments($teacherId) {
        try {
            // Debug: Log the teacher ID
            error_log("Getting pending enrollments for teacher ID: " . $teacherId);
            
            $stmt = $this->pdo->prepare("
                SELECT ce.id as enrollment_id, ce.class_id, ce.student_id, ce.enrollment_status, 
                       ce.enrolled_at, ce.approved_at, ce.approved_by, ce.notes, ce.created_at, ce.updated_at,
                       c.class_name, c.class_code,
                       u.first_name, u.last_name, u.email, u.student_id as student_number
                FROM class_enrollments ce
                JOIN classes c ON ce.class_id = c.id
                JOIN users u ON ce.student_id = u.id
                WHERE c.teacher_id = ? AND ce.enrollment_status = 'pending' AND c.is_active = TRUE
                ORDER BY ce.enrolled_at ASC
            ");
            $stmt->execute([$teacherId]);
            $enrollments = $stmt->fetchAll();
            
            // Debug: Log the number of enrollments found
            error_log("Found " . count($enrollments) . " pending enrollments");
            
            return [
                'success' => true,
                'enrollments' => $enrollments
            ];
        } catch (Exception $e) {
            error_log("Error getting pending enrollments: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Update enrollment status
    public function updateEnrollmentStatus($enrollmentId, $status, $teacherId, $notes = '') {
        try {
            if (!in_array($status, ['approved', 'rejected'])) {
                throw new Exception("Invalid status");
            }
            
            // First, check if the enrollment exists and belongs to the teacher
            $checkStmt = $this->pdo->prepare("
                SELECT ce.id, ce.class_id, ce.student_id, c.teacher_id, c.class_name, ce.enrollment_status,
                       u.first_name, u.last_name, u.email
                FROM class_enrollments ce
                JOIN classes c ON ce.class_id = c.id
                JOIN users u ON ce.student_id = u.id
                WHERE ce.id = ? AND c.teacher_id = ?
            ");
            $checkStmt->execute([$enrollmentId, $teacherId]);
            $enrollment = $checkStmt->fetch();
            
            // Debug: Log the enrollment check
            error_log("Enrollment check - ID: " . $enrollmentId . ", Teacher ID: " . $teacherId . ", Found: " . ($enrollment ? 'Yes' : 'No'));
            if ($enrollment) {
                error_log("Enrollment details: " . print_r($enrollment, true));
            }
            
            if (!$enrollment) {
                return [
                    'success' => false,
                    'message' => 'Enrollment not found or you do not have permission'
                ];
            }
            
            // Start transaction
            $this->pdo->beginTransaction();
            
            try {
                // Update the enrollment status
                $stmt = $this->pdo->prepare("
                    UPDATE class_enrollments 
                    SET enrollment_status = ?, approved_at = CURRENT_TIMESTAMP, approved_by = ?, notes = ?
                    WHERE id = ?
                ");
                
                if (!$stmt->execute([$status, $teacherId, $notes, $enrollmentId])) {
                    throw new Exception("Failed to update enrollment status");
                }
                
                // Create notification for the student
                $notificationStmt = $this->pdo->prepare("
                    INSERT INTO notifications (user_id, type, title, message, is_read, created_at) 
                    VALUES (?, ?, ?, ?, 0, UTC_TIMESTAMP())
                ");
                
                if ($status === 'approved') {
                    $notificationType = 'enrollment_approved';
                    $notificationTitle = "Enrollment Approved: " . $enrollment['class_name'];
                    $notificationMessage = "Your enrollment request for class '" . $enrollment['class_name'] . "' has been approved! You can now access the class materials and participate in activities.";
                } else {
                    $notificationType = 'enrollment_rejected';
                    $notificationTitle = "Enrollment Rejected: " . $enrollment['class_name'];
                    $notificationMessage = "Your enrollment request for class '" . $enrollment['class_name'] . "' has been rejected.";
                    if (!empty($notes)) {
                        $notificationMessage .= " Reason: " . $notes;
                    }
                }
                
                $notificationStmt->execute([
                    $enrollment['student_id'],
                    $notificationType,
                    $notificationTitle,
                    $notificationMessage
                ]);
                
                // Commit transaction
                $this->pdo->commit();
                
                return [
                    'success' => true,
                    'message' => 'Enrollment ' . $status . ' successfully. Student has been notified.',
                    'student_name' => $enrollment['first_name'] . ' ' . $enrollment['last_name']
                ];
                
            } catch (Exception $e) {
                // Rollback transaction on error
                $this->pdo->rollBack();
                throw $e;
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Get class students
    public function getClassStudents($classId, $teacherId) {
        try {
            // Debug logging
            error_log("getClassStudents - Class ID: " . $classId);
            error_log("getClassStudents - Teacher ID: " . $teacherId);
            
            // First, check if class exists at all
            $classExistsStmt = $this->pdo->prepare("SELECT id, teacher_id FROM classes WHERE id = ?");
            $classExistsStmt->execute([$classId]);
            $classExists = $classExistsStmt->fetch();
            
            if (!$classExists) {
                error_log("Class with ID " . $classId . " does not exist");
                return [
                    'success' => false,
                    'message' => 'Class does not exist'
                ];
            }
            
            error_log("Class exists - Teacher ID in DB: " . $classExists['teacher_id'] . ", Requesting Teacher ID: " . $teacherId);
            
            // First, get class information
            $classStmt = $this->pdo->prepare("
                SELECT id, class_name, subject, grade_level, strand, description, class_code, created_at
                FROM classes 
                WHERE id = ? AND teacher_id = ?
            ");
            $classStmt->execute([$classId, $teacherId]);
            $classInfo = $classStmt->fetch();
            
            if (!$classInfo) {
                error_log("Class access denied - Teacher ID mismatch");
                return [
                    'success' => false,
                    'message' => 'Class not found or access denied'
                ];
            }
            
            // Get all students (both approved and pending)
            $stmt = $this->pdo->prepare("
                SELECT ce.id as enrollment_id, ce.class_id, ce.student_id, ce.enrollment_status, 
                       ce.enrolled_at, ce.approved_at, ce.approved_by, ce.notes, ce.created_at, ce.updated_at,
                       u.first_name, u.last_name, u.email, u.student_id as student_number,
                       up.total_score, up.completed_lessons, up.current_topic
                FROM class_enrollments ce
                JOIN users u ON ce.student_id = u.id
                LEFT JOIN user_progress up ON u.id = up.user_id
                WHERE ce.class_id = ? 
                ORDER BY 
                    CASE ce.enrollment_status 
                        WHEN 'approved' THEN 1 
                        WHEN 'pending' THEN 2 
                        ELSE 3 
                    END,
                    ce.enrolled_at ASC
            ");
            $stmt->execute([$classId]);
            $students = $stmt->fetchAll();
            
            // Debug: Log the enrollment statuses
            error_log("Students found: " . count($students));
            foreach ($students as $student) {
                error_log("Student: " . $student['first_name'] . " " . $student['last_name'] . " - Status: " . $student['enrollment_status']);
            }
            
            return [
                'success' => true,
                'students' => $students,
                'class_info' => $classInfo
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Get student enrollments
    public function getStudentEnrollments($studentId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT ce.*, c.class_name, c.class_code, c.description, c.subject, c.grade_level, c.strand,
                       t.first_name as teacher_first_name, t.last_name as teacher_last_name, t.email as teacher_email
                FROM class_enrollments ce
                JOIN classes c ON ce.class_id = c.id
                JOIN teachers t ON c.teacher_id = t.id
                WHERE ce.student_id = ?
                ORDER BY ce.enrolled_at DESC
            ");
            $stmt->execute([$studentId]);
            $enrollments = $stmt->fetchAll();
            
            return [
                'success' => true,
                'enrollments' => $enrollments
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Delete a class and notify enrolled students
    public function deleteClass($classId, $teacherId) {
        try {
            // First, check if the class exists and belongs to the teacher
            $checkStmt = $this->pdo->prepare("
                SELECT c.id, c.class_name, c.teacher_id, 
                       COUNT(ce.id) as total_enrollments
                FROM classes c
                LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.enrollment_status = 'approved'
                WHERE c.id = ? AND c.teacher_id = ? AND c.is_active = TRUE
                GROUP BY c.id
            ");
            $checkStmt->execute([$classId, $teacherId]);
            $class = $checkStmt->fetch();
            
            if (!$class) {
                return [
                    'success' => false,
                    'message' => 'Class not found or you do not have permission to delete it'
                ];
            }
            
            // Get all enrolled students before deletion
            $studentsStmt = $this->pdo->prepare("
                SELECT u.id as student_id, u.first_name, u.last_name, u.email, ce.enrollment_status
                FROM class_enrollments ce
                JOIN users u ON ce.student_id = u.id
                WHERE ce.class_id = ? AND ce.enrollment_status = 'approved'
            ");
            $studentsStmt->execute([$classId]);
            $enrolledStudents = $studentsStmt->fetchAll();
            
            // Start transaction
            $this->pdo->beginTransaction();
            
            try {
                // Create notifications for enrolled students
                if (!empty($enrolledStudents)) {
                    $notificationStmt = $this->pdo->prepare("
                        INSERT INTO notifications (user_id, type, title, message, is_read, created_at) 
                        VALUES (?, 'class_deleted', ?, ?, 0, UTC_TIMESTAMP())
                    ");
                    
                    $notificationTitle = "Class Deleted: " . $class['class_name'];
                    $notificationMessage = "The class '" . $class['class_name'] . "' has been deleted by your teacher. You are no longer enrolled in this class.";
                    
                    foreach ($enrolledStudents as $student) {
                        $notificationStmt->execute([
                            $student['student_id'],
                            $notificationTitle,
                            $notificationMessage
                        ]);
                    }
                }
                
                // Delete all enrollments for this class
                $deleteEnrollmentsStmt = $this->pdo->prepare("
                    DELETE FROM class_enrollments WHERE class_id = ?
                ");
                $deleteEnrollmentsStmt->execute([$classId]);
                
                // Soft delete the class (set is_active to FALSE)
                $deleteClassStmt = $this->pdo->prepare("
                    UPDATE classes SET is_active = FALSE, updated_at = NOW() WHERE id = ?
                ");
                $deleteClassStmt->execute([$classId]);
                
                // Commit transaction
                $this->pdo->commit();
                
                return [
                    'success' => true,
                    'message' => 'Class deleted successfully. ' . count($enrolledStudents) . ' students have been notified.',
                    'notified_students' => count($enrolledStudents)
                ];
                
            } catch (Exception $e) {
                // Rollback transaction on error
                $this->pdo->rollBack();
                throw $e;
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    // Get students enrolled in a specific topic/class
    public function getTopicStudents($topicName) {
        try {
            error_log("getTopicStudents called for topic: $topicName");
            
            // First, get the current user's class (if they're a student)
            $currentUserId = $_SESSION['user_id'] ?? null;
            $userType = $_SESSION['user_type'] ?? null;
            
            error_log("Current user ID: $currentUserId, User type: $userType");
            
            if (!$currentUserId) {
                return [
                    'success' => false,
                    'message' => 'User not logged in'
                ];
            }

            $classId = null;
            
            if ($userType === 'student') {
                // Get the student's enrolled class
                $stmt = $this->pdo->prepare("
                    SELECT se.class_id 
                    FROM student_enrollments se 
                    WHERE se.student_id = ? AND se.status = 'approved'
                    LIMIT 1
                ");
                $stmt->execute([$currentUserId]);
                $enrollment = $stmt->fetch(PDO::FETCH_ASSOC);
                $classId = $enrollment['class_id'] ?? null;
            } else if ($userType === 'teacher') {
                // Get the teacher's first class
                $stmt = $this->pdo->prepare("
                    SELECT id FROM classes WHERE teacher_id = ? LIMIT 1
                ");
                $stmt->execute([$currentUserId]);
                $class = $stmt->fetch(PDO::FETCH_ASSOC);
                $classId = $class['id'] ?? null;
            }

            error_log("Found class ID: $classId");
            
            if (!$classId) {
                return [
                    'success' => false,
                    'message' => 'No class found for user'
                ];
            }

            // Get all students in the same class who have taken or are taking the topic
            // This includes students who have completed lessons or attempted quizzes for this topic
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT
                    s.id,
                    s.first_name,
                    s.last_name,
                    s.email,
                    COUNT(DISTINCT lc.id) as lessons_completed,
                    COUNT(DISTINCT qa.id) as quiz_attempts
                FROM students s
                JOIN student_enrollments se ON s.id = se.student_id
                LEFT JOIN lesson_completions lc ON s.id = lc.student_id 
                    AND lc.topic = ?
                LEFT JOIN quiz_attempts qa ON s.id = qa.student_id 
                    AND qa.quiz_type = ?
                WHERE se.class_id = ? AND se.status = 'approved'
                GROUP BY s.id, s.first_name, s.last_name, s.email
                HAVING lessons_completed > 0 OR quiz_attempts > 0
                ORDER BY s.first_name, s.last_name
            ");
            
            $stmt->execute([$topicName, $topicName, $classId]);
            $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("Found " . count($students) . " students who have taken topic: $topicName");
            
            // If no students have taken the topic yet, show all students in the class
            if (empty($students)) {
                $stmt = $this->pdo->prepare("
                    SELECT DISTINCT
                        s.id,
                        s.first_name,
                        s.last_name,
                        s.email
                    FROM students s
                    JOIN student_enrollments se ON s.id = se.student_id
                    WHERE se.class_id = ? AND se.status = 'approved'
                    ORDER BY s.first_name, s.last_name
                ");
                
                $stmt->execute([$classId]);
                $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
                error_log("Showing all " . count($students) . " students in class for topic: $topicName");
            }
            
            error_log("Returning " . count($students) . " students for topic: $topicName");
            
            return [
                'success' => true,
                'students' => $students,
                'class_id' => $classId,
                'topic' => $topicName
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error fetching topic students: ' . $e->getMessage()
            ];
        }
    }
}

// Handle requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    $classManager = new ClassManagement();
    
    switch ($action) {
        case 'get_teacher_classes':
            if (!isset($_SESSION['teacher_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            $result = $classManager->getTeacherClasses($_SESSION['teacher_id']);
            echo json_encode($result);
            break;
            
        case 'get_student_enrollments':
            if (!isset($_SESSION['user_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            $result = $classManager->getStudentEnrollments($_SESSION['user_id']);
            echo json_encode($result);
            break;
            
        case 'get_pending_enrollments':
            if (!isset($_SESSION['teacher_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            // Debug: Log session info
            error_log("Session data: " . print_r($_SESSION, true));
            
            $result = $classManager->getPendingEnrollments($_SESSION['teacher_id']);
            echo json_encode($result);
            break;
            
        case 'get_class_students':
            if (!isset($_SESSION['teacher_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            $classId = $_GET['class_id'] ?? null;
            $teacherId = $_SESSION['teacher_id'];
            
            // Debug logging
            error_log("get_class_students - Class ID: " . $classId);
            error_log("get_class_students - Teacher ID: " . $teacherId);
            
            if (!$classId) {
                echo json_encode(['success' => false, 'message' => 'Class ID is required']);
                exit;
            }
            
            $result = $classManager->getClassStudents($classId, $teacherId);
            echo json_encode($result);
            break;
            
        case 'debug_teacher_session':
            echo json_encode([
                'success' => true,
                'session_data' => $_SESSION,
                'teacher_id' => $_SESSION['teacher_id'] ?? 'Not set',
                'user_type' => $_SESSION['user_type'] ?? 'Not set'
            ]);
            break;
            
        case 'debug_teacher_classes':
            if (!isset($_SESSION['teacher_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            $teacherId = $_SESSION['teacher_id'];
            $stmt = $this->pdo->prepare("SELECT id, class_name, teacher_id FROM classes WHERE teacher_id = ?");
            $stmt->execute([$teacherId]);
            $classes = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'teacher_id' => $teacherId,
                'classes' => $classes
            ]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $classManager = new ClassManagement();
    
    switch ($action) {
        case 'create_class':
            if (!isset($_SESSION['teacher_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            $className = $_POST['class_name'] ?? '';
            $description = $_POST['description'] ?? '';
            $subject = $_POST['subject'] ?? '';
            $gradeLevel = $_POST['grade_level'] ?? '';
            $strand = $_POST['strand'] ?? '';
            $maxStudents = $_POST['max_students'] ?? 50;
            
            if (empty($className) || empty($subject) || empty($gradeLevel) || empty($strand)) {
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                exit;
            }
            
            $result = $classManager->createClass($_SESSION['teacher_id'], $className, $description, $subject, $gradeLevel, $strand, $maxStudents);
            echo json_encode($result);
            break;
            
        case 'join_class':
            if (!isset($_SESSION['user_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            $classCode = $_POST['class_code'] ?? '';
            if (empty($classCode)) {
                echo json_encode(['success' => false, 'message' => 'Class code is required']);
                exit;
            }
            
            $result = $classManager->joinClass($_SESSION['user_id'], $classCode);
            echo json_encode($result);
            break;
            
        case 'update_enrollment':
            if (!isset($_SESSION['teacher_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            $enrollmentId = $_POST['enrollment_id'] ?? null;
            $status = $_POST['status'] ?? null;
            $notes = $_POST['notes'] ?? '';
            
            if (!$enrollmentId || !$status) {
                echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
                exit;
            }
            
            // Debug: Log the parameters
            error_log("Update enrollment - Teacher ID: " . $_SESSION['teacher_id'] . ", Enrollment ID: " . $enrollmentId . ", Status: " . $status);
            
            $result = $classManager->updateEnrollmentStatus($enrollmentId, $status, $_SESSION['teacher_id'], $notes);
            echo json_encode($result);
            break;
            
        case 'delete_class':
            if (!isset($_SESSION['teacher_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            $classId = $_POST['class_id'] ?? null;
            
            if (!$classId) {
                echo json_encode(['success' => false, 'message' => 'Class ID is required']);
                exit;
            }
            
            $result = $classManager->deleteClass($classId, $_SESSION['teacher_id']);
            echo json_encode($result);
            break;
            
        case 'get_topic_students':
            if (!isset($_SESSION['user_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            $topic = $_GET['topic'] ?? '';
            if (empty($topic)) {
                echo json_encode(['success' => false, 'message' => 'Topic is required']);
                exit;
            }
            
            $result = $classManager->getTopicStudents($topic);
            echo json_encode($result);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>