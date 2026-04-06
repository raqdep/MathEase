<?php
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

require_once 'config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        throw new Exception('Invalid input payload.');
    }

    if (array_key_exists('email', $input)) {
        throw new Exception('Email cannot be changed from profile settings.');
    }

    $firstName = trim((string)($input['first_name'] ?? ''));
    $lastName = trim((string)($input['last_name'] ?? ''));
    if (array_key_exists('grade_level', $input) || array_key_exists('strand', $input)) {
        throw new Exception('Grade level and strand cannot be changed from profile settings.');
    }

    if ($firstName === '' || $lastName === '') {
        throw new Exception('First name and last name are required.');
    }

    if (strlen($firstName) > 80 || strlen($lastName) > 80) {
        throw new Exception('Name is too long.');
    }

    $userId = (int)$_SESSION['user_id'];
    $stmt = $pdo->prepare("UPDATE users SET first_name = ?, last_name = ? WHERE id = ?");
    $stmt->execute([
        $firstName,
        $lastName,
        $userId
    ]);

    $_SESSION['user_name'] = trim($firstName . ' ' . $lastName);

    require_once __DIR__ . '/student-activity-log-helper.php';
    log_student_activity($pdo, $userId, 'profile_edit', 'Updated profile name');

    $fetchStmt = $pdo->prepare("SELECT id, first_name, last_name, email, student_id, grade_level, strand, last_login, COALESCE(profile_picture, '') as profile_picture FROM users WHERE id = ?");
    $fetchStmt->execute([$userId]);
    $user = $fetchStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception('User record not found after update.');
    }

    if (!empty($user['profile_picture'])) {
        $path = (string)$user['profile_picture'];
        if (strpos($path, '../') === 0) $path = substr($path, 3);
        if (strpos($path, 'uploads/profiles/') !== 0) $path = 'uploads/profiles/' . ltrim(basename($path), '/\\');
        $user['profile_picture'] = $path;
        $user['profile_picture_url'] = $path;
    } else {
        $user['profile_picture'] = null;
        $user['profile_picture_url'] = null;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully.',
        'user' => $user
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
