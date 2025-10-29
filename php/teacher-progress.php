<?php
require_once 'config.php';

// Check if teacher is logged in
if (!isset($_SESSION['teacher_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

try {
    // Get teacher's class statistics
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(DISTINCT u.id) as total_students,
            COUNT(DISTINCT CASE WHEN up.completed_lessons > 0 THEN u.id END) as active_students,
            AVG(up.total_score) as average_score,
            SUM(up.completed_lessons) as total_completed_lessons
        FROM users u
        LEFT JOIN user_progress up ON u.id = up.user_id
        WHERE u.strand = 'STEM' AND u.grade_level = '11'
    ");
    $stmt->execute();
    $summary = $stmt->fetch();
    
    // Get student activity (recent progress updates)
    $stmt = $pdo->prepare("
        SELECT 
            u.first_name,
            u.last_name,
            u.student_id,
            up.current_topic,
            up.completed_lessons,
            up.total_score,
            up.updated_at
        FROM users u
        LEFT JOIN user_progress up ON u.id = up.user_id
        WHERE u.strand = 'STEM' AND u.grade_level = '11'
        ORDER BY up.updated_at DESC
        LIMIT 10
    ");
    $stmt->execute();
    $studentActivity = $stmt->fetchAll();
    
    // Get topic performance data
    $stmt = $pdo->prepare("
        SELECT 
            t.name as topic_name,
            COUNT(DISTINCT utp.user_id) as students_attempted,
            COUNT(DISTINCT CASE WHEN utp.completed = 1 THEN utp.user_id END) as students_completed,
            AVG(utp.best_score) as average_score,
            MAX(utp.last_attempt) as last_activity
        FROM topics t
        LEFT JOIN user_topic_progress utp ON t.id = utp.topic_id
        LEFT JOIN users u ON utp.user_id = u.id
        WHERE u.strand = 'STEM' AND u.grade_level = '11'
        GROUP BY t.id, t.name
        ORDER BY t.order_index
    ");
    $stmt->execute();
    $topicPerformance = $stmt->fetchAll();
    
    // Get upcoming deadlines (placeholder - can be expanded with actual assignment system)
    $upcomingDeadlines = [
        [
            'title' => 'Functions Quiz',
            'due_date' => date('Y-m-d', strtotime('+3 days')),
            'class' => 'Grade 11 STEM',
            'type' => 'quiz'
        ],
        [
            'title' => 'Rational Functions Assignment',
            'due_date' => date('Y-m-d', strtotime('+7 days')),
            'class' => 'Grade 11 STEM',
            'type' => 'assignment'
        ]
    ];
    
    // Get teaching resources
    $teachingResources = [
        [
            'title' => 'Functions Lesson Plan',
            'type' => 'lesson_plan',
            'url' => 'resources/functions-lesson-plan.pdf'
        ],
        [
            'title' => 'Interactive Graphing Tools',
            'type' => 'tool',
            'url' => 'tools/graphing-calculator.html'
        ],
        [
            'title' => 'Assessment Rubrics',
            'type' => 'rubric',
            'url' => 'resources/assessment-rubrics.pdf'
        ]
    ];
    
    $response = [
        'success' => true,
        'summary' => [
            'total_students' => $summary['total_students'] ?? 0,
            'active_students' => $summary['active_students'] ?? 0,
            'average_score' => round($summary['average_score'] ?? 0, 1),
            'total_completed_lessons' => $summary['total_completed_lessons'] ?? 0
        ],
        'student_activity' => $studentActivity,
        'topic_performance' => $topicPerformance,
        'upcoming_deadlines' => $upcomingDeadlines,
        'teaching_resources' => $teachingResources
    ];
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    
    error_log("Teacher progress data error: " . $e->getMessage());
}

header('Content-Type: application/json');
echo json_encode($response);
?>
