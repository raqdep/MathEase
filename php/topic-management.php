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

/**
 * Canonical list of topics that have actual pages in topics/ folder.
 * This is the single source of truth for Topic Management.
 * order_index: 1-10 = 1st Quarter, 11+ = 2nd Quarter
 */
function getCanonicalTopicsList() {
    return [
        ['slug' => 'functions', 'name' => 'Functions', 'order_index' => 1, 'description' => 'Introduction to functions, domain & range, operations, composition and inverses'],
        ['slug' => 'evaluating-functions', 'name' => 'Evaluating Functions', 'order_index' => 2, 'description' => 'Evaluate functions at given values and interpret notation'],
        ['slug' => 'operations-on-functions', 'name' => 'Operations on Functions', 'order_index' => 3, 'description' => 'Add, subtract, multiply, and divide functions'],
        ['slug' => 'solving-real-life-problems', 'name' => 'Solving Real-Life Problems', 'order_index' => 4, 'description' => 'Apply functions to real-world situations'],
        ['slug' => 'rational-functions', 'name' => 'Rational Functions', 'order_index' => 5, 'description' => 'Rational functions, graphing, and applications'],
        ['slug' => 'solving-rational-equations-inequalities', 'name' => 'Solving Rational Equations and Inequalities', 'order_index' => 6, 'description' => 'Solve rational equations and inequalities'],
        ['slug' => 'representations-of-rational-functions', 'name' => 'Representations of Rational Functions', 'order_index' => 7, 'description' => 'Represent rational functions in various forms'],
        ['slug' => 'domain-range-rational-functions', 'name' => 'Domain and Range of Rational Functions', 'order_index' => 8, 'description' => 'Domain and range of rational functions'],
        ['slug' => 'one-to-one-functions', 'name' => 'One-to-One Functions', 'order_index' => 9, 'description' => 'One-to-one functions and horizontal line test'],
        ['slug' => 'domain-range-inverse-functions', 'name' => 'Domain and Range of Inverse Functions', 'order_index' => 10, 'description' => 'Domain and range of inverse functions'],
        ['slug' => 'simple-interest', 'name' => 'Simple Interest', 'order_index' => 11, 'description' => 'Simple interest calculations'],
        ['slug' => 'compound-interest', 'name' => 'Compound Interest', 'order_index' => 12, 'description' => 'Compound interest and growth'],
        ['slug' => 'simple-and-compound-values', 'name' => 'Simple and Compound Values', 'order_index' => 13, 'description' => 'Future and present values for simple and compound interest'],
        ['slug' => 'solving-interest-problems', 'name' => 'Solving Interest Problems', 'order_index' => 14, 'description' => 'Solve real-life problems involving interest'],
    ];
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