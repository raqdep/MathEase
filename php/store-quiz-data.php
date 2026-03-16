<?php
/**
 * Store Quiz Data for AI Analysis
 * Saves quiz answers and scores for Functions topic quizzes
 * 
 * DATABASE TABLE: quiz_attempts
 * 
 * IMPORTANT SEPARATION FROM /quiz FOLDER QUIZZES:
 * - This endpoint is used by topics/*.html (lesson quizzes)
 * - Quiz type format: functions_topic_1, functions_topic_2, solving_real_life_problems_lesson_1, etc.
 * - Quiz files in /quiz folder use quiz-management.php with different quiz_type values:
 *   * functions-quiz.html uses: 'functions'
 *   * evaluating-functions-quiz.html uses: 'evaluating-functions'
 *   * operations-on-functions-quiz.html uses: 'operations-on-functions'
 *   * etc.
 * - COMPLETE SEPARATION:
 *   * Topic quizzes: Complete immediately, NO 'in_progress' status, stored via store-quiz-data.php
 *   * /quiz folder quizzes: Use 'in_progress' status, managed via quiz-management.php
 *   * quiz-management.php filters out topic quiz types (those with '_topic_' or '_lesson_' in quiz_type)
 * - This ensures NO CONFLICT - quizzes in /quiz folder are NOT affected by topic quizzes
 */

// Suppress HTML error output and ensure only JSON is returned
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Start output buffering to catch any unwanted output
ob_start();

session_start();

// Clear any output that might have been generated
ob_clean();

// Set JSON header early
header('Content-Type: application/json');

// Load config after headers are set
require_once 'config.php';

// Clear any output from config.php
ob_clean();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    ob_clean();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    ob_end_flush();
    exit;
}

// Get JSON input
$raw_input = file_get_contents('php://input');
if ($raw_input === false) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Failed to read input data']);
    ob_end_flush();
    exit;
}

$input = json_decode($raw_input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    $json_error = json_last_error_msg();
    error_log("JSON decode error: $json_error. Raw input: " . substr($raw_input, 0, 500));
    ob_clean();
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid JSON input: ' . $json_error
    ]);
    ob_end_flush();
    exit;
}

if (!$input || !is_array($input)) {
    error_log("Invalid input: " . substr($raw_input, 0, 500));
    ob_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid input format']);
    ob_end_flush();
    exit;
}

// CRITICAL: Use $_SESSION['user_id'] as student_id
// This is the SAME ID used in groq-ai-performance.php to query quiz data
// IMPORTANT: session student_id is student number (string), but quiz_attempts.student_id stores user id (int)
$user_id = $_SESSION['user_id'];
$student_id = $user_id; // Use user_id so AI performance analysis can find the attempts

// Get quiz data from request
$topic = $input['topic'] ?? '';
$lesson = $input['lesson'] ?? null;
$quiz_type = $input['quiz_type'] ?? ''; // Expected format: functions_topic_1, functions_topic_2, etc.

// Validate quiz_type format matches what groq-ai-performance.php expects
if (!empty($quiz_type) && $topic === 'functions' && !preg_match('/^functions_topic_\d+$/', $quiz_type)) {
    error_log("WARNING: Quiz type format may not match query pattern. Got: $quiz_type, Expected: functions_topic_N");
}
$score = $input['score'] ?? 0;
$total_questions = $input['total_questions'] ?? 5;
$answers = $input['answers'] ?? [];
$time_taken_seconds = isset($input['time_taken_seconds']) ? max(0, (int) $input['time_taken_seconds']) : 0;

