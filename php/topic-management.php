<?php
// Ensure clean output
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output
ini_set('log_errors', 1); // Log errors instead

session_start();
require_once 'config.php';

// Set content type to JSON
header('Content-Type: application/json');

// Check if user is logged in as teacher
if (!isset($_SESSION['teacher_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error_code' => 'TEACHER_AUTH_REQUIRED',
        'message' => 'Teacher authentication required',
        'redirect' => 'teacher-login.html'
    ]);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {
        case 'get_class_topics':
            getClassTopics();
            break;
        case 'toggle_topic_lock':
            toggleTopicLock();
            break;
        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function getClassTopics() {
    global $pdo;
    
    $classId = $_GET['class_id'] ?? '';
    
    if (empty($classId)) {
        throw new Exception('Class ID is required');
    }
    
    // Verify teacher owns this class
    $stmt = $pdo->prepare("SELECT id FROM classes WHERE id = ? AND teacher_id = ?");
    $stmt->execute([$classId, $_SESSION['teacher_id']]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('Class not found or access denied');
    }
    
    // Get all topics with their lock status for this class
    $stmt = $pdo->prepare("
        SELECT 
            t.id as topic_id,
            t.name as topic_name,
            t.description,
            t.order_index as topic_order,
            COALESCE(ct.is_locked, 0) as is_locked,
            ? as class_id
        FROM topics t
        LEFT JOIN class_topic_locks ct ON t.id = ct.topic_id AND ct.class_id = ?
        ORDER BY t.order_index ASC
    ");
    $stmt->execute([$classId, $classId]);
    $result = $stmt->fetchAll();
    
    $topics = [];
    foreach ($result as $row) {
        $topics[] = [
            'topic_id' => $row['topic_id'],
            'topic_name' => $row['topic_name'],
            'description' => $row['description'],
            'topic_order' => $row['topic_order'],
            'is_locked' => (bool)$row['is_locked'],
            'class_id' => $row['class_id']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'topics' => $topics
    ]);
}

function toggleTopicLock() {
    global $pdo;
    
    $topicId = $_POST['topic_id'] ?? '';
    $classId = $_POST['class_id'] ?? '';
    $isLocked = $_POST['is_locked'] ?? '';
    
    if (empty($topicId) || empty($classId)) {
        throw new Exception('Topic ID and Class ID are required');
    }
    
    // Verify teacher owns this class
    $stmt = $pdo->prepare("SELECT id FROM classes WHERE id = ? AND teacher_id = ?");
    $stmt->execute([$classId, $_SESSION['teacher_id']]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('Class not found or access denied');
    }
    
    // Check if topic exists
    $stmt = $pdo->prepare("SELECT id FROM topics WHERE id = ?");
    $stmt->execute([$topicId]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('Topic not found');
    }
    
    $newLockStatus = $isLocked === 'true' ? 0 : 1; // Toggle the status
    
    // Check if lock record exists
    $stmt = $pdo->prepare("SELECT id FROM class_topic_locks WHERE topic_id = ? AND class_id = ?");
    $stmt->execute([$topicId, $classId]);
    
    if ($stmt->rowCount() > 0) {
        // Update existing record
        $stmt = $pdo->prepare("UPDATE class_topic_locks SET is_locked = ?, updated_at = NOW() WHERE topic_id = ? AND class_id = ?");
        $stmt->execute([$newLockStatus, $topicId, $classId]);
    } else {
        // Insert new record
        $stmt = $pdo->prepare("INSERT INTO class_topic_locks (topic_id, class_id, is_locked, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
        $stmt->execute([$topicId, $classId, $newLockStatus]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => $newLockStatus ? 'Topic locked successfully' : 'Topic unlocked successfully',
        'is_locked' => (bool)$newLockStatus
    ]);
}
?>