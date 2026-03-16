<?php
/**
 * Custom AI Quiz Performance Analysis
 * Analyzes student quiz performance based on answers stored in database
 * Identifies strengths, weaknesses, correct/incorrect answers, and provides recommendations
 */

session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];
$topic = $_GET['topic'] ?? 'functions';

try {
    // Enable error reporting for debugging
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    
    // Check database connection
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }
    
    // Debug: Log the query parameters
    error_log("Analyzing quiz performance for user_id: $user_id, topic: $topic");
    
    // Check which time column exists (completion_time or time_taken_seconds)
    $timeColumn = 'completion_time'; // Default column name
    try {
        $timeColumnCheck = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'time_taken_seconds'");
        if ($timeColumnCheck->rowCount() > 0) {
            $timeColumn = 'time_taken_seconds';
        } else {
            // Check if completion_time exists
            $completionTimeCheck = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'completion_time'");
            if ($completionTimeCheck->rowCount() > 0) {
                $timeColumn = 'completion_time';
            }
        }
    } catch (PDOException $e) {
        error_log("Warning: Could not check time column: " . $e->getMessage());
        // Default to completion_time
        $timeColumn = 'completion_time';
    }
    
    error_log("Using time column: $timeColumn");
    
    // Get all quiz attempts for this user and topic
    // Handle different topic formats:
    // - functions -> functions_topic_%
    // - operations-on-functions -> Match both formats:
    //   * operations-on-functions-lesson-X (hyphens, new format)
    //   * operations_on_functions_lesson_X (underscores, old format)
    // - evaluating-functions -> Match both formats:
    //   * evaluating-functions-lesson-X or evaluating_functions_topic_X
    if ($topic === 'functions') {
        $quizTypePattern = 'functions_topic_%';
    } elseif ($topic === 'operations-on-functions') {
        // Use OR condition to match both formats
        // Pattern 1: operations-on-functions-lesson-X (hyphens)
        // Pattern 2: operations_on_functions_lesson_X (underscores)
        // We'll use a more flexible pattern that matches both
        $quizTypePattern = 'operations%functions%lesson%';
    } elseif ($topic === 'evaluating-functions') {
        // Match both formats: evaluating-functions-lesson-X and evaluating_functions_topic_X
        $quizTypePattern = 'evaluating%functions%';
    } else {
        $quizTypePattern = $topic . '%';
    }
    error_log("Quiz type pattern: $quizTypePattern for topic: $topic");
    
    // For operations-on-functions, we need to check both patterns
    // because old data might use underscores and new data uses hyphens
    if ($topic === 'operations-on-functions') {
        // Try pattern with hyphens first (new format)
        $stmtHyphens = $pdo->prepare("
            SELECT 
                id,
                quiz_type,
                score,
                total_questions,
                $timeColumn as time_taken_seconds,
                answers_data,
                completed_at
            FROM quiz_attempts
            WHERE student_id = ? 
            AND quiz_type LIKE 'operations-on-functions%'
            AND answers_data IS NOT NULL
            AND answers_data != ''
            ORDER BY completed_at DESC
        ");
        $stmtHyphens->execute([$user_id]);
        $attemptsHyphens = $stmtHyphens->fetchAll(PDO::FETCH_ASSOC);
        
        // Try pattern with underscores (old format)
        $stmtUnderscores = $pdo->prepare("
            SELECT 
                id,
                quiz_type,
                score,
                total_questions,
                $timeColumn as time_taken_seconds,
                answers_data,
                completed_at
            FROM quiz_attempts
            WHERE student_id = ? 
            AND quiz_type LIKE 'operations_on_functions%'
            AND answers_data IS NOT NULL
            AND answers_data != ''
            ORDER BY completed_at DESC
        ");
        $stmtUnderscores->execute([$user_id]);
        $attemptsUnderscores = $stmtUnderscores->fetchAll(PDO::FETCH_ASSOC);
        
        // Combine both results
        $quizAttempts = array_merge($attemptsHyphens, $attemptsUnderscores);
        error_log("Found " . count($attemptsHyphens) . " attempts with hyphens format");
        error_log("Found " . count($attemptsUnderscores) . " attempts with underscores format");
        error_log("Total combined: " . count($quizAttempts) . " quiz attempts");
    } else {
        // For other topics, use the original pattern matching
        $stmt = $pdo->prepare("
            SELECT 
                id,
                quiz_type,
                score,
                total_questions,
                $timeColumn as time_taken_seconds,
                answers_data,
                completed_at
            FROM quiz_attempts
            WHERE student_id = ? 
            AND quiz_type LIKE ?
            AND answers_data IS NOT NULL
            AND answers_data != ''
            ORDER BY completed_at DESC
        ");
        
        $stmt->execute([$user_id, $quizTypePattern]);
        $quizAttempts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Remove duplicates if any (in case both patterns matched the same record for operations-on-functions)
    if ($topic === 'operations-on-functions' && !empty($quizAttempts)) {
        $uniqueAttempts = [];
        $seenIds = [];
        foreach ($quizAttempts as $attempt) {
            if (!in_array($attempt['id'], $seenIds)) {
                $uniqueAttempts[] = $attempt;
                $seenIds[] = $attempt['id'];
            }
        }
        $quizAttempts = $uniqueAttempts;
    }
    
    // Group all attempts by lesson number and sort by completed_at (oldest first)
    $allAttemptsByLesson = [];
    foreach ($quizAttempts as $attempt) {
        $quizType = $attempt['quiz_type'];
        $lessonNum = extractTopicNumber($quizType);
        
        if ($lessonNum > 0) {
            if (!isset($allAttemptsByLesson[$lessonNum])) {
                $allAttemptsByLesson[$lessonNum] = [];
            }
            $allAttemptsByLesson[$lessonNum][] = $attempt;
        }
    }
    
    // Sort attempts by completed_at (oldest first) for each lesson
    foreach ($allAttemptsByLesson as $lessonNum => $attempts) {
        usort($attempts, function($a, $b) {
            $timeA = strtotime($a['completed_at']);
            $timeB = strtotime($b['completed_at']);
            return $timeA - $timeB; // Oldest first
        });
        $allAttemptsByLesson[$lessonNum] = $attempts;
    }
    
    // Count failed attempts BEFORE the final passed attempt for each lesson
    $attemptCountsByLesson = [];
    $latestAttemptsByLesson = [];
    
    foreach ($allAttemptsByLesson as $lessonNum => $attempts) {
        $totalAttempts = count($attempts);
        $failedBeforePass = 0;
        $firstPassedAttemptIndex = null;
        $latestPassedAttempt = null;
        $hasPassed = false;
        
        // Go through attempts chronologically to find the first passed attempt
        foreach ($attempts as $index => $attempt) {
            $score = (int)($attempt['score'] ?? 0);
            $totalQuestions = (int)($attempt['total_questions'] ?? 5);
            $percentage = $totalQuestions > 0 ? ($score / $totalQuestions) * 100 : 0;
            $isPassed = ($percentage >= 60 || $score >= 3);
            
            if ($isPassed) {
                // Found a passed attempt
                if ($firstPassedAttemptIndex === null) {
                    // This is the first passed attempt - count failures before this
                    $firstPassedAttemptIndex = $index;
                    // Count all attempts before this index that failed
                    for ($i = 0; $i < $index; $i++) {
                        $prevScore = (int)($attempts[$i]['score'] ?? 0);
                        $prevTotalQuestions = (int)($attempts[$i]['total_questions'] ?? 5);
                        $prevPercentage = $prevTotalQuestions > 0 ? ($prevScore / $prevTotalQuestions) * 100 : 0;
                        $prevIsPassed = ($prevPercentage >= 60 || $prevScore >= 3);
                        if (!$prevIsPassed) {
                            $failedBeforePass++;
                        }
                    }
                }
                $latestPassedAttempt = $attempt;
                $hasPassed = true;
            }
        }
        
        // If no passed attempt found, use the latest attempt (even if failed)
        // and count all attempts as failed
        if (!$hasPassed && !empty($attempts)) {
            $latestAttempt = end($attempts);
            $failedBeforePass = $totalAttempts;
            $latestAttemptsByLesson[$lessonNum] = $latestAttempt;
        } else if ($latestPassedAttempt) {
            // Use the latest passed attempt for analysis
            $latestAttemptsByLesson[$lessonNum] = $latestPassedAttempt;
        }
        
        // Store attempt counts
        $attemptCountsByLesson[$lessonNum] = [
            'total_attempts' => $totalAttempts,
            'failed_before_pass' => $failedBeforePass,
            'passed_on_attempt' => $hasPassed ? ($failedBeforePass + 1) : null,
            'has_passed' => $hasPassed
        ];
    }
    
    // Replace quizAttempts with only the latest attempts
    $quizAttempts = array_values($latestAttemptsByLesson);
    error_log("After filtering to latest attempts per lesson: " . count($quizAttempts) . " unique quiz attempts");
    
    error_log("Found " . count($quizAttempts) . " quiz attempts for topic: $topic");
    
    // Debug: Check if answers_data exists
    if (!empty($quizAttempts)) {
        foreach ($quizAttempts as $idx => $attempt) {
            error_log("Attempt " . ($idx + 1) . ": quiz_type=" . $attempt['quiz_type'] . ", answers_data length=" . strlen($attempt['answers_data'] ?? ''));
            // Try to decode to check if valid JSON
            $testDecode = json_decode($attempt['answers_data'], true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("WARNING: Attempt " . ($idx + 1) . " has invalid JSON: " . json_last_error_msg());
            } else {
                error_log("Attempt " . ($idx + 1) . " JSON is valid, contains " . count($testDecode) . " answers");
            }
        }
    }
    
    if (empty($quizAttempts)) {
        // Check if there are any attempts without answers_data
        $checkStmt = $pdo->prepare("
            SELECT COUNT(*) as total_attempts, quiz_type
            FROM quiz_attempts
            WHERE student_id = ? 
            AND quiz_type LIKE ?
            GROUP BY quiz_type
        ");
        $checkStmt->execute([$user_id, $quizTypePattern]);
        $checkResults = $checkStmt->fetchAll(PDO::FETCH_ASSOC);
        $totalAttempts = 0;
        $attemptTypes = [];
        foreach ($checkResults as $row) {
            $totalAttempts += $row['total_attempts'];
            $attemptTypes[] = $row['quiz_type'];
        }
        
        // Also check ALL attempts for this user to see what quiz_types exist
        $allAttemptsStmt = $pdo->prepare("
            SELECT DISTINCT quiz_type, COUNT(*) as count
            FROM quiz_attempts
            WHERE student_id = ?
            GROUP BY quiz_type
        ");
        $allAttemptsStmt->execute([$user_id]);
        $allAttempts = $allAttemptsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("DEBUG: Pattern used: $quizTypePattern");
        error_log("DEBUG: User ID: $user_id");
        error_log("DEBUG: All quiz types for this user: " . json_encode($allAttempts));
        error_log("DEBUG: Matching attempts (without answers_data check): " . json_encode($attemptTypes));
        
        if ($totalAttempts > 0) {
            error_log("Found $totalAttempts attempts but none have answers_data");
            echo json_encode([
                'success' => false,
                'message' => "Found $totalAttempts quiz attempt(s) but answers data is missing. Please retake the quiz.",
                'debug' => 'Attempts exist but answers_data is NULL or empty',
                'pattern_used' => $quizTypePattern,
                'found_types' => $attemptTypes,
                'all_user_types' => array_map(function($a) { return $a['quiz_type']; }, $allAttempts)
            ]);
        } else {
            // Check if there are any attempts at all for this user
            $anyAttemptsStmt = $pdo->prepare("SELECT COUNT(*) as count FROM quiz_attempts WHERE student_id = ?");
            $anyAttemptsStmt->execute([$user_id]);
            $anyAttempts = $anyAttemptsStmt->fetch(PDO::FETCH_ASSOC);
            $anyCount = $anyAttempts['count'] ?? 0;
            
            if ($anyCount > 0) {
                error_log("User has $anyCount total attempts but none match pattern $quizTypePattern");
                echo json_encode([
                    'success' => false,
                    'message' => "No quiz attempts found matching pattern '$quizTypePattern'. Found $anyCount total attempts for this user.",
                    'debug' => "Pattern mismatch. Pattern: $quizTypePattern, User has: " . json_encode(array_map(function($a) { return $a['quiz_type']; }, $allAttempts)),
                    'pattern_used' => $quizTypePattern,
                    'all_user_types' => array_map(function($a) { return $a['quiz_type']; }, $allAttempts)
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'No quiz attempts found. Please complete at least one quiz first.',
                    'debug' => "No attempts found for user_id: $user_id, pattern: $quizTypePattern"
                ]);
            }
        }
        exit;
    }
    
    // Analyze quiz performance (pass attempt counts)
    $attemptCountsByLesson = $GLOBALS['attempt_counts_by_lesson'] ?? [];
    $analysis = analyzeQuizPerformance($quizAttempts, $topic, $attemptCountsByLesson);
    
    echo json_encode([
        'success' => true,
        'analysis' => $analysis
    ]);
    
} catch (Exception $e) {
    error_log("Quiz Performance Analysis Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to analyze performance: ' . $e->getMessage(),
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}

/**
 * Analyze quiz performance from attempts
 */
function analyzeQuizPerformance($quizAttempts, $topic, $attemptCountsByLesson = []) {
    $allAnswers = [];
    $topicPerformance = [];
    $correctAnswers = [];
    $incorrectAnswers = [];
    $questionTypes = [];
    $totalScore = 0;
    $totalQuestions = 0;
    $totalTime = 0;
    
    // Process each quiz attempt
    foreach ($quizAttempts as $attempt) {
        $quizType = $attempt['quiz_type'];
        $topicNum = extractTopicNumber($quizType);
        
        // Debug: Log attempt processing
        error_log("Processing attempt: quiz_type=$quizType, topicNum=$topicNum");
        
        // Parse answers data
        $answersData = $attempt['answers_data'] ?? null;
        if (empty($answersData)) {
            error_log("WARNING: Attempt $quizType has empty answers_data, skipping");
            continue;
        }
        
        $answers = json_decode($answersData, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("ERROR: Failed to decode JSON for attempt $quizType: " . json_last_error_msg());
            error_log("Answers data preview: " . substr($answersData, 0, 200));
            continue;
        }
        
        if (!is_array($answers)) {
            error_log("WARNING: Decoded answers is not an array for attempt $quizType");
            continue;
        }
        
        error_log("Successfully parsed " . count($answers) . " answers for attempt $quizType");
        
        // Initialize topic performance if not exists
        if (!isset($topicPerformance[$topicNum])) {
            $attemptCounts = $attemptCountsByLesson[$topicNum] ?? [
                'total_attempts' => 0,
                'failed_before_pass' => 0,
                'passed_on_attempt' => null,
                'has_passed' => false
            ];
            
            $topicPerformance[$topicNum] = [
                'correct' => 0,
                'incorrect' => 0,
                'total' => 0,
                'score' => 0,
                'questions' => [],
                'total_attempts' => $attemptCounts['total_attempts'],
                'failed_before_pass' => $attemptCounts['failed_before_pass'],
                'passed_on_attempt' => $attemptCounts['passed_on_attempt'],
                'has_passed' => $attemptCounts['has_passed']
            ];
        }
        
        // Analyze each answer
        foreach ($answers as $index => $answer) {
            if (!is_array($answer)) {
                error_log("WARNING: Answer at index $index is not an array");
                continue;
            }
            
            if (!isset($answer['isCorrect'])) {
                error_log("WARNING: Answer at index $index missing 'isCorrect' field");
                continue;
            }
            
            $questionNum = $index + 1;
            $isCorrect = (bool)$answer['isCorrect'];
            $question = $answer['question'] ?? "Question " . $questionNum;
            
            // Track correct/incorrect answers
            if ($isCorrect) {
                $correctAnswers[] = [
                    'topic' => $topicNum,
                    'question' => $question,
                    'questionNum' => $questionNum,
                    'selected' => $answer['selectedText'] ?? 'N/A',
                    'correct' => $answer['correctText'] ?? 'N/A',
                    'explanation' => $answer['explanation'] ?? ''
                ];
                $topicPerformance[$topicNum]['correct']++;
            } else {
                $incorrectAnswers[] = [
                    'topic' => $topicNum,
                    'question' => $question,
                    'questionNum' => $questionNum,
                    'selected' => $answer['selectedText'] ?? 'N/A',
                    'correct' => $answer['correctText'] ?? 'N/A',
                    'options' => $answer['options'] ?? [],
                    'explanation' => $answer['explanation'] ?? ''
                ];
                $topicPerformance[$topicNum]['incorrect']++;
            }
            
            $topicPerformance[$topicNum]['total']++;
            $topicPerformance[$topicNum]['questions'][] = [
                'question' => $question,
                'isCorrect' => $isCorrect
            ];
        }
        
        // Update topic score
        $score = (int)$attempt['score'];
        $attemptTotalQuestions = (int)$attempt['total_questions'];
        $topicPerformance[$topicNum]['score'] = $score;
        $totalScore += $score;
        $totalQuestions += $attemptTotalQuestions; // Fixed: was incorrectly adding $totalQuestions to itself
        
        // Handle both column names (completion_time or time_taken_seconds)
        $timeValue = $attempt['time_taken_seconds'] ?? $attempt['completion_time'] ?? 0;
        if ($timeValue > 0) {
            $totalTime += (int)$timeValue;
        }
    }
    
    // Calculate performance metrics
    $overallAverage = $totalQuestions > 0 ? round(($totalScore / $totalQuestions) * 100, 1) : 0;
    
    // Identify strengths and weaknesses
    $strengths = identifyStrengths($topicPerformance, $correctAnswers);
    $weaknesses = identifyWeaknesses($topicPerformance, $incorrectAnswers);
    
    // Generate recommendations
    $recommendations = generateRecommendations($topicPerformance, $incorrectAnswers, $overallAverage);
    
    // Build analysis report
    $analysis = [
        'overallAverage' => $overallAverage,
        'totalQuizzes' => count($quizAttempts),
        'totalQuestions' => $totalQuestions,
        'totalScore' => $totalScore,
        'totalTimeMinutes' => round($totalTime / 60, 1),
        'topicPerformance' => $topicPerformance,
        'strengths' => $strengths,
        'weaknesses' => $weaknesses,
        'correctAnswers' => $correctAnswers,
        'incorrectAnswers' => $incorrectAnswers,
        'recommendations' => $recommendations,
        'summary' => generateSummary($topicPerformance, $overallAverage, $strengths, $weaknesses)
    ];
    
    return $analysis;
}

/**
 * Extract topic number from quiz_type
 * Supports multiple formats:
 * - "functions_topic_1" -> 1
 * - "operations-on-functions-lesson-1" -> 1
 * - "operations_on_functions_lesson_1" -> 1
 * - "evaluating-functions-lesson-1" -> 1
 * - "evaluating_functions_topic_1" -> 1
 */
function extractTopicNumber($quizType) {
    // Try to match "topic" pattern first (for functions_topic_X format)
    if (preg_match('/topic[_\s-]*(\d+)/i', $quizType, $matches)) {
        return (int)$matches[1];
    }
    // Try to match "lesson" pattern (for operations-on-functions-lesson-X format)
    if (preg_match('/lesson[_\s-]*(\d+)/i', $quizType, $matches)) {
        return (int)$matches[1];
    }
    // If no match, return 0
    error_log("WARNING: Could not extract topic number from quiz_type: $quizType");
    return 0;
}

/**
 * Identify student strengths
 */
function identifyStrengths($topicPerformance, $correctAnswers) {
    $strengths = [];
    
    // Find topics with high performance (80% or above)
    foreach ($topicPerformance as $topicNum => $performance) {
        if ($performance['total'] > 0) {
            $percentage = ($performance['correct'] / $performance['total']) * 100;
            if ($percentage >= 80) {
                $strengths[] = [
                    'topic' => $topicNum,
                    'percentage' => round($percentage, 1),
                    'correct' => $performance['correct'],
                    'total' => $performance['total'],
                    'message' => getTopicName($topicNum) . " - You scored " . round($percentage, 1) . "%! Excellent!"
                ];
            }
        }
    }
    
    // Find question types student is good at
    $questionTypeCounts = [];
    foreach ($correctAnswers as $answer) {
        $question = $answer['question'];
        $type = identifyQuestionType($question);
        if (!isset($questionTypeCounts[$type])) {
            $questionTypeCounts[$type] = 0;
        }
        $questionTypeCounts[$type]++;
    }
    
    if (!empty($questionTypeCounts)) {
        $maxType = array_search(max($questionTypeCounts), $questionTypeCounts);
        if ($maxType !== false) {
            $strengths[] = [
                'type' => 'question_type',
                'message' => "You're strong in " . $maxType . " questions!"
            ];
        }
    }
    
    return $strengths;
}

/**
 * Identify student weaknesses
 */
function identifyWeaknesses($topicPerformance, $incorrectAnswers) {
    $weaknesses = [];
    
    // Find topics with low performance (below 60%)
    foreach ($topicPerformance as $topicNum => $performance) {
        if ($performance['total'] > 0) {
            $percentage = ($performance['correct'] / $performance['total']) * 100;
            if ($percentage < 60) {
                $weaknesses[] = [
                    'topic' => $topicNum,
                    'percentage' => round($percentage, 1),
                    'correct' => $performance['correct'],
                    'total' => $performance['total'],
                    'incorrect' => $performance['incorrect'],
                    'message' => getTopicName($topicNum) . " - Only " . round($percentage, 1) . "%. You need to review this topic."
                ];
            }
        }
    }
    
    // Find common mistakes
    $commonMistakes = [];
    foreach ($incorrectAnswers as $answer) {
        $topic = $answer['topic'];
        if (!isset($commonMistakes[$topic])) {
            $commonMistakes[$topic] = [];
        }
        $commonMistakes[$topic][] = $answer;
    }
    
    foreach ($commonMistakes as $topic => $mistakes) {
        if (count($mistakes) >= 2) {
            $weaknesses[] = [
                'type' => 'common_mistakes',
                'topic' => $topic,
                'count' => count($mistakes),
                'message' => getTopicName($topic) . " - " . count($mistakes) . " incorrect answers. You need more practice."
            ];
        }
    }
    
    return $weaknesses;
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations($topicPerformance, $incorrectAnswers, $overallAverage) {
    $recommendations = [];
    
    // Identify weak topics (below 60%)
    $weakTopics = [];
    foreach ($topicPerformance as $topicNum => $performance) {
        if ($performance['total'] > 0) {
            $percentage = ($performance['correct'] / $performance['total']) * 100;
            if ($percentage < 60) {
                $weakTopics[$topicNum] = [
                    'percentage' => $percentage,
                    'correct' => $performance['correct'],
                    'incorrect' => $performance['incorrect'],
                    'total' => $performance['total']
                ];
            }
        }
    }
    
    // Overall performance recommendation
    if ($overallAverage >= 80) {
        $recommendations[] = "Excellent performance! Keep up the great work.";
    } else if ($overallAverage >= 60) {
        if (count($weakTopics) > 0) {
            $recommendations[] = "Good overall performance, but you need to focus on improving your weak areas.";
        } else {
            $recommendations[] = "Good performance, but there's room for improvement. Continue practicing.";
        }
    } else {
        if (count($weakTopics) > 0) {
            $recommendations[] = "You need more practice. Focus on reviewing and mastering the topics where you're struggling.";
        } else {
            $recommendations[] = "You need more practice. Review all topics and retake the quizzes.";
        }
    }
    
    // Specific weak topic recommendations with detailed focus areas
    if (count($weakTopics) > 0) {
        // Sort weak topics by percentage (lowest first)
        uasort($weakTopics, function($a, $b) {
            return $a['percentage'] <=> $b['percentage'];
        });
        
        foreach ($weakTopics as $topicNum => $weakData) {
            $topicName = getTopicName($topicNum);
            $percentage = round($weakData['percentage'], 1);
            $incorrectCount = $weakData['incorrect'];
            $totalCount = $weakData['total'];
            
            // Get specific focus areas for this topic
            $focusAreas = getTopicFocusAreas($topicNum, $incorrectAnswers);
            
            $rec = "FOCUS REVIEW: " . $topicName . " (Score: " . $percentage . "%, " . $incorrectCount . " incorrect out of " . $totalCount . " questions)";
            
            if (!empty($focusAreas)) {
                $rec .= "\n   • Specific areas to review: " . implode(", ", $focusAreas);
            }
            
            // Add topic-specific study tips
            $studyTips = getTopicStudyTips($topicNum);
            if (!empty($studyTips)) {
                $rec .= "\n   • Study tips: " . $studyTips;
            }
            
            $recommendations[] = $rec;
        }
    }
    
    // Count incorrect answers per topic for additional recommendations
    if (count($incorrectAnswers) > 0) {
        $topicMistakeCount = [];
        foreach ($incorrectAnswers as $answer) {
            $topic = $answer['topic'];
            if (!isset($topicMistakeCount[$topic])) {
                $topicMistakeCount[$topic] = 0;
            }
            $topicMistakeCount[$topic]++;
        }
        
        // Find topics with most mistakes
        arsort($topicMistakeCount);
        $topTopicsWithMistakes = array_slice(array_keys($topicMistakeCount), 0, 2, true);
        
        if (count($topTopicsWithMistakes) > 0) {
            $topicsList = [];
            foreach ($topTopicsWithMistakes as $topicNum) {
                $topicsList[] = getTopicName($topicNum) . " (" . $topicMistakeCount[$topicNum] . " mistakes)";
            }
            $recommendations[] = "Priority Review: Focus most on " . implode(" and ", $topicsList) . ". Review your incorrect answers and understand the explanations.";
        }
    }
    
    // Study time recommendation
    if (count($weakTopics) > 0) {
        $recommendations[] = "Allocate extra study time for your weak topics. Spend at least 30 minutes daily reviewing the concepts you're struggling with.";
    } else {
        $recommendations[] = "Allocate regular study time. Consistent practice is more effective than cramming.";
    }
    
    return $recommendations;
}

/**
 * Get specific focus areas for a topic based on incorrect answers
 */
function getTopicFocusAreas($topicNum, $incorrectAnswers) {
    $focusAreas = [];
    $topicQuestions = [];
    
    // Collect questions from this topic
    foreach ($incorrectAnswers as $answer) {
        if ($answer['topic'] == $topicNum) {
            $topicQuestions[] = $answer['question'];
        }
    }
    
    if (empty($topicQuestions)) {
        return $focusAreas;
    }
    
    $allQuestions = implode(' ', array_map('strtolower', $topicQuestions));
    
    // Topic 1: Introduction to Functions
    if ($topicNum == 1) {
        if (stripos($allQuestions, 'function') !== false && stripos($allQuestions, 'what is') !== false) {
            $focusAreas[] = "Function definition and concept";
        }
        if (stripos($allQuestions, 'f(x)') !== false || stripos($allQuestions, 'notation') !== false) {
            $focusAreas[] = "Function notation f(x)";
        }
        if (stripos($allQuestions, 'evaluate') !== false || stripos($allQuestions, 'f(') !== false) {
            $focusAreas[] = "Evaluating functions";
        }
        if (stripos($allQuestions, 'machine') !== false) {
            $focusAreas[] = "Function machine concept";
        }
    }
    
    // Topic 2: Domain & Range
    if ($topicNum == 2) {
        if (stripos($allQuestions, 'domain') !== false) {
            $focusAreas[] = "Finding domain of functions";
        }
        if (stripos($allQuestions, 'range') !== false) {
            $focusAreas[] = "Finding range of functions";
        }
        if (stripos($allQuestions, '√') !== false || stripos($allQuestions, 'sqrt') !== false) {
            $focusAreas[] = "Domain restrictions for square roots";
        }
        if (stripos($allQuestions, '/') !== false || stripos($allQuestions, 'fraction') !== false) {
            $focusAreas[] = "Domain restrictions for rational functions";
        }
    }
    
    // Topic 3: Function Operations
    if ($topicNum == 3) {
        if (stripos($allQuestions, 'add') !== false || stripos($allQuestions, 'subtract') !== false) {
            $focusAreas[] = "Adding and subtracting functions";
        }
        if (stripos($allQuestions, 'multiply') !== false) {
            $focusAreas[] = "Multiplying functions";
        }
        if (stripos($allQuestions, 'divide') !== false) {
            $focusAreas[] = "Dividing functions";
        }
        if (stripos($allQuestions, 'operation') !== false) {
            $focusAreas[] = "Function operations in general";
        }
    }
    
    // Topic 4: Composition & Inverses
    if ($topicNum == 4) {
        if (stripos($allQuestions, 'composition') !== false || stripos($allQuestions, 'compose') !== false) {
            $focusAreas[] = "Function composition (f∘g)";
        }
        if (stripos($allQuestions, 'inverse') !== false) {
            $focusAreas[] = "Inverse functions";
        }
    }
    
    return array_unique($focusAreas);
}

/**
 * Get study tips for a specific topic
 */
function getTopicStudyTips($topicNum) {
    $tips = [
        1 => "Practice reading function notation, work through evaluation examples step-by-step, and visualize functions as machines.",
        2 => "Practice identifying restrictions (square roots need ≥ 0, fractions need denominator ≠ 0), and graph functions to see domain and range visually.",
        3 => "Practice combining functions step-by-step, work through examples of (f+g)(x), (f-g)(x), (f·g)(x), and (f/g)(x) with actual numbers.",
        4 => "Practice composition by working from inside out: find g(x) first, then plug into f. For inverses, practice swapping x and y and solving."
    ];
    
    return $tips[$topicNum] ?? "Review the lesson content, re-read examples, and practice similar problems.";
}

/**
 * Generate summary report
 */
function generateSummary($topicPerformance, $overallAverage, $strengths, $weaknesses) {
    $summary = [];
    
    $summary[] = "Overall Performance: " . $overallAverage . "%";
    
    if (count($strengths) > 0) {
        $summary[] = "Strengths: " . count($strengths) . " topics with excellent performance";
    }
    
    if (count($weaknesses) > 0) {
        $summary[] = "Areas to Improve: " . count($weaknesses) . " topics that need more practice";
    }
    
    return implode(". ", $summary);
}

/**
 * Get topic name
 */
function getTopicName($topicNum) {
    $topicNames = [
        1 => 'Topic 1: Introduction to Functions',
        2 => 'Topic 2: Domain & Range',
        3 => 'Topic 3: Function Operations',
        4 => 'Topic 4: Composition & Inverses'
    ];
    return $topicNames[$topicNum] ?? 'Topic ' . $topicNum;
}

/**
 * Identify question type from question text
 */
function identifyQuestionType($question) {
    $question = strtolower($question);
    
    if (strpos($question, 'domain') !== false || strpos($question, 'range') !== false) {
        return 'Domain & Range';
    } else if (strpos($question, 'function') !== false && strpos($question, 'notation') !== false) {
        return 'Function Notation';
    } else if (strpos($question, 'composition') !== false || strpos($question, 'compose') !== false) {
        return 'Composition';
    } else if (strpos($question, 'inverse') !== false) {
        return 'Inverse Functions';
    } else if (strpos($question, 'operation') !== false || strpos($question, 'add') !== false || strpos($question, 'subtract') !== false) {
        return 'Function Operations';
    } else {
        return 'General Functions';
    }
}

?>
