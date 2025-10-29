<?php
require_once 'config.php';

// Check if teacher is logged in
if (!isset($_SESSION['teacher_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

header('Content-Type: application/json');

try {
    $action = $_GET['action'] ?? $_POST['action'] ?? 'get_performance_data';
    
    switch ($action) {
        case 'get_performance_data':
            getClassPerformanceData();
            break;
        case 'get_student_details':
            getStudentDetails();
            break;
        case 'export_performance':
            exportPerformanceData();
            break;
        case 'validate_data':
            validateClassPerformanceData();
            break;
        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

function getClassPerformanceData() {
    global $pdo;
    
    try {
        $teacherId = $_SESSION['teacher_id'];
        $requestedClassId = $_GET['class_id'] ?? null;
        
        // First, check if required tables exist
        $tables = ['classes', 'class_enrollments', 'users', 'user_progress'];
        foreach ($tables as $table) {
            $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
            if ($stmt->rowCount() === 0) {
                throw new Exception("Required table '$table' does not exist. Please run the database migrations.");
            }
        }
        
        // Get all classes for this teacher
        $stmt = $pdo->prepare("
            SELECT c.id, c.class_name, c.class_code, c.grade_level, c.strand, c.subject,
                   COUNT(DISTINCT ce.student_id) as total_enrolled,
                   COUNT(DISTINCT CASE WHEN ce.enrollment_status = 'approved' THEN ce.student_id END) as approved_students
            FROM classes c
            LEFT JOIN class_enrollments ce ON c.id = ce.class_id
            WHERE c.teacher_id = ? AND c.is_active = TRUE
            GROUP BY c.id
            ORDER BY c.class_name
        ");
        $stmt->execute([$teacherId]);
        $classes = $stmt->fetchAll();
        
        // If a specific class is requested, verify it belongs to this teacher and filter to only that class
        if ($requestedClassId) {
            // First verify that the requested class actually belongs to this teacher
            $stmt = $pdo->prepare("SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_active = TRUE");
            $stmt->execute([$requestedClassId, $teacherId]);
            
            if ($stmt->rowCount() === 0) {
                throw new Exception("Access denied: Class does not belong to this teacher or does not exist.");
            }
            
            // Filter to only the requested class
            $classes = array_filter($classes, function($class) use ($requestedClassId) {
                return $class['id'] == $requestedClassId;
            });
        }
        
        $performanceData = [];
        
        foreach ($classes as $class) {
            // Check if optional tables exist
            $quizAttemptsExists = false;
            $lessonCompletionExists = false;
            
            try {
                $stmt = $pdo->query("SHOW TABLES LIKE 'quiz_attempts'");
                $quizAttemptsExists = $stmt->rowCount() > 0;
            } catch (Exception $e) {
                // Table doesn't exist, continue without quiz data
            }
            
            try {
                $stmt = $pdo->query("SHOW TABLES LIKE 'lesson_completion'");
                $lessonCompletionExists = $stmt->rowCount() > 0;
            } catch (Exception $e) {
                // Table doesn't exist, continue without lesson completion data
            }
            
            // Build the query dynamically based on available tables
            $quizSubqueries = '';
            $lessonSubqueries = '';
            
            if ($quizAttemptsExists) {
                $quizSubqueries = "
                    -- Quiz performance - Functions Quiz (1st Quarter)
                    (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'functions') as functions_quiz_attempts,
                    (SELECT ROUND((qa.score / qa.total_questions) * 100, 1) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'functions' AND qa.status = 'completed' ORDER BY qa.completed_at DESC LIMIT 1) as functions_quiz_latest,
                    (SELECT MAX(ROUND((qa.score / qa.total_questions) * 100, 1)) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'functions' AND qa.status = 'completed') as functions_quiz_best,
                    (SELECT CASE WHEN MAX(ROUND((qa.score / qa.total_questions) * 100, 1)) >= 70 THEN 'PASSED' ELSE 'FAILED' END FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'functions' AND qa.status = 'completed') as functions_quiz_status,
                    (SELECT MAX(qa.completed_at) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'functions' AND qa.status = 'completed') as functions_quiz_last_attempt,
                    
                    -- Quiz performance - Evaluating Functions Quiz (2nd Quarter)
                    (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'evaluating-functions') as evaluating_functions_quiz_attempts,
                    (SELECT ROUND((qa.score / qa.total_questions) * 100, 1) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'evaluating-functions' AND qa.status = 'completed' ORDER BY qa.completed_at DESC LIMIT 1) as evaluating_functions_quiz_latest,
                    (SELECT MAX(ROUND((qa.score / qa.total_questions) * 100, 1)) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'evaluating-functions' AND qa.status = 'completed') as evaluating_functions_quiz_best,
                    (SELECT CASE WHEN MAX(ROUND((qa.score / qa.total_questions) * 100, 1)) >= 70 THEN 'PASSED' ELSE 'FAILED' END FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'evaluating-functions' AND qa.status = 'completed') as evaluating_functions_quiz_status,
                    (SELECT MAX(qa.completed_at) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'evaluating-functions' AND qa.status = 'completed') as evaluating_functions_quiz_last_attempt,
                    
                    -- Quiz performance - Operations on Functions Quiz (3rd Quarter)
                    (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'operations-on-functions') as operations_quiz_attempts,
                    (SELECT ROUND((qa.score / qa.total_questions) * 100, 1) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'operations-on-functions' AND qa.status = 'completed' ORDER BY qa.completed_at DESC LIMIT 1) as operations_quiz_latest,
                    (SELECT MAX(ROUND((qa.score / qa.total_questions) * 100, 1)) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'operations-on-functions' AND qa.status = 'completed') as operations_quiz_best,
                    (SELECT CASE WHEN MAX(ROUND((qa.score / qa.total_questions) * 100, 1)) >= 70 THEN 'PASSED' ELSE 'FAILED' END FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'operations-on-functions' AND qa.status = 'completed') as operations_quiz_status,
                    (SELECT MAX(qa.completed_at) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'operations-on-functions' AND qa.status = 'completed') as operations_quiz_last_attempt,
                    
                    -- Overall quiz statistics
                    (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.status = 'completed') as total_quiz_attempts,
                    (SELECT AVG(ROUND((qa.score / qa.total_questions) * 100, 1)) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.status = 'completed') as overall_quiz_average,
                    (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.status = 'completed' AND ROUND((qa.score / qa.total_questions) * 100, 1) >= 70) as passed_quizzes_count,
                    (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.status = 'completed' AND ROUND((qa.score / qa.total_questions) * 100, 1) < 70) as failed_quizzes_count,";
            } else {
                $quizSubqueries = "
                    -- Quiz performance (tables not available)
                    0 as functions_quiz_attempts,
                    0 as functions_quiz_latest,
                    0 as functions_quiz_best,
                    'NO_ATTEMPTS' as functions_quiz_status,
                    NULL as functions_quiz_last_attempt,
                    0 as evaluating_functions_quiz_attempts,
                    0 as evaluating_functions_quiz_latest,
                    0 as evaluating_functions_quiz_best,
                    'NO_ATTEMPTS' as evaluating_functions_quiz_status,
                    NULL as evaluating_functions_quiz_last_attempt,
                    0 as operations_quiz_attempts,
                    0 as operations_quiz_latest,
                    0 as operations_quiz_best,
                    'NO_ATTEMPTS' as operations_quiz_status,
                    NULL as operations_quiz_last_attempt,
                    0 as total_quiz_attempts,
                    0 as overall_quiz_average,
                    0 as passed_quizzes_count,
                    0 as failed_quizzes_count,";
            }
            
            if ($lessonCompletionExists) {
                $lessonSubqueries = "
                    -- Topic completion
                    (SELECT COUNT(*) FROM lesson_completion lc WHERE lc.user_id = u.id AND lc.topic_name = 'functions') as functions_lessons_completed,
                    (SELECT COUNT(*) FROM lesson_completion lc WHERE lc.user_id = u.id AND lc.topic_name = 'evaluating-functions') as evaluating_functions_lessons_completed,
                    (SELECT COUNT(*) FROM lesson_completion lc WHERE lc.user_id = u.id AND lc.topic_name = 'operations-on-functions') as operations_lessons_completed,
                    (SELECT COUNT(*) FROM lesson_completion lc WHERE lc.user_id = u.id AND lc.topic_name = 'rational-functions') as rational_functions_lessons_completed,
                    (SELECT COUNT(*) FROM lesson_completion lc WHERE lc.user_id = u.id AND lc.topic_name = 'solving-real-life-problems') as real_life_lessons_completed";
            } else {
                $lessonSubqueries = "
                    -- Topic completion (tables not available)
                    0 as functions_lessons_completed,
                    0 as evaluating_functions_lessons_completed,
                    0 as operations_lessons_completed,
                    0 as rational_functions_lessons_completed,
                    0 as real_life_lessons_completed";
            }
            
            // Get detailed student performance for this class (ALL students, not just approved)
            // Additional security: Join with classes table to ensure class belongs to current teacher
            $sql = "
                SELECT 
                    u.id as student_id,
                    u.first_name,
                    u.last_name,
                    u.student_id as student_number,
                    u.email,
                    ce.enrollment_status,
                    ce.enrolled_at,
                    ce.approved_at,
                    up.total_score,
                    up.completed_lessons,
                    up.current_topic,
                    up.updated_at as last_activity,
                    $quizSubqueries
                    $lessonSubqueries
                FROM class_enrollments ce
                JOIN users u ON ce.student_id = u.id
                JOIN classes c ON ce.class_id = c.id
                LEFT JOIN user_progress up ON u.id = up.user_id
                WHERE ce.class_id = ? AND c.teacher_id = ? AND c.is_active = TRUE
                ORDER BY ce.enrollment_status DESC, u.last_name, u.first_name
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$class['id'], $teacherId]);
            $students = $stmt->fetchAll();
            
            // Calculate class statistics with validation (ALL students)
            $totalStudents = count($students);
            $approvedStudents = count(array_filter($students, function($s) { 
                return $s['enrollment_status'] === 'approved'; 
            }));
            $pendingStudents = count(array_filter($students, function($s) { 
                return $s['enrollment_status'] === 'pending'; 
            }));
            $rejectedStudents = count(array_filter($students, function($s) { 
                return $s['enrollment_status'] === 'rejected'; 
            }));
            
            $activeStudents = count(array_filter($students, function($s) { 
                return ($s['completed_lessons'] ?? 0) > 0; 
            }));
            
            // Calculate average score with null handling
            $validScores = array_filter(array_column($students, 'total_score'), function($score) {
                return $score !== null && $score >= 0;
            });
            $averageScore = count($validScores) > 0 ? round(array_sum($validScores) / count($validScores), 2) : 0;
            
            // Calculate average lessons completed
            $validLessons = array_filter(array_column($students, 'completed_lessons'), function($lessons) {
                return $lessons !== null && $lessons >= 0;
            });
            $averageLessonsCompleted = count($validLessons) > 0 ? round(array_sum($validLessons) / count($validLessons), 2) : 0;
            
            // Count students with quiz attempts
            $studentsWithQuizAttempts = count(array_filter($students, function($s) { 
                return ($s['functions_quiz_attempts'] ?? 0) > 0 || ($s['evaluating_functions_quiz_attempts'] ?? 0) > 0; 
            }));
            
            // Calculate average quiz score with validation - using overall_quiz_average from database
            $validQuizAverages = array_filter(array_column($students, 'overall_quiz_average'), function($score) {
                return $score !== null && $score >= 0;
            });
            $averageQuizScore = count($validQuizAverages) > 0 ? round(array_sum($validQuizAverages) / count($validQuizAverages), 2) : 0;
            
            // Calculate quiz pass/fail statistics
            $totalQuizAttempts = array_sum(array_column($students, 'total_quiz_attempts'));
            $totalPassedQuizzes = array_sum(array_column($students, 'passed_quizzes_count'));
            $totalFailedQuizzes = array_sum(array_column($students, 'failed_quizzes_count'));
            $quizPassRate = $totalQuizAttempts > 0 ? round(($totalPassedQuizzes / $totalQuizAttempts) * 100, 2) : 0;
            
            // Calculate completion rates for each topic
            $topicCompletionRates = [];
            $topicNames = ['functions', 'evaluating-functions', 'operations-on-functions', 'rational-functions', 'solving-real-life-problems'];
            $topicMaxLessons = [5, 4, 3, 4, 3];
            
            foreach ($topicNames as $index => $topicName) {
                $columnName = str_replace('-', '_', $topicName) . '_lessons_completed';
                $completedCount = 0;
                foreach ($students as $student) {
                    if (isset($student[$columnName]) && $student[$columnName] > 0) {
                        $completedCount++;
                    }
                }
                $topicCompletionRates[$topicName] = [
                    'completed_students' => $completedCount,
                    'total_students' => $totalStudents,
                    'completion_rate' => $totalStudents > 0 ? round(($completedCount / $totalStudents) * 100, 2) : 0,
                    'max_lessons' => $topicMaxLessons[$index]
                ];
            }
            
            $classStats = [
                'total_students' => $totalStudents,
                'approved_students' => $approvedStudents,
                'pending_students' => $pendingStudents,
                'rejected_students' => $rejectedStudents,
                'active_students' => $activeStudents,
                'average_score' => $averageScore,
                'average_lessons_completed' => $averageLessonsCompleted,
                'students_with_quiz_attempts' => $studentsWithQuizAttempts,
                'average_quiz_score' => $averageQuizScore,
                'quiz_statistics' => [
                    'total_quiz_attempts' => $totalQuizAttempts,
                    'passed_quizzes' => $totalPassedQuizzes,
                    'failed_quizzes' => $totalFailedQuizzes,
                    'pass_rate' => $quizPassRate
                ],
                'topic_completion_rates' => $topicCompletionRates,
                'data_accuracy' => [
                    'last_updated' => date('Y-m-d H:i:s'),
                    'data_source' => 'Database',
                    'validation_status' => 'Validated'
                ]
            ];
            
            // Topic completion statistics
            $topicStats = [
                'functions' => [
                    'completed' => count(array_filter($students, function($s) { return $s['functions_lessons_completed'] > 0; })),
                    'total_lessons' => 5, // Based on the system
                    'average_score' => 0
                ],
                'evaluating-functions' => [
                    'completed' => count(array_filter($students, function($s) { return $s['evaluating_functions_lessons_completed'] > 0; })),
                    'total_lessons' => 4,
                    'average_score' => 0
                ],
                'operations-on-functions' => [
                    'completed' => count(array_filter($students, function($s) { return $s['operations_lessons_completed'] > 0; })),
                    'total_lessons' => 3,
                    'average_score' => 0
                ],
                'rational-functions' => [
                    'completed' => count(array_filter($students, function($s) { return $s['rational_functions_lessons_completed'] > 0; })),
                    'total_lessons' => 4,
                    'average_score' => 0
                ],
                'solving-real-life-problems' => [
                    'completed' => count(array_filter($students, function($s) { return $s['real_life_lessons_completed'] > 0; })),
                    'total_lessons' => 3,
                    'average_score' => 0
                ]
            ];
            
            $performanceData[] = [
                'class_info' => $class,
                'class_stats' => $classStats,
                'topic_stats' => $topicStats,
                'students' => $students
            ];
        }
        
        // Overall statistics across all classes
        $overallStats = [
            'total_classes' => count($classes),
            'total_students' => array_sum(array_column($performanceData, 'class_stats')) ? 
                array_sum(array_column(array_column($performanceData, 'class_stats'), 'total_students')) : 0,
            'active_students' => array_sum(array_column($performanceData, 'class_stats')) ? 
                array_sum(array_column(array_column($performanceData, 'class_stats'), 'active_students')) : 0,
            'average_score' => 0,
            'average_quiz_score' => 0
        ];
        
        // Calculate overall averages
        $allScores = [];
        $allQuizScores = [];
        foreach ($performanceData as $classData) {
            foreach ($classData['students'] as $student) {
                if ($student['total_score'] > 0) {
                    $allScores[] = $student['total_score'];
                }
                if ($student['functions_quiz_best'] !== null) {
                    $allQuizScores[] = $student['functions_quiz_best'];
                }
                if ($student['evaluating_functions_quiz_best'] !== null) {
                    $allQuizScores[] = $student['evaluating_functions_quiz_best'];
                }
            }
        }
        
        $overallStats['average_score'] = count($allScores) > 0 ? round(array_sum($allScores) / count($allScores), 2) : 0;
        $overallStats['average_quiz_score'] = count($allQuizScores) > 0 ? round(array_sum($allQuizScores) / count($allQuizScores), 2) : 0;
        
        echo json_encode([
            'success' => true,
            'overall_stats' => $overallStats,
            'classes' => $performanceData
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function getStudentDetails() {
    global $pdo;
    
    try {
        $studentId = $_GET['student_id'] ?? $_POST['student_id'];
        if (!$studentId) {
            throw new Exception('Student ID is required');
        }
        
        // Check if lesson_completion table exists
        $lessonCompletionExists = false;
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE 'lesson_completion'");
            $lessonCompletionExists = $stmt->rowCount() > 0;
        } catch (Exception $e) {
            $lessonCompletionExists = false;
        }

        // Build the query based on available tables
        if ($lessonCompletionExists) {
            $stmt = $pdo->prepare("
                SELECT 
                    u.id, u.first_name, u.last_name, u.student_id as student_number, u.email,
                    up.total_score, up.completed_lessons, up.current_topic, up.updated_at as last_activity,
                    c.class_name, c.class_code, ce.enrolled_at, ce.approved_at,
                    
                    -- Detailed lesson progress by topic (from lesson_completion table)
                    (SELECT COUNT(*) FROM lesson_completion lc1 WHERE lc1.user_id = u.id AND lc1.topic_name = 'functions') as functions_lessons_completed,
                    (SELECT COUNT(*) FROM lesson_completion lc2 WHERE lc2.user_id = u.id AND lc2.topic_name = 'evaluating-functions') as evaluating_functions_lessons_completed,
                    (SELECT COUNT(*) FROM lesson_completion lc3 WHERE lc3.user_id = u.id AND lc3.topic_name = 'operations-on-functions') as operations_lessons_completed,
                    (SELECT COUNT(*) FROM lesson_completion lc4 WHERE lc4.user_id = u.id AND lc4.topic_name = 'rational-functions') as rational_functions_lessons_completed,
                    (SELECT COUNT(*) FROM lesson_completion lc5 WHERE lc5.user_id = u.id AND lc5.topic_name = 'solving-real-life-problems') as real_life_lessons_completed,
                    
                    -- Quiz performance summary
                    (SELECT AVG(ROUND((qa.score / qa.total_questions) * 100, 1)) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.status = 'completed') as overall_quiz_average,
                    (SELECT MAX(ROUND((qa.score / qa.total_questions) * 100, 1)) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'functions' AND qa.status = 'completed') as functions_quiz_best,
                    (SELECT MAX(ROUND((qa.score / qa.total_questions) * 100, 1)) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'evaluating-functions' AND qa.status = 'completed') as evaluating_functions_quiz_best,
                    (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.status = 'completed') as total_quiz_attempts,
                    (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.status = 'completed' AND ROUND((qa.score / qa.total_questions) * 100, 1) >= 70) as passed_quizzes_count
                    
                FROM users u
                LEFT JOIN user_progress up ON u.id = up.user_id
                LEFT JOIN class_enrollments ce ON u.id = ce.student_id AND ce.enrollment_status = 'approved'
                LEFT JOIN classes c ON ce.class_id = c.id
                WHERE u.id = ?
            ");
        } else {
            $stmt = $pdo->prepare("
                SELECT 
                    u.id, u.first_name, u.last_name, u.student_id as student_number, u.email,
                    up.total_score, up.completed_lessons, up.current_topic, up.updated_at as last_activity,
                    c.class_name, c.class_code, ce.enrolled_at, ce.approved_at,
                    
                    -- Default values when lesson_completion table doesn't exist
                    0 as functions_lessons_completed,
                    0 as evaluating_functions_lessons_completed,
                    0 as operations_lessons_completed,
                    0 as rational_functions_lessons_completed,
                    0 as real_life_lessons_completed,
                    
                    -- Quiz performance summary
                    (SELECT AVG(ROUND((qa.score / qa.total_questions) * 100, 1)) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.status = 'completed') as overall_quiz_average,
                    (SELECT MAX(ROUND((qa.score / qa.total_questions) * 100, 1)) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'functions' AND qa.status = 'completed') as functions_quiz_best,
                    (SELECT MAX(ROUND((qa.score / qa.total_questions) * 100, 1)) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'evaluating-functions' AND qa.status = 'completed') as evaluating_functions_quiz_best,
                    (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.status = 'completed') as total_quiz_attempts,
                    (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.status = 'completed' AND ROUND((qa.score / qa.total_questions) * 100, 1) >= 70) as passed_quizzes_count
                    
                FROM users u
                LEFT JOIN user_progress up ON u.id = up.user_id
                LEFT JOIN class_enrollments ce ON u.id = ce.student_id AND ce.enrollment_status = 'approved'
                LEFT JOIN classes c ON ce.class_id = c.id
                WHERE u.id = ?
            ");
        }
        $stmt->execute([$studentId]);
        $student = $stmt->fetch();
        
        if (!$student) {
            throw new Exception('Student not found');
        }
        
        // Get detailed quiz attempts (if table exists)
        $quizAttempts = [];
        $quizStatistics = [];
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE 'quiz_attempts'");
            if ($stmt->rowCount() > 0) {
                // Get all quiz attempts with detailed information
                $stmt = $pdo->prepare("
                    SELECT 
                        quiz_type, 
                        score, 
                        total_questions, 
                        correct_answers,
                        incorrect_answers,
                        ROUND((score / total_questions) * 100, 1) as percentage,
                        CASE WHEN ROUND((score / total_questions) * 100, 1) >= 70 THEN 'PASSED' ELSE 'FAILED' END as pass_status,
                        completion_time as time_taken, 
                        TIME_FORMAT(SEC_TO_TIME(completion_time), '%i:%s') as formatted_time,
                        started_at,
                        completed_at as attempted_at
                    FROM quiz_attempts
                    WHERE student_id = ? AND status = 'completed' AND status != 'reset'
                    ORDER BY completed_at DESC
                ");
                $stmt->execute([$studentId]);
                $quizAttempts = $stmt->fetchAll();
                
                // Calculate quiz statistics by type
                $stmt = $pdo->prepare("
                    SELECT 
                        quiz_type,
                        COUNT(*) as total_attempts,
                        MAX(ROUND((score / total_questions) * 100, 1)) as best_score,
                        AVG(ROUND((score / total_questions) * 100, 1)) as average_score,
                        MIN(completion_time) as fastest_time,
                        MAX(completion_time) as slowest_time,
                        COUNT(CASE WHEN ROUND((score / total_questions) * 100, 1) >= 70 THEN 1 END) as passed_attempts,
                        COUNT(CASE WHEN ROUND((score / total_questions) * 100, 1) < 70 THEN 1 END) as failed_attempts,
                        ROUND((COUNT(CASE WHEN ROUND((score / total_questions) * 100, 1) >= 70 THEN 1 END) / COUNT(*)) * 100, 1) as pass_rate
                    FROM quiz_attempts
                    WHERE student_id = ? AND status = 'completed'
                    GROUP BY quiz_type
                ");
                $stmt->execute([$studentId]);
                $quizStatistics = $stmt->fetchAll();
            }
        } catch (Exception $e) {
            // Table doesn't exist or error occurred
            $quizAttempts = [];
            $quizStatistics = [];
        }
        
        // Get lesson completions (if table exists)
        $lessonCompletions = [];
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE 'lesson_completion'");
            if ($stmt->rowCount() > 0) {
                $stmt = $pdo->prepare("
                    SELECT topic_name as topic, lesson_number, completed_at
                    FROM lesson_completion
                    WHERE user_id = ?
                    ORDER BY completed_at DESC
                ");
                $stmt->execute([$studentId]);
                $lessonCompletions = $stmt->fetchAll();
            }
        } catch (Exception $e) {
            // Table doesn't exist or error occurred
            $lessonCompletions = [];
        }
        
        echo json_encode([
            'success' => true,
            'student' => $student,
            'quiz_attempts' => $quizAttempts,
            'quiz_statistics' => $quizStatistics,
            'lesson_completions' => $lessonCompletions
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function exportPerformanceData() {
    global $pdo;
    
    try {
        $teacherId = $_SESSION['teacher_id'];
        $format = $_GET['format'] ?? 'excel';
        
        // Get performance data
        $performanceData = getPerformanceDataForExport($teacherId);
        
        // Only CSV export is available
        exportToCSV($performanceData);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function getPerformanceDataForExport($teacherId) {
    global $pdo;
    
    // Get all classes for this teacher
    $stmt = $pdo->prepare("
        SELECT c.id, c.class_name, c.class_code, c.grade_level, c.strand, c.subject,
               COUNT(DISTINCT ce.student_id) as total_enrolled,
               COUNT(DISTINCT CASE WHEN ce.enrollment_status = 'approved' THEN ce.student_id END) as approved_students
        FROM classes c
        LEFT JOIN class_enrollments ce ON c.id = ce.class_id
        WHERE c.teacher_id = ? AND c.is_active = TRUE
        GROUP BY c.id
        ORDER BY c.class_name
    ");
    $stmt->execute([$teacherId]);
    $classes = $stmt->fetchAll();
    
    $exportData = [];
    
    foreach ($classes as $class) {
        // Get student data for this class
        $stmt = $pdo->prepare("
            SELECT 
                u.id as student_id,
                u.first_name,
                u.last_name,
                u.student_id as student_number,
                u.email,
                ce.enrollment_status,
                ce.enrolled_at,
                ce.approved_at,
                up.total_score,
                up.completed_lessons,
                up.current_topic,
                up.updated_at as last_activity,
                -- Quiz performance - Functions Quiz
                (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'functions') as functions_quiz_attempts,
                (SELECT MAX(ROUND((qa.score / qa.total_questions) * 100, 1)) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'functions' AND qa.status = 'completed') as functions_quiz_best,
                (SELECT CASE WHEN MAX(ROUND((qa.score / qa.total_questions) * 100, 1)) >= 70 THEN 'PASSED' ELSE 'FAILED' END FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'functions' AND qa.status = 'completed') as functions_quiz_status,
                
                -- Quiz performance - Evaluating Functions Quiz
                (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'evaluating-functions') as evaluating_functions_quiz_attempts,
                (SELECT MAX(ROUND((qa.score / qa.total_questions) * 100, 1)) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'evaluating-functions' AND qa.status = 'completed') as evaluating_functions_quiz_best,
                (SELECT CASE WHEN MAX(ROUND((qa.score / qa.total_questions) * 100, 1)) >= 70 THEN 'PASSED' ELSE 'FAILED' END FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.quiz_type = 'evaluating-functions' AND qa.status = 'completed') as evaluating_functions_quiz_status,
                
                -- Overall quiz statistics
                (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.status = 'completed') as total_quiz_attempts,
                (SELECT AVG(ROUND((qa.score / qa.total_questions) * 100, 1)) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.status = 'completed') as overall_quiz_average,
                (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.student_id = u.id AND qa.status = 'completed' AND ROUND((qa.score / qa.total_questions) * 100, 1) >= 70) as passed_quizzes_count,
                -- Topic completion
                (SELECT COUNT(*) FROM lesson_completion lc WHERE lc.user_id = u.id AND lc.topic_name = 'functions') as functions_lessons_completed,
                (SELECT COUNT(*) FROM lesson_completion lc WHERE lc.user_id = u.id AND lc.topic_name = 'evaluating-functions') as evaluating_functions_lessons_completed,
                (SELECT COUNT(*) FROM lesson_completion lc WHERE lc.user_id = u.id AND lc.topic_name = 'operations-on-functions') as operations_lessons_completed,
                (SELECT COUNT(*) FROM lesson_completion lc WHERE lc.user_id = u.id AND lc.topic_name = 'rational-functions') as rational_functions_lessons_completed,
                (SELECT COUNT(*) FROM lesson_completion lc WHERE lc.user_id = u.id AND lc.topic_name = 'solving-real-life-problems') as real_life_lessons_completed
            FROM class_enrollments ce
            JOIN users u ON ce.student_id = u.id
            LEFT JOIN user_progress up ON u.id = up.user_id
            WHERE ce.class_id = ? AND ce.enrollment_status = 'approved'
            ORDER BY u.last_name, u.first_name
        ");
        $stmt->execute([$class['id']]);
        $students = $stmt->fetchAll();
        
        $exportData[] = [
            'class_info' => $class,
            'students' => $students
        ];
    }
    
    return $exportData;
}


function exportToCSV($performanceData) {
    // Set headers for CSV download
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="Class_Performance_Report_' . date('Y-m-d') . '.csv"');
    
    $output = fopen('php://output', 'w');
    
    // Add BOM for proper UTF-8 encoding in Excel
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
    
    // Add header row
    fputcsv($output, [
        'Class Name', 'Class Code', 'Grade Level', 'Strand',
        'Student Name', 'Student ID', 'Email',
        'Total Score (%)', 'Lessons Completed',
        'Functions Quiz (%)', 'Functions Quiz Status',
        'Evaluating Quiz (%)', 'Evaluating Quiz Status',
        'Overall Quiz Average (%)', 'Passed Quizzes',
        'Functions Lessons', 'Evaluating Lessons', 'Operations Lessons',
        'Rational Lessons', 'Real-Life Lessons', 'Last Activity'
    ]);
    
    // Add data rows
    foreach ($performanceData as $classData) {
        $class = $classData['class_info'];
        $students = $classData['students'];
        
        foreach ($students as $student) {
            $lastActivity = $student['last_activity'] ? date('Y-m-d H:i', strtotime($student['last_activity'])) : 'Never';
            
            fputcsv($output, [
                $class['class_name'],
                $class['class_code'],
                $class['grade_level'],
                $class['strand'],
                $student['first_name'] . ' ' . $student['last_name'],
                $student['student_number'],
                $student['email'],
                $student['total_score'] ?? 0,
                $student['completed_lessons'] ?? 0,
                $student['functions_quiz_best'] ?? 0,
                $student['functions_quiz_status'] ?? 'NO_ATTEMPTS',
                $student['evaluating_functions_quiz_best'] ?? 0,
                $student['evaluating_functions_quiz_status'] ?? 'NO_ATTEMPTS',
                $student['overall_quiz_average'] ?? 0,
                $student['passed_quizzes_count'] ?? 0,
                ($student['functions_lessons_completed'] ?? 0) . '/5',
                ($student['evaluating_functions_lessons_completed'] ?? 0) . '/4',
                ($student['operations_lessons_completed'] ?? 0) . '/3',
                ($student['rational_functions_lessons_completed'] ?? 0) . '/4',
                ($student['real_life_lessons_completed'] ?? 0) . '/3',
                $lastActivity
            ]);
        }
    }
    
    fclose($output);
    exit;
}

function validateClassPerformanceData() {
    global $pdo;
    
    try {
        $teacherId = $_SESSION['teacher_id'];
        $validationResults = [
            'database_tables' => [],
            'data_issues' => [],
            'recommendations' => [],
            'overall_status' => 'good'
        ];
        
        // Check required tables
        $requiredTables = ['users', 'classes', 'class_enrollments', 'user_progress'];
        $optionalTables = ['quiz_attempts', 'lesson_completion'];
        
        foreach ($requiredTables as $table) {
            $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
            if ($stmt->rowCount() === 0) {
                $validationResults['database_tables'][] = [
                    'table' => $table,
                    'status' => 'missing',
                    'required' => true
                ];
                $validationResults['overall_status'] = 'error';
            } else {
                $validationResults['database_tables'][] = [
                    'table' => $table,
                    'status' => 'exists',
                    'required' => true
                ];
            }
        }
        
        foreach ($optionalTables as $table) {
            $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
            if ($stmt->rowCount() === 0) {
                $validationResults['database_tables'][] = [
                    'table' => $table,
                    'status' => 'missing',
                    'required' => false
                ];
                $validationResults['recommendations'][] = "Consider creating the '$table' table for enhanced quiz and lesson tracking";
            } else {
                $validationResults['database_tables'][] = [
                    'table' => $table,
                    'status' => 'exists',
                    'required' => false
                ];
            }
        }
        
        // Check for data issues
        if ($validationResults['overall_status'] !== 'error') {
            // Check for classes without students
            $stmt = $pdo->prepare("
                SELECT c.id, c.class_name, COUNT(ce.student_id) as student_count
                FROM classes c
                LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.enrollment_status = 'approved'
                WHERE c.teacher_id = ? AND c.is_active = TRUE
                GROUP BY c.id
                HAVING student_count = 0
            ");
            $stmt->execute([$teacherId]);
            $emptyClasses = $stmt->fetchAll();
            
            if (count($emptyClasses) > 0) {
                $validationResults['data_issues'][] = [
                    'type' => 'empty_classes',
                    'count' => count($emptyClasses),
                    'message' => 'Some classes have no enrolled students'
                ];
                $validationResults['overall_status'] = 'warning';
            }
            
            // Check for students without progress data
            $stmt = $pdo->prepare("
                SELECT COUNT(DISTINCT ce.student_id) as students_without_progress
                FROM class_enrollments ce
                LEFT JOIN user_progress up ON ce.student_id = up.user_id
                JOIN classes c ON ce.class_id = c.id
                WHERE c.teacher_id = ? AND ce.enrollment_status = 'approved' AND up.user_id IS NULL
            ");
            $stmt->execute([$teacherId]);
            $result = $stmt->fetch();
            
            if ($result['students_without_progress'] > 0) {
                $validationResults['data_issues'][] = [
                    'type' => 'missing_progress',
                    'count' => $result['students_without_progress'],
                    'message' => 'Some students have no progress data'
                ];
                $validationResults['overall_status'] = 'warning';
            }
            
            // Check for quiz data if table exists
            $stmt = $pdo->query("SHOW TABLES LIKE 'quiz_attempts'");
            if ($stmt->rowCount() > 0) {
                $stmt = $pdo->prepare("
                    SELECT COUNT(DISTINCT ce.student_id) as students_without_quizzes
                    FROM class_enrollments ce
                    LEFT JOIN quiz_attempts qa ON ce.student_id = qa.student_id
                    JOIN classes c ON ce.class_id = c.id
                    WHERE c.teacher_id = ? AND ce.enrollment_status = 'approved' AND qa.student_id IS NULL
                ");
                $stmt->execute([$teacherId]);
                $result = $stmt->fetch();
                
                if ($result['students_without_quizzes'] > 0) {
                    $validationResults['data_issues'][] = [
                        'type' => 'no_quiz_attempts',
                        'count' => $result['students_without_quizzes'],
                        'message' => 'Some students have not attempted any quizzes'
                    ];
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'validation' => $validationResults
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
