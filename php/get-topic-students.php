<?php
session_start();
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
$topic = $_GET['topic'] ?? '';

if (empty($topic)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Topic is required']);
    exit;
}

try {
    // Get the current user's class enrollment (only approved enrollments in active classes)
    $enrollmentStmt = $pdo->prepare("
        SELECT ce.class_id, c.class_name
        FROM class_enrollments ce
        INNER JOIN classes c ON ce.class_id = c.id
        WHERE ce.student_id = ? 
            AND ce.enrollment_status = 'approved'
            AND c.is_active = TRUE
        LIMIT 1
    ");
    $enrollmentStmt->execute([$user_id]);
    $enrollment = $enrollmentStmt->fetch();
    
    if (!$enrollment) {
        echo json_encode([
            'success' => true,
            'students' => [],
            'total_count' => 0,
            'message' => 'User not enrolled in any active class'
        ]);
        exit;
    }
    
    $class_id = $enrollment['class_id'];
    $class_name = $enrollment['class_name'] ?? 'Unknown Class';
    
    // Topic name mapping (URL-friendly to display name)
    $topicNameMap = [
        'functions' => 'Functions',
        'evaluating-functions' => 'Evaluating Functions',
        'operations-on-functions' => 'Operations on Functions',
        'solving-real-life-problems' => 'Solving Real-Life Problems',
        'rational-functions' => 'Rational Functions',
        'solving-rational-equations-inequalities' => 'Solving Rational Equations and Inequalities',
        'representations-of-rational-functions' => 'Representations of Rational Functions',
        'domain-range-rational-functions' => 'Domain and Range of Rational Functions',
        'one-to-one-functions' => 'One-to-One Functions',
        'domain-range-inverse-functions' => 'Domain and Range of Inverse Functions',
        'simple-interest' => 'Simple Interest',
        'compound-interest' => 'Compound Interest',
        'simple-and-compound-values' => 'Interest, Maturity, Future, and Present Values',
        'solving-interest-problems' => 'Solving Problems: Simple and Compound Interest'
    ];
    
    $properTopicName = $topicNameMap[$topic] ?? $topic;
    
    // Get topic_id
    $topicStmt = $pdo->prepare("SELECT id FROM topics WHERE name = ?");
    $topicStmt->execute([$properTopicName]);
    $topicData = $topicStmt->fetch();
    
    if (!$topicData) {
        echo json_encode([
            'success' => true,
            'students' => [],
            'message' => 'Topic not found'
        ]);
        exit;
    }
    
    $topic_id = $topicData['id'];
    
    // Get all students in the SAME CLASS who have accessed this topic
    // Only show students from the current user's class (class_id must match exactly)
    // Check both lesson_completion and user_topic_progress tables
    $stmt = $pdo->prepare("
        SELECT DISTINCT
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.profile_picture,
            COUNT(DISTINCT lc.lesson_number) as lessons_completed,
            ce.class_id
        FROM users u
        INNER JOIN class_enrollments ce ON u.id = ce.student_id
        INNER JOIN classes c ON ce.class_id = c.id
        LEFT JOIN lesson_completion lc ON u.id = lc.user_id 
            AND (lc.topic_name = ? OR lc.topic_name = ?)
        LEFT JOIN user_topic_progress utp ON u.id = utp.user_id 
            AND utp.topic_id = ?
        WHERE ce.class_id = ? 
            AND ce.enrollment_status = 'approved'
            AND c.is_active = TRUE
            AND u.id != ?
            AND (
                lc.id IS NOT NULL 
                OR utp.id IS NOT NULL
            )
        GROUP BY u.id, u.first_name, u.last_name, u.email, u.profile_picture, ce.class_id
        HAVING ce.class_id = ?
        ORDER BY lessons_completed DESC, u.first_name, u.last_name
    ");
    
    $stmt->execute([$topic, $properTopicName, $topic_id, $class_id, $user_id, $class_id]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($students as &$student) {
        $normalizedProfilePicture = normalizeStudentProfilePicture($student['profile_picture'] ?? null);
        $student['profile_picture'] = $normalizedProfilePicture;
        $student['profile_picture_url'] = $normalizedProfilePicture;
    }
    unset($student);
    
    // Get total count of students from SAME CLASS who accessed this topic
    $countStmt = $pdo->prepare("
        SELECT COUNT(DISTINCT u.id) as total_count
        FROM users u
        INNER JOIN class_enrollments ce ON u.id = ce.student_id
        INNER JOIN classes c ON ce.class_id = c.id
        LEFT JOIN lesson_completion lc ON u.id = lc.user_id 
            AND (lc.topic_name = ? OR lc.topic_name = ?)
        LEFT JOIN user_topic_progress utp ON u.id = utp.user_id 
            AND utp.topic_id = ?
        WHERE ce.class_id = ? 
            AND ce.enrollment_status = 'approved'
            AND c.is_active = TRUE
            AND u.id != ?
            AND (
                lc.id IS NOT NULL 
                OR utp.id IS NOT NULL
            )
    ");
    
    $countStmt->execute([$topic, $properTopicName, $topic_id, $class_id, $user_id]);
    $countResult = $countStmt->fetch();
    $totalCount = $countResult['total_count'] ?? 0;
    
    echo json_encode([
        'success' => true,
        'students' => $students,
        'total_count' => $totalCount,
        'topic' => $topic,
        'class_id' => $class_id,
        'class_name' => $class_name
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
