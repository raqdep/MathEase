<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

$action = $input['action'] ?? '';
$topic = $input['topic'] ?? '';
$lesson = $input['lesson'] ?? null;
$user_id = $_SESSION['user_id'];

try {
    // Log the incoming request
    error_log("Complete lesson request: " . json_encode($input));
    
    // Check database connection
    if (!$pdo) {
        error_log("Database connection failed");
        throw new Exception('Database connection failed');
    }
    
    // Check if required tables exist
    $tablesCheck = $pdo->query("SHOW TABLES LIKE 'user_lesson_progress'");
    if ($tablesCheck->rowCount() == 0) {
        error_log("user_lesson_progress table not found");
        throw new Exception('Database tables not found. Please run the database migration first.');
    }
    
    error_log("Processing action: " . $action . " for topic: " . $topic . " lesson: " . $lesson);
    
    switch ($action) {
        case 'complete':
            if (!$topic || !$lesson) {
                error_log("Missing topic or lesson: topic=" . $topic . ", lesson=" . $lesson);
                throw new Exception('Topic and lesson are required');
            }
            
            error_log("Completing lesson: user_id=" . $user_id . ", topic=" . $topic . ", lesson=" . $lesson);
            
            // First, we need to get the topic_id and lesson_id from the database
            // Create a mapping from URL-friendly names to display names
            $topicNameMap = [
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
                'interest-maturity-future-present-values' => 'Interest, Maturity, Future, and Present Values',
                'solving-problems-simple-compound-interest' => 'Solving Problems: Simple and Compound Interest'
            ];
            
            // Get the proper topic name
            $properTopicName = $topicNameMap[$topic] ?? $topic;
            
            $topicStmt = $pdo->prepare("SELECT id FROM topics WHERE name = ?");
            $topicStmt->execute([$properTopicName]);
            $topicData = $topicStmt->fetch();
            
            if (!$topicData) {
                error_log("Topic not found: " . $topic . " (mapped to: " . $properTopicName . ")");
                
                // Try to create the topic if it doesn't exist
                if ($topic === 'rational-functions') {
                    error_log("Attempting to create Rational Functions topic");
                    try {
                        $createTopicStmt = $pdo->prepare("
                            INSERT INTO topics (name, description, difficulty_level, order_index) 
                            VALUES (?, 'Master the fundamentals of rational functions including domain analysis, graphing, equation solving, and inequality solving.', 'intermediate', 6)
                        ");
                        $createTopicStmt->execute([$properTopicName]);
                        $topic_id = $pdo->lastInsertId();
                        
                        // Create lessons for the topic
                        $lessonTitles = [
                            'Understanding Rational Functions',
                            'Graphing Rational Functions', 
                            'Solving Rational Equations',
                            'Solving Rational Inequalities'
                        ];
                        
                        foreach ($lessonTitles as $index => $title) {
                            $createLessonStmt = $pdo->prepare("
                                INSERT INTO lessons (topic_id, title, content, duration_minutes, order_index) 
                                VALUES (?, ?, 'Lesson content for ' . ?, 60, ?)
                            ");
                            $createLessonStmt->execute([$topic_id, $title, $title, $index + 1]);
                        }
                        
                        error_log("Successfully created Rational Functions topic with ID: " . $topic_id);
                    } catch (Exception $createError) {
                        error_log("Failed to create topic: " . $createError->getMessage());
                        throw new Exception('Topic not found: ' . $topic . '. Please contact administrator to add this topic to the database.');
                    }
                } else {
                    throw new Exception('Topic not found: ' . $topic);
                }
            } else {
                $topic_id = $topicData['id'];
            }
            
            // Get the lesson_id for this topic and lesson number
            $lessonStmt = $pdo->prepare("SELECT id FROM lessons WHERE topic_id = ? AND order_index = ?");
            $lessonStmt->execute([$topic_id, $lesson]);
            $lessonData = $lessonStmt->fetch();
            
            if (!$lessonData) {
                error_log("Lesson not found: topic_id=" . $topic_id . ", lesson=" . $lesson);
                throw new Exception('Lesson not found for topic: ' . $topic . ', lesson: ' . $lesson);
            }
            
            $lesson_id = $lessonData['id'];
            
            // Check if lesson completion already exists
            $checkStmt = $pdo->prepare("
                SELECT id FROM user_lesson_progress 
                WHERE user_id = ? AND lesson_id = ?
            ");
            $checkStmt->execute([$user_id, $lesson_id]);
            
            if ($checkStmt->rowCount() > 0) {
                error_log("Updating existing lesson completion");
                // Update existing completion
                $updateStmt = $pdo->prepare("
                    UPDATE user_lesson_progress 
                    SET completed = TRUE, last_accessed = NOW()
                    WHERE user_id = ? AND lesson_id = ?
                ");
                $updateStmt->execute([$user_id, $lesson_id]);
            } else {
                error_log("Creating new lesson completion");
                // Insert new completion
                $insertStmt = $pdo->prepare("
                    INSERT INTO user_lesson_progress (user_id, lesson_id, completed, last_accessed)
                    VALUES (?, ?, TRUE, NOW())
                ");
                $insertStmt->execute([$user_id, $lesson_id]);
            }
            
            error_log("Updating user progress");
            // Update user progress
            updateUserProgress($pdo, $user_id, $topic);
            
            error_log("Lesson completion successful");
            echo json_encode([
                'success' => true, 
                'message' => 'Lesson completed successfully',
                'lesson' => $lesson,
                'topic' => $topic
            ]);
            break;
            
        case 'get_completed':
            if (!$topic) {
                throw new Exception('Topic is required');
            }
            
            // Get topic_id using the same mapping
            $topicNameMap = [
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
                'interest-maturity-future-present-values' => 'Interest, Maturity, Future, and Present Values',
                'solving-problems-simple-compound-interest' => 'Solving Problems: Simple and Compound Interest'
            ];
            
            $properTopicName = $topicNameMap[$topic] ?? $topic;
            
            $topicStmt = $pdo->prepare("SELECT id FROM topics WHERE name = ?");
            $topicStmt->execute([$properTopicName]);
            $topicData = $topicStmt->fetch();
            
            if (!$topicData) {
                error_log("Topic not found for get_completed: " . $topic . " (mapped to: " . $properTopicName . ")");
                
                // Try to create the topic if it doesn't exist
                if ($topic === 'rational-functions') {
                    error_log("Attempting to create Rational Functions topic for get_completed");
                    try {
                        $createTopicStmt = $pdo->prepare("
                            INSERT INTO topics (name, description, difficulty_level, order_index) 
                            VALUES (?, 'Master the fundamentals of rational functions including domain analysis, graphing, equation solving, and inequality solving.', 'intermediate', 6)
                        ");
                        $createTopicStmt->execute([$properTopicName]);
                        $topic_id = $pdo->lastInsertId();
                        
                        // Create lessons for the topic
                        $lessonTitles = [
                            'Understanding Rational Functions',
                            'Graphing Rational Functions', 
                            'Solving Rational Equations',
                            'Solving Rational Inequalities'
                        ];
                        
                        foreach ($lessonTitles as $index => $title) {
                            $createLessonStmt = $pdo->prepare("
                                INSERT INTO lessons (topic_id, title, content, duration_minutes, order_index) 
                                VALUES (?, ?, 'Lesson content for ' . ?, 60, ?)
                            ");
                            $createLessonStmt->execute([$topic_id, $title, $title, $index + 1]);
                        }
                        
                        error_log("Successfully created Rational Functions topic with ID: " . $topic_id);
                    } catch (Exception $createError) {
                        error_log("Failed to create topic: " . $createError->getMessage());
                        throw new Exception('Topic not found: ' . $topic . '. Please contact administrator to add this topic to the database.');
                    }
                } else {
                    throw new Exception('Topic not found: ' . $topic);
                }
            } else {
                $topic_id = $topicData['id'];
            }
            
            // Get completed lessons for this topic
            $stmt = $pdo->prepare("
                SELECT l.order_index as lesson_number
                FROM user_lesson_progress ulp
                JOIN lessons l ON ulp.lesson_id = l.id
                WHERE ulp.user_id = ? AND l.topic_id = ? AND ulp.completed = TRUE
                ORDER BY l.order_index
            ");
            $stmt->execute([$user_id, $topic_id]);
            $completed_lessons = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            echo json_encode([
                'success' => true,
                'completed_lessons' => $completed_lessons,
                'total_completed' => count($completed_lessons)
            ]);
            break;
            
        case 'get_progress':
            if (!$topic) {
                throw new Exception('Topic is required');
            }
            
            // Get topic_id
            $topicStmt = $pdo->prepare("SELECT id FROM topics WHERE name = ?");
            $topicStmt->execute([$topic]);
            $topicData = $topicStmt->fetch();
            
            if (!$topicData) {
                throw new Exception('Topic not found: ' . $topic);
            }
            
            $topic_id = $topicData['id'];
            
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as completed_count,
                    MAX(l.order_index) as last_completed_lesson
                FROM user_lesson_progress ulp
                JOIN lessons l ON ulp.lesson_id = l.id
                WHERE ulp.user_id = ? AND l.topic_id = ? AND ulp.completed = TRUE
            ");
            $stmt->execute([$user_id, $topic_id]);
            $progress = $stmt->fetch();
            
            echo json_encode([
                'success' => true,
                'progress' => $progress
            ]);
            break;
            
        case 'complete_topic':
            if (!$topic) {
                throw new Exception('Topic is required');
            }
            
            // Get topic_id using the same mapping
            $topicNameMap = [
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
                'interest-maturity-future-present-values' => 'Interest, Maturity, Future, and Present Values',
                'solving-problems-simple-compound-interest' => 'Solving Problems: Simple and Compound Interest'
            ];
            
            $properTopicName = $topicNameMap[$topic] ?? $topic;
            
            $topicStmt = $pdo->prepare("SELECT id FROM topics WHERE name = ?");
            $topicStmt->execute([$properTopicName]);
            $topicData = $topicStmt->fetch();
            
            if (!$topicData) {
                error_log("Topic not found for complete_topic: " . $topic . " (mapped to: " . $properTopicName . ")");
                
                // Try to create the topic if it doesn't exist
                if ($topic === 'rational-functions') {
                    error_log("Attempting to create Rational Functions topic for complete_topic");
                    try {
                        $createTopicStmt = $pdo->prepare("
                            INSERT INTO topics (name, description, difficulty_level, order_index) 
                            VALUES (?, 'Master the fundamentals of rational functions including domain analysis, graphing, equation solving, and inequality solving.', 'intermediate', 6)
                        ");
                        $createTopicStmt->execute([$properTopicName]);
                        $topic_id = $pdo->lastInsertId();
                        
                        // Create lessons for the topic
                        $lessonTitles = [
                            'Understanding Rational Functions',
                            'Graphing Rational Functions', 
                            'Solving Rational Equations',
                            'Solving Rational Inequalities'
                        ];
                        
                        foreach ($lessonTitles as $index => $title) {
                            $createLessonStmt = $pdo->prepare("
                                INSERT INTO lessons (topic_id, title, content, duration_minutes, order_index) 
                                VALUES (?, ?, 'Lesson content for ' . ?, 60, ?)
                            ");
                            $createLessonStmt->execute([$topic_id, $title, $title, $index + 1]);
                        }
                        
                        error_log("Successfully created Rational Functions topic with ID: " . $topic_id);
                    } catch (Exception $createError) {
                        error_log("Failed to create topic: " . $createError->getMessage());
                        throw new Exception('Topic not found: ' . $topic . '. Please contact administrator to add this topic to the database.');
                    }
                } else {
                    throw new Exception('Topic not found: ' . $topic);
                }
            } else {
                $topic_id = $topicData['id'];
            }
            
            // Check if all lessons are completed
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as completed_count
                FROM user_lesson_progress ulp
                JOIN lessons l ON ulp.lesson_id = l.id
                WHERE ulp.user_id = ? AND l.topic_id = ? AND ulp.completed = TRUE
            ");
            $stmt->execute([$user_id, $topic_id]);
            $completedCount = $stmt->fetch()['completed_count'];
            
            // Get total lessons for this topic
            $totalStmt = $pdo->prepare("SELECT COUNT(*) as total FROM lessons WHERE topic_id = ?");
            $totalStmt->execute([$topic_id]);
            $total = $totalStmt->fetch()['total'];
            
            if ($completedCount < $total) {
                throw new Exception("Please complete all lessons before marking the topic as complete. You have completed {$completedCount} of {$total} lessons.");
            }
            
            // Check if user has already received points for this topic (BEFORE updating)
            $checkStmt = $pdo->prepare("
                SELECT completed FROM user_topic_progress 
                WHERE user_id = ? AND topic_id = ? AND completed = TRUE
            ");
            $checkStmt->execute([$user_id, $topic_id]);
            $existingProgress = $checkStmt->fetch();
            
            // Only award points if this is the first time completing the topic
            $pointsToAdd = 0;
            if (!$existingProgress) {
                $pointsToAdd = 50; // Bonus points for completing a topic for the first time
            }
            
            // Mark topic as completed in user_topic_progress table
            $stmt = $pdo->prepare("
                INSERT INTO user_topic_progress (user_id, topic_id, completed, last_attempt) 
                VALUES (?, ?, TRUE, NOW())
                ON DUPLICATE KEY UPDATE 
                    completed = TRUE,
                    last_attempt = NOW(),
                    updated_at = NOW()
            ");
            $stmt->execute([$user_id, $topic_id]);
            
            // Update main user_progress table
            $stmt = $pdo->prepare("
                UPDATE user_progress 
                SET 
                    total_score = total_score + ?,
                    completed_lessons = (SELECT COUNT(*) FROM user_lesson_progress WHERE user_id = ? AND completed = TRUE),
                    current_topic = ?,
                    updated_at = NOW()
                WHERE user_id = ?
            ");
            $stmt->execute([$pointsToAdd, $user_id, $topic, $user_id]);
            
            $message = "Topic '{$topic}' marked as complete!";
            if ($pointsToAdd > 0) {
                $message .= " You earned {$pointsToAdd} bonus points!";
            } else {
                $message .= " (No additional points - already completed before)";
            }
            
            echo json_encode([
                'success' => true,
                'message' => $message,
                'completed_lessons' => $completedCount,
                'total_lessons' => $total,
                'points_awarded' => $pointsToAdd
            ]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    error_log("Complete lesson error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage(),
        'debug_info' => [
            'action' => $action,
            'topic' => $topic,
            'lesson' => $lesson,
            'user_id' => $user_id ?? 'not_set'
        ]
    ]);
}

// Function to update user progress
function updateUserProgress($pdo, $user_id, $topic) {
    // Get topic_id
    $topicStmt = $pdo->prepare("SELECT id FROM topics WHERE name = ?");
    $topicStmt->execute([$topic]);
    $topicData = $topicStmt->fetch();
    
    if (!$topicData) {
        error_log("Topic not found in updateUserProgress: " . $topic);
        return;
    }
    
    $topic_id = $topicData['id'];
    
    // Get total lessons completed for this topic
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as completed_count
        FROM user_lesson_progress ulp
        JOIN lessons l ON ulp.lesson_id = l.id
        WHERE ulp.user_id = ? AND l.topic_id = ? AND ulp.completed = TRUE
    ");
    $stmt->execute([$user_id, $topic_id]);
    $count = $stmt->fetch()['completed_count'];
    
    // Get total lessons for this topic
    $totalStmt = $pdo->prepare("SELECT COUNT(*) as total FROM lessons WHERE topic_id = ?");
    $totalStmt->execute([$topic_id]);
    $total = $totalStmt->fetch()['total'];
    
    // Update main user_progress table (existing structure)
    $checkStmt = $pdo->prepare("
        SELECT id FROM user_progress 
        WHERE user_id = ?
    ");
    $checkStmt->execute([$user_id]);
    
    if ($checkStmt->rowCount() > 0) {
        // Update existing progress
        $updateStmt = $pdo->prepare("
            UPDATE user_progress 
            SET completed_lessons = (SELECT COUNT(*) FROM user_lesson_progress WHERE user_id = ? AND completed = TRUE), 
                current_topic = ?, updated_at = NOW()
            WHERE user_id = ?
        ");
        $updateStmt->execute([$user_id, $topic, $user_id]);
    } else {
        // Insert new progress record
        $insertStmt = $pdo->prepare("
            INSERT INTO user_progress (user_id, completed_lessons, current_topic, created_at, updated_at)
            VALUES (?, (SELECT COUNT(*) FROM user_lesson_progress WHERE user_id = ? AND completed = TRUE), ?, NOW(), NOW())
        ");
        $insertStmt->execute([$user_id, $user_id, $topic]);
    }
    
    // Update topic-specific progress table
    $checkTopicStmt = $pdo->prepare("
        SELECT id FROM user_topic_progress 
        WHERE user_id = ? AND topic_id = ?
    ");
    $checkTopicStmt->execute([$user_id, $topic_id]);
    
    if ($checkTopicStmt->rowCount() > 0) {
        // Update existing topic progress
        $updateTopicStmt = $pdo->prepare("
            UPDATE user_topic_progress 
            SET last_attempt = NOW(), updated_at = NOW()
            WHERE user_id = ? AND topic_id = ?
        ");
        $updateTopicStmt->execute([$user_id, $topic_id]);
    } else {
        // Insert new topic progress record
        $insertTopicStmt = $pdo->prepare("
            INSERT INTO user_topic_progress (user_id, topic_id, completed, last_attempt, created_at, updated_at)
            VALUES (?, ?, FALSE, NOW(), NOW(), NOW())
        ");
        $insertTopicStmt->execute([$user_id, $topic_id]);
    }
}

?>