try {
    // Check database connection
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }
    
    // Create quiz_attempts table if it doesn't exist
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                quiz_type VARCHAR(100) NOT NULL,
                score INT NOT NULL DEFAULT 0,
                total_questions INT NOT NULL DEFAULT 5,
                time_taken_seconds INT DEFAULT 0,
                attempt_number INT DEFAULT 1,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                answers_data TEXT,
                INDEX idx_student_quiz (student_id, quiz_type),
                INDEX idx_completed_at (completed_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    } catch (PDOException $e) {
        // Table might already exist with different structure, try to continue
        error_log("Warning: Could not create quiz_attempts table (may already exist): " . $e->getMessage());
        // Check if table exists
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'quiz_attempts'");
        if ($tableCheck->rowCount() == 0) {
            throw new Exception("Failed to create quiz_attempts table and table does not exist");
        }
    }
    
    // CRITICAL: Ensure 'status' column exists (required for separation between /quiz and /topics quizzes)
    // Topic quizzes use 'completed' status, /quiz folder quizzes use 'in_progress' status
    try {
        $statusColumnCheck = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'status'");
        if ($statusColumnCheck->rowCount() === 0) {
            // Add status column if it doesn't exist
            $pdo->exec("ALTER TABLE quiz_attempts ADD COLUMN status VARCHAR(20) DEFAULT 'completed' AFTER quiz_type");
            error_log("✅ Added 'status' column to quiz_attempts table");
        } else {
            // Check if status column allows NULL
            $statusCol = $statusColumnCheck->fetch(PDO::FETCH_ASSOC);
            if ($statusCol['Null'] === 'YES' && $statusCol['Default'] === null) {
                // Update to have default value
                $pdo->exec("ALTER TABLE quiz_attempts MODIFY COLUMN status VARCHAR(20) DEFAULT 'completed'");
                error_log("✅ Updated 'status' column to have default value 'completed'");
            }
        }
    } catch (PDOException $e) {
        error_log("Warning: Could not check/add status column: " . $e->getMessage());
        // Continue anyway - status might already exist
    }
    
    // Check if attempt_number column exists, if not add it
    $has_attempt_number = false;
    try {
        $columnCheck = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'attempt_number'");
        $has_attempt_number = ($columnCheck->rowCount() > 0);
        
        if (!$has_attempt_number) {
            // Column doesn't exist, add it - try to add after total_questions or just at the end
            try {
                $pdo->exec("ALTER TABLE quiz_attempts ADD COLUMN attempt_number INT DEFAULT 1 AFTER total_questions");
            } catch (PDOException $e2) {
                // If AFTER fails, just add at the end
                $pdo->exec("ALTER TABLE quiz_attempts ADD COLUMN attempt_number INT DEFAULT 1");
            }
            error_log("Added attempt_number column to quiz_attempts table");
            $has_attempt_number = true;
        }
    } catch (PDOException $e) {
        error_log("Warning: Could not check/add attempt_number column: " . $e->getMessage());
        // Continue anyway, we'll handle it in the INSERT
    }
    
    // Check if answers_data column exists, if not add it
    // CRITICAL: This column is required for AI analysis - must exist!
    $has_answers_data = false;
    try {
        $columnCheck = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'answers_data'");
        $has_answers_data = ($columnCheck->rowCount() > 0);
        
        if (!$has_answers_data) {
            // Column doesn't exist, add it - try to add after completed_at or just at the end
            try {
                $pdo->exec("ALTER TABLE quiz_attempts ADD COLUMN answers_data TEXT NULL AFTER completed_at");
                error_log("✅ Successfully added answers_data column to quiz_attempts table (after completed_at)");
                $has_answers_data = true;
            } catch (PDOException $e2) {
                // If AFTER fails, try adding at the end
                try {
                    $pdo->exec("ALTER TABLE quiz_attempts ADD COLUMN answers_data TEXT NULL");
                    error_log("✅ Successfully added answers_data column to quiz_attempts table (at end)");
                    $has_answers_data = true;
                } catch (PDOException $e3) {
                    // If both fail, this is a critical error
                    error_log("❌ CRITICAL ERROR: Could not add answers_data column. Error 1: " . $e2->getMessage() . ", Error 2: " . $e3->getMessage());
                    throw new Exception("Failed to add answers_data column to quiz_attempts table. This column is required for AI analysis. Please run php/setup-ai-tables.php or manually add the column.");
                }
            }
        } else {
            error_log("✅ answers_data column already exists in quiz_attempts table");
        }
    } catch (PDOException $e) {
        error_log("❌ CRITICAL ERROR: Could not check/add answers_data column: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        // Don't continue if we can't ensure answers_data column exists
        ob_clean();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database error: Could not ensure answers_data column exists. This column is required for AI analysis.',
            'error' => 'MISSING_COLUMN',
            'details' => $e->getMessage()
        ]);
        ob_end_flush();
        exit;
    }
    
    // Final verification - ensure column exists before proceeding
    if (!$has_answers_data) {
        error_log("❌ CRITICAL: answers_data column check failed - column does not exist and could not be added");
        ob_clean();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Critical error: answers_data column is missing. Please run php/setup-ai-tables.php to fix this.',
            'error' => 'MISSING_COLUMN_CRITICAL'
        ]);
        ob_end_flush();
        exit;
    }
    
    // Check if time_taken_seconds column exists, if not check for completion_time and add time_taken_seconds
    $has_time_taken_seconds = false;
    try {
        $columnCheck = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'time_taken_seconds'");
        $has_time_taken_seconds = ($columnCheck->rowCount() > 0);
        
        if (!$has_time_taken_seconds) {
            // Check if completion_time exists
            $completionTimeCheck = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'completion_time'");
            if ($completionTimeCheck->rowCount() > 0) {
                // Use completion_time column name instead
                $has_time_taken_seconds = false; // We'll use completion_time
            } else {
                // Add time_taken_seconds column
                $pdo->exec("ALTER TABLE quiz_attempts ADD COLUMN time_taken_seconds INT DEFAULT 0 AFTER total_questions");
                error_log("Added time_taken_seconds column to quiz_attempts table");
                $has_time_taken_seconds = true;
            }
        }
    } catch (PDOException $e) {
        error_log("Warning: Could not check/add time_taken_seconds column: " . $e->getMessage());
    }
    
    // Get attempt number for this quiz type
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as attempt_count 
        FROM quiz_attempts 
        WHERE student_id = ? AND quiz_type = ?
    ");
    $stmt->execute([$student_id, $quiz_type]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $attempt_number = ($result['attempt_count'] ?? 0) + 1;
    
    // Validate and ensure answers data is properly formatted
    if (empty($answers) || !is_array($answers)) {
        error_log("WARNING: Empty or invalid answers array for quiz_type: $quiz_type, student_id: $student_id");
        // Don't set to empty - this is a critical error, we need answers for AI analysis
        ob_clean();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Answers data is required for AI analysis. Please retake the quiz.',
            'error' => 'MISSING_ANSWERS'
        ]);
        ob_end_flush();
        exit;
    }
    
    // Validate that answers array has the expected structure
    $validAnswers = [];
    foreach ($answers as $index => $answer) {
        if (is_array($answer) && isset($answer['question'])) {
            // Ensure all required fields exist
            $validAnswer = [
                'question' => $answer['question'] ?? "Question " . ($index + 1),
                'options' => $answer['options'] ?? [],
                'selected' => isset($answer['selected']) ? (int) $answer['selected'] : -1,
                'selectedText' => $answer['selectedText'] ?? 'N/A',
                'correct' => isset($answer['correct']) ? (int) $answer['correct'] : -1,
                'correctText' => $answer['correctText'] ?? 'N/A',
                'isCorrect' => isset($answer['isCorrect']) ? (bool) $answer['isCorrect'] : false,
                'explanation' => $answer['explanation'] ?? '' // Include explanation if available
            ];
            $validAnswers[] = $validAnswer;
        } else {
            error_log("WARNING: Invalid answer format at index $index for quiz_type: $quiz_type");
        }
    }
    
    if (empty($validAnswers)) {
        error_log("ERROR: No valid answers found after validation for quiz_type: $quiz_type, student_id: $student_id");
        ob_clean();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'No valid answers found. Please retake the quiz.',
            'error' => 'INVALID_ANSWERS'
        ]);
        ob_end_flush();
        exit;
    }
    
    // Validate and encode answers data FIRST (before building INSERT)
    $answers_json = json_encode($validAnswers, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
    if ($answers_json === false) {
        $json_error = json_last_error_msg();
        error_log("JSON encoding failed: $json_error");
        throw new Exception("Failed to encode answers data: $json_error");
    }
    
    // Store quiz attempt with topic information
    // Build INSERT statement based on available columns
    // CRITICAL: Topic quizzes should always have 'completed' status (not 'in_progress')
    // This ensures they don't conflict with /quiz folder quizzes which use 'in_progress'
    $columns = ['student_id', 'quiz_type', 'score', 'total_questions', 'status'];
    $placeholders = ['?', '?', '?', '?', '?'];
    $values = [$student_id, $quiz_type, $score, $total_questions, 'completed'];
    
    // Add attempt_number if column exists (already checked above)
    if ($has_attempt_number) {
        $columns[] = 'attempt_number';
        $placeholders[] = '?';
        $values[] = $attempt_number;
    }
    
    // Add answers_data if column exists (already checked above)
    if ($has_answers_data) {
        $columns[] = 'answers_data';
        $placeholders[] = '?';
        $values[] = $answers_json;
    }
    
    // Add time_taken_seconds or completion_time
    $time_column = null;
    try {
        $columnCheck = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'time_taken_seconds'");
        if ($columnCheck->rowCount() > 0) {
            $time_column = 'time_taken_seconds';
        } else {
            $columnCheck = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'completion_time'");
            if ($columnCheck->rowCount() > 0) {
                $time_column = 'completion_time';
            }
        }
    } catch (PDOException $e) {
        // Column check failed
    }
    
    if ($time_column) {
        $columns[] = $time_column;
        $placeholders[] = '?';
        $values[] = $time_taken_seconds;
    }
    
    // Validate data types before insertion
    $student_id = (int)$student_id;
    $score = (int)$score;
    $total_questions = (int)$total_questions;
    $attempt_number = (int)$attempt_number;
    $time_taken_seconds = (int)$time_taken_seconds;
    
    // Ensure quiz_type is not too long
    if (strlen($quiz_type) > 100) {
        $quiz_type = substr($quiz_type, 0, 100);
    }
    
    $sql = "INSERT INTO quiz_attempts (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
    $stmt = $pdo->prepare($sql);
    
    // Log for debugging - CRITICAL for troubleshooting
    error_log("=== STORING QUIZ DATA ===");
    error_log("student_id: $student_id");
    error_log("user_id: $user_id");
    error_log("Topic: $topic");
    error_log("Quiz Type: $quiz_type");
    error_log("Score: $score/$total_questions");
    error_log("Valid Answers count: " . count($validAnswers));
    error_log("Answers JSON length: " . strlen($answers_json) . " characters");
    error_log("SQL: $sql");
    error_log("Columns: " . implode(', ', $columns));
    error_log("Values count: " . count($values));
    error_log("Values (sanitized): " . json_encode(array_map(function($v) {
        if (is_string($v) && strlen($v) > 100) {
            return substr($v, 0, 100) . '... (truncated)';
        }
        return $v;
    }, $values)));
    
    try {
        $result = $stmt->execute($values);
        error_log("Execute result: " . ($result ? 'SUCCESS' : 'FAILED'));
        
        if (!$result) {
            $errorInfo = $stmt->errorInfo();
            error_log("SQL Error Info: " . json_encode($errorInfo));
            throw new Exception('Failed to execute INSERT: ' . ($errorInfo[2] ?? 'Unknown error'));
        }
        
        $attempt_id = $pdo->lastInsertId();
        error_log("Insert ID: $attempt_id");
        
        if (!$attempt_id) {
            error_log("ERROR: No insert ID returned - INSERT may have failed");
            throw new Exception('Failed to get insert ID after storing quiz data');
        }
        
        error_log("✅ Quiz data stored successfully with attempt_id: $attempt_id");
    } catch (PDOException $e) {
        error_log("❌ PDO Exception during INSERT: " . $e->getMessage());
        error_log("PDO Error Code: " . $e->getCode());
        error_log("PDO Error Info: " . json_encode($e->errorInfo ?? []));
        throw $e;
    }
    
    // Verify the data was stored correctly
    error_log("=== VERIFYING STORED DATA ===");
    $verifyColumns = ['id', 'student_id', 'quiz_type', 'score', 'total_questions', 'completed_at'];
    if ($has_answers_data) {
        $verifyColumns[] = 'answers_data';
        $verifyColumns[] = 'LENGTH(answers_data) as answers_length';
    }
    
    $verifySql = "SELECT " . implode(', ', $verifyColumns) . " FROM quiz_attempts WHERE id = ?";
    error_log("Verification SQL: $verifySql");
    $verifyStmt = $pdo->prepare($verifySql);
    $verifyStmt->execute([$attempt_id]);
    $stored = $verifyStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$stored) {
        error_log("❌ ERROR: Could not verify stored quiz data - record not found with id: $attempt_id");
        throw new Exception('Failed to verify stored quiz data - record not found');
    }
    
    error_log("✅ Verification successful:");
    error_log("  - Stored student_id: " . ($stored['student_id'] ?? 'N/A'));
    error_log("  - Stored quiz_type: " . ($stored['quiz_type'] ?? 'N/A'));
    error_log("  - Stored score: " . ($stored['score'] ?? 'N/A') . "/" . ($stored['total_questions'] ?? 'N/A'));
    error_log("  - Expected student_id: $student_id");
    error_log("  - Expected quiz_type: $quiz_type");
    
    // Check if student_id matches
    if (isset($stored['student_id']) && $stored['student_id'] != $student_id) {
        error_log("⚠️ WARNING: Stored student_id (" . $stored['student_id'] . ") does not match expected ($student_id)");
    }
    
    // Check if quiz_type matches
    if (isset($stored['quiz_type']) && $stored['quiz_type'] != $quiz_type) {
        error_log("⚠️ WARNING: Stored quiz_type (" . $stored['quiz_type'] . ") does not match expected ($quiz_type)");
    }
    
    $answersCount = 0;
    if ($has_answers_data && isset($stored['answers_data'])) {
        $storedAnswers = json_decode($stored['answers_data'], true);
        $answersCount = is_array($storedAnswers) ? count($storedAnswers) : 0;
        
        if ($answersCount === 0) {
            error_log("ERROR: Stored answers_data is empty or invalid for attempt_id: $attempt_id");
            throw new Exception('Answers data was not stored correctly');
        }
        
        // Additional verification: check that answers can be decoded and have required fields
        foreach ($storedAnswers as $idx => $ans) {
            if (!isset($ans['question']) || !isset($ans['selected']) || !isset($ans['correct'])) {
                error_log("WARNING: Answer at index $idx is missing required fields");
            }
        }
        
        $answersLength = isset($stored['answers_length']) ? $stored['answers_length'] : strlen($stored['answers_data']);
        error_log("✅ SUCCESS: Verified stored quiz - ID: $attempt_id, Quiz Type: $quiz_type, Answers stored: $answersCount, JSON length: " . $answersLength . " bytes");
        error_log("✅ AI can now analyze this quiz attempt - answers_data is properly stored");
    } else {
        if (!$has_answers_data) {
            error_log("❌ CRITICAL ERROR: answers_data column does not exist - AI cannot analyze this quiz!");
            error_log("❌ Quiz attempt saved but WITHOUT answers_data - student_id: $student_id, quiz_type: $quiz_type");
            throw new Exception('Critical: answers_data column is missing. Quiz was saved but AI cannot analyze it. Please run php/setup-ai-tables.php');
        } else {
            error_log("❌ WARNING: answers_data column exists but data was not stored - attempt_id: $attempt_id");
            error_log("❌ Quiz attempt saved but WITHOUT answers_data - AI cannot analyze this quiz!");
            throw new Exception('Answers data was not stored - answers_data column exists but is empty');
        }
    }
    
    // Clear any output before sending JSON
    ob_clean();
    
    echo json_encode([
        'success' => true,
        'message' => 'Quiz data and answers stored successfully for AI analysis',
        'attempt_id' => $attempt_id,
        'topic' => $topic,
        'quiz_type' => $quiz_type,
        'answers_stored' => $answersCount,
        'verified' => true
    ]);
    
    // End output buffering and send
    ob_end_flush();
    exit;
    
} catch (PDOException $e) {
    // Clear any output
    ob_clean();
    
    error_log("Store Quiz Data PDO Error: " . $e->getMessage());
    error_log("PDO Error Code: " . $e->getCode());
    error_log("PDO Error Info: " . print_r($e->errorInfo ?? [], true));
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage(),
        'error' => 'PDO_EXCEPTION',
        'error_code' => $e->getCode()
    ]);
    
    ob_end_flush();
    exit;
    
} catch (Exception $e) {
    // Clear any output
    ob_clean();
    
    error_log("Store Quiz Data Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to store quiz data: ' . $e->getMessage(),
        'error' => 'GENERAL_EXCEPTION'
    ]);
    
    ob_end_flush();
    exit;
}
?>
