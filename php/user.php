<?php
require_once 'config.php';

function normalizeStudentProfilePicture(?string $rawPath): ?string {
    $path = trim((string)($rawPath ?? ''));
    if ($path === '') {
        return null;
    }

    if (strpos($path, '../') === 0) {
        $path = substr($path, 3);
    }

    if (preg_match('#^https?://#i', $path)) {
        return $path;
    }

    if (strpos($path, 'uploads/profiles/') === 0) {
        return $path;
    }

    if (strpos($path, 'profiles/') === 0) {
        return 'uploads/' . $path;
    }

    return 'uploads/profiles/' . ltrim(basename($path), '/\\');
}

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Allow teachers to view topic/lesson pages (they don't have user_id)
if (is_teacher_logged_in()) {
    $name = $_SESSION['teacher_name'] ?? 'Teacher';
    $parts = preg_split('/\s+/', trim($name), 2);
    echo json_encode([
        'success' => true,
        'user' => [
            'first_name' => $parts[0] ?? $name,
            'last_name' => $parts[1] ?? '',
            'grade_level' => null,
            'strand' => null,
            'email' => $_SESSION['teacher_email'] ?? '',
            'student_id' => null
        ],
        'progress' => ['total_score' => 0, 'completed_lessons' => 0, 'current_topic' => ''],
        'user_type' => 'teacher'
    ]);
    exit;
}

if (!is_logged_in()) {
    error_log("User not logged in - Session data: " . json_encode($_SESSION));
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

try {
    $userId = $_SESSION['user_id'];

    // Ensure profile_picture column exists
    try {
        $col = $pdo->query("SHOW COLUMNS FROM users LIKE 'profile_picture'");
        if ($col->rowCount() === 0) {
            $pdo->exec("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) NULL");
        }
    } catch (PDOException $e) { /* ignore */ }

    // Fetch user (include profile_picture for nav/topic icons)
    $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, student_id, grade_level, strand, last_login, COALESCE(profile_picture, '') as profile_picture FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception('User not found');
    }

    $normalizedProfilePicture = normalizeStudentProfilePicture($user['profile_picture'] ?? null);
    $user['profile_picture'] = $normalizedProfilePicture;
    $user['profile_picture_url'] = $normalizedProfilePicture;

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


