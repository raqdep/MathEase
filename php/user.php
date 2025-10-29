<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if (!is_logged_in()) {
    error_log("User not logged in - Session data: " . json_encode($_SESSION));
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

try {
    $userId = $_SESSION['user_id'];

    // Fetch user
    $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, student_id, grade_level, strand, last_login FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        throw new Exception('User not found');
    }

    // Fetch or initialize user_progress
    $stmt = $pdo->prepare("SELECT total_score, completed_lessons, current_topic FROM user_progress WHERE user_id = ?");
    $stmt->execute([$userId]);
    $progress = $stmt->fetch();

    if (!$progress) {
        $progress = [
            'total_score' => 0,
            'completed_lessons' => 0,
            'current_topic' => 'Functions'
        ];
    }

    $response = [
        'success' => true,
        'user' => $user,
        'progress' => $progress
    ];
    
    error_log("User.php returning data: " . json_encode($response));
    echo json_encode($response);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>


