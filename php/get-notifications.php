<?php
/**
 * Teacher notifications API — reads/writes `teacher_notifications` in mathease_database3.
 */
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// Check if teacher is logged in
if (!isset($_SESSION['teacher_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated'
    ]);
    exit;
}

$teacher_id = $_SESSION['teacher_id'];

// Force DB name (avoid wrong DB_NAME from environment)
putenv('DB_NAME=mathease_database3');
$_ENV['DB_NAME'] = 'mathease_database3';
$_SERVER['DB_NAME'] = 'mathease_database3';

$configPath = __DIR__ . '/config.php';
if (file_exists($configPath)) {
    require_once $configPath;
    if (!isset($pdo)) {
        $host = defined('DB_HOST') ? DB_HOST : 'localhost';
        $username = defined('DB_USER') ? DB_USER : 'root';
        $password = defined('DB_PASS') ? DB_PASS : '';
        $pdo = new PDO('mysql:host=' . $host . ';dbname=mathease_database3;charset=utf8mb4', $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
} else {
    $host = 'localhost';
    $username = 'root';
    $password = '';
    $pdo = new PDO('mysql:host=' . $host . ';dbname=mathease_database3;charset=utf8mb4', $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}

/**
 * Ensure table exists on legacy installs (minimal DDL).
 */
function ensure_teacher_notifications_table(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS teacher_notifications (
            id INT(11) NOT NULL AUTO_INCREMENT,
            teacher_id INT(11) NOT NULL,
            class_id INT(11) DEFAULT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            read_at TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (id),
            KEY teacher_id (teacher_id),
            KEY class_id (class_id),
            KEY is_read (is_read),
            KEY created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

try {
    ensure_teacher_notifications_table($pdo);

    // Handle POST requests (mark as read)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';

        if ($action === 'mark_read' && isset($_POST['notification_id'])) {
            $notification_id = $_POST['notification_id'];

            $stmt = $pdo->prepare('
                UPDATE teacher_notifications
                SET is_read = 1, read_at = NOW()
                WHERE id = ? AND teacher_id = ?
            ');
            $stmt->execute([$notification_id, $teacher_id]);

            echo json_encode(['success' => true]);
            exit;
        }

        if ($action === 'mark_all_read') {
            $stmt = $pdo->prepare('
                UPDATE teacher_notifications
                SET is_read = 1, read_at = NOW()
                WHERE teacher_id = ? AND is_read = 0
            ');
            $stmt->execute([$teacher_id]);

            echo json_encode(['success' => true]);
            exit;
        }
    }

    // GET request - fetch notifications (last 30 days)
    $stmt = $pdo->prepare('
        SELECT
            tn.*,
            c.class_name
        FROM teacher_notifications tn
        LEFT JOIN classes c ON tn.class_id = c.id
        WHERE tn.teacher_id = ?
        AND tn.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY tn.created_at DESC
        LIMIT 50
    ');
    $stmt->execute([$teacher_id]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare('
        SELECT COUNT(*) as unread_count
        FROM teacher_notifications
        WHERE teacher_id = ? AND is_read = 0
    ');
    $stmt->execute([$teacher_id]);
    $unread = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'notifications' => $notifications,
        'unread_count' => (int) $unread['unread_count'],
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage(),
    ]);
}
