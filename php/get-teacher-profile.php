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
} else {
    $host = 'localhost';
    $dbname = 'mathease_database3';
    $username = 'root';
    $password = '';
    
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed'
        ]);
        exit;
    }
}

try {
    $profileImageColumn = null;
    try {
        $colStmt = $pdo->query("SHOW COLUMNS FROM teachers");
        $columns = $colStmt ? $colStmt->fetchAll(PDO::FETCH_COLUMN, 0) : [];
        $preferred = ['profile_image', 'profile_image_path', 'avatar', 'photo'];
        foreach ($preferred as $candidate) {
            if (in_array($candidate, $columns, true)) {
                $profileImageColumn = $candidate;
                break;
            }
        }
    } catch (Exception $ignore) {
        $profileImageColumn = null;
    }

    $imageSelect = $profileImageColumn ? ", {$profileImageColumn} AS profile_image" : ", NULL AS profile_image";

    // Get teacher information
    $stmt = $pdo->prepare("
        SELECT id, first_name, last_name, email, teacher_id as teacher_id_number, department, subject {$imageSelect}
        FROM teachers
        WHERE id = ?
    ");
    $stmt->execute([$teacher_id]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($teacher) {
        if (!empty($teacher['profile_image'])) {
            $path = (string)$teacher['profile_image'];
            if (strpos($path, '../') === 0) {
                $path = substr($path, 3);
            }
            $teacher['profile_image'] = $path;
            $teacher['profile_image_url'] = $path;
        } else {
            $teacher['profile_image'] = null;
            $teacher['profile_image_url'] = null;
        }
        echo json_encode([
            'success' => true,
            'teacher' => $teacher
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Teacher not found'
        ]);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
