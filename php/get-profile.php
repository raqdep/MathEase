<?php
/**
 * Get Student Profile Data
 * Returns complete profile information including badges, lessons, and quizzes
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
$requested_user_id = $_GET['user_id'] ?? $user_id;

// Only allow users to view their own profile (unless admin)
if ($requested_user_id != $user_id) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

try {
    // First, ensure profile_picture column exists
    try {
        $columnCheck = $pdo->query("SHOW COLUMNS FROM users LIKE 'profile_picture'");
        if ($columnCheck->rowCount() == 0) {
            // Column doesn't exist, add it
            $pdo->exec("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) NULL");
            error_log("Added profile_picture column to users table in get-profile.php");
        }
    } catch (PDOException $e) {
        error_log("Warning: Could not check/add profile_picture column: " . $e->getMessage());
        // Continue anyway
    }
    
    // Get user information
    $stmt = $pdo->prepare("
        SELECT 
            id, 
            first_name, 
            last_name, 
            email, 
            student_id, 
            grade_level, 
            strand, 
            last_login,
            COALESCE(profile_picture, '') as profile_picture
        FROM users 
        WHERE id = ?
    ");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception('User not found');
    }
    
    error_log("Retrieved profile data for user_id: $user_id");
    
    // Get badges from database
    $badges = [];
    try {
        // Check if badges and user_badges (or student_badges) tables exist
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'badges'");
        if ($tableCheck->rowCount() > 0) {
            $useUserBadges = $pdo->query("SHOW TABLES LIKE 'user_badges'")->rowCount() > 0;
            $useStudentBadges = !$useUserBadges && $pdo->query("SHOW TABLES LIKE 'student_badges'")->rowCount() > 0;
            if ($useUserBadges) {
                $stmt = $pdo->prepare("
                    SELECT b.id, b.name, b.description, b.icon_url, ub.earned_at
                    FROM badges b
                    INNER JOIN user_badges ub ON b.id = ub.badge_id
                    WHERE ub.user_id = ?
                    ORDER BY ub.earned_at DESC
                ");
                $stmt->execute([$user_id]);
                $badges = $stmt->fetchAll(PDO::FETCH_ASSOC);
                error_log("Retrieved " . count($badges) . " badges from database for user_id: $user_id");
            } elseif ($useStudentBadges) {
                $stmt = $pdo->prepare("
                    SELECT b.id, b.name, b.description, b.icon_url, sb.earned_at
                    FROM badges b
                    INNER JOIN student_badges sb ON b.id = sb.badge_id
                    WHERE sb.student_id = ?
                    ORDER BY sb.earned_at DESC
                ");
                $stmt->execute([$user_id]);
                $badges = $stmt->fetchAll(PDO::FETCH_ASSOC);
                error_log("Retrieved " . count($badges) . " badges from database for user_id: $user_id");
            }
        }
    } catch (PDOException $e) {
        error_log("Error fetching badges: " . $e->getMessage());
        $badges = [];
    }
    
    // Get completed lessons from database
    $lessons = [];
    try {
        // Check if lesson_completion table exists
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'lesson_completion'");
        if ($tableCheck->rowCount() > 0) {
            $stmt = $pdo->prepare("
                SELECT 
                    lesson_number,
                    topic_name,
                    completed_at
                FROM lesson_completion
                WHERE user_id = ?
                ORDER BY completed_at DESC
            ");
            $stmt->execute([$user_id]);
            $lessons = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("Retrieved " . count($lessons) . " completed lessons from database for user_id: $user_id");
        }
    } catch (PDOException $e) {
        error_log("Error fetching lessons: " . $e->getMessage());
        $lessons = [];
    }
    
    // Get quiz attempts from database
    $quizzes = [];
    try {
        // Check if quiz_attempts table exists
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'quiz_attempts'");
        if ($tableCheck->rowCount() > 0) {
            $stmt = $pdo->prepare("
                SELECT 
                    quiz_type,
                    score,
                    total_questions,
                    completed_at
                FROM quiz_attempts
                WHERE student_id = ?
                ORDER BY completed_at DESC
                LIMIT 50
            ");
            $stmt->execute([$user_id]);
            $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("Retrieved " . count($quizzes) . " quiz attempts from database for user_id: $user_id");
        }
    } catch (PDOException $e) {
        error_log("Error fetching quizzes: " . $e->getMessage());
        $quizzes = [];
    }
    
    // Get total study time from database
    $totalStudyTime = 0;
    try {
        // Check if study_time table exists
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'study_time'");
        if ($tableCheck->rowCount() > 0) {
            $stmt = $pdo->prepare("
                SELECT SUM(time_spent_seconds) as total_time
                FROM study_time
                WHERE student_id = ?
            ");
            $stmt->execute([$user_id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $totalStudyTime = (int)($result['total_time'] ?? 0);
            error_log("Retrieved total study time from database for user_id: $user_id - $totalStudyTime seconds");
        }
    } catch (PDOException $e) {
        error_log("Error fetching study time: " . $e->getMessage());
        $totalStudyTime = 0;
    }
    
    $normalizedProfilePicture = normalizeStudentProfilePicture($user['profile_picture'] ?? null);
    $user['profile_picture'] = $normalizedProfilePicture;
    $user['profile_picture_url'] = $normalizedProfilePicture;
    
    echo json_encode([
        'success' => true,
        'user' => $user,
        'badges' => $badges,
        'lessons' => $lessons,
        'quizzes' => $quizzes,
        'study_time' => (int)$totalStudyTime
    ]);
    
} catch (Exception $e) {
    error_log("Error in get-profile.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
