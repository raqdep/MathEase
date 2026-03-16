<?php
/**
 * Teacher lesson/topic progress - track which topics the teacher has viewed
 * so they can see "My lesson progress" on the teacher dashboard.
 */
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['teacher_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Teacher not logged in']);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS teacher_topic_views (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            topic_slug VARCHAR(100) NOT NULL,
            topic_name VARCHAR(150) NOT NULL,
            last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_teacher_topic (teacher_id, topic_slug),
            INDEX idx_teacher (teacher_id),
            INDEX idx_last_viewed (last_viewed_at)
        )
    ");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
    exit;
}

$teacherId = (int) $_SESSION['teacher_id'];

try {
    switch ($action) {
        case 'record_view':
            $topicSlug = trim($_POST['topic_slug'] ?? $_GET['topic_slug'] ?? '');
            $topicName = trim($_POST['topic_name'] ?? $_GET['topic_name'] ?? $topicSlug);
            if ($topicSlug === '') {
                echo json_encode(['success' => false, 'message' => 'topic_slug required']);
                exit;
            }
            $stmt = $pdo->prepare("
                INSERT INTO teacher_topic_views (teacher_id, topic_slug, topic_name, last_viewed_at)
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE topic_name = VALUES(topic_name), last_viewed_at = NOW()
            ");
            $stmt->execute([$teacherId, $topicSlug, $topicName ?: $topicSlug]);
            echo json_encode(['success' => true, 'message' => 'View recorded']);
            break;

        case 'get_my_progress':
            $stmt = $pdo->prepare("
                SELECT topic_slug, topic_name, last_viewed_at
                FROM teacher_topic_views
                WHERE teacher_id = ?
                ORDER BY last_viewed_at DESC
                LIMIT 50
            ");
            $stmt->execute([$teacherId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode([
                'success' => true,
                'topics' => $rows,
                'count' => count($rows)
            ]);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
