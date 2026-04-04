<?php
// Start output buffering to prevent any output before JSON
ob_start();

session_start();
require_once 'config.php';
require_once __DIR__ . '/teacher-lessons-schema.php';

// Clean any output that might have been generated
ob_clean();

header('Content-Type: application/json');

// Check if user is logged in as teacher
if (!isset($_SESSION['teacher_id']) || !isset($_SESSION['user_type']) || $_SESSION['user_type'] !== 'teacher') {
    ob_clean();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Teacher access required.']);
    ob_end_flush();
    exit;
}

try {
    $teacher_id = $_SESSION['teacher_id'];
    ensure_teacher_lessons_schema($pdo);

    // Handle DELETE request
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        $lesson_id = $input['lesson_id'] ?? null;
        
        if (!$lesson_id) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Lesson ID required.']);
            ob_end_flush();
            exit;
        }
        
        // Verify lesson belongs to teacher
        $stmt = $pdo->prepare("
            SELECT id FROM teacher_lessons 
            WHERE id = ? AND teacher_id = ?
        ");
        $stmt->execute([$lesson_id, $teacher_id]);
        $lesson = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$lesson) {
            ob_clean();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Lesson not found or unauthorized.']);
            ob_end_flush();
            exit;
        }
        
        // Delete lesson
        $stmt = $pdo->prepare("DELETE FROM teacher_lessons WHERE id = ? AND teacher_id = ?");
        $stmt->execute([$lesson_id, $teacher_id]);
        
        ob_clean();
        echo json_encode([
            'success' => true,
            'message' => 'Lesson deleted successfully.'
        ]);
        ob_end_flush();
        exit;
    }
    
    // Handle GET request for specific lesson
    if (isset($_GET['lesson_id'])) {
        $lesson_id = (int)$_GET['lesson_id'];
        
        $stmt = $pdo->prepare("
            SELECT tl.id, tl.title, tl.topic, tl.html_content, tl.created_at, tl.updated_at,
                   tl.class_id, c.class_name
            FROM teacher_lessons tl
            LEFT JOIN classes c ON c.id = tl.class_id
            WHERE tl.id = ? AND tl.teacher_id = ?
        ");
        
        $stmt->execute([$lesson_id, $teacher_id]);
        $lesson = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($lesson) {
            ob_clean();
            echo json_encode([
                'success' => true,
                'lesson' => $lesson
            ]);
            ob_end_flush();
        } else {
            ob_clean();
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Lesson not found.'
            ]);
            ob_end_flush();
        }
        exit;
    }
    
    // Handle GET request for all lessons
    $stmt = $pdo->prepare("
        SELECT tl.id, tl.title, tl.topic, tl.created_at, tl.updated_at, tl.class_id, c.class_name
        FROM teacher_lessons tl
        LEFT JOIN classes c ON c.id = tl.class_id
        WHERE tl.teacher_id = ?
        ORDER BY tl.created_at DESC
    ");

    $stmt->execute([$teacher_id]);
    $lessons = $stmt->fetchAll(PDO::FETCH_ASSOC);

    ob_clean();
    echo json_encode([
        'success' => true,
        'lessons' => $lessons
    ]);
    ob_end_flush();

} catch (PDOException $e) {
    error_log("Get Teacher Lessons Error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load lessons.'
    ]);
    ob_end_flush();
}
?>
