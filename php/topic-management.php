<?php
// Ensure clean output
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output
ini_set('log_errors', 1); // Log errors instead

session_start();
require_once 'config.php';
require_once __DIR__ . '/topics-canonical.php';
require_once __DIR__ . '/student-notification-helper.php';

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
    
    $canonical = getCanonicalTopicsList();
    $topics = [];
    
    foreach ($canonical as $c) {
        $name = $c['name'];
        $orderIndex = $c['order_index'];
        $description = $c['description'] ?? '';
        
        // Ensure topic exists in DB (for class_topic_locks FK)
        $stmt = $pdo->prepare("SELECT id FROM topics WHERE name = ? LIMIT 1");
        $stmt->execute([$name]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$row) {
            try {
                $ins = $pdo->prepare("
                    INSERT INTO topics (name, description, difficulty_level, order_index, is_active, created_at)
                    VALUES (?, ?, 'intermediate', ?, 1, NOW())
                ");
                $ins->execute([$name, $description, $orderIndex]);
                $topicId = $pdo->lastInsertId();
            } catch (PDOException $e) {
                error_log("topic-management: insert topic failed: " . $e->getMessage());
                continue;
            }
        } else {
            $topicId = $row['id'];
            // Optionally update order_index to match canonical
            try {
                $upd = $pdo->prepare("UPDATE topics SET order_index = ? WHERE id = ?");
                $upd->execute([$orderIndex, $topicId]);
            } catch (PDOException $e) { /* ignore */ }
        }
        
        // Get lock status for this class
        $stmt = $pdo->prepare("SELECT is_locked FROM class_topic_locks WHERE topic_id = ? AND class_id = ?");
        $stmt->execute([$topicId, $classId]);
        $lockRow = $stmt->fetch(PDO::FETCH_ASSOC);
        $isLocked = $lockRow ? (bool)$lockRow['is_locked'] : false;
        
        $topics[] = [
            'topic_id' => (int) $topicId,
            'topic_name' => $name,
            'topic_slug' => $c['slug'],
            'description' => $description,
            'topic_order' => $orderIndex,
            'is_locked' => $isLocked,
            'class_id' => $classId
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
    $stmt = $pdo->prepare("SELECT id, name FROM topics WHERE id = ? LIMIT 1");
    $stmt->execute([$topicId]);
    $topicRow = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$topicRow) {
        throw new Exception('Topic not found');
    }

    $classStmt = $pdo->prepare("SELECT class_name FROM classes WHERE id = ? LIMIT 1");
    $classStmt->execute([$classId]);
    $classRow = $classStmt->fetch(PDO::FETCH_ASSOC);
    $className = $classRow['class_name'] ?? 'your class';
    
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

    // Notify approved students: topic opened/closed (lesson access)
    try {
        $topicName = (string)($topicRow['name'] ?? 'Topic');
        if ($newLockStatus) {
            notifyApprovedStudents($pdo, (int)$classId, 'topic_closed', 'Topic Closed', "$topicName was closed by your teacher in \"$className\".");
        } else {
            notifyApprovedStudents($pdo, (int)$classId, 'topic_opened', 'Topic Opened', "$topicName is now open in \"$className\". You can continue learning.");
        }
    } catch (Throwable $e) {
        error_log('topic-management notify students failed: ' . $e->getMessage());
    }
    
    echo json_encode([
        'success' => true,
        'message' => $newLockStatus ? 'Topic locked successfully' : 'Topic unlocked successfully',
        'is_locked' => (bool)$newLockStatus
    ]);
}
?>