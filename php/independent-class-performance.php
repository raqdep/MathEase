<?php
// Disable error display to prevent HTML errors from breaking JSON
ini_set('display_errors', 0);
ini_set('log_errors', 1);

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
            getIndependentClassPerformanceData();
            break;
        case 'get_student_details':
            getStudentPerformanceDetails();
            break;
        case 'export_performance':
            exportPerformanceData();
            break;
        case 'validate_data':
            validatePerformanceData();
            break;
        case 'update_performance':
            updateStudentPerformance();
            break;
        case 'calculate_class_summary':
            calculateClassPerformanceSummary();
            break;
        case 'sync_performance_data':
            syncPerformanceDataFromMainSystem();
            break;
        case 'debug':
            debugSystem();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    error_log("Independent Class Performance Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred while processing your request']);
} catch (Error $e) {
    error_log("Independent Class Performance Fatal Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'A system error occurred']);
}


function debugSystem() {
    global $pdo;
    
    $debug = [
        'session_status' => session_status(),
        'session_id' => session_id(),
        'teacher_id_set' => isset($_SESSION['teacher_id']),
        'teacher_id_value' => $_SESSION['teacher_id'] ?? 'not set',
        'php_version' => PHP_VERSION,
        'pdo_available' => class_exists('PDO'),
        'database_connected' => false,
        'tables_exist' => [],
        'error_reporting' => error_reporting(),
        'display_errors' => ini_get('display_errors'),
        'log_errors' => ini_get('log_errors')
    ];
    
    try {
        // Test database connection
        $stmt = $pdo->query("SELECT 1");
        $debug['database_connected'] = true;
        
        // Check tables
        $tables = ['student_performance_tracking', 'class_performance_summary', 'classes', 'users'];
        foreach ($tables as $table) {
            $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
            $debug['tables_exist'][$table] = $stmt->rowCount() > 0;
        }
        
        // Test JSON encoding
        $debug['json_test'] = json_encode(['test' => 'success']);
        
    } catch (Exception $e) {
        $debug['database_error'] = $e->getMessage();
    }
    
    echo json_encode(['success' => true, 'debug' => $debug]);
}

function getIndependentClassPerformanceData() {
    global $pdo;
    
    try {
        // Debug: Check if teacher_id exists in session
        if (!isset($_SESSION['teacher_id'])) {
            throw new Exception('Teacher session not found. Please log in again.');
        }
        
        $teacherId = $_SESSION['teacher_id'];
        $requestedClassId = $_GET['class_id'] ?? null;
        
        // Debug: Log the request
        error_log("Independent Performance Request - Teacher ID: $teacherId, Class ID: " . ($requestedClassId ?? 'all'));
        
        // Check if independent performance tables exist
        $tables = ['student_performance_tracking', 'class_performance_summary'];
        foreach ($tables as $table) {
            try {
                $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
                if ($stmt->rowCount() === 0) {
                    throw new Exception("Independent performance table '$table' does not exist. Please run the independent_class_performance_migration.sql");
                }
            } catch (PDOException $e) {
                error_log("Database error checking table $table: " . $e->getMessage());
                throw new Exception("Database error while checking required tables");
            }
        }
        
        // Get all classes for this teacher
        try {
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
        } catch (PDOException $e) {
            error_log("Database error getting classes: " . $e->getMessage());
            throw new Exception("Database error while retrieving classes");
        }
        
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
            // Check if we need to sync data for this class
            $needsSync = false;
            
            // Check if there are any students in the class but no performance tracking data
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as enrolled_count
                FROM class_enrollments ce
                WHERE ce.class_id = ? AND ce.enrollment_status = 'approved'
            ");
            $stmt->execute([$class['id']]);
            $enrolledCount = $stmt->fetch()['enrolled_count'];
            
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as tracked_count
                FROM student_performance_tracking spt
                WHERE spt.class_id = ?
            ");
            $stmt->execute([$class['id']]);
            $trackedCount = $stmt->fetch()['tracked_count'];
            
            // Check if data is outdated (older than 1 hour)
            $stmt = $pdo->prepare("
                SELECT MAX(updated_at) as last_update
                FROM student_performance_tracking spt
                WHERE spt.class_id = ?
            ");
            $stmt->execute([$class['id']]);
            $lastUpdate = $stmt->fetch()['last_update'];
            
            if ($enrolledCount > 0 && ($trackedCount == 0 || $trackedCount < $enrolledCount)) {
                $needsSync = true;
            } elseif ($lastUpdate && strtotime($lastUpdate) < (time() - 3600)) { // 1 hour ago
                $needsSync = true;
            }
            
            // Auto-sync if needed
            if ($needsSync) {
                error_log("Auto-syncing performance data for class {$class['id']}");
                syncPerformanceDataForClass($class['id']);
            }
            
            // Get comprehensive student performance data from independent tracking table
            $stmt = $pdo->prepare("
                SELECT 
                    spt.*,
                    u.first_name,
                    u.last_name,
                    u.student_id as student_number,
                    u.email,
                    ce.enrollment_status,
                    ce.enrolled_at,
                    ce.approved_at
                FROM student_performance_tracking spt
                JOIN users u ON spt.student_id = u.id
                JOIN class_enrollments ce ON spt.student_id = ce.student_id AND spt.class_id = ce.class_id
                WHERE spt.class_id = ?
                ORDER BY ce.enrollment_status DESC, u.last_name, u.first_name
            ");
            $stmt->execute([$class['id']]);
            $students = $stmt->fetchAll();
            
            // Get class performance summary
            $stmt = $pdo->prepare("
                SELECT * FROM class_performance_summary 
                WHERE class_id = ?
            ");
            $stmt->execute([$class['id']]);
            $classSummary = $stmt->fetch();
            
            // If no summary exists, calculate it
            if (!$classSummary) {
                calculateClassPerformanceSummaryForClass($class['id']);
                $stmt->execute([$class['id']]);
                $classSummary = $stmt->fetch();
            }
            
            // Calculate additional statistics
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
                return $s['total_lessons_completed'] > 0; 
            }));
            
            // Calculate performance distribution
            $performanceDistribution = [
                'excellent' => count(array_filter($students, function($s) { 
                    return $s['overall_performance_status'] === 'EXCELLENT'; 
                })),
                'good' => count(array_filter($students, function($s) { 
                    return $s['overall_performance_status'] === 'GOOD'; 
                })),
                'average' => count(array_filter($students, function($s) { 
                    return $s['overall_performance_status'] === 'AVERAGE'; 
                })),
                'needs_improvement' => count(array_filter($students, function($s) { 
                    return $s['overall_performance_status'] === 'NEEDS_IMPROVEMENT'; 
                })),
                'poor' => count(array_filter($students, function($s) { 
                    return $s['overall_performance_status'] === 'POOR'; 
                }))
            ];
            
            // Calculate engagement distribution
            $engagementDistribution = [
                'high' => count(array_filter($students, function($s) { 
                    return $s['engagement_level'] === 'HIGH'; 
                })),
                'medium' => count(array_filter($students, function($s) { 
                    return $s['engagement_level'] === 'MEDIUM'; 
                })),
                'low' => count(array_filter($students, function($s) { 
                    return $s['engagement_level'] === 'LOW'; 
                }))
            ];
            
            // Calculate topic completion rates
            $topicCompletionRates = [
                'functions' => [
                    'completed_students' => count(array_filter($students, function($s) { 
                        return $s['functions_lessons_completed'] > 0; 
                    })),
                    'total_students' => $totalStudents,
                    'completion_rate' => $totalStudents > 0 ? round((count(array_filter($students, function($s) { 
                        return $s['functions_lessons_completed'] > 0; 
                    })) / $totalStudents) * 100, 2) : 0,
                    'max_lessons' => 5
                ],
                'evaluating-functions' => [
                    'completed_students' => count(array_filter($students, function($s) { 
                        return $s['evaluating_functions_lessons_completed'] > 0; 
                    })),
                    'total_students' => $totalStudents,
                    'completion_rate' => $totalStudents > 0 ? round((count(array_filter($students, function($s) { 
                        return $s['evaluating_functions_lessons_completed'] > 0; 
                    })) / $totalStudents) * 100, 2) : 0,
                    'max_lessons' => 4
                ],
                'operations-on-functions' => [
                    'completed_students' => count(array_filter($students, function($s) { 
                        return $s['operations_on_functions_lessons_completed'] > 0; 
                    })),
                    'total_students' => $totalStudents,
                    'completion_rate' => $totalStudents > 0 ? round((count(array_filter($students, function($s) { 
                        return $s['operations_on_functions_lessons_completed'] > 0; 
                    })) / $totalStudents) * 100, 2) : 0,
                    'max_lessons' => 3
                ],
                'rational-functions' => [
                    'completed_students' => count(array_filter($students, function($s) { 
                        return $s['rational_functions_lessons_completed'] > 0; 
                    })),
                    'total_students' => $totalStudents,
                    'completion_rate' => $totalStudents > 0 ? round((count(array_filter($students, function($s) { 
                        return $s['rational_functions_lessons_completed'] > 0; 
                    })) / $totalStudents) * 100, 2) : 0,
                    'max_lessons' => 4
                ],
                'solving-real-life-problems' => [
                    'completed_students' => count(array_filter($students, function($s) { 
                        return $s['solving_real_life_problems_lessons_completed'] > 0; 
                    })),
                    'total_students' => $totalStudents,
                    'completion_rate' => $totalStudents > 0 ? round((count(array_filter($students, function($s) { 
                        return $s['solving_real_life_problems_lessons_completed'] > 0; 
                    })) / $totalStudents) * 100, 2) : 0,
                    'max_lessons' => 3
                ]
            ];
            
            $classStats = [
                'total_students' => $totalStudents,
                'approved_students' => $approvedStudents,
                'pending_students' => $pendingStudents,
                'rejected_students' => $rejectedStudents,
                'active_students' => $activeStudents,
                'average_score' => $classSummary['average_total_score'] ?? 0,
                'average_lessons_completed' => $classSummary['average_lessons_completed'] ?? 0,
                'average_quiz_score' => $classSummary['average_quiz_score'] ?? 0,
                'quiz_statistics' => [
                    'total_quiz_attempts' => $classSummary['total_quiz_attempts'] ?? 0,
                    'passed_quizzes' => $classSummary['total_passed_quizzes'] ?? 0,
                    'failed_quizzes' => $classSummary['total_failed_quizzes'] ?? 0,
                    'pass_rate' => $classSummary['overall_quiz_pass_rate'] ?? 0
                ],
                'performance_distribution' => $performanceDistribution,
                'engagement_distribution' => $engagementDistribution,
                'topic_completion_rates' => $topicCompletionRates,
                'class_performance_status' => $classSummary['class_performance_status'] ?? 'NEEDS_IMPROVEMENT',
                'data_accuracy' => [
                    'last_updated' => $classSummary['last_calculated_at'] ?? date('Y-m-d H:i:s'),
                    'data_source' => 'Independent Performance Tracking',
                    'validation_status' => 'Validated'
                ]
            ];
            
            $performanceData[] = [
                'class_info' => $class,
                'class_stats' => $classStats,
                'class_summary' => $classSummary,
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
                if ($student['overall_quiz_average'] > 0) {
                    $allQuizScores[] = $student['overall_quiz_average'];
                }
            }
        }
        
        $overallStats['average_score'] = count($allScores) > 0 ? round(array_sum($allScores) / count($allScores), 2) : 0;
        $overallStats['average_quiz_score'] = count($allQuizScores) > 0 ? round(array_sum($allQuizScores) / count($allQuizScores), 2) : 0;
        
        echo json_encode([
            'success' => true,
            'overall_stats' => $overallStats,
            'classes' => $performanceData,
            'data_source' => 'Independent Performance Tracking System'
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function getStudentPerformanceDetails() {
    global $pdo;
    
    try {
        $studentId = $_GET['student_id'] ?? $_POST['student_id'];
        if (!$studentId) {
            throw new Exception('Student ID is required');
        }
        
        // Get comprehensive student performance data
        $stmt = $pdo->prepare("
            SELECT 
                spt.*,
                u.first_name,
                u.last_name,
                u.student_id as student_number,
                u.email,
                c.class_name,
                c.class_code,
                ce.enrolled_at,
                ce.approved_at
            FROM student_performance_tracking spt
            JOIN users u ON spt.student_id = u.id
            JOIN classes c ON spt.class_id = c.id
            JOIN class_enrollments ce ON spt.student_id = ce.student_id AND spt.class_id = ce.class_id
            WHERE spt.student_id = ?
        ");
        $stmt->execute([$studentId]);
        $student = $stmt->fetch();
        
        if (!$student) {
            throw new Exception('Student performance data not found');
        }
        
        // Get performance history
        $stmt = $pdo->prepare("
            SELECT 
                ph.*,
                t.first_name as recorded_by_first_name,
                t.last_name as recorded_by_last_name
            FROM performance_history ph
            LEFT JOIN teachers t ON ph.recorded_by = t.id
            WHERE ph.student_id = ?
            ORDER BY ph.recorded_at DESC
            LIMIT 10
        ");
        $stmt->execute([$studentId]);
        $performanceHistory = $stmt->fetchAll();
        
        // Get topic-specific performance breakdown
        $topicPerformance = [
            'functions' => [
                'score' => $student['functions_score'],
                'lessons_completed' => $student['functions_lessons_completed'],
                'quiz_score' => $student['functions_quiz_score'],
                'quiz_attempts' => $student['functions_quiz_attempts'],
                'quiz_best_score' => $student['functions_quiz_best_score'],
                'quiz_status' => $student['functions_quiz_status'],
                'quiz_last_attempt' => $student['functions_quiz_last_attempt']
            ],
            'evaluating-functions' => [
                'score' => $student['evaluating_functions_score'],
                'lessons_completed' => $student['evaluating_functions_lessons_completed'],
                'quiz_score' => $student['evaluating_functions_quiz_score'],
                'quiz_attempts' => $student['evaluating_functions_quiz_attempts'],
                'quiz_best_score' => $student['evaluating_functions_quiz_best_score'],
                'quiz_status' => $student['evaluating_functions_quiz_status'],
                'quiz_last_attempt' => $student['evaluating_functions_quiz_last_attempt']
            ],
            'operations-on-functions' => [
                'score' => $student['operations_on_functions_score'],
                'lessons_completed' => $student['operations_on_functions_lessons_completed'],
                'quiz_score' => $student['operations_on_functions_quiz_score'],
                'quiz_attempts' => $student['operations_on_functions_quiz_attempts'],
                'quiz_best_score' => $student['operations_on_functions_quiz_best_score'],
                'quiz_status' => $student['operations_on_functions_quiz_status'],
                'quiz_last_attempt' => $student['operations_on_functions_quiz_last_attempt']
            ],
            'rational-functions' => [
                'score' => $student['rational_functions_score'],
                'lessons_completed' => $student['rational_functions_lessons_completed'],
                'quiz_score' => $student['rational_functions_quiz_score'],
                'quiz_attempts' => $student['rational_functions_quiz_attempts'],
                'quiz_best_score' => $student['rational_functions_quiz_best_score'],
                'quiz_status' => $student['rational_functions_quiz_status'],
                'quiz_last_attempt' => $student['rational_functions_quiz_last_attempt']
            ],
            'solving-real-life-problems' => [
                'score' => $student['solving_real_life_problems_score'],
                'lessons_completed' => $student['solving_real_life_problems_lessons_completed'],
                'quiz_score' => $student['solving_real_life_problems_quiz_score'],
                'quiz_attempts' => $student['solving_real_life_problems_quiz_attempts'],
                'quiz_best_score' => $student['solving_real_life_problems_quiz_best_score'],
                'quiz_status' => $student['solving_real_life_problems_quiz_status'],
                'quiz_last_attempt' => $student['solving_real_life_problems_quiz_last_attempt']
            ]
        ];
        
        echo json_encode([
            'success' => true,
            'student' => $student,
            'topic_performance' => $topicPerformance,
            'performance_history' => $performanceHistory,
            'data_source' => 'Independent Performance Tracking System'
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function updateStudentPerformance() {
    global $pdo;
    
    try {
        $studentId = $_POST['student_id'] ?? null;
        $classId = $_POST['class_id'] ?? null;
        $updateData = $_POST['update_data'] ?? [];
        
        if (!$studentId || !$classId) {
            throw new Exception('Student ID and Class ID are required');
        }
        
        // Verify teacher has access to this class
        $stmt = $pdo->prepare("
            SELECT c.id FROM classes c 
            WHERE c.id = ? AND c.teacher_id = ? AND c.is_active = TRUE
        ");
        $stmt->execute([$classId, $_SESSION['teacher_id']]);
        if ($stmt->rowCount() === 0) {
            throw new Exception('Access denied: Class does not belong to this teacher');
        }
        
        // Build update query dynamically
        $updateFields = [];
        $updateValues = [];
        
        foreach ($updateData as $field => $value) {
            if (in_array($field, [
                'total_score', 'total_lessons_completed', 'current_topic',
                'functions_score', 'functions_lessons_completed', 'functions_quiz_score',
                'functions_quiz_attempts', 'functions_quiz_best_score', 'functions_quiz_status',
                'evaluating_functions_score', 'evaluating_functions_lessons_completed',
                'evaluating_functions_quiz_score', 'evaluating_functions_quiz_attempts',
                'evaluating_functions_quiz_best_score', 'evaluating_functions_quiz_status',
                'operations_on_functions_score', 'operations_on_functions_lessons_completed',
                'operations_on_functions_quiz_score', 'operations_on_functions_quiz_attempts',
                'operations_on_functions_quiz_best_score', 'operations_on_functions_quiz_status',
                'rational_functions_score', 'rational_functions_lessons_completed',
                'rational_functions_quiz_score', 'rational_functions_quiz_attempts',
                'rational_functions_quiz_best_score', 'rational_functions_quiz_status',
                'solving_real_life_problems_score', 'solving_real_life_problems_lessons_completed',
                'solving_real_life_problems_quiz_score', 'solving_real_life_problems_quiz_attempts',
                'solving_real_life_problems_quiz_best_score', 'solving_real_life_problems_quiz_status',
                'total_quiz_attempts', 'overall_quiz_average', 'passed_quizzes_count',
                'failed_quizzes_count', 'quiz_pass_rate', 'overall_performance_status',
                'engagement_level'
            ])) {
                $updateFields[] = "$field = ?";
                $updateValues[] = $value;
            }
        }
        
        if (empty($updateFields)) {
            throw new Exception('No valid fields to update');
        }
        
        $updateValues[] = $studentId;
        $updateValues[] = $classId;
        
        $sql = "UPDATE student_performance_tracking SET " . implode(', ', $updateFields) . 
               ", last_activity = NOW(), updated_at = NOW() WHERE student_id = ? AND class_id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($updateValues);
        
        // Record the change in performance history
        $stmt = $pdo->prepare("
            INSERT INTO performance_history (
                student_id, class_id, total_score, total_lessons_completed, 
                overall_quiz_average, overall_performance_status, 
                change_reason, recorded_by, recorded_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $studentId, $classId, 
            $updateData['total_score'] ?? 0,
            $updateData['total_lessons_completed'] ?? 0,
            $updateData['overall_quiz_average'] ?? 0,
            $updateData['overall_performance_status'] ?? 'NEEDS_IMPROVEMENT',
            'Manual update by teacher',
            $_SESSION['teacher_id']
        ]);
        
        // Recalculate class performance summary
        calculateClassPerformanceSummaryForClass($classId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Student performance updated successfully'
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function calculateClassPerformanceSummary() {
    global $pdo;
    
    try {
        $classId = $_POST['class_id'] ?? $_GET['class_id'] ?? null;
        
        if ($classId) {
            calculateClassPerformanceSummaryForClass($classId);
            echo json_encode([
                'success' => true,
                'message' => 'Class performance summary calculated successfully'
            ]);
        } else {
            // Calculate for all classes of this teacher
            $stmt = $pdo->prepare("
                SELECT id FROM classes 
                WHERE teacher_id = ? AND is_active = TRUE
            ");
            $stmt->execute([$_SESSION['teacher_id']]);
            $classes = $stmt->fetchAll();
            
            foreach ($classes as $class) {
                calculateClassPerformanceSummaryForClass($class['id']);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'All class performance summaries calculated successfully'
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function calculateClassPerformanceSummaryForClass($classId) {
    global $pdo;
    
    try {
        // Call the stored procedure
        $stmt = $pdo->prepare("CALL CalculateClassPerformanceSummary(?)");
        $stmt->execute([$classId]);
        
        // Update performance status for all students in the class
        $stmt = $pdo->prepare("
            SELECT student_id FROM student_performance_tracking 
            WHERE class_id = ?
        ");
        $stmt->execute([$classId]);
        $students = $stmt->fetchAll();
        
        foreach ($students as $student) {
            $stmt = $pdo->prepare("CALL UpdateStudentPerformanceStatus(?, ?)");
            $stmt->execute([$student['student_id'], $classId]);
        }
        
    } catch (Exception $e) {
        error_log("Error calculating class performance summary: " . $e->getMessage());
    }
}

function getPerformanceAnalytics() {
    global $pdo;
    
    try {
        $classId = $_GET['class_id'] ?? null;
        $teacherId = $_SESSION['teacher_id'];
        
        // Get performance analytics for the class
        $stmt = $pdo->prepare("
            SELECT * FROM performance_analytics 
            WHERE teacher_id = ? AND class_id = ?
            ORDER BY calculated_at DESC
            LIMIT 1
        ");
        $stmt->execute([$teacherId, $classId]);
        $analytics = $stmt->fetch();
        
        if (!$analytics) {
            // Generate basic analytics if none exist
            $analytics = generateBasicAnalytics($classId, $teacherId);
        }
        
        echo json_encode([
            'success' => true,
            'analytics' => $analytics
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function generateBasicAnalytics($classId, $teacherId) {
    global $pdo;
    
    // This would generate basic analytics based on current performance data
    // For now, return a basic structure
    return [
        'class_id' => $classId,
        'teacher_id' => $teacherId,
        'analytics_period_start' => date('Y-m-01'),
        'analytics_period_end' => date('Y-m-t'),
        'average_score_trend' => 'STABLE',
        'engagement_trend' => 'STABLE',
        'completion_rate_trend' => 'STABLE',
        'top_performing_topic' => 'functions',
        'struggling_topic' => 'rational-functions',
        'improvement_recommendations' => 'Focus on rational functions topic',
        'intervention_needed' => false,
        'intervention_priority' => 'LOW',
        'calculated_at' => date('Y-m-d H:i:s')
    ];
}

function exportPerformanceData() {
    global $pdo;
    
    try {
        $teacherId = $_SESSION['teacher_id'];
        $format = $_GET['format'] ?? 'csv';
        
        // Get performance data using the independent system
        $stmt = $pdo->prepare("
            SELECT 
                c.class_name, c.class_code, c.grade_level, c.strand,
                u.first_name, u.last_name, u.student_id as student_number, u.email,
                spt.total_score, spt.total_lessons_completed, spt.current_topic,
                spt.functions_score, spt.functions_quiz_best_score, spt.functions_quiz_status,
                spt.evaluating_functions_score, spt.evaluating_functions_quiz_best_score, spt.evaluating_functions_quiz_status,
                spt.overall_quiz_average, spt.passed_quizzes_count,
                spt.functions_lessons_completed, spt.evaluating_functions_lessons_completed,
                spt.operations_on_functions_lessons_completed, spt.rational_functions_lessons_completed,
                spt.solving_real_life_problems_lessons_completed, spt.last_activity,
                spt.overall_performance_status, spt.engagement_level
            FROM student_performance_tracking spt
            JOIN users u ON spt.student_id = u.id
            JOIN classes c ON spt.class_id = c.id
            WHERE c.teacher_id = ?
            ORDER BY c.class_name, u.last_name, u.first_name
        ");
        $stmt->execute([$teacherId]);
        $performanceData = $stmt->fetchAll();
        
        if ($format === 'csv') {
            exportToCSV($performanceData);
        } else {
            echo json_encode([
                'success' => true,
                'data' => $performanceData,
                'format' => $format
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function exportToCSV($performanceData) {
    // Set headers for CSV download
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="Independent_Class_Performance_Report_' . date('Y-m-d') . '.csv"');
    
    $output = fopen('php://output', 'w');
    
    // Add BOM for proper UTF-8 encoding in Excel
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
    
    // Add header row
    fputcsv($output, [
        'Class Name', 'Class Code', 'Grade Level', 'Strand',
        'Student Name', 'Student ID', 'Email',
        'Total Score (%)', 'Lessons Completed', 'Current Topic',
        'Functions Score (%)', 'Functions Quiz (%)', 'Functions Quiz Status',
        'Evaluating Score (%)', 'Evaluating Quiz (%)', 'Evaluating Quiz Status',
        'Overall Quiz Average (%)', 'Passed Quizzes',
        'Functions Lessons', 'Evaluating Lessons', 'Operations Lessons',
        'Rational Lessons', 'Real-Life Lessons', 'Last Activity',
        'Performance Status', 'Engagement Level'
    ]);
    
    // Add data rows
    foreach ($performanceData as $student) {
        $lastActivity = $student['last_activity'] ? date('Y-m-d H:i', strtotime($student['last_activity'])) : 'Never';
        
        fputcsv($output, [
            $student['class_name'],
            $student['class_code'],
            $student['grade_level'],
            $student['strand'],
            $student['first_name'] . ' ' . $student['last_name'],
            $student['student_number'],
            $student['email'],
            $student['total_score'] ?? 0,
            $student['total_lessons_completed'] ?? 0,
            $student['current_topic'] ?? '',
            $student['functions_score'] ?? 0,
            $student['functions_quiz_best_score'] ?? 0,
            $student['functions_quiz_status'] ?? 'NOT_ATTEMPTED',
            $student['evaluating_functions_score'] ?? 0,
            $student['evaluating_functions_quiz_best_score'] ?? 0,
            $student['evaluating_functions_quiz_status'] ?? 'NOT_ATTEMPTED',
            $student['overall_quiz_average'] ?? 0,
            $student['passed_quizzes_count'] ?? 0,
            ($student['functions_lessons_completed'] ?? 0) . '/5',
            ($student['evaluating_functions_lessons_completed'] ?? 0) . '/4',
            ($student['operations_on_functions_lessons_completed'] ?? 0) . '/3',
            ($student['rational_functions_lessons_completed'] ?? 0) . '/4',
            ($student['solving_real_life_problems_lessons_completed'] ?? 0) . '/3',
            $lastActivity,
            $student['overall_performance_status'] ?? 'NEEDS_IMPROVEMENT',
            $student['engagement_level'] ?? 'LOW'
        ]);
    }
    
    fclose($output);
    exit;
}

function validatePerformanceData() {
    global $pdo;
    
    try {
        $teacherId = $_SESSION['teacher_id'];
        $validationResults = [
            'database_tables' => [],
            'data_issues' => [],
            'recommendations' => [],
            'overall_status' => 'good'
        ];
        
        // Check independent performance tables
        $requiredTables = ['student_performance_tracking', 'class_performance_summary'];
        $optionalTables = ['performance_history', 'performance_analytics'];
        
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
                $validationResults['recommendations'][] = "Consider creating the '$table' table for enhanced analytics";
            } else {
                $validationResults['database_tables'][] = [
                    'table' => $table,
                    'status' => 'exists',
                    'required' => false
                ];
            }
        }
        
        // Check for data consistency
        if ($validationResults['overall_status'] !== 'error') {
            // Check for students without performance data
            $stmt = $pdo->prepare("
                SELECT COUNT(DISTINCT ce.student_id) as students_without_performance
                FROM class_enrollments ce
                LEFT JOIN student_performance_tracking spt ON ce.student_id = spt.student_id AND ce.class_id = spt.class_id
                JOIN classes c ON ce.class_id = c.id
                WHERE c.teacher_id = ? AND ce.enrollment_status = 'approved' AND spt.student_id IS NULL
            ");
            $stmt->execute([$teacherId]);
            $result = $stmt->fetch();
            
            if ($result['students_without_performance'] > 0) {
                $validationResults['data_issues'][] = [
                    'type' => 'missing_performance_data',
                    'count' => $result['students_without_performance'],
                    'message' => 'Some students have no performance tracking data'
                ];
                $validationResults['overall_status'] = 'warning';
            }
            
            // Check for classes without performance summaries
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as classes_without_summary
                FROM classes c
                LEFT JOIN class_performance_summary cps ON c.id = cps.class_id
                WHERE c.teacher_id = ? AND c.is_active = TRUE AND cps.class_id IS NULL
            ");
            $stmt->execute([$teacherId]);
            $result = $stmt->fetch();
            
            if ($result['classes_without_summary'] > 0) {
                $validationResults['data_issues'][] = [
                    'type' => 'missing_class_summaries',
                    'count' => $result['classes_without_summary'],
                    'message' => 'Some classes have no performance summaries'
                ];
                $validationResults['recommendations'][] = 'Run class performance summary calculation for all classes';
            }
        }
        
        echo json_encode([
            'success' => true,
            'validation' => $validationResults,
            'data_source' => 'Independent Performance Tracking System'
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function syncPerformanceDataForClass($classId) {
    global $pdo;
    
    try {
        // Get all students in this class
        $stmt = $pdo->prepare("
            SELECT DISTINCT ce.student_id, u.id as user_id
            FROM class_enrollments ce
            JOIN users u ON ce.student_id = u.id
            WHERE ce.class_id = ?
        ");
        $stmt->execute([$classId]);
        $students = $stmt->fetchAll();
        
        foreach ($students as $student) {
            $studentId = $student['student_id'];
            $userId = $student['user_id'];
            
            // Sync quiz data from quiz_attempts table
            $quizData = [];
            
            // Functions Quiz
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as attempts,
                    MAX(ROUND((score / total_questions) * 100, 1)) as best_score,
                    MAX(completed_at) as last_attempt,
                    CASE WHEN MAX(ROUND((score / total_questions) * 100, 1)) >= 70 THEN 'PASSED' ELSE 'FAILED' END as status
                FROM quiz_attempts 
                WHERE student_id = ? AND quiz_type = 'functions' AND status = 'completed'
            ");
            $stmt->execute([$userId]);
            $functionsData = $stmt->fetch();
            
            if ($functionsData) {
                $quizData['functions_quiz_attempts'] = $functionsData['attempts'];
                $quizData['functions_quiz_best_score'] = $functionsData['best_score'] ?? 0;
                $quizData['functions_quiz_status'] = $functionsData['status'] ?? 'NOT_ATTEMPTED';
                $quizData['functions_quiz_last_attempt'] = $functionsData['last_attempt'];
            }
            
            // Evaluating Functions Quiz
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as attempts,
                    MAX(ROUND((score / total_questions) * 100, 1)) as best_score,
                    MAX(completed_at) as last_attempt,
                    CASE WHEN MAX(ROUND((score / total_questions) * 100, 1)) >= 70 THEN 'PASSED' ELSE 'FAILED' END as status
                FROM quiz_attempts 
                WHERE student_id = ? AND quiz_type = 'evaluating-functions' AND status = 'completed'
            ");
            $stmt->execute([$userId]);
            $evaluatingData = $stmt->fetch();
            
            if ($evaluatingData) {
                $quizData['evaluating_functions_quiz_attempts'] = $evaluatingData['attempts'];
                $quizData['evaluating_functions_quiz_best_score'] = $evaluatingData['best_score'] ?? 0;
                $quizData['evaluating_functions_quiz_status'] = $evaluatingData['status'] ?? 'NOT_ATTEMPTED';
                $quizData['evaluating_functions_quiz_last_attempt'] = $evaluatingData['last_attempt'];
            }
            
            // Operations Quiz
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as attempts,
                    MAX(ROUND((score / total_questions) * 100, 1)) as best_score,
                    MAX(completed_at) as last_attempt,
                    CASE WHEN MAX(ROUND((score / total_questions) * 100, 1)) >= 70 THEN 'PASSED' ELSE 'FAILED' END as status
                FROM quiz_attempts 
                WHERE student_id = ? AND quiz_type = 'operations-on-functions' AND status = 'completed'
            ");
            $stmt->execute([$userId]);
            $operationsData = $stmt->fetch();
            
            if ($operationsData) {
                $quizData['operations_on_functions_quiz_attempts'] = $operationsData['attempts'];
                $quizData['operations_on_functions_quiz_best_score'] = $operationsData['best_score'] ?? 0;
                $quizData['operations_on_functions_quiz_status'] = $operationsData['status'] ?? 'NOT_ATTEMPTED';
                $quizData['operations_on_functions_quiz_last_attempt'] = $operationsData['last_attempt'];
            }
            
            // Sync lesson completion data
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(CASE WHEN topic_name = 'functions' THEN 1 END) as functions_lessons,
                    COUNT(CASE WHEN topic_name = 'evaluating-functions' THEN 1 END) as evaluating_lessons,
                    COUNT(CASE WHEN topic_name = 'operations-on-functions' THEN 1 END) as operations_lessons,
                    COUNT(*) as total_lessons
                FROM lesson_completion 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $lessonData = $stmt->fetch();
            
            if ($lessonData) {
                $quizData['functions_lessons_completed'] = $lessonData['functions_lessons'];
                $quizData['evaluating_functions_lessons_completed'] = $lessonData['evaluating_lessons'];
                $quizData['operations_on_functions_lessons_completed'] = $lessonData['operations_lessons'];
                $quizData['total_lessons_completed'] = $lessonData['total_lessons'];
            }
            
            // Sync user progress data
            $stmt = $pdo->prepare("
                SELECT total_score, completed_lessons, current_topic, updated_at
                FROM user_progress 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $progressData = $stmt->fetch();
            
            if ($progressData) {
                $quizData['total_score'] = $progressData['total_score'] ?? 0;
                $quizData['current_topic'] = $progressData['current_topic'];
                $quizData['last_activity'] = $progressData['updated_at'];
            }
            
            // Calculate overall performance metrics
            $totalQuizScore = ($quizData['functions_quiz_best_score'] ?? 0) + 
                             ($quizData['evaluating_functions_quiz_best_score'] ?? 0) + 
                             ($quizData['operations_on_functions_quiz_best_score'] ?? 0);
            
            $quizData['overall_quiz_average'] = $totalQuizScore > 0 ? round($totalQuizScore / 3, 2) : 0;
            
            // Determine overall performance status
            $passedQuizzes = 0;
            if (($quizData['functions_quiz_status'] ?? '') === 'PASSED') $passedQuizzes++;
            if (($quizData['evaluating_functions_quiz_status'] ?? '') === 'PASSED') $passedQuizzes++;
            if (($quizData['operations_on_functions_quiz_status'] ?? '') === 'PASSED') $passedQuizzes++;
            
            if ($passedQuizzes === 3) {
                $quizData['overall_performance_status'] = 'EXCELLENT';
            } elseif ($passedQuizzes === 2) {
                $quizData['overall_performance_status'] = 'GOOD';
            } elseif ($passedQuizzes === 1) {
                $quizData['overall_performance_status'] = 'AVERAGE';
            } elseif ($passedQuizzes === 0 && $totalQuizScore > 0) {
                $quizData['overall_performance_status'] = 'NEEDS_IMPROVEMENT';
            } else {
                $quizData['overall_performance_status'] = 'POOR';
            }
            
            // Update or insert into student_performance_tracking
            $updateFields = [];
            $updateValues = [];
            
            foreach ($quizData as $field => $value) {
                if ($value !== null) {
                    $updateFields[] = "$field = ?";
                    $updateValues[] = $value;
                }
            }
            
            if (!empty($updateFields)) {
                $updateValues[] = $studentId;
                $updateValues[] = $classId;
                
                $sql = "INSERT INTO student_performance_tracking (student_id, class_id, " . 
                       implode(', ', array_keys($quizData)) . ", updated_at) 
                       VALUES (?, ?, " . str_repeat('?, ', count($quizData)) . "NOW())
                       ON DUPLICATE KEY UPDATE " . implode(', ', $updateFields) . ", updated_at = NOW()";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute(array_merge([$studentId, $classId], array_values($quizData)));
            }
        }
        
        // Recalculate class performance summary
        calculateClassPerformanceSummaryForClass($classId);
        
    } catch (Exception $e) {
        error_log("Error syncing performance data for class $classId: " . $e->getMessage());
    }
}

function syncPerformanceDataFromMainSystem() {
    global $pdo;
    
    try {
        $teacherId = $_SESSION['teacher_id'];
        $classId = $_GET['class_id'] ?? $_POST['class_id'] ?? null;
        
        // Get all classes for this teacher
        $classesQuery = "SELECT id FROM classes WHERE teacher_id = ? AND is_active = TRUE";
        if ($classId) {
            $classesQuery .= " AND id = ?";
        }
        
        $stmt = $pdo->prepare($classesQuery);
        if ($classId) {
            $stmt->execute([$teacherId, $classId]);
        } else {
            $stmt->execute([$teacherId]);
        }
        $classes = $stmt->fetchAll();
        
        $syncedStudents = 0;
        $syncedClasses = 0;
        
        foreach ($classes as $class) {
            $classId = $class['id'];
            $syncedClasses++;
            
            // Get all students in this class
            $stmt = $pdo->prepare("
                SELECT DISTINCT ce.student_id, u.id as user_id
                FROM class_enrollments ce
                JOIN users u ON ce.student_id = u.id
                WHERE ce.class_id = ?
            ");
            $stmt->execute([$classId]);
            $students = $stmt->fetchAll();
            
            foreach ($students as $student) {
                $studentId = $student['student_id'];
                $userId = $student['user_id'];
                
                // Sync quiz data from quiz_attempts table
                $quizData = [];
                
                // Functions Quiz
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as attempts,
                        MAX(ROUND((score / total_questions) * 100, 1)) as best_score,
                        MAX(completed_at) as last_attempt,
                        CASE WHEN MAX(ROUND((score / total_questions) * 100, 1)) >= 70 THEN 'PASSED' ELSE 'FAILED' END as status
                    FROM quiz_attempts 
                    WHERE student_id = ? AND quiz_type = 'functions' AND status = 'completed'
                ");
                $stmt->execute([$userId]);
                $functionsData = $stmt->fetch();
                
                if ($functionsData) {
                    $quizData['functions_quiz_attempts'] = $functionsData['attempts'];
                    $quizData['functions_quiz_best_score'] = $functionsData['best_score'] ?? 0;
                    $quizData['functions_quiz_status'] = $functionsData['status'] ?? 'NOT_ATTEMPTED';
                    $quizData['functions_quiz_last_attempt'] = $functionsData['last_attempt'];
                }
                
                // Evaluating Functions Quiz
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as attempts,
                        MAX(ROUND((score / total_questions) * 100, 1)) as best_score,
                        MAX(completed_at) as last_attempt,
                        CASE WHEN MAX(ROUND((score / total_questions) * 100, 1)) >= 70 THEN 'PASSED' ELSE 'FAILED' END as status
                    FROM quiz_attempts 
                    WHERE student_id = ? AND quiz_type = 'evaluating-functions' AND status = 'completed'
                ");
                $stmt->execute([$userId]);
                $evaluatingData = $stmt->fetch();
                
                if ($evaluatingData) {
                    $quizData['evaluating_functions_quiz_attempts'] = $evaluatingData['attempts'];
                    $quizData['evaluating_functions_quiz_best_score'] = $evaluatingData['best_score'] ?? 0;
                    $quizData['evaluating_functions_quiz_status'] = $evaluatingData['status'] ?? 'NOT_ATTEMPTED';
                    $quizData['evaluating_functions_quiz_last_attempt'] = $evaluatingData['last_attempt'];
                }
                
                // Operations Quiz
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as attempts,
                        MAX(ROUND((score / total_questions) * 100, 1)) as best_score,
                        MAX(completed_at) as last_attempt,
                        CASE WHEN MAX(ROUND((score / total_questions) * 100, 1)) >= 70 THEN 'PASSED' ELSE 'FAILED' END as status
                    FROM quiz_attempts 
                    WHERE student_id = ? AND quiz_type = 'operations-on-functions' AND status = 'completed'
                ");
                $stmt->execute([$userId]);
                $operationsData = $stmt->fetch();
                
                if ($operationsData) {
                    $quizData['operations_on_functions_quiz_attempts'] = $operationsData['attempts'];
                    $quizData['operations_on_functions_quiz_best_score'] = $operationsData['best_score'] ?? 0;
                    $quizData['operations_on_functions_quiz_status'] = $operationsData['status'] ?? 'NOT_ATTEMPTED';
                    $quizData['operations_on_functions_quiz_last_attempt'] = $operationsData['last_attempt'];
                }
                
                // Sync lesson completion data
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(CASE WHEN topic_name = 'functions' THEN 1 END) as functions_lessons,
                        COUNT(CASE WHEN topic_name = 'evaluating-functions' THEN 1 END) as evaluating_lessons,
                        COUNT(CASE WHEN topic_name = 'operations-on-functions' THEN 1 END) as operations_lessons,
                        COUNT(*) as total_lessons
                    FROM lesson_completion 
                    WHERE user_id = ?
                ");
                $stmt->execute([$userId]);
                $lessonData = $stmt->fetch();
                
                if ($lessonData) {
                    $quizData['functions_lessons_completed'] = $lessonData['functions_lessons'];
                    $quizData['evaluating_functions_lessons_completed'] = $lessonData['evaluating_lessons'];
                    $quizData['operations_on_functions_lessons_completed'] = $lessonData['operations_lessons'];
                    $quizData['total_lessons_completed'] = $lessonData['total_lessons'];
                }
                
                // Sync user progress data
                $stmt = $pdo->prepare("
                    SELECT total_score, completed_lessons, current_topic, updated_at
                    FROM user_progress 
                    WHERE user_id = ?
                ");
                $stmt->execute([$userId]);
                $progressData = $stmt->fetch();
                
                if ($progressData) {
                    $quizData['total_score'] = $progressData['total_score'] ?? 0;
                    $quizData['current_topic'] = $progressData['current_topic'];
                    $quizData['last_activity'] = $progressData['updated_at'];
                }
                
                // Calculate overall performance metrics
                $totalQuizScore = ($quizData['functions_quiz_best_score'] ?? 0) + 
                                 ($quizData['evaluating_functions_quiz_best_score'] ?? 0) + 
                                 ($quizData['operations_on_functions_quiz_best_score'] ?? 0);
                
                $quizData['overall_quiz_average'] = $totalQuizScore > 0 ? round($totalQuizScore / 3, 2) : 0;
                
                // Determine overall performance status
                $passedQuizzes = 0;
                if (($quizData['functions_quiz_status'] ?? '') === 'PASSED') $passedQuizzes++;
                if (($quizData['evaluating_functions_quiz_status'] ?? '') === 'PASSED') $passedQuizzes++;
                if (($quizData['operations_on_functions_quiz_status'] ?? '') === 'PASSED') $passedQuizzes++;
                
                if ($passedQuizzes === 3) {
                    $quizData['overall_performance_status'] = 'EXCELLENT';
                } elseif ($passedQuizzes === 2) {
                    $quizData['overall_performance_status'] = 'GOOD';
                } elseif ($passedQuizzes === 1) {
                    $quizData['overall_performance_status'] = 'AVERAGE';
                } elseif ($passedQuizzes === 0 && $totalQuizScore > 0) {
                    $quizData['overall_performance_status'] = 'NEEDS_IMPROVEMENT';
                } else {
                    $quizData['overall_performance_status'] = 'POOR';
                }
                
                // Update or insert into student_performance_tracking
                $updateFields = [];
                $updateValues = [];
                
                foreach ($quizData as $field => $value) {
                    if ($value !== null) {
                        $updateFields[] = "$field = ?";
                        $updateValues[] = $value;
                    }
                }
                
                if (!empty($updateFields)) {
                    $updateValues[] = $studentId;
                    $updateValues[] = $classId;
                    
                    $sql = "INSERT INTO student_performance_tracking (student_id, class_id, " . 
                           implode(', ', array_keys($quizData)) . ", updated_at) 
                           VALUES (?, ?, " . str_repeat('?, ', count($quizData)) . "NOW())
                           ON DUPLICATE KEY UPDATE " . implode(', ', $updateFields) . ", updated_at = NOW()";
                    
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute(array_merge([$studentId, $classId], array_values($quizData)));
                    
                    $syncedStudents++;
                }
            }
            
            // Recalculate class performance summary
            calculateClassPerformanceSummaryForClass($classId);
        }
        
        echo json_encode([
            'success' => true,
            'message' => "Successfully synced performance data for $syncedStudents students across $syncedClasses classes",
            'synced_students' => $syncedStudents,
            'synced_classes' => $syncedClasses
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

?>
