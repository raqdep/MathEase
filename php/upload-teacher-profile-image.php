<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

if (!isset($_SESSION['teacher_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

function ensureTeacherImageColumn(PDO $pdo): string {
    $columnsStmt = $pdo->query("SHOW COLUMNS FROM teachers");
    $columns = $columnsStmt ? $columnsStmt->fetchAll(PDO::FETCH_COLUMN, 0) : [];
    $preferred = ['profile_image', 'profile_image_path', 'avatar', 'photo'];
    foreach ($preferred as $candidate) {
        if (in_array($candidate, $columns, true)) {
            return $candidate;
        }
    }
    $pdo->exec("ALTER TABLE teachers ADD COLUMN profile_image VARCHAR(255) NULL AFTER subject");
    return 'profile_image';
}

try {
    if (!isset($_FILES['profile_image'])) {
        throw new Exception('No image uploaded.');
    }

    $file = $_FILES['profile_image'];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new Exception('Upload failed. Please try again.');
    }

    $maxBytes = 3 * 1024 * 1024;
    if (($file['size'] ?? 0) <= 0 || ($file['size'] ?? 0) > $maxBytes) {
        throw new Exception('Image must be less than 3MB.');
    }

    $tmpName = (string)$file['tmp_name'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = $finfo ? finfo_file($finfo, $tmpName) : '';
    if ($finfo) finfo_close($finfo);

    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp'
    ];
    if (!isset($allowed[$mime])) {
        throw new Exception('Only JPG, PNG, and WEBP images are allowed.');
    }

    $ext = $allowed[$mime];
    $teacherId = (int)$_SESSION['teacher_id'];
    $fileName = 'teacher_' . $teacherId . '_' . time() . '.' . $ext;

    $relativeDir = 'uploads/teacher-profiles';
    $absoluteDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'teacher-profiles';
    if (!is_dir($absoluteDir) && !mkdir($absoluteDir, 0775, true) && !is_dir($absoluteDir)) {
        throw new Exception('Failed to create upload directory.');
    }

    $destination = $absoluteDir . DIRECTORY_SEPARATOR . $fileName;
    if (!move_uploaded_file($tmpName, $destination)) {
        throw new Exception('Failed to save uploaded image.');
    }

    $relativePath = $relativeDir . '/' . $fileName;
    $column = ensureTeacherImageColumn($pdo);
    $update = $pdo->prepare("UPDATE teachers SET {$column} = ? WHERE id = ?");
    $update->execute([$relativePath, $teacherId]);

    echo json_encode([
        'success' => true,
        'message' => 'Profile image uploaded successfully.',
        'profile_image' => $relativePath,
        'profile_image_url' => $relativePath
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
