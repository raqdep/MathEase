<?php
/**
 * Upload Profile Picture
 * Handles profile picture uploads for students
 */

// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

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

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // Check if file was uploaded
    if (!isset($_FILES['profile_picture']) || $_FILES['profile_picture']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error');
    }
    
    $file = $_FILES['profile_picture'];
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    $fileType = mime_content_type($file['tmp_name']);
    
    if (!in_array($fileType, $allowedTypes)) {
        throw new Exception('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
    }
    
    // Validate file size (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception('File size exceeds 5MB limit.');
    }
    
    // Create uploads directory if it doesn't exist
    $uploadDir = __DIR__ . '/../uploads/profiles/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'profile_' . $user_id . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Failed to save uploaded file');
    }
    
    // Update database
    // First, check if profile_picture column exists, if not add it
    try {
        $columnCheck = $pdo->query("SHOW COLUMNS FROM users LIKE 'profile_picture'");
        if ($columnCheck->rowCount() == 0) {
            // Column doesn't exist, add it
            $pdo->exec("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) NULL");
            error_log("Added profile_picture column to users table");
        }
    } catch (PDOException $e) {
        error_log("Warning: Could not check/add profile_picture column: " . $e->getMessage());
        // Continue anyway - column might already exist
    }
    
    // Get old profile picture to delete it
    $stmt = $pdo->prepare("SELECT profile_picture FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $oldPicture = $stmt->fetchColumn();
    
    // Update user record in database
    $stmt = $pdo->prepare("UPDATE users SET profile_picture = ? WHERE id = ?");
    $updateResult = $stmt->execute([$filename, $user_id]);
    
    if (!$updateResult) {
        // If update failed, delete the uploaded file
        @unlink($filepath);
        throw new Exception('Failed to update profile picture in database');
    }
    
    // Verify the update was successful
    $verifyStmt = $pdo->prepare("SELECT profile_picture FROM users WHERE id = ?");
    $verifyStmt->execute([$user_id]);
    $savedPicture = $verifyStmt->fetchColumn();
    
    if ($savedPicture !== $filename) {
        // Database update didn't work, delete uploaded file
        @unlink($filepath);
        throw new Exception('Failed to verify profile picture was saved to database');
    }
    
    error_log("Profile picture saved to database for user_id: $user_id, filename: $filename");
    
    // Delete old profile picture if it exists
    if ($oldPicture && $oldPicture !== $filename && file_exists($uploadDir . $oldPicture)) {
        @unlink($uploadDir . $oldPicture);
        error_log("Deleted old profile picture: $oldPicture");
    }
    
    // Final verification - query database to confirm it was saved
    $finalCheck = $pdo->prepare("SELECT profile_picture FROM users WHERE id = ?");
    $finalCheck->execute([$user_id]);
    $finalResult = $finalCheck->fetchColumn();
    
    if ($finalResult !== $filename) {
        // Database save failed, clean up uploaded file
        @unlink($filepath);
        error_log("ERROR: Profile picture filename mismatch. Expected: $filename, Got: " . ($finalResult ?: 'NULL'));
        throw new Exception('Failed to save profile picture to database. Please try again.');
    }
    
    error_log("SUCCESS: Profile picture saved to database for user_id: $user_id, filename: $filename");
    
    $normalizedPath = normalizeStudentProfilePicture($filename);

    echo json_encode([
        'success' => true,
        'message' => 'Profile picture uploaded and saved to database successfully',
        'profile_picture' => $normalizedPath,
        'profile_picture_url' => $normalizedPath,
        'verified' => true
    ]);
    
} catch (Exception $e) {
    error_log("Error in upload-profile-picture.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
