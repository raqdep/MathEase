<?php
session_start();
require_once 'config.php';

// Check if admin is logged in
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

$teacherId = $_GET['teacher_id'] ?? null;

if (!$teacherId) {
    echo json_encode(['success' => false, 'message' => 'Teacher ID is required']);
    exit;
}

try {
    // Get teacher information
    $stmt = $pdo->prepare("
        SELECT id, first_name, last_name, email, teacher_id, department, subject, created_at
        FROM teachers 
        WHERE id = ? AND approval_status = 'approved'
    ");
    $stmt->execute([$teacherId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$teacher) {
        echo json_encode(['success' => false, 'message' => 'Teacher not found']);
        exit;
    }
    
    // Get students with detailed progress analytics
    $stmt = $pdo->prepare("
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.student_id,
            u.grade_level,
            u.strand,
            COALESCE(up.total_score, 0) as total_score,
            COALESCE(up.completed_lessons, 0) as completed_lessons,
            CASE 
                WHEN up.completed_lessons > 0 THEN ROUND((up.total_score / (up.completed_lessons * 100)) * 100, 2)
                ELSE 0 
            END as progress_percentage,
            COALESCE(quiz_stats.avg_quiz_score, 0) as avg_quiz_score,
            COALESCE(achievement_stats.achievements_count, 0) as achievements_count,
            ROW_NUMBER() OVER (ORDER BY COALESCE(up.total_score, 0) DESC) as ranking
        FROM users u
        LEFT JOIN user_progress up ON u.id = up.user_id
        LEFT JOIN (
            SELECT 
                user_id,
                AVG(score) as avg_quiz_score
            FROM quiz_attempts 
            WHERE completed = 1
            GROUP BY user_id
        ) quiz_stats ON u.id = quiz_stats.user_id
        LEFT JOIN (
            SELECT 
                user_id,
                COUNT(*) as achievements_count
            FROM user_achievements
            GROUP BY user_id
        ) achievement_stats ON u.id = achievement_stats.user_id
        WHERE u.email_verified = 1
        AND EXISTS (
            SELECT 1 FROM teacher_classes tc 
            WHERE tc.teacher_id = ? 
            AND tc.grade_level = u.grade_level 
            AND tc.strand = u.strand 
            AND tc.is_active = TRUE
        )
        ORDER BY total_score DESC
    ");
    $stmt->execute([$teacherId]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate analytics
    $totalStudents = count($students);
    $avgProgress = $totalStudents > 0 ? round(array_sum(array_column($students, 'progress_percentage')) / $totalStudents, 2) : 0;
    $avgQuizScore = $totalStudents > 0 ? round(array_sum(array_column($students, 'avg_quiz_score')) / $totalStudents, 2) : 0;
    $totalAchievements = array_sum(array_column($students, 'achievements_count'));
    
    $analytics = [
        'total_students' => $totalStudents,
        'avg_progress' => $avgProgress,
        'avg_quiz_score' => $avgQuizScore,
        'total_achievements' => $totalAchievements
    ];
    
    echo json_encode([
        'success' => true,
        'teacher' => $teacher,
        'students' => $students,
        'analytics' => $analytics
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in admin-student-progress.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
}
?>
