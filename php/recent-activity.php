<?php
// Set content type to JSON
header('Content-Type: application/json');

// Suppress any HTML output from errors
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    require_once 'config.php';
    
    // Check if user is logged in as teacher
    session_start();
    if (!isset($_SESSION['teacher_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Teacher authentication required']);
        exit;
    }

    $teacherId = $_SESSION['teacher_id'];
    $activities = [];
    
    // Get recent student enrollment requests (last 7 days)
    $stmt = $pdo->prepare("
        SELECT 
            'enrollment' as type,
            CONCAT(u.first_name, ' ', u.last_name) as student_name,
            u.email,
            er.created_at,
            er.status,
            c.class_name
        FROM enrollment_requests er
        JOIN users u ON er.student_id = u.id
        LEFT JOIN classes c ON er.class_id = c.id
        WHERE er.teacher_id = ? 
        AND er.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY er.created_at DESC
        LIMIT 5
    ");
    $stmt->execute([$teacherId]);
    $enrollmentRequests = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($enrollmentRequests as $request) {
        $activities[] = [
            'type' => 'enrollment',
            'icon' => 'fas fa-user-plus',
            'title' => 'New enrollment request',
            'description' => $request['student_name'] . ' requested to join ' . ($request['class_name'] ?: 'your class'),
            'time' => getTimeAgo($request['created_at']),
            'color' => 'text-blue-600',
            'status' => $request['status']
        ];
    }
    
    // Get recent quiz completions (last 7 days)
    $stmt = $pdo->prepare("
        SELECT 
            'quiz_completion' as type,
            CONCAT(u.first_name, ' ', u.last_name) as student_name,
            qa.quiz_type,
            qa.score,
            qa.total_questions,
            qa.completed_at,
            c.class_name
        FROM quiz_attempts qa
        JOIN users u ON qa.student_id = u.id
        LEFT JOIN class_enrollments ce ON u.id = ce.student_id
        LEFT JOIN classes c ON ce.class_id = c.id AND c.teacher_id = ?
        WHERE qa.teacher_id = ? 
        AND qa.completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND qa.status = 'completed'
        ORDER BY qa.completed_at DESC
        LIMIT 10
    ");
    $stmt->execute([$teacherId, $teacherId]);
    $quizCompletions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($quizCompletions as $completion) {
        $quizName = getQuizDisplayName($completion['quiz_type']);
        $percentage = round(($completion['score'] / $completion['total_questions']) * 100);
        
        $activities[] = [
            'type' => 'quiz_completion',
            'icon' => 'fas fa-question-circle',
            'title' => 'Quiz completed',
            'description' => $completion['student_name'] . ' completed ' . $quizName . ' with ' . $percentage . '%',
            'time' => getTimeAgo($completion['completed_at']),
            'color' => 'text-green-600',
            'score' => $completion['score'],
            'total' => $completion['total_questions']
        ];
    }
    
    // Get recent class activities (last 7 days)
    $stmt = $pdo->prepare("
        SELECT 
            'class_activity' as type,
            c.class_name,
            c.created_at,
            COUNT(ce.student_id) as student_count
        FROM classes c
        LEFT JOIN class_enrollments ce ON c.id = ce.class_id
        WHERE c.teacher_id = ? 
        AND c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT 3
    ");
    $stmt->execute([$teacherId]);
    $classActivities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($classActivities as $class) {
        $activities[] = [
            'type' => 'class_activity',
            'icon' => 'fas fa-chalkboard',
            'title' => 'New class created',
            'description' => 'Created class "' . $class['class_name'] . '" with ' . $class['student_count'] . ' students',
            'time' => getTimeAgo($class['created_at']),
            'color' => 'text-purple-600'
        ];
    }
    
    // Get recent topic unlocks (last 7 days)
    $stmt = $pdo->prepare("
        SELECT 
            'topic_unlock' as type,
            t.topic_name,
            t.unlocked_at,
            c.class_name
        FROM topic_locks t
        JOIN classes c ON t.class_id = c.id
        WHERE c.teacher_id = ? 
        AND t.unlocked_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY t.unlocked_at DESC
        LIMIT 5
    ");
    $stmt->execute([$teacherId]);
    $topicUnlocks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($topicUnlocks as $unlock) {
        $activities[] = [
            'type' => 'topic_unlock',
            'icon' => 'fas fa-unlock',
            'title' => 'Topic unlocked',
            'description' => 'Unlocked "' . $unlock['topic_name'] . '" for class ' . $unlock['class_name'],
            'time' => getTimeAgo($unlock['unlocked_at']),
            'color' => 'text-orange-600'
        ];
    }
    
    // Sort all activities by time (most recent first)
    usort($activities, function($a, $b) {
        return strtotime($b['time']) - strtotime($a['time']);
    });
    
    // Limit to 10 most recent activities
    $activities = array_slice($activities, 0, 10);
    
    // If no recent activities, show a default message
    if (empty($activities)) {
        $activities[] = [
            'type' => 'no_activity',
            'icon' => 'fas fa-info-circle',
            'title' => 'No recent activity',
            'description' => 'No activities in the last 7 days. Start by creating a class or managing quizzes.',
            'time' => 'Just now',
            'color' => 'text-gray-500'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'activities' => $activities
    ]);
    
} catch (Exception $e) {
    error_log("Recent activity error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch recent activity'
    ]);
} catch (Error $e) {
    error_log("Recent activity fatal error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error occurred'
    ]);
}

function getTimeAgo($datetime) {
    $time = time() - strtotime($datetime);
    
    if ($time < 60) {
        return 'Just now';
    } elseif ($time < 3600) {
        $minutes = floor($time / 60);
        return $minutes . ' minute' . ($minutes > 1 ? 's' : '') . ' ago';
    } elseif ($time < 86400) {
        $hours = floor($time / 3600);
        return $hours . ' hour' . ($hours > 1 ? 's' : '') . ' ago';
    } elseif ($time < 2592000) {
        $days = floor($time / 86400);
        return $days . ' day' . ($days > 1 ? 's' : '') . ' ago';
    } else {
        return date('M j, Y', strtotime($datetime));
    }
}

function getQuizDisplayName($quizType) {
    $quizNames = [
        'functions' => 'Functions Quiz',
        'evaluating-functions' => 'Evaluating Functions Quiz',
        'operations-on-functions' => 'Operations on Functions Quiz',
        'real-life-problems' => 'Real-Life Problems Quiz',
        'rational-functions' => 'Rational Functions Quiz'
    ];
    
    return $quizNames[$quizType] ?? ucfirst(str_replace('-', ' ', $quizType)) . ' Quiz';
}
?>
