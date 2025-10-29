<?php
session_start();
header('Content-Type: application/json');

// Check if teacher is logged in
if (!isset($_SESSION['teacher_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated'
    ]);
    exit;
}

$teacher_id = $_SESSION['teacher_id'];

// Database connection
if (file_exists('config.php')) {
    require_once 'config.php';
    // Use $pdo from config if available
    if (!isset($pdo)) {
        $host = 'localhost';
        $dbname = 'mathease';
        $username = 'root';
        $password = ''; // Change this to your MySQL password if needed
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
} else {
    $host = 'localhost';
    $dbname = 'mathease';
    $username = 'root';
    $password = ''; // Change this to your MySQL password if needed
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}

try {
    
    // Handle POST requests (mark as read)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';
        
        if ($action === 'mark_read' && isset($_POST['notification_id'])) {
            $notification_id = $_POST['notification_id'];
            
            $stmt = $pdo->prepare("
                UPDATE teacher_notifications 
                SET is_read = 1, read_at = NOW() 
                WHERE id = ? AND teacher_id = ?
            ");
            $stmt->execute([$notification_id, $teacher_id]);
            
            echo json_encode(['success' => true]);
            exit;
        }
        
        if ($action === 'mark_all_read') {
            $stmt = $pdo->prepare("
                UPDATE teacher_notifications 
                SET is_read = 1, read_at = NOW() 
                WHERE teacher_id = ? AND is_read = 0
            ");
            $stmt->execute([$teacher_id]);
            
            echo json_encode(['success' => true]);
            exit;
        }
    }
    
    // GET request - fetch notifications
    // Get recent notifications (last 30 days)
    $stmt = $pdo->prepare("
        SELECT 
            tn.*,
            c.class_name
        FROM teacher_notifications tn
        LEFT JOIN classes c ON tn.class_id = c.id
        WHERE tn.teacher_id = ?
        AND tn.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY tn.created_at DESC
        LIMIT 50
    ");
    $stmt->execute([$teacher_id]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get unread count
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as unread_count 
        FROM teacher_notifications 
        WHERE teacher_id = ? AND is_read = 0
    ");
    $stmt->execute([$teacher_id]);
    $unread = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'notifications' => $notifications,
        'unread_count' => (int)$unread['unread_count']
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
