<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Check if user is logged in as student
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$topicId = $_GET['topic_id'] ?? '';

if (!$topicId) {
    echo json_encode(['success' => false, 'message' => 'Topic ID required']);
    exit;
}

// Map URL topic IDs to database topic names
function mapTopicIdToName($topicId) {
    $mapping = [
        'functions' => 'Functions',
        'evaluating-functions' => 'Evaluating Functions',
        'operations-on-functions' => 'Operations on Functions',
        'solving-real-life-problems' => 'Solving Real-Life Problems',
        'rational-functions' => 'Rational Functions',
        'representations-of-rational-functions' => 'Representations of Rational Functions',
        'domain-range-rational-functions' => 'Domain and Range of Rational Functions',
        'domain-range-inverse-functions' => 'Domain and Range of Inverse Functions',
        'one-to-one-functions' => 'One-to-One Functions',
        'solving-rational-equations-inequalities' => 'Solving Rational Equations and Inequalities',
        'simple-interest' => 'Simple Interest',
        'compound-interest' => 'Compound Interest',
        'simple-and-compound-values' => 'Interest, Maturity, Future, and Present Values',
        'solving-interest-problems' => 'Solving Problems: Simple and Compound Interest'
    ];
    
    return $mapping[$topicId] ?? $topicId;
}

$topicName = mapTopicIdToName($topicId);

try {
    // Check if student is enrolled in any class
    $stmt = $pdo->prepare("
        SELECT ce.id, ce.class_id, c.teacher_id
        FROM class_enrollments ce
        JOIN classes c ON ce.class_id = c.id
        WHERE ce.student_id = ? AND ce.enrollment_status = 'approved'
        LIMIT 1
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $enrollment = $stmt->fetch();
    
    if (!$enrollment) {
        echo json_encode([
            'success' => true,
            'is_locked' => false,
            'needs_enrollment' => true,
            'message' => 'You are not enrolled in any class'
        ]);
        exit;
    }
    
    // Check if topic is locked for this specific class
    $stmt = $pdo->prepare("
        SELECT ctl.is_locked
        FROM class_topic_locks ctl
        JOIN topics t ON ctl.topic_id = t.id
        WHERE ctl.class_id = ? AND t.name = ?
    ");
    $stmt->execute([$enrollment['class_id'], $topicName]);
    $lock = $stmt->fetch();
    
    if ($lock && $lock['is_locked']) {
        echo json_encode([
            'success' => true,
            'is_locked' => true,
            'message' => 'This topic is currently locked by your teacher'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'is_locked' => false,
            'message' => 'Topic is available'
        ]);
    }
    
} catch (Exception $e) {
    error_log("Student topic check error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>
