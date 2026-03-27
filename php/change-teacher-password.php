<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

if (!isset($_SESSION['teacher_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        throw new Exception('Invalid input payload.');
    }

    $currentPassword = (string)($input['current_password'] ?? '');
    $newPassword = (string)($input['new_password'] ?? '');
    $confirmPassword = (string)($input['confirm_password'] ?? '');

    if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
        throw new Exception('All password fields are required.');
    }

    if ($newPassword !== $confirmPassword) {
        throw new Exception('New password and confirmation do not match.');
    }

    if (strlen($newPassword) < 8) {
        throw new Exception('New password must be at least 8 characters.');
    }

    $teacherId = (int)$_SESSION['teacher_id'];
    $stmt = $pdo->prepare("SELECT password FROM teachers WHERE id = ?");
    $stmt->execute([$teacherId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$teacher) {
        throw new Exception('Teacher not found.');
    }

    if (!password_verify($currentPassword, (string)$teacher['password'])) {
        throw new Exception('Current password is incorrect.');
    }

    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $updateStmt = $pdo->prepare("UPDATE teachers SET password = ? WHERE id = ?");
    $updateStmt->execute([$newHash, $teacherId]);

    echo json_encode([
        'success' => true,
        'message' => 'Password updated successfully.'
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
