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

    $firstName = trim((string)($input['first_name'] ?? ''));
    $lastName = trim((string)($input['last_name'] ?? ''));

    if ($firstName === '' || $lastName === '') {
        throw new Exception('First name and last name are required.');
    }

    if (strlen($firstName) > 80 || strlen($lastName) > 80) {
        throw new Exception('Name is too long.');
    }

    if (isset($input['email'])) {
        throw new Exception('Email cannot be changed from profile settings.');
    }

    $teacherId = (int)$_SESSION['teacher_id'];
    $stmt = $pdo->prepare("UPDATE teachers SET first_name = ?, last_name = ? WHERE id = ?");
    $stmt->execute([$firstName, $lastName, $teacherId]);

    $fetchStmt = $pdo->prepare("SELECT id, first_name, last_name, email, teacher_id, department, subject FROM teachers WHERE id = ?");
    $fetchStmt->execute([$teacherId]);
    $teacher = $fetchStmt->fetch(PDO::FETCH_ASSOC);

    if (!$teacher) {
        throw new Exception('Teacher record not found after update.');
    }

    $_SESSION['teacher_name'] = trim(($teacher['first_name'] ?? '') . ' ' . ($teacher['last_name'] ?? ''));

    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully.',
        'teacher' => $teacher
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
