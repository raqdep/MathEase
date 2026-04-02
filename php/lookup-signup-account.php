<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

try {
    $accountType = isset($_POST['account_type']) ? trim($_POST['account_type']) : 'student';
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Valid email is required.');
    }

    if ($accountType === 'teacher') {
        $stmt = $pdo->prepare("SELECT id, email_verified FROM teachers WHERE LOWER(email) = LOWER(?) LIMIT 1");
        $stmt->execute([$email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) throw new Exception('Teacher account not found.');
        echo json_encode([
            'success' => true,
            'id' => (int) $row['id'],
            'email_verified' => (int) ($row['email_verified'] ?? 0),
        ]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id, email_verified FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) throw new Exception('User account not found.');

    echo json_encode([
        'success' => true,
        'id' => (int) $row['id'],
        'email_verified' => (int) ($row['email_verified'] ?? 0),
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

