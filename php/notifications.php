<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Disable error display to prevent HTML in JSON response
ini_set('display_errors', 0);
error_reporting(E_ALL);

class NotificationManager {
    private $pdo;
    
    public function __construct() {
        global $pdo;
        $this->pdo = $pdo;
        if (!$this->pdo) {
            throw new Exception("Database connection not available");
        }
    }
    
    // Get notifications for a user
    public function getUserNotifications($userId, $limit = 50, $unreadOnly = false) {
        try {
            // Ensure limit is an integer
            $limit = (int)$limit;
            if ($limit <= 0) $limit = 50;
            
            $sql = "
                SELECT id, type, title, message, is_read, read_at, 
                       DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
                       UNIX_TIMESTAMP(created_at) as created_timestamp
                FROM notifications 
                WHERE user_id = ?
            ";
            
            if ($unreadOnly) {
                $sql .= " AND is_read = FALSE";
            }
            
            $sql .= " ORDER BY created_at DESC LIMIT " . $limit;
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId]);
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'notifications' => $notifications
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Mark notification as read
    public function markAsRead($notificationId, $userId) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE notifications 
                SET is_read = TRUE, read_at = NOW() 
                WHERE id = ? AND user_id = ?
            ");
            
            if ($stmt->execute([$notificationId, $userId])) {
                return [
                    'success' => true,
                    'message' => 'Notification marked as read'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to mark notification as read'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Mark all notifications as read for a user
    public function markAllAsRead($userId) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE notifications 
                SET is_read = TRUE, read_at = NOW() 
                WHERE user_id = ? AND is_read = FALSE
            ");
            
            if ($stmt->execute([$userId])) {
                return [
                    'success' => true,
                    'message' => 'All notifications marked as read'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to mark notifications as read'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Get unread notification count
    public function getUnreadCount($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as unread_count
                FROM notifications 
                WHERE user_id = ? AND is_read = FALSE
            ");
            $stmt->execute([$userId]);
            $result = $stmt->fetch();
            
            return [
                'success' => true,
                'unread_count' => $result['unread_count']
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Create a notification
    public function createNotification($userId, $type, $title, $message) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO notifications (user_id, type, title, message, is_read, created_at) 
                VALUES (?, ?, ?, ?, FALSE, NOW())
            ");
            
            if ($stmt->execute([$userId, $type, $title, $message])) {
                return [
                    'success' => true,
                    'notification_id' => $this->pdo->lastInsertId()
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to create notification'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Delete a notification
    public function deleteNotification($notificationId, $userId) {
        try {
            $stmt = $this->pdo->prepare("
                DELETE FROM notifications 
                WHERE id = ? AND user_id = ?
            ");
            
            if ($stmt->execute([$notificationId, $userId])) {
                return [
                    'success' => true,
                    'message' => 'Notification deleted'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to delete notification'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}

// Handle requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    $notificationManager = new NotificationManager();
    
    switch ($action) {
        case 'get_notifications':
            if (!isset($_SESSION['user_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            $limit = $_GET['limit'] ?? 50;
            $unreadOnly = isset($_GET['unread_only']) && $_GET['unread_only'] === 'true';
            
            $result = $notificationManager->getUserNotifications($_SESSION['user_id'], $limit, $unreadOnly);
            
            echo json_encode($result);
            break;
            
        case 'get_unread_count':
            if (!isset($_SESSION['user_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            $result = $notificationManager->getUnreadCount($_SESSION['user_id']);
            
            echo json_encode($result);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $notificationManager = new NotificationManager();
    
    switch ($action) {
        case 'mark_as_read':
            if (!isset($_SESSION['user_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            $notificationId = $_POST['notification_id'] ?? null;
            if (!$notificationId) {
                echo json_encode(['success' => false, 'message' => 'Notification ID is required']);
                exit;
            }
            
            $result = $notificationManager->markAsRead($notificationId, $_SESSION['user_id']);
            echo json_encode($result);
            break;
            
        case 'mark_all_as_read':
            if (!isset($_SESSION['user_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            $result = $notificationManager->markAllAsRead($_SESSION['user_id']);
            echo json_encode($result);
            break;
            
        case 'delete_notification':
            if (!isset($_SESSION['user_id'])) {
                echo json_encode(['success' => false, 'message' => 'Not authenticated']);
                exit;
            }
            
            $notificationId = $_POST['notification_id'] ?? null;
            if (!$notificationId) {
                echo json_encode(['success' => false, 'message' => 'Notification ID is required']);
                exit;
            }
            
            $result = $notificationManager->deleteNotification($notificationId, $_SESSION['user_id']);
            echo json_encode($result);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
