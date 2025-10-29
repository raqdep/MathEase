<?php
session_start();
require_once 'config.php';

// Prevent caching - always get fresh data from database
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

class QuizManager {
    private $pdo;
    
    public function __construct() {
        global $pdo;
        $this->pdo = $pdo;
        
        // Check if database connection is valid
        if (!$this->pdo) {
            throw new Exception("Database connection not available");
        }
    }
    
    // Check for existing quiz attempt
    public function checkExistingAttempt($studentId, $quizType) {
        try {
            // First check for in-progress attempts
            $stmt = $this->pdo->prepare("
                SELECT id, completion_time, status, started_at
                FROM quiz_attempts 
                WHERE student_id = ? AND quiz_type = ? AND status = 'in_progress'
                ORDER BY started_at DESC 
                LIMIT 1
            ");
            $stmt->execute([$studentId, $quizType]);
            $attempt = $stmt->fetch();
            
            if ($attempt) {
                return [
                    'success' => true,
                    'attempt' => [
                        'attempt_id' => $attempt['id'],
                        'completion_time' => $attempt['completion_time'],
                        'status' => $attempt['status'],
                        'started_at' => $attempt['started_at']
                    ]
                ];
            }
            
            // If no in-progress attempt, check if there are any completed attempts that haven't been reset
            $completedStmt = $this->pdo->prepare("
                SELECT id, completion_time, status, started_at
                FROM quiz_attempts 
                WHERE student_id = ? AND quiz_type = ? AND status = 'completed'
                ORDER BY completed_at DESC 
                LIMIT 1
            ");
            $completedStmt->execute([$studentId, $quizType]);
            $completedAttempt = $completedStmt->fetch();
            
            if ($completedAttempt) {
                // Student has completed this quiz and it hasn't been reset
                return [
                    'success' => true,
                    'attempt' => [
                        'attempt_id' => $completedAttempt['id'],
                        'completion_time' => $completedAttempt['completion_time'],
                        'status' => $completedAttempt['status'],
                        'started_at' => $completedAttempt['started_at']
                    ]
                ];
            }
            
            // No existing attempts found
            return [
                'success' => true,
                'attempt' => null
            ];
        } catch (Exception $e) {
            error_log("Error checking existing attempt: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to check existing attempt'
            ];
        }
    }

    // Get saved quiz answers
    public function getQuizAnswers($attemptId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT question_number, student_answer 
                FROM quiz_answers 
                WHERE attempt_id = ?
            ");
            $stmt->execute([$attemptId]);
            $answers = $stmt->fetchAll();
            
            $answerMap = [];
            foreach ($answers as $answer) {
                $questionNumber = $answer['question_number'];
                $studentAnswer = $answer['student_answer'];
                
                // Convert question number to frontend format
                if ($questionNumber >= 1 && $questionNumber <= 10) {
                    // Multiple choice questions: q1, q2, q3, etc.
                    $answerMap["q{$questionNumber}"] = $studentAnswer;
                } elseif ($questionNumber == 11) {
                    // Problem solving question: ps-answer
                    $answerMap['ps-answer'] = $studentAnswer;
                } else {
                    // Skip invalid question numbers (like 0)
                    error_log("Skipping invalid question number: $questionNumber");
                }
            }
            
            error_log("Quiz answers retrieved for attempt $attemptId: " . json_encode($answerMap));
            
            return [
                'success' => true,
                'answers' => $answerMap
            ];
        } catch (Exception $e) {
            error_log("Error getting quiz answers: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get quiz answers'
            ];
        }
    }

    // Save quiz progress
    public function saveQuizProgress($attemptId, $answers, $completionTime) {
        try {
            $this->pdo->beginTransaction();
            
            // Update completion time
            $stmt = $this->pdo->prepare("
                UPDATE quiz_attempts 
                SET completion_time = ? 
                WHERE id = ?
            ");
            $stmt->execute([$completionTime, $attemptId]);
            
            // Save/update answers
            foreach ($answers as $questionKey => $answer) {
                // Normalize question key to numeric question number and determine type
                $questionType = 'multiple_choice';
                $questionNumber = null;
                if ($questionKey === 'ps-answer') {
                    $questionType = 'problem_solving';
                    $questionNumber = 11; // Convert to numeric for database
                } elseif (preg_match('/^q(\d{1,2})$/', (string)$questionKey, $m)) {
                    $questionNumber = (int)$m[1];
                } else {
                    // Skip unknown keys to avoid inserting invalid question numbers
                    error_log("Skipping unknown answer key: " . $questionKey);
                    continue;
                }
                
                // Check if answer already exists
                $checkStmt = $this->pdo->prepare("
                    SELECT id FROM quiz_answers 
                    WHERE attempt_id = ? AND question_number = ?
                ");
                $checkStmt->execute([$attemptId, $questionNumber]);
                $existing = $checkStmt->fetch();
                
                if ($existing) {
                    // Update existing answer
                    $stmt = $this->pdo->prepare("
                        UPDATE quiz_answers 
                        SET student_answer = ? 
                        WHERE attempt_id = ? AND question_number = ?
                    ");
                    $stmt->execute([$answer, $attemptId, $questionNumber]);
                } else {
                    // Insert new answer
                    $stmt = $this->pdo->prepare("
                        INSERT INTO quiz_answers (attempt_id, question_number, question_type, student_answer) 
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmt->execute([$attemptId, $questionNumber, $questionType, $answer]);
                }
            }
            
            $this->pdo->commit();
            
            return [
                'success' => true,
                'message' => 'Progress saved successfully'
            ];
        } catch (Exception $e) {
            $this->pdo->rollBack();
            error_log("Error saving quiz progress: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to save progress'
            ];
        }
    }

    // Start a new quiz attempt
    public function startQuiz($studentId, $quizType) {
        try {
            error_log("Starting quiz - Student ID: $studentId, Quiz Type: $quizType");
            
            // Validate quiz type
            if (empty($quizType)) {
                error_log("Error: Quiz type is empty or null");
                return [
                    'success' => false,
                    'message' => 'Quiz type is required'
                ];
            }
            
            // First, verify that the student exists
            $checkStmt = $this->pdo->prepare("SELECT id FROM users WHERE id = ?");
            $checkStmt->execute([$studentId]);
            $user = $checkStmt->fetch();
            
            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'Student not found. Please log in again.'
                ];
            }
            
            // Check if there's already an in-progress attempt
            $existingStmt = $this->pdo->prepare("
                SELECT id, quiz_type FROM quiz_attempts 
                WHERE student_id = ? AND status = 'in_progress'
            ");
            $existingStmt->execute([$studentId]);
            $existing = $existingStmt->fetch();
            
            if ($existing) {
                error_log("Found existing in-progress attempt - ID: " . $existing['id'] . ", Quiz Type: " . $existing['quiz_type']);
                // Check if it's the same quiz type
                if ($existing['quiz_type'] === $quizType) {
                    return [
                        'success' => false,
                        'message' => 'You already have a quiz attempt in progress. Please complete it first.'
                    ];
                } else {
                    error_log("Different quiz type in progress - Existing: " . $existing['quiz_type'] . ", Requested: $quizType");
                    return [
                        'success' => false,
                        'message' => 'You have a different quiz in progress. Please complete it first.'
                    ];
                }
            }
            
            $stmt = $this->pdo->prepare("
                INSERT INTO quiz_attempts (student_id, quiz_type, status) 
                VALUES (?, ?, 'in_progress')
            ");
            $result = $stmt->execute([$studentId, $quizType]);
            
            if (!$result) {
                error_log("Failed to insert quiz attempt - SQL error: " . json_encode($stmt->errorInfo()));
                return [
                    'success' => false,
                    'message' => 'Failed to create quiz attempt'
                ];
            }
            
            $attemptId = $this->pdo->lastInsertId();
            error_log("Quiz attempt created - ID: $attemptId");
            
            if (!$attemptId || $attemptId == 0) {
                error_log("Invalid attempt ID returned: $attemptId");
                return [
                    'success' => false,
                    'message' => 'Failed to get valid attempt ID'
                ];
            }
            
            // Verify the quiz type was stored correctly
            $verifyStmt = $this->pdo->prepare("SELECT quiz_type FROM quiz_attempts WHERE id = ?");
            $verifyStmt->execute([$attemptId]);
            $storedQuizType = $verifyStmt->fetchColumn();
            error_log("Quiz attempt verified - ID: $attemptId, Stored Quiz Type: $storedQuizType");
            
            return [
                'success' => true,
                'attempt_id' => $attemptId,
                'message' => 'Quiz started successfully'
            ];
        } catch (Exception $e) {
            error_log("Error starting quiz: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to start quiz: ' . $e->getMessage()
            ];
        }
    }
    
    // Submit quiz results
    public function submitQuiz($attemptId, $answers, $completionTime) {
        try {
            $this->pdo->beginTransaction();
            
            // Get the attempt details
            $stmt = $this->pdo->prepare("
                SELECT student_id, quiz_type FROM quiz_attempts WHERE id = ?
            ");
            $stmt->execute([$attemptId]);
            $attempt = $stmt->fetch();
            
            if (!$attempt) {
                throw new Exception("Quiz attempt not found");
            }
            
            $quizType = $attempt['quiz_type'];
            error_log("Processing quiz submission - Attempt ID: $attemptId, Quiz Type: $quizType");
            $score = 0;
            $correctAnswers = 0;
            $incorrectAnswers = 0;
            $totalQuestions = 0;
            
            // Handle different quiz types
            if ($quizType === 'evaluating-functions') {
                // Evaluating Functions Quiz: 10 questions (8 multiple choice + 2 problem solving)
                $totalQuestions = 10;
                
                // Process multiple choice answers (questions 1-8)
                for ($i = 1; $i <= 8; $i++) {
                    if (isset($answers["q$i"])) {
                        $studentAnswer = $answers["q$i"];
                        $correctAnswer = $this->getEvaluatingFunctionsCorrectAnswer($i);
                        $isCorrect = ($studentAnswer === $correctAnswer);
                        
                        if ($isCorrect) {
                            $score += 1;
                            $correctAnswers++;
                        } else {
                            $incorrectAnswers++;
                        }
                        
                        // Store individual answer
                        $this->storeAnswer($attemptId, $i, 'multiple_choice', $studentAnswer, $correctAnswer, $isCorrect, $isCorrect ? 1 : 0);
                    }
                }
                
                // Process problem solving answers (questions 9-10)
                $psScore = $this->calculateEvaluatingFunctionsProblemSolvingScore($answers);
                $score += $psScore;
                
                // Store problem solving answers
                $this->storeEvaluatingFunctionsProblemSolvingAnswers($attemptId, $answers, $psScore);
                
            } else if ($quizType === 'operations-on-functions') {
                // Operations on Functions Quiz: 15 points (10 multiple choice + 1 problem solving worth 5 points)
                $totalQuestions = 15;
                
                // Process multiple choice answers (questions 1-10)
                for ($i = 1; $i <= 10; $i++) {
                    if (isset($answers["q$i"])) {
                        $studentAnswer = $answers["q$i"];
                        $correctAnswer = $this->getOperationsOnFunctionsCorrectAnswer($i);
                        $isCorrect = ($studentAnswer === $correctAnswer);
                        
                        if ($isCorrect) {
                            $score += 1;
                            $correctAnswers++;
                        } else {
                            $incorrectAnswers++;
                        }
                        
                        // Store individual answer
                        $this->storeAnswer($attemptId, $i, 'multiple_choice', $studentAnswer, $correctAnswer, $isCorrect, $isCorrect ? 1 : 0);
                    }
                }
                
                // Process problem solving answers (question 11)
                $psScore = $this->calculateOperationsOnFunctionsProblemSolvingScore($answers);
                $score += $psScore;
                
                // Count problem solving as correct/incorrect
                if ($psScore >= 5) {
                    $correctAnswers++;
                } else {
                    $incorrectAnswers++;
                }
                
                // Store problem solving answers
                $this->storeOperationsOnFunctionsProblemSolvingAnswers($attemptId, $answers, $psScore);
                
            } else if ($quizType === 'rational-functions') {
                // Rational Functions Quiz: 11 questions (10 multiple choice + 1 problem solving)
                $totalQuestions = 11;
                error_log("Processing rational-functions quiz - Attempt ID: $attemptId, Answers: " . json_encode($answers));
                
                // Process multiple choice answers (questions 1-10)
                for ($i = 1; $i <= 10; $i++) {
                    if (isset($answers["q$i"])) {
                        $studentAnswer = $answers["q$i"];
                        $correctAnswer = $this->getRationalFunctionsCorrectAnswer($i);
                        $isCorrect = ($studentAnswer === $correctAnswer);
                        
                        error_log("Question $i: Student: $studentAnswer, Correct: $correctAnswer, IsCorrect: " . ($isCorrect ? 'YES' : 'NO'));
                        
                        if ($isCorrect) {
                            $score += 1;
                            $correctAnswers++;
                        } else {
                            $incorrectAnswers++;
                        }
                        
                        // Store individual answer
                        $this->storeAnswer($attemptId, $i, 'multiple_choice', $studentAnswer, $correctAnswer, $isCorrect, $isCorrect ? 1 : 0);
                    }
                }
                
                // Process problem solving answer (question 11)
                $psScore = $this->calculateRationalFunctionsProblemSolvingScore($answers);
                $score += $psScore;
                
                error_log("Problem solving score: $psScore, Total score so far: $score");
                
                // Count problem solving as correct/incorrect
                if ($psScore >= 1) {
                    $correctAnswers++;
                } else {
                    $incorrectAnswers++;
                }
                
                // Store problem solving answer
                $this->storeRationalFunctionsProblemSolvingAnswer($attemptId, $answers, $psScore);
                
                error_log("Final rational-functions score: $score, Correct: $correctAnswers, Incorrect: $incorrectAnswers, Total: $totalQuestions");
                
            } else if ($quizType === 'functions') {
                // Functions Quiz: 15 points (10 multiple choice + 1 problem solving worth 5 points)
                $totalQuestions = 15;
                
                // Process multiple choice answers (questions 1-10)
                for ($i = 1; $i <= 10; $i++) {
                    if (isset($answers["q$i"])) {
                        $studentAnswer = $answers["q$i"];
                        $correctAnswer = $this->getCorrectAnswer($i);
                        $isCorrect = ($studentAnswer === $correctAnswer);
                        
                        if ($isCorrect) {
                            $score += 1;
                            $correctAnswers++;
                        } else {
                            $incorrectAnswers++;
                        }
                        
                        // Store individual answer
                        $this->storeAnswer($attemptId, $i, 'multiple_choice', $studentAnswer, $correctAnswer, $isCorrect, $isCorrect ? 1 : 0);
                    }
                }
                
                // Process problem solving answers (question 11)
                $psScore = $this->calculateProblemSolvingScore($answers);
                $score += $psScore;
                
                // Count problem solving as correct/incorrect
                if ($psScore >= 5) {
                    $correctAnswers++;
                } else {
                    $incorrectAnswers++;
                }
                
                // Store problem solving answers
                $this->storeProblemSolvingAnswers($attemptId, $answers, $psScore);
                
            } else if ($quizType === 'real-life-problems') {
                // Real-Life Problems Quiz: 15 points (10 multiple choice + 1 problem solving worth 5 points)
                $totalQuestions = 15;
                
                // Process multiple choice answers (questions 1-10)
                for ($i = 1; $i <= 10; $i++) {
                    if (isset($answers["q$i"])) {
                        $studentAnswer = $answers["q$i"];
                        $correctAnswer = $this->getRealLifeProblemsCorrectAnswer($i);
                        $isCorrect = ($studentAnswer === $correctAnswer);
                        
                        if ($isCorrect) {
                            $score += 1;
                            $correctAnswers++;
                        } else {
                            $incorrectAnswers++;
                        }
                        
                        // Store individual answer
                        $this->storeAnswer($attemptId, $i, 'multiple_choice', $studentAnswer, $correctAnswer, $isCorrect, $isCorrect ? 1 : 0);
                    }
                }
                
                // Process problem solving answers (question 11)
                $psScore = $this->calculateRealLifeProblemsProblemSolvingScore($answers);
                $score += $psScore;
                
                // Count problem solving as correct/incorrect
                if ($psScore >= 5) {
                    $correctAnswers++;
                } else {
                    $incorrectAnswers++;
                }
                
                // Store problem solving answers
                $this->storeRealLifeProblemsProblemSolvingAnswers($attemptId, $answers, $psScore);
                
            } else {
                // Unknown quiz type - log error and use default functions quiz logic
                error_log("Unknown quiz type: $quizType, using default functions quiz logic");
                $totalQuestions = 15;
                
                // Process multiple choice answers (questions 1-10)
                for ($i = 1; $i <= 10; $i++) {
                    if (isset($answers["q$i"])) {
                        $studentAnswer = $answers["q$i"];
                        $correctAnswer = $this->getCorrectAnswer($i);
                        $isCorrect = ($studentAnswer === $correctAnswer);
                        
                        if ($isCorrect) {
                            $score += 1;
                            $correctAnswers++;
                        } else {
                            $incorrectAnswers++;
                        }
                        
                        // Store individual answer
                        $this->storeAnswer($attemptId, $i, 'multiple_choice', $studentAnswer, $correctAnswer, $isCorrect, $isCorrect ? 1 : 0);
                    }
                }
                
                // Process problem solving answers (question 11)
                $psScore = $this->calculateProblemSolvingScore($answers);
                $score += $psScore;
                
                // Count problem solving as correct/incorrect
                if ($psScore >= 5) {
                    $correctAnswers++;
                } else {
                    $incorrectAnswers++;
                }
                
                // Store problem solving answers
                $this->storeProblemSolvingAnswers($attemptId, $answers, $psScore);
            }
            
            // Update quiz attempt with explicit status
            $stmt = $this->pdo->prepare("
                UPDATE quiz_attempts 
                SET score = ?, correct_answers = ?, incorrect_answers = ?, total_questions = ?,
                    completion_time = ?, completed_at = CURRENT_TIMESTAMP, status = 'completed'
                WHERE id = ?
            ");
            $stmt->execute([$score, $correctAnswers, $incorrectAnswers, $totalQuestions, $completionTime, $attemptId]);
            
            // Verify the status was set correctly
            $verifyStmt = $this->pdo->prepare("SELECT status FROM quiz_attempts WHERE id = ?");
            $verifyStmt->execute([$attemptId]);
            $actualStatus = $verifyStmt->fetchColumn();
            
            // Ensure status is properly set
            if ($actualStatus !== 'completed') {
                error_log("Warning: Status not set to 'completed' for attempt $attemptId. Current status: $actualStatus");
                // Force update the status
                $forceStmt = $this->pdo->prepare("UPDATE quiz_attempts SET status = 'completed' WHERE id = ?");
                $forceStmt->execute([$attemptId]);
            }
            
            error_log("Quiz submission completed - Attempt ID: $attemptId, Status: $actualStatus, Score: $score");
            
        // Badge awarding is now handled by the frontend through badge-management.php
            
            $this->pdo->commit();
            
            // Generate detailed results
            $detailedResults = $this->generateDetailedResults($answers, $score, $correctAnswers, $incorrectAnswers, $quizType);
            
            return [
                'success' => true,
                'score' => $score,
                'total_questions' => $totalQuestions,
                'correct_answers' => $correctAnswers,
                'incorrect_answers' => $incorrectAnswers,
                'completion_time' => $completionTime,
                'detailedResults' => $detailedResults,
                'message' => 'Quiz submitted successfully'
            ];
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            error_log("Error submitting quiz: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to submit quiz'
            ];
        }
    }
    
    // Generate detailed results for quiz submission
    private function generateDetailedResults($answers, $score, $correctAnswers, $incorrectAnswers, $quizType = 'functions') {
        $detailedResults = '';
        
        if ($quizType === 'evaluating-functions') {
            // Evaluating Functions Quiz results
            $correctAnswersData = [
                'q1' => 'a', 'q2' => 'b', 'q3' => 'c', 'q4' => 'a', 'q5' => 'b',
                'q6' => 'c', 'q7' => 'a', 'q8' => 'b'
            ];
            
            // Generate detailed results for multiple choice questions (1-8)
            for ($i = 1; $i <= 8; $i++) {
                $questionKey = "q{$i}";
                $selected = $answers[$questionKey] ?? '';
                $correct = $correctAnswersData[$questionKey];
                
                if ($selected) {
                    if ($selected === $correct) {
                        $detailedResults .= "
                            <div class=\"bg-green-50 border-l-4 border-green-500 p-4 rounded-lg\">
                                <div class=\"flex items-center justify-between\">
                                    <div>
                                        <h4 class=\"font-semibold text-green-800\">Question {$i} ✓</h4>
                                        <p class=\"text-sm text-green-700\">Correct! (+1 point)</p>
                                    </div>
                                    <i class=\"fas fa-check-circle text-green-500 text-xl\"></i>
                                </div>
                            </div>
                        ";
                    } else {
                        $detailedResults .= "
                            <div class=\"bg-red-50 border-l-4 border-red-500 p-4 rounded-lg\">
                                <div class=\"flex items-center justify-between\">
                                    <div>
                                        <h4 class=\"font-semibold text-red-800\">Question {$i} ✗</h4>
                                        <p class=\"text-sm text-red-700\">Incorrect. Your answer: " . strtoupper($selected) . "</p>
                                        <p class=\"text-sm text-red-600\">Correct answer: " . strtoupper($correct) . "</p>
                                    </div>
                                    <i class=\"fas fa-times-circle text-red-500 text-xl\"></i>
                                </div>
                            </div>
                        ";
                    }
                } else {
                    $detailedResults .= "
                        <div class=\"bg-gray-50 border-l-4 border-gray-500 p-4 rounded-lg\">
                            <div class=\"flex items-center justify-between\">
                                <div>
                                    <h4 class=\"font-semibold text-gray-800\">Question {$i} -</h4>
                                    <p class=\"text-sm text-gray-700\">Not answered</p>
                                    <p class=\"text-sm text-gray-600\">Correct answer: " . strtoupper($correct) . "</p>
                                </div>
                                <i class=\"fas fa-question-circle text-gray-500 text-xl\"></i>
                            </div>
                        </div>
                    ";
                }
            }
            
            // Generate detailed results for problem solving (questions 9-10)
            $psScore = 0;
            $psDetails = '';
            
            // Question 9
            $ps9 = intval($answers['ps-9'] ?? 0);
            if (abs($ps9 - 25) <= 5) {
                $psScore += 1;
                $psDetails .= '<p class="text-sm text-green-700">Question 9: Correct! (+1 point)</p>';
            } else {
                $psDetails .= "<p class=\"text-sm text-red-700\">Question 9: Incorrect. Your answer: {$ps9}, Correct: 25</p>";
            }
            
            // Question 10
            $ps10 = intval($answers['ps-10'] ?? 0);
            if (abs($ps10 - 15) <= 3) {
                $psScore += 1;
                $psDetails .= '<p class="text-sm text-green-700">Question 10: Correct! (+1 point)</p>';
            } else {
                $psDetails .= "<p class=\"text-sm text-red-700\">Question 10: Incorrect. Your answer: {$ps10}, Correct: 15</p>";
            }
            
            $detailedResults .= "
                <div class=\"bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg\">
                    <div class=\"flex items-center justify-between\">
                        <div>
                            <h4 class=\"font-semibold text-orange-800\">Problem Solving</h4>
                            <p class=\"text-sm text-orange-700\">Score: {$psScore}/2 points</p>
                            {$psDetails}
                        </div>
                        <i class=\"fas fa-calculator text-orange-500 text-xl\"></i>
                    </div>
                </div>
            ";
            
        } else {
            // Default Functions Quiz results
            $correctAnswersData = [
                'q1' => 'a', 'q2' => 'b', 'q3' => 'a', 'q4' => 'b', 'q5' => 'b',
                'q6' => 'a', 'q7' => 'b', 'q8' => 'b', 'q9' => 'a', 'q10' => 'a'
            ];
            
            // Problem solving correct answers
            $problemSolvingAnswers = ['ps-a' => 450, 'ps-b' => 10, 'ps-c' => 100];
            
            // Generate detailed results for multiple choice questions
            for ($i = 1; $i <= 10; $i++) {
                $questionKey = "q{$i}";
                $selected = $answers[$questionKey] ?? '';
                $correct = $correctAnswersData[$questionKey];
                
                if ($selected) {
                    if ($selected === $correct) {
                        $detailedResults .= "
                            <div class=\"bg-green-50 border-l-4 border-green-500 p-4 rounded-lg\">
                                <div class=\"flex items-center justify-between\">
                                    <div>
                                        <h4 class=\"font-semibold text-green-800\">Question {$i} ✓</h4>
                                        <p class=\"text-sm text-green-700\">Correct! (+1 point)</p>
                                    </div>
                                    <i class=\"fas fa-check-circle text-green-500 text-xl\"></i>
                                </div>
                            </div>
                        ";
                    } else {
                        $detailedResults .= "
                            <div class=\"bg-red-50 border-l-4 border-red-500 p-4 rounded-lg\">
                                <div class=\"flex items-center justify-between\">
                                    <div>
                                        <h4 class=\"font-semibold text-red-800\">Question {$i} ✗</h4>
                                        <p class=\"text-sm text-red-700\">Incorrect. Your answer: " . strtoupper($selected) . "</p>
                                        <p class=\"text-sm text-red-600\">Correct answer: " . strtoupper($correct) . "</p>
                                    </div>
                                    <i class=\"fas fa-times-circle text-red-500 text-xl\"></i>
                                </div>
                            </div>
                        ";
                    }
                } else {
                    $detailedResults .= "
                        <div class=\"bg-gray-50 border-l-4 border-gray-500 p-4 rounded-lg\">
                            <div class=\"flex items-center justify-between\">
                                <div>
                                    <h4 class=\"font-semibold text-gray-800\">Question {$i} -</h4>
                                    <p class=\"text-sm text-gray-700\">Not answered</p>
                                    <p class=\"text-sm text-gray-600\">Correct answer: " . strtoupper($correct) . "</p>
                                </div>
                                <i class=\"fas fa-question-circle text-gray-500 text-xl\"></i>
                            </div>
                        </div>
                    ";
                }
            }
            
            // Generate detailed results for problem solving
            $psScore = 0;
            $psDetails = '';
            
            // Part A
            $psA = intval($answers['ps-a'] ?? 0);
            if (abs($psA - $problemSolvingAnswers['ps-a']) <= 50) {
                $psScore += 1;
                $psDetails .= '<p class="text-sm text-green-700">Part A: Correct! (+1 point)</p>';
            } else {
                $psDetails .= "<p class=\"text-sm text-red-700\">Part A: Incorrect. Your answer: {$psA}, Correct: {$problemSolvingAnswers['ps-a']}</p>";
            }
            
            // Part B
            $psB = intval($answers['ps-b'] ?? 0);
            if (abs($psB - $problemSolvingAnswers['ps-b']) <= 5) {
                $psScore += 2;
                $psDetails .= '<p class="text-sm text-green-700">Part B: Correct! (+2 points)</p>';
            } else {
                $psDetails .= "<p class=\"text-sm text-red-700\">Part B: Incorrect. Your answer: {$psB}, Correct: {$problemSolvingAnswers['ps-b']}</p>";
            }
            
            // Part C
            $psC = intval($answers['ps-c'] ?? 0);
            if (abs($psC - $problemSolvingAnswers['ps-c']) <= 50) {
                $psScore += 2;
                $psDetails .= '<p class="text-sm text-green-700">Part C: Correct! (+2 points)</p>';
            } else {
                $psDetails .= "<p class=\"text-sm text-red-700\">Part C: Incorrect. Your answer: {$psC}, Correct: {$problemSolvingAnswers['ps-c']}</p>";
            }
            
            $detailedResults .= "
                <div class=\"bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg\">
                    <div class=\"flex items-center justify-between\">
                        <div>
                            <h4 class=\"font-semibold text-purple-800\">Problem Solving</h4>
                            <p class=\"text-sm text-purple-700\">Score: {$psScore}/5 points</p>
                            {$psDetails}
                        </div>
                        <i class=\"fas fa-calculator text-purple-500 text-xl\"></i>
                    </div>
                </div>
            ";
        }
        
        return $detailedResults;
    }
    
    // Get leaderboard for a specific quiz type
    public function getLeaderboard($quizType, $limit = 20, $teacherId = null, $sameClassOnly = false, $classId = null) {
        try {
            // Get current user ID for highlighting
            $currentUserId = $_SESSION['user_id'] ?? null;
            
            // Ensure limit is an integer and within reasonable bounds
            $limit = max(1, min(100, (int)$limit));
            
            // If no teacher ID provided, get it from current user's enrollment
            if (!$teacherId && $currentUserId) {
                $teacherId = $this->getCurrentUserTeacherId($currentUserId);
            }
            
            // Build the query with proper class filtering
            $sql = "
                SELECT 
                    qa.id as attempt_id,
                    u.id as student_id,
                    CONCAT(u.first_name, ' ', u.last_name) as student_name,
                    qa.score,
                    qa.total_questions,
                    ROUND((qa.score / qa.total_questions) * 100, 1) as percentage,
                    qa.completion_time,
                    TIME_FORMAT(SEC_TO_TIME(qa.completion_time), '%i:%s') as formatted_time,
                    qa.completed_at,
                    DATE(qa.completed_at) as quiz_date,
                    c.class_name,
                    c.id as class_id,
                    CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                    CASE WHEN u.id = ? THEN 1 ELSE 0 END as is_current_user,
                    ROW_NUMBER() OVER (
                        PARTITION BY qa.quiz_type, c.id 
                        ORDER BY qa.score DESC, qa.completion_time ASC
                    ) as rank_position
                FROM quiz_attempts qa
                JOIN users u ON qa.student_id = u.id
                LEFT JOIN class_enrollments ce ON u.id = ce.student_id AND ce.enrollment_status = 'approved'
                LEFT JOIN classes c ON ce.class_id = c.id AND c.is_active = TRUE
                LEFT JOIN teachers t ON c.teacher_id = t.id
                WHERE qa.status = 'completed' 
                    AND qa.completed_at IS NOT NULL
                    AND qa.quiz_type = ?";
            
            $params = [$currentUserId, $quizType];
            
            // Filter by teacher if teacher ID is provided
            if ($teacherId) {
                $sql .= " AND c.teacher_id = ?";
                $params[] = $teacherId;
            }
            
            // If specific class ID is provided, filter by that class
            if ($classId) {
                $sql .= " AND c.id = ?";
                $params[] = $classId;
            }
            // If same class only is requested, filter by the current user's exact class
            else if ($sameClassOnly && $currentUserId) {
                $sql .= " AND u.id IN (
                    SELECT ce.student_id 
                    FROM class_enrollments ce
                    WHERE ce.class_id = (
                        SELECT ce2.class_id 
                        FROM class_enrollments ce2
                        JOIN classes c2 ON ce2.class_id = c2.id
                        WHERE ce2.student_id = ? AND ce2.enrollment_status = 'approved' AND c2.is_active = TRUE
                        LIMIT 1
                    ) AND ce.enrollment_status = 'approved'
                )";
                $params[] = $currentUserId;
            }
            
            $sql .= " ORDER BY qa.score DESC, qa.completion_time ASC LIMIT " . $limit;
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $leaderboard = $stmt->fetchAll();
            
            // Recalculate rank position based on filtered results
            foreach ($leaderboard as $index => $entry) {
                $leaderboard[$index]['rank_position'] = $index + 1;
            }
            
            return [
                'success' => true,
                'leaderboard' => $leaderboard,
                'class_id' => $classId,
                'teacher_id' => $teacherId
            ];
        } catch (Exception $e) {
            error_log("Error getting leaderboard: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get leaderboard: ' . $e->getMessage()
            ];
        }
    }
    
    // Helper function to get current user's teacher ID
    private function getCurrentUserTeacherId($userId) {
        try {
            // Check if current user is a teacher
            if (isset($_SESSION['teacher_id'])) {
                // User is a teacher, return their teacher ID
                return $_SESSION['teacher_id'];
            }
            
            // User is a student, get their teacher ID from enrollment
            $sql = "
                SELECT c.teacher_id 
                FROM class_enrollments ce
                JOIN classes c ON ce.class_id = c.id
                WHERE ce.student_id = ? AND ce.enrollment_status = 'approved' AND c.is_active = TRUE
                LIMIT 1
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId]);
            $result = $stmt->fetch();
            
            return $result ? $result['teacher_id'] : null;
        } catch (Exception $e) {
            error_log("Error getting teacher ID: " . $e->getMessage());
            return null;
        }
    }
    
    
    // Get student's quiz history
    public function getStudentQuizHistory($studentId, $quizType = null) {
        try {
            $sql = "
                SELECT 
                    id,
                    quiz_type,
                    score,
                    total_questions,
                    correct_answers,
                    incorrect_answers,
                    completion_time,
                    TIME_FORMAT(SEC_TO_TIME(completion_time), '%i:%s') as formatted_time,
                    completed_at,
                    DATE(completed_at) as quiz_date,
                    status
                FROM quiz_attempts 
                WHERE student_id = ? AND status = 'completed' AND status != 'reset'
            ";
            
            $params = [$studentId];
            
            if ($quizType) {
                $sql .= " AND quiz_type = ?";
                $params[] = $quizType;
            }
            
            $sql .= " ORDER BY completed_at DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $history = $stmt->fetchAll();
            
            // Calculate percentage for each attempt
            foreach ($history as &$attempt) {
                $attempt['percentage'] = round(($attempt['score'] / $attempt['total_questions']) * 100, 1);
            }
            
            return [
                'success' => true,
                'attempts' => $history
            ];
        } catch (Exception $e) {
            error_log("Error getting student quiz history: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get quiz history'
            ];
        }
    }
    
    // Save quiz settings (deadline and time limit) for specific class
    public function saveQuizSettings($quizType, $deadline, $timeLimit, $classId = null) {
        try {
            // Ensure quiz_settings table exists with proper structure
            $this->ensureQuizSettingsTableExists();
            
            // If no class_id provided, use 0 for global settings (backward compatibility)
            if (!$classId) {
                $classId = 0;
            }
            
            // Verify class belongs to current teacher if class_id is provided
            if ($classId && $classId != 0) {
                $teacherId = null;
                // Use teacher_id if present; do not require user_type to be set
                if (isset($_SESSION['teacher_id'])) {
                    $teacherId = $_SESSION['teacher_id'];
                }
                
                if ($teacherId) {
                    $verifyStmt = $this->pdo->prepare("
                        SELECT id FROM classes 
                        WHERE id = ? AND teacher_id = ? AND is_active = TRUE
                    ");
                    $verifyStmt->execute([$classId, $teacherId]);
                    $class = $verifyStmt->fetch();
                    
                    if (!$class) {
                        return [
                            'success' => false,
                            'message' => 'Invalid class selection'
                        ];
                    }
                }
            }
            
            // Insert or update settings for specific class
            $sql = "
                INSERT INTO quiz_settings (quiz_type, class_id, deadline, time_limit, is_open) 
                VALUES (?, ?, ?, ?, 1) 
                ON DUPLICATE KEY UPDATE 
                deadline = VALUES(deadline), 
                time_limit = VALUES(time_limit),
                updated_at = CURRENT_TIMESTAMP
            ";
            
            // Frontend sends local time, store as-is (no timezone conversion)
            // Parse and format for MySQL DATETIME
            $deadlineObj = new DateTime($deadline);
            $deadlineLocal = $deadlineObj->format('Y-m-d H:i:s');
            
            // Log for debugging
            error_log("Saving deadline - Input (local): $deadline, Stored (local): $deadlineLocal");
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$quizType, $classId, $deadlineLocal, $timeLimit]);
            
            $scopeText = $classId == 0 ? 'all classes' : "class ID $classId";
            error_log("Quiz settings saved successfully for quiz_type: $quizType, deadline local: $deadlineLocal, time_limit: $timeLimit, scope: $scopeText");
            
            return [
                'success' => true,
                'message' => 'Quiz settings saved successfully for ' . ($classId == 0 ? 'all classes' : 'selected class'),
                'class_id' => $classId
            ];
        } catch (Exception $e) {
            error_log("Error saving quiz settings: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to save quiz settings: ' . $e->getMessage()
            ];
        }
    }

    // Get quiz results for teachers
    public function getQuizResults($quizType, $teacherId = null, $classId = null) {
    try {
        // Debug: Log session data for troubleshooting
        error_log("Quiz results request - Session data: " . json_encode($_SESSION));
        
        // If no teacher ID provided, get it from current user's enrollment
        if (!$teacherId) {
            // Check if current user is a teacher
            if (isset($_SESSION['teacher_id'])) {
                // User is a teacher (teacher_id present), use their teacher ID directly
                $teacherId = $_SESSION['teacher_id'];
                error_log("Teacher logged in - using teacher ID: " . $teacherId);
            } else {
                // User is a student, get their teacher ID from enrollment
                $currentUserId = $_SESSION['user_id'] ?? null;
                if ($currentUserId) {
                    $teacherId = $this->getCurrentUserTeacherId($currentUserId);
                    error_log("Student logged in - using teacher ID from enrollment: " . $teacherId);
                }
            }
        }
        
        // Ensure we have a teacher ID for filtering
        if (!$teacherId) {
            error_log("No teacher ID available for quiz results filtering - Session: " . json_encode($_SESSION));
            return [
                'success' => false,
                'message' => 'Teacher ID required for quiz results'
            ];
        }
        
        // Debug: Log the teacher ID being used for filtering
        error_log("Quiz results query - Quiz Type: $quizType, Teacher ID: $teacherId, Class ID: $classId");
        
        // Verification: Check what classes belong to this teacher
        $verifyStmt = $this->pdo->prepare("
            SELECT id, class_name, teacher_id 
            FROM classes 
            WHERE teacher_id = ? AND is_active = TRUE
        ");
        $verifyStmt->execute([$teacherId]);
        $teacherClasses = $verifyStmt->fetchAll();
        error_log("Teacher $teacherId has " . count($teacherClasses) . " active classes: " . json_encode($teacherClasses));
        
        // If class ID is provided, verify it belongs to the teacher
        if ($classId) {
            $classBelongsToTeacher = false;
            foreach ($teacherClasses as $class) {
                if ($class['id'] == $classId) {
                    $classBelongsToTeacher = true;
                    break;
                }
            }
            
            if (!$classBelongsToTeacher) {
                error_log("Class ID $classId does not belong to teacher $teacherId");
                return [
                    'success' => false,
                    'message' => 'Invalid class selection'
                ];
            }
        }
        
        // Build the main query with proper class filtering
        $sql = "
            SELECT 
                qa.id,
                qa.student_id,
                CONCAT(u.first_name, ' ', u.last_name) as student_name,
                qa.score,
                qa.total_questions,
                qa.correct_answers,
                qa.incorrect_answers,
                qa.completion_time,
                TIME_FORMAT(SEC_TO_TIME(qa.completion_time), '%i:%s') as formatted_time,
                qa.completed_at,
                DATE(qa.completed_at) as quiz_date,
                ROUND((qa.score / qa.total_questions) * 100, 1) as percentage,
                c.class_name,
                c.id as class_id,
                u.email as student_email
            FROM quiz_attempts qa
            JOIN users u ON qa.student_id = u.id
            JOIN class_enrollments ce ON u.id = ce.student_id AND ce.enrollment_status = 'approved'
            JOIN classes c ON ce.class_id = c.id AND c.is_active = TRUE AND c.teacher_id = ?
            WHERE qa.quiz_type = ? AND qa.status = 'completed'";
        
        $params = [$teacherId, $quizType];
        
        // Add class filtering if class ID is provided - this ensures only students from specific class
        if ($classId) {
            $sql .= " AND c.id = ?";
            $params[] = $classId;
        }
        
        $sql .= " ORDER BY qa.score DESC, qa.completion_time ASC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll();
        
        // Debug: Log the query results
        error_log("Quiz results query executed - Found " . count($results) . " results for teacher ID: $teacherId" . ($classId ? ", class ID: $classId" : ""));
        if (count($results) > 0) {
            error_log("First result sample: " . json_encode($results[0]));
            // Log all student names and class names to verify filtering
            foreach ($results as $index => $result) {
                error_log("Result $index: Student: {$result['student_name']}, Class: {$result['class_name']}, Class ID: {$result['class_id']}");
            }
        } else {
            error_log("No results found for teacher ID: $teacherId, quiz type: $quizType" . ($classId ? ", class ID: $classId" : ""));
        }
        
        // Get statistics for the specific class
        $stats = $this->getQuizStatisticsForType($quizType, $teacherId, $classId);
        
        return [
            'success' => true,
            'results' => $results,
            'statistics' => $stats,
            'class_id' => $classId,
            'teacher_id' => $teacherId
        ];
    } catch (Exception $e) {
        error_log("Error getting quiz results: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Failed to get quiz results'
        ];
    }
    }
    
    // Get quiz statistics for all quizzes
    public function getQuizStatistics($quizType = null, $sameClassOnly = false, $classId = null) {
        try {
            // Get current user's teacher ID for filtering
            $currentUserId = $_SESSION['user_id'] ?? null;
            $teacherId = null;
            if ($currentUserId) {
                $teacherId = $this->getCurrentUserTeacherId($currentUserId);
            }
            
            $sql = "
                SELECT 
                    qa.quiz_type,
                    COUNT(*) as total_attempts,
                    COUNT(CASE WHEN qa.status = 'completed' THEN 1 END) as completed_attempts,
                    AVG(CASE WHEN qa.status = 'completed' THEN (qa.score / qa.total_questions) * 100 END) as average_percentage,
                    MIN(CASE WHEN qa.status = 'completed' THEN qa.completion_time END) as fastest_time,
                    MAX(CASE WHEN qa.status = 'completed' THEN qa.completion_time END) as slowest_time
                FROM quiz_attempts qa
                JOIN users u ON qa.student_id = u.id
                LEFT JOIN class_enrollments ce ON u.id = ce.student_id AND ce.enrollment_status = 'approved'
                LEFT JOIN classes c ON ce.class_id = c.id AND c.is_active = TRUE
                WHERE qa.status = 'completed'";
            
            $params = [];
            
            // Filter by quiz type if provided
            if ($quizType) {
                $sql .= " AND qa.quiz_type = ?";
                $params[] = $quizType;
            }
            
            // Filter by teacher if teacher ID is available
            if ($teacherId) {
                $sql .= " AND c.teacher_id = ?";
                $params[] = $teacherId;
            }
            
            // Filter by specific class if class ID is provided
            if ($classId) {
                $sql .= " AND c.id = ?";
                $params[] = $classId;
            }
            
            // If same class only is requested, filter by the current user's exact class
            if ($sameClassOnly && $currentUserId) {
                $sql .= " AND qa.student_id IN (
                    SELECT ce.student_id 
                    FROM class_enrollments ce
                    WHERE ce.class_id = (
                        SELECT ce2.class_id 
                        FROM class_enrollments ce2
                        JOIN classes c2 ON ce2.class_id = c2.id
                        WHERE ce2.student_id = ? AND ce2.enrollment_status = 'approved' AND c2.is_active = TRUE
                        LIMIT 1
                    ) AND ce.enrollment_status = 'approved'
                )";
                $params[] = $currentUserId;
            }
            
            $sql .= " GROUP BY qa.quiz_type";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll();
            
            // Format statistics by quiz type
            $statistics = [];
            foreach ($results as $row) {
                $statistics[$row['quiz_type']] = [
                    'total_attempts' => (int)$row['total_attempts'],
                    'completed' => (int)$row['completed_attempts'],
                    'average_percentage' => round($row['average_percentage'], 1),
                    'fastest_time' => (int)$row['fastest_time'],
                    'slowest_time' => (int)$row['slowest_time']
                ];
            }
            
            return [
                'success' => true,
                'statistics' => $statistics,
                'class_id' => $classId,
                'teacher_id' => $teacherId
            ];
        } catch (Exception $e) {
            error_log("Error getting quiz statistics: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get quiz statistics'
            ];
        }
    }
    
    // Get quiz statistics for a specific quiz type
    private function getQuizStatisticsForType($quizType, $teacherId = null, $classId = null) {
        try {
            // If no teacher ID provided, get it from current user's enrollment
            if (!$teacherId) {
                $currentUserId = $_SESSION['user_id'] ?? null;
                if ($currentUserId) {
                    $teacherId = $this->getCurrentUserTeacherId($currentUserId);
                }
            }
            
            $sql = "
                SELECT 
                    COUNT(*) as total_attempts,
                    AVG((qa.score / qa.total_questions) * 100) as average_percentage,
                    MIN(qa.completion_time) as fastest_time,
                    MAX(qa.completion_time) as slowest_time
                FROM quiz_attempts qa
                JOIN users u ON qa.student_id = u.id
                LEFT JOIN class_enrollments ce ON u.id = ce.student_id AND ce.enrollment_status = 'approved'
                LEFT JOIN classes c ON ce.class_id = c.id AND c.is_active = TRUE
                WHERE qa.quiz_type = ? AND qa.status = 'completed'";
            
            $params = [$quizType];
            
            // Filter by teacher if teacher ID is provided
            if ($teacherId) {
                $sql .= " AND c.teacher_id = ?";
                $params[] = $teacherId;
            }
            
            // Filter by class if class ID is provided
            if ($classId) {
                $sql .= " AND c.id = ?";
                $params[] = $classId;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch();
            
            return [
                'total_attempts' => (int)$result['total_attempts'],
                'average_percentage' => round($result['average_percentage'], 1),
                'fastest_time' => (int)$result['fastest_time'],
                'slowest_time' => (int)$result['slowest_time']
            ];
        } catch (Exception $e) {
            error_log("Error getting quiz statistics for type: " . $e->getMessage());
            return [
                'total_attempts' => 0,
                'average_percentage' => 0,
                'fastest_time' => 0,
                'slowest_time' => 0
            ];
        }
    }
    
    // Get quiz settings and deadlines for specific class
    public function getQuizSettings($classId = null) {
        try {
            // Ensure quiz_settings table exists
            $this->ensureQuizSettingsTableExists();
            
            // If no class_id provided, get settings for all classes
            if (!$classId) {
                $sql = "
                    SELECT qs.quiz_type, qs.class_id, qs.deadline, qs.time_limit, qs.is_open, 
                           qs.created_at, qs.updated_at, c.class_name
                    FROM quiz_settings qs
                    LEFT JOIN classes c ON qs.class_id = c.id
                    ORDER BY qs.updated_at DESC
                ";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute();
            } else {
                // Get settings for specific class
                $sql = "
                    SELECT qs.quiz_type, qs.class_id, qs.deadline, qs.time_limit, qs.is_open, 
                           qs.created_at, qs.updated_at, c.class_name
                    FROM quiz_settings qs
                    LEFT JOIN classes c ON qs.class_id = c.id
                    WHERE qs.class_id = ?
                    ORDER BY qs.updated_at DESC
                ";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$classId]);
            }
            
            $results = $stmt->fetchAll();
            
            // Format settings by quiz type and class
            $settings = [];
            foreach ($results as $row) {
                $quizType = $row['quiz_type'];
                $classId = $row['class_id'];
                
                if (!isset($settings[$quizType])) {
                    $settings[$quizType] = [];
                }
                
                // Database stores UTC, send as full ISO 8601 string
                // Create DateTime object, explicitly stating the stored time is UTC
                $deadlineObj = new DateTime($row['deadline'], new DateTimeZone('UTC'));
                // Format as a full ISO 8601 string (UTC)
                $deadlineISO = $deadlineObj->format('Y-m-d\TH:i:s\Z');
                
                // Log for debugging
                error_log("Retrieving deadline - Stored UTC: {$row['deadline']}, Returned ISO: $deadlineISO");
                
                $settings[$quizType][$classId] = [
                    'deadline' => $deadlineISO,
                    'time_limit' => (int)$row['time_limit'],
                    'is_open' => (bool)$row['is_open'],
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at'],
                    'class_name' => $row['class_name'] ?: ($classId == 0 ? 'All Classes' : 'Unknown Class')
                ];
            }
            
            error_log("Retrieved quiz settings for class_id: " . ($classId ?: 'all') . " - " . json_encode($settings));
            
            return [
                'success' => true,
                'settings' => $settings,
                'class_id' => $classId
            ];
        } catch (Exception $e) {
            error_log("Error getting quiz settings: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get quiz settings: ' . $e->getMessage()
            ];
        }
    }
    
    // Toggle quiz status (open/close) for specific class
    public function toggleQuizStatus($quizType, $isOpen, $classId = null) {
        try {
            // Ensure quiz_settings table exists
            $this->ensureQuizSettingsTableExists();
            
            // If no class_id provided, use 0 for global settings (backward compatibility)
            if (!$classId) {
                $classId = 0;
            }
            
            // Verify class belongs to current teacher if class_id is provided
            if ($classId && $classId != 0) {
                $teacherId = null;
                // Use teacher_id if present; do not require user_type to be set
                if (isset($_SESSION['teacher_id'])) {
                    $teacherId = $_SESSION['teacher_id'];
                }
                
                if ($teacherId) {
                    $verifyStmt = $this->pdo->prepare("
                        SELECT id FROM classes 
                        WHERE id = ? AND teacher_id = ? AND is_active = TRUE
                    ");
                    $verifyStmt->execute([$classId, $teacherId]);
                    $class = $verifyStmt->fetch();
                    
                    if (!$class) {
                        return [
                            'success' => false,
                            'message' => 'Invalid class selection'
                        ];
                    }
                }
            }
            
            // Update or insert quiz status for specific class
            $sql = "
                INSERT INTO quiz_settings (quiz_type, class_id, is_open, deadline, time_limit, updated_at) 
                VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), 20, CURRENT_TIMESTAMP) 
                ON DUPLICATE KEY UPDATE 
                is_open = VALUES(is_open),
                updated_at = CURRENT_TIMESTAMP
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$quizType, $classId, $isOpen]);
            
            $scopeText = $classId == 0 ? 'all classes' : "class ID $classId";
            error_log("Quiz status toggled for quiz_type: $quizType, is_open: $isOpen, scope: $scopeText");
            
            return [
                'success' => true,
                'message' => 'Quiz status updated successfully for ' . ($classId == 0 ? 'all classes' : 'selected class'),
                'class_id' => $classId
            ];
        } catch (Exception $e) {
            error_log("Error toggling quiz status: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update quiz status: ' . $e->getMessage()
            ];
        }
    }
    
    // Get quiz status for all quizzes or specific class
    public function getQuizStatus($classId = null) {
        try {
            // Ensure quiz_settings table exists
            $this->ensureQuizSettingsTableExists();
            
            if ($classId) {
                // Get status for specific class
                $sql = "
                    SELECT quiz_type, is_open
                    FROM quiz_settings
                    WHERE class_id = ?
                    ORDER BY updated_at DESC
                ";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$classId]);
            } else {
                // Get status for all classes (global)
                $sql = "
                    SELECT quiz_type, is_open
                    FROM quiz_settings
                    ORDER BY updated_at DESC
                ";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute();
            }
            
            $results = $stmt->fetchAll();
            
            // Format status by quiz type
            $status = [];
            foreach ($results as $row) {
                $status[$row['quiz_type']] = (bool)$row['is_open'];
            }
            
            error_log("Retrieved quiz status for class {$classId}: " . json_encode($status));
            
            return [
                'success' => true,
                'status' => $status
            ];
        } catch (Exception $e) {
            error_log("Error getting quiz status: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get quiz status: ' . $e->getMessage()
            ];
        }
    }
    
    // Ensure quiz_settings table exists with proper structure
    private function ensureQuizSettingsTableExists() {
        try {
            // Check if quiz_settings table exists
            $sql = "SHOW TABLES LIKE 'quiz_settings'";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch();
            
            if (!$result) {
                // Create quiz_settings table with class_id support
                $sql = "
                    CREATE TABLE quiz_settings (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        quiz_type VARCHAR(50) NOT NULL,
                        class_id INT NOT NULL,
                        deadline DATETIME NOT NULL,
                        time_limit INT NOT NULL DEFAULT 20,
                        is_open TINYINT(1) DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        
                        UNIQUE KEY unique_quiz_class (quiz_type, class_id),
                        INDEX idx_quiz_type (quiz_type),
                        INDEX idx_class_id (class_id),
                        INDEX idx_deadline (deadline),
                        INDEX idx_is_open (is_open),
                        
                        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
                    )
                ";
                $this->pdo->exec($sql);
                error_log("Created quiz_settings table with class_id support");
            } else {
                // Table exists, check if class_id column exists
                $this->addClassIdColumnIfNotExists();
                $this->addIsOpenColumnIfNotExists();
            }
        } catch (Exception $e) {
            error_log("Error ensuring quiz_settings table exists: " . $e->getMessage());
            throw $e;
        }
    }

    // Add class_id column if it doesn't exist
    private function addClassIdColumnIfNotExists() {
        try {
            // Check if class_id column exists
            $sql = "SHOW COLUMNS FROM quiz_settings LIKE 'class_id'";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch();
            
            if (!$result) {
                // Add class_id column
                $sql = "ALTER TABLE quiz_settings ADD COLUMN class_id INT NOT NULL DEFAULT 0";
                $this->pdo->exec($sql);
                
                // Update existing records to have a default class_id (0 means global)
                $sql = "UPDATE quiz_settings SET class_id = 0 WHERE class_id = 0";
                $this->pdo->exec($sql);
                
                // Add foreign key constraint
                try {
                    $sql = "ALTER TABLE quiz_settings ADD CONSTRAINT fk_quiz_settings_class_id FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE";
                    $this->pdo->exec($sql);
                } catch (Exception $e) {
                    // Foreign key might already exist or fail due to existing data
                    error_log("Could not add foreign key constraint: " . $e->getMessage());
                }
                
                // Update unique constraint
                try {
                    $sql = "ALTER TABLE quiz_settings DROP INDEX quiz_type";
                    $this->pdo->exec($sql);
                } catch (Exception $e) {
                    // Index might not exist
                }
                
                try {
                    $sql = "ALTER TABLE quiz_settings ADD UNIQUE KEY unique_quiz_class (quiz_type, class_id)";
                    $this->pdo->exec($sql);
                } catch (Exception $e) {
                    error_log("Could not add unique constraint: " . $e->getMessage());
                }
                
                error_log("Added class_id column to quiz_settings table");
            }
        } catch (Exception $e) {
            error_log("Error adding class_id column: " . $e->getMessage());
        }
    }

    // Add is_open column if it doesn't exist
    private function addIsOpenColumnIfNotExists() {
        try {
            // Check if is_open column exists
            $sql = "SHOW COLUMNS FROM quiz_settings LIKE 'is_open'";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch();
            
            if (!$result) {
                // Add is_open column
                $sql = "ALTER TABLE quiz_settings ADD COLUMN is_open TINYINT(1) DEFAULT 1";
                $this->pdo->exec($sql);
                error_log("Added is_open column to quiz_settings table");
            }
        } catch (Exception $e) {
            error_log("Error adding is_open column: " . $e->getMessage());
        }
    }
    
    // Mark abandoned quiz attempts (for cleanup when students logout)
    public function markAbandonedAttempts($studentId = null, $attemptId = null) {
        try {
            // If specific attempt ID is provided, clear that attempt directly
            if ($attemptId) {
                $sql = "
                    UPDATE quiz_attempts 
                    SET status = 'abandoned', completed_at = CURRENT_TIMESTAMP
                    WHERE id = ? AND student_id = ? AND status = 'in_progress'
                ";
                $params = [$attemptId, $studentId];
            } else {
                // Original logic for old attempts
                $sql = "
                    UPDATE quiz_attempts 
                    SET status = 'abandoned', completed_at = CURRENT_TIMESTAMP
                    WHERE status = 'in_progress' 
                    AND started_at < DATE_SUB(NOW(), INTERVAL 2 HOUR)
                ";
                
                $params = [];
                if ($studentId) {
                    $sql .= " AND student_id = ?";
                    $params[] = $studentId;
                }
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            return [
                'success' => true,
                'abandoned_count' => $stmt->rowCount(),
                'message' => 'Abandoned attempts marked successfully'
            ];
        } catch (Exception $e) {
            error_log("Error marking abandoned attempts: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to mark abandoned attempts'
            ];
        }
    }
    
    // Get quiz attempt by ID (for recovery purposes)
    public function getQuizAttemptById($attemptId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT qa.*, u.first_name, u.last_name, u.email
                FROM quiz_attempts qa
                JOIN users u ON qa.student_id = u.id
                WHERE qa.id = ?
            ");
            $stmt->execute([$attemptId]);
            $attempt = $stmt->fetch();
            
            if ($attempt) {
                return [
                    'success' => true,
                    'attempt' => $attempt
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Quiz attempt not found'
                ];
            }
        } catch (Exception $e) {
            error_log("Error getting quiz attempt: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to get quiz attempt'
            ];
        }
    }
    
    // Validate quiz attempt ownership (security check)
    public function validateAttemptOwnership($attemptId, $studentId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id FROM quiz_attempts 
                WHERE id = ? AND student_id = ?
            ");
            $stmt->execute([$attemptId, $studentId]);
            $attempt = $stmt->fetch();
            
            return $attempt !== false;
        } catch (Exception $e) {
            error_log("Error validating attempt ownership: " . $e->getMessage());
            return false;
        }
    }
    
    // Allow teacher to reset quiz attempt for specific student
    public function resetStudentQuizAttempt($studentId, $quizType, $teacherId) {
        try {
            error_log("Resetting quiz attempt - Student ID: $studentId, Quiz Type: $quizType, Teacher ID: $teacherId");
            
            // Verify that the student belongs to the teacher's class
            $verifyStmt = $this->pdo->prepare("
                SELECT ce.id 
                FROM class_enrollments ce
                JOIN classes c ON ce.class_id = c.id
                WHERE ce.student_id = ? AND c.teacher_id = ? AND ce.enrollment_status = 'approved' AND c.is_active = TRUE
            ");
            $verifyStmt->execute([$studentId, $teacherId]);
            $enrollment = $verifyStmt->fetch();
            
            if (!$enrollment) {
                error_log("Reset failed - Student not found in teacher's class");
                return [
                    'success' => false,
                    'message' => 'Student not found in your class'
                ];
            }
            
            $this->pdo->beginTransaction();
            
            try {
                // First, check what attempts exist before reset
                $checkStmt = $this->pdo->prepare("
                    SELECT id, status, completed_at
                    FROM quiz_attempts 
                    WHERE student_id = ? AND quiz_type = ? AND status IN ('completed', 'in_progress')
                ");
                $checkStmt->execute([$studentId, $quizType]);
                $existingAttempts = $checkStmt->fetchAll();
                error_log("Found " . count($existingAttempts) . " attempts to reset for student $studentId, quiz $quizType");
                
                // Mark all existing attempts as 'reset'
                $stmt = $this->pdo->prepare("
                    UPDATE quiz_attempts 
                    SET status = 'reset', completed_at = CURRENT_TIMESTAMP
                    WHERE student_id = ? AND quiz_type = ? AND status IN ('completed', 'in_progress')
                ");
                $stmt->execute([$studentId, $quizType]);
                $resetCount = $stmt->rowCount();
                error_log("Reset $resetCount quiz attempts");
                
                // Delete associated answers
                $deleteAnswersStmt = $this->pdo->prepare("
                    DELETE qa FROM quiz_answers qa
                    JOIN quiz_attempts q ON qa.attempt_id = q.id
                    WHERE q.student_id = ? AND q.quiz_type = ? AND q.status = 'reset'
                ");
                $deleteAnswersStmt->execute([$studentId, $quizType]);
                $deletedAnswers = $deleteAnswersStmt->rowCount();
                error_log("Deleted $deletedAnswers quiz answers");
                
                $this->pdo->commit();
                
                error_log("Quiz reset completed successfully for student $studentId, quiz $quizType");
                return [
                    'success' => true,
                    'message' => 'Quiz attempt reset successfully. Student can now retake the quiz.',
                    'reset_count' => $resetCount
                ];
                
            } catch (Exception $e) {
                $this->pdo->rollBack();
                error_log("Error during quiz reset: " . $e->getMessage());
                throw $e;
            }
            
        } catch (Exception $e) {
            error_log("Error resetting student quiz attempt: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to reset quiz attempt: ' . $e->getMessage()
            ];
        }
    }
    
    // Helper methods
    private function getCorrectAnswer($questionNumber) {
        $correctAnswers = [
            1 => 'a', 2 => 'b', 3 => 'a', 4 => 'b', 5 => 'b',
            6 => 'a', 7 => 'b', 8 => 'b', 9 => 'a', 10 => 'a'
        ];
        return $correctAnswers[$questionNumber] ?? '';
    }
    
    // Real-Life Problems Quiz correct answers
    private function getRealLifeProblemsCorrectAnswer($questionNumber) {
        $correctAnswers = [
            1 => 'b', 2 => 'b', 3 => 'c', 4 => 'b', 5 => 'a',
            6 => 'b', 7 => 'b', 8 => 'c', 9 => 'a', 10 => 'c'
        ];
        return $correctAnswers[$questionNumber] ?? '';
    }
    
    // Evaluating Functions Quiz correct answers
    private function getEvaluatingFunctionsCorrectAnswer($questionNumber) {
        $correctAnswers = [
            1 => 'a', 2 => 'b', 3 => 'c', 4 => 'a', 5 => 'b',
            6 => 'c', 7 => 'a', 8 => 'b'
        ];
        return $correctAnswers[$questionNumber] ?? '';
    }
    
    // Operations on Functions Quiz correct answers
    private function getOperationsOnFunctionsCorrectAnswer($questionNumber) {
        $correctAnswers = [
            1 => 'a', 2 => 'a', 3 => 'a', 4 => 'a', 5 => 'a', 
            6 => 'a', 7 => 'a', 8 => 'a', 9 => 'a', 10 => 'b'
        ];
        return $correctAnswers[$questionNumber] ?? '';
    }
    
    private function calculateOperationsOnFunctionsProblemSolvingScore($answers) {
        $score = 0;
        
        if (isset($answers['ps-answer']) && !empty(trim($answers['ps-answer']))) {
            $answer = strtolower(trim($answers['ps-answer']));
            
            // Check for correct final answer (16 is correct, 15 is close)
            if (strpos($answer, '16') !== false) {
                $score = 5; // Full points for correct answer
            } else if (strpos($answer, '15') !== false) {
                $score = 4; // 80% for close answer
            } else {
                // Check for partial credit based on work shown
                $partialCredit = 0;
                
                // Check for key steps in the solution
                // Step 1: Find g(2) = 2-1 = 1
                if (strpos($answer, 'g(2)') !== false || strpos($answer, '2-1') !== false || strpos($answer, '1') !== false) {
                    $partialCredit += 1; // 1 point for finding g(2) = 1
                }
                // Step 2: Find f(g(2)) = f(1) = 2(1) + 3 = 7
                if (strpos($answer, 'f(1)') !== false || strpos($answer, '2(1)+3') !== false || strpos($answer, '2*1+3') !== false || strpos($answer, '7') !== false) {
                    $partialCredit += 1; // 1 point for finding f(1) = 7
                }
                // Step 3: Find h(3) = 3² = 9
                if (strpos($answer, 'h(3)') !== false || strpos($answer, '3²') !== false || strpos($answer, '3^2') !== false || strpos($answer, '9') !== false) {
                    $partialCredit += 1; // 1 point for finding h(3) = 9
                }
                // Step 4: Add the results
                if (strpos($answer, '+') !== false || strpos($answer, 'add') !== false || strpos($answer, 'sum') !== false || strpos($answer, '16') !== false) {
                    $partialCredit += 1; // 1 point for adding or getting final result
                }
                // Step 5: Show understanding of composition
                if (strpos($answer, '(f ∘ g)') !== false || strpos($answer, 'f(g') !== false || strpos($answer, 'composition') !== false) {
                    $partialCredit += 0.5; // 0.5 points for understanding composition
                }
                
                $score = min($partialCredit, 5); // Cap at maximum points
            }
        }
        
        return $score;
    }
    
    private function calculateProblemSolvingScore($answers) {
        $score = 0;
        
        // Problem solving question (5 points) - maximum profit
        if (isset($answers['ps-answer']) && abs(intval($answers['ps-answer']) - 450) <= 50) {
            $score += 5;
        }
        
        return $score;
    }
    
    // Real-Life Problems Quiz problem solving score calculation
    private function calculateRealLifeProblemsProblemSolvingScore($answers) {
        $score = 0;
        
        // Problem solving question (5 points) - maximum profit
        if (isset($answers['q11']) && abs(intval($answers['q11']) - 450) <= 50) {
            $score += 5;
        }
        
        return $score;
    }
    
    private function storeAnswer($attemptId, $questionNumber, $questionType, $studentAnswer, $correctAnswer, $isCorrect, $pointsEarned) {
        $stmt = $this->pdo->prepare("
            INSERT INTO quiz_answers (attempt_id, question_number, question_type, student_answer, correct_answer, is_correct, points_earned)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$attemptId, $questionNumber, $questionType, $studentAnswer, $correctAnswer, $isCorrect, $pointsEarned]);
    }
    
    private function storeProblemSolvingAnswers($attemptId, $answers, $totalScore) {
        $psAnswer = $answers['ps-answer'] ?? '';
        $correctAnswer = '450';
        $isCorrect = ($totalScore >= 5); // 5 out of 5 points
        
        $this->storeAnswer($attemptId, 11, 'problem_solving', $psAnswer, $correctAnswer, $isCorrect, $totalScore);
    }
    
    // Real-Life Problems Quiz problem solving storage
    private function storeRealLifeProblemsProblemSolvingAnswers($attemptId, $answers, $totalScore) {
        $psAnswer = $answers['q11'] ?? '';
        $correctAnswer = '450';
        $isCorrect = ($totalScore >= 5); // 5 out of 5 points
        
        $this->storeAnswer($attemptId, 11, 'problem_solving', $psAnswer, $correctAnswer, $isCorrect, $totalScore);
    }
    
    // Evaluating Functions Quiz problem solving methods
    private function calculateEvaluatingFunctionsProblemSolvingScore($answers) {
        $score = 0;
        
        // Problem solving question 9 (1 point)
        if (isset($answers['ps-9']) && abs(intval($answers['ps-9']) - 25) <= 5) {
            $score += 1;
        }
        
        // Problem solving question 10 (1 point)
        if (isset($answers['ps-10']) && abs(intval($answers['ps-10']) - 15) <= 3) {
            $score += 1;
        }
        
        return $score;
    }
    
    private function storeEvaluatingFunctionsProblemSolvingAnswers($attemptId, $answers, $totalScore) {
        $psAnswers = [
            'ps-9' => $answers['ps-9'] ?? '',
            'ps-10' => $answers['ps-10'] ?? ''
        ];
        
        $combinedAnswer = implode(',', $psAnswers);
        $correctAnswer = '25,15';
        $isCorrect = ($totalScore >= 1); // At least 1 out of 2 points
        
        $this->storeAnswer($attemptId, 9, 'problem_solving', $psAnswers['ps-9'], '25', $psAnswers['ps-9'] == '25', $psAnswers['ps-9'] == '25' ? 1 : 0);
        $this->storeAnswer($attemptId, 10, 'problem_solving', $psAnswers['ps-10'], '15', $psAnswers['ps-10'] == '15', $psAnswers['ps-10'] == '15' ? 1 : 0);
    }
    
    private function storeOperationsOnFunctionsProblemSolvingAnswers($attemptId, $answers, $score) {
        try {
            $psAnswer = $answers['ps-answer'] ?? '';
            $correctAnswer = '16'; // The correct answer for the problem solving question
            $isCorrect = ($score >= 5); // 5 out of 5 points for full credit
            
            $this->storeAnswer($attemptId, 11, 'problem_solving', $psAnswer, $correctAnswer, $isCorrect, $score);
        } catch (Exception $e) {
            error_log("Error storing operations on functions problem solving answers: " . $e->getMessage());
        }
    }
    
    // Rational Functions Quiz helper methods
    private function getRationalFunctionsCorrectAnswer($questionNumber) {
        $correctAnswers = [
            1 => 'a', // A function that can be expressed as the ratio of two polynomials
            2 => 'b', // All real numbers except x = 3
            3 => 'b', // x = 1
            4 => 'b', // y = 2
            5 => 'a', // Solutions that appear to work but don't satisfy the original equation
            6 => 'a', // x = 1.2 and x = -4
            7 => 'a', // Find the least common denominator (LCD)
            8 => 'a', // (-∞, -2) ∪ [1, ∞)
            9 => 'a', // Sign analysis and number line
            10 => 'a' // x = -3
        ];
        
        return $correctAnswers[$questionNumber] ?? '';
    }
    
    private function calculateRationalFunctionsProblemSolvingScore($answers) {
        $score = 0;
        
        // Problem solving question (1 point) - domain of f(x) = (x² - 4)/(x - 2)
        if (isset($answers['q11'])) {
            $studentAnswer = strtolower(trim($answers['q11']));
            $correctAnswer = '(-∞,2) ∪ (2,∞)';
            
            // Check for exact match or common variations
            if ($studentAnswer === strtolower($correctAnswer) || 
                $studentAnswer === '(-∞,2) u (2,∞)' ||
                $studentAnswer === '(-∞,2) ∪ (2,∞)' ||
                strpos($studentAnswer, '(-∞,2)') !== false && strpos($studentAnswer, '(2,∞)') !== false) {
                $score = 1;
            }
        }
        
        return $score;
    }
    
    private function storeRationalFunctionsProblemSolvingAnswer($attemptId, $answers, $score) {
        try {
            $psAnswer = $answers['q11'] ?? '';
            $correctAnswer = '(-∞,2) ∪ (2,∞)';
            $isCorrect = ($score >= 1);
            
            $this->storeAnswer($attemptId, 11, 'problem_solving', $psAnswer, $correctAnswer, $isCorrect, $score);
        } catch (Exception $e) {
            error_log("Error storing rational functions problem solving answer: " . $e->getMessage());
        }
    }
    
    // Update heartbeat for quiz attempt
    public function updateHeartbeat($attemptId) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE quiz_attempts 
                SET last_heartbeat = CURRENT_TIMESTAMP
                WHERE id = ? AND status = 'in_progress'
            ");
            $stmt->execute([$attemptId]);
            
            if ($stmt->rowCount() > 0) {
                return [
                    'success' => true,
                    'message' => 'Heartbeat updated'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Attempt not found or not in progress'
                ];
            }
        } catch (Exception $e) {
            error_log("Error updating heartbeat: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update heartbeat'
            ];
        }
    }
    
    // Mark quiz attempt as cheating
    public function markAsCheating($attemptId, $reason) {
        try {
            $this->pdo->beginTransaction();
            
            // Update attempt status to 'completed' with zero score (since 'cheating' is not in enum)
            $stmt = $this->pdo->prepare("
                UPDATE quiz_attempts 
                SET status = 'completed', 
                    score = 0, 
                    completed_at = CURRENT_TIMESTAMP,
                    cheating_reason = ?
                WHERE id = ? AND status = 'in_progress'
            ");
            $stmt->execute([$reason, $attemptId]);
            
            if ($stmt->rowCount() > 0) {
                // Log the cheating incident
                $logStmt = $this->pdo->prepare("
                    INSERT INTO cheating_incidents (attempt_id, reason, detected_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                ");
                $logStmt->execute([$attemptId, $reason]);
                
                $this->pdo->commit();
                
                error_log("Quiz attempt $attemptId marked as cheating - reason: $reason");
                
                return [
                    'success' => true,
                    'message' => 'Attempt marked as cheating with zero score',
                    'score' => 0,
                    'total_questions' => 11,
                    'cheating_detected' => true,
                    'cheating_reason' => $reason
                ];
            } else {
                $this->pdo->rollBack();
                return [
                    'success' => false,
                    'message' => 'Attempt not found or not in progress'
                ];
            }
        } catch (Exception $e) {
            $this->pdo->rollBack();
            error_log("Error marking as cheating: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to mark as cheating'
            ];
        }
    }
    
    // Check and award badges after quiz completion
    private function checkAndAwardBadges($studentId, $quizType, $score, $totalQuestions, $attemptId) {
        try {
            $percentage = ($score / $totalQuestions) * 100;
            
            error_log("Badge check: Student $studentId, Quiz: $quizType, Score: $score/$totalQuestions ($percentage%)");
            
            // Get all badges that could be awarded
            $badgesQuery = "SELECT * FROM badges WHERE is_active = 1";
            $badges = $this->pdo->query($badgesQuery)->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("Found " . count($badges) . " active badges in database");
            
            $awardedBadges = [];
            
            foreach ($badges as $badge) {
                $shouldAward = false;
                
                // Check if student already has this badge
                $existingBadge = $this->pdo->prepare("
                    SELECT id FROM student_badges 
                    WHERE student_id = ? AND badge_id = ?
                ");
                $existingBadge->execute([$studentId, $badge['id']]);
                
                if ($existingBadge->fetch()) {
                    continue; // Student already has this badge
                }
                
                // Special handling for real-life-problems quiz
                if ($quizType === 'real-life-problems') {
                    error_log("Checking badge: {$badge['name']} for real-life-problems quiz");
                    
                    // Check for Real-Life Problems Champion badge (90%+) - highest priority
                    if ($badge['name'] === 'Real-Life Problems Champion' && $percentage >= 90) {
                        $shouldAward = true;
                        error_log("Awarding Real-Life Problems Champion badge - Score: $percentage%");
                    }
                    // Check for Real-Life Problems Master badge (80%+ but less than 90%)
                    elseif ($badge['name'] === 'Real-Life Problems Master' && $percentage >= 80 && $percentage < 90) {
                        $shouldAward = true;
                        error_log("Awarding Real-Life Problems Master badge - Score: $percentage%");
                    }
                    // Check for Real-Life Problems Solver badge (50%+ but less than 80%)
                    elseif ($badge['name'] === 'Real-Life Problems Solver' && $percentage >= 50 && $percentage < 80) {
                        $shouldAward = true;
                        error_log("Awarding Real-Life Problems Solver badge - Score: $percentage%");
                    }
                }
                // Skip all other badge checks if not real-life-problems quiz
                elseif ($quizType !== 'real-life-problems' && ($badge['name'] === 'Real-Life Problems Champion' || $badge['name'] === 'Real-Life Problems Master' || $badge['name'] === 'Real-Life Problems Solver')) {
                    // Skip real-life-problems badges for other quiz types
                    continue;
                }
                
                if ($shouldAward) {
                    // Award the badge
                    $awardQuery = "
                        INSERT INTO student_badges (student_id, badge_id, quiz_attempt_id) 
                        VALUES (?, ?, ?)
                    ";
                    $this->pdo->prepare($awardQuery)->execute([$studentId, $badge['id'], $attemptId]);
                    
                    $awardedBadges[] = [
                        'id' => $badge['id'],
                        'name' => $badge['name'],
                        'description' => $badge['description']
                    ];
                    
                    error_log("Badge awarded: {$badge['name']} to student $studentId for quiz $quizType with score $percentage%");
                }
            }
            
            if (!empty($awardedBadges)) {
                error_log("Awarded " . count($awardedBadges) . " badges to student $studentId");
            }
            
        } catch (Exception $e) {
            error_log("Error checking and awarding badges: " . $e->getMessage());
            // Don't throw exception as this shouldn't break the quiz submission
        }
    }
}

// Handle API requests
$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Check authentication for both students and teachers
$isStudent = is_student_logged_in();
$isTeacher = is_teacher_logged_in();

// For certain actions, we need to handle authentication more gracefully
$authRequiredActions = ['start_quiz', 'check_existing_attempt', 'get_student_history'];
$teacherOnlyActions = ['save_quiz_settings', 'get_quiz_results', 'get_quiz_statistics', 'toggle_quiz_status'];
$publicActions = ['get_quiz_settings', 'get_quiz_status']; // These can be accessed by both students and teachers

// Check if action requires authentication
if (in_array($action, $authRequiredActions) && !$isStudent && !$isTeacher) {
    echo json_encode([
        'success' => false, 
        'message' => 'Authentication required',
        'error_code' => 'AUTH_REQUIRED',
        'redirect' => 'login.html'
    ]);
    exit;
}

// Check if action requires teacher authentication
if (in_array($action, $teacherOnlyActions) && !$isTeacher) {
    echo json_encode([
        'success' => false, 
        'message' => 'Teacher authentication required',
        'error_code' => 'TEACHER_AUTH_REQUIRED',
        'redirect' => 'teacher-login.html'
    ]);
    exit;
}

// Public actions (get_quiz_settings, get_quiz_status) can be accessed by anyone
// No authentication check needed for these actions

// For actions that don't require authentication (like get_leaderboard, get_statistics)
// we allow them to proceed without authentication

try {
    $quizManager = new QuizManager();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

try {
    switch ($action) {
        case 'start_quiz':
            $quizType = $_POST['quiz_type'] ?? '';
            $userId = $isStudent ? $_SESSION['user_id'] : null;
            
            // Log quiz start attempt
            error_log("Quiz start attempt - User ID: $userId, Quiz Type: $quizType");
            
            if (!$userId) {
                error_log("Quiz start failed - No user ID provided");
                echo json_encode(['success' => false, 'message' => 'Student authentication required for quiz']);
                break;
            }
            
            if (empty($quizType)) {
                error_log("Quiz start failed - No quiz type provided");
                echo json_encode(['success' => false, 'message' => 'Quiz type is required']);
                break;
            }
            $result = $quizManager->startQuiz($userId, $quizType);
            error_log("Quiz start result: " . json_encode($result));
            echo json_encode($result);
            break;
            
        case 'submit_quiz':
            $attemptId = $_POST['attempt_id'] ?? null;
            $answersJson = $_POST['answers'] ?? '{}';
            $completionTime = $_POST['completion_time'] ?? 0;
            
            // Handle answers - they might be JSON string or already an array
            if (is_string($answersJson)) {
                $answers = json_decode($answersJson, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    error_log("Quiz submission failed - Invalid JSON in answers: " . json_last_error_msg());
                    echo json_encode(['success' => false, 'message' => 'Invalid answers format']);
                    break;
                }
            } else {
                // Already an array
                $answers = $answersJson;
            }
            
            // Log submission attempt
            error_log("Quiz submission attempt - Attempt ID: $attemptId, Completion Time: $completionTime, Answers: " . json_encode($answers));
            
            if (!$attemptId) {
                error_log("Quiz submission failed - No attempt ID provided");
                echo json_encode(['success' => false, 'message' => 'Attempt ID required']);
                break;
            }
            
            // Validate attempt ownership if student is logged in
            if ($isStudent) {
                if (!$quizManager->validateAttemptOwnership($attemptId, $_SESSION['user_id'])) {
                    error_log("Quiz submission failed - Invalid attempt ownership for user: " . $_SESSION['user_id']);
                    echo json_encode([
                        'success' => false, 
                        'message' => 'You can only submit your own quiz attempts',
                        'error_code' => 'INVALID_ATTEMPT'
                    ]);
                    break;
                }
            }
            
            $result = $quizManager->submitQuiz($attemptId, $answers, $completionTime);
            error_log("Quiz submission result: " . json_encode($result));
            echo json_encode($result);
            break;
            
        case 'get_leaderboard':
            $quizType = $_GET['quiz_type'] ?? '';
            $limit = $_GET['limit'] ?? 20;
            $sameClassOnly = isset($_GET['same_class_only']) && $_GET['same_class_only'] === 'true';
            $classId = $_GET['class_id'] ?? null;
            $result = $quizManager->getLeaderboard($quizType, $limit, null, $sameClassOnly, $classId);
            echo json_encode($result);
            break;
            
        case 'get_statistics':
            $quizType = $_GET['quiz_type'] ?? null;
            $sameClassOnly = isset($_GET['same_class_only']) && $_GET['same_class_only'] === 'true';
            $classId = $_GET['class_id'] ?? null;
            $result = $quizManager->getQuizStatistics($quizType, $sameClassOnly, $classId);
            echo json_encode($result);
            break;
            
        case 'check_existing_attempt':
            $quizType = $_GET['quiz_type'] ?? '';
            $userId = $isStudent ? $_SESSION['user_id'] : null;
            if (!$userId) {
                echo json_encode(['success' => false, 'message' => 'Student authentication required']);
                break;
            }
            if (empty($quizType)) {
                echo json_encode(['success' => false, 'message' => 'Quiz type is required']);
                break;
            }
            $result = $quizManager->checkExistingAttempt($userId, $quizType);
            echo json_encode($result);
            break;
            
        case 'get_quiz_answers':
            $attemptId = $_GET['attempt_id'] ?? null;
            error_log("Getting quiz answers for attempt ID: $attemptId");
            
            if (!$attemptId) {
                error_log("No attempt ID provided for get_quiz_answers");
                echo json_encode(['success' => false, 'message' => 'Attempt ID required']);
                break;
            }
            
            // Validate attempt ownership if student is logged in
            if ($isStudent) {
                if (!$quizManager->validateAttemptOwnership($attemptId, $_SESSION['user_id'])) {
                    error_log("Quiz answers access denied - Invalid attempt ownership for user: " . $_SESSION['user_id']);
                    echo json_encode([
                        'success' => false, 
                        'message' => 'You can only access your own quiz answers',
                        'error_code' => 'INVALID_ATTEMPT'
                    ]);
                    break;
                }
            }
            
            $result = $quizManager->getQuizAnswers($attemptId);
            error_log("Quiz answers result: " . json_encode($result));
            echo json_encode($result);
            break;
            
        case 'save_quiz_progress':
            $attemptId = $_POST['attempt_id'] ?? null;
            $completionTime = $_POST['completion_time'] ?? 0;
            $answers = $_POST['answers'] ?? [];
            
            // Decode JSON string if it's a string
            if (is_string($answers)) {
                $answers = json_decode($answers, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    echo json_encode(['success' => false, 'message' => 'Invalid answers format']);
                    break;
                }
            }
            
            if (!$attemptId) {
                echo json_encode(['success' => false, 'message' => 'Attempt ID required']);
                break;
            }
            
            // Validate attempt ownership if student is logged in
            if ($isStudent) {
                if (!$quizManager->validateAttemptOwnership($attemptId, $_SESSION['user_id'])) {
                    echo json_encode([
                        'success' => false, 
                        'message' => 'You can only save progress for your own quiz attempts',
                        'error_code' => 'INVALID_ATTEMPT'
                    ]);
                    break;
                }
            }
            
            $result = $quizManager->saveQuizProgress($attemptId, $answers, $completionTime);
            echo json_encode($result);
            break;
            
        case 'get_student_history':
            $quizType = $_GET['quiz_type'] ?? null;
            $userId = $isStudent ? $_SESSION['user_id'] : null;
            if (!$userId) {
                echo json_encode(['success' => false, 'message' => 'Student authentication required']);
                break;
            }
            $result = $quizManager->getStudentQuizHistory($userId, $quizType);
            echo json_encode($result);
            break;
            
        case 'save_quiz_settings':
            error_log("=== SAVE QUIZ SETTINGS REQUEST ===");
            error_log("Is Teacher: " . ($isTeacher ? 'YES' : 'NO'));
            error_log("POST data: " . json_encode($_POST));
            
            if (!$isTeacher) {
                error_log("ERROR: Not authenticated as teacher");
                echo json_encode([
                    'success' => false, 
                    'message' => 'Teacher authentication required',
                    'error_code' => 'TEACHER_AUTH_REQUIRED',
                    'redirect' => 'teacher-login.html'
                ]);
                break;
            }
            $quizType = $_POST['quiz_type'] ?? '';
            $deadline = $_POST['deadline'] ?? '';
            $timeLimit = $_POST['time_limit'] ?? 20;
            $classId = $_POST['class_id'] ?? null;
            
            error_log("Quiz Type: $quizType");
            error_log("Deadline: $deadline");
            error_log("Time Limit: $timeLimit");
            error_log("Class ID: $classId");
            
            $result = $quizManager->saveQuizSettings($quizType, $deadline, $timeLimit, $classId);
            error_log("Save result: " . json_encode($result));
            echo json_encode($result);
            break;
            
        case 'get_quiz_results':
            if (!$isTeacher) {
                echo json_encode(['success' => false, 'message' => 'Teacher authentication required']);
                break;
            }
            $quizType = $_GET['quiz_type'] ?? '';
            $classId = $_GET['class_id'] ?? null;
            $result = $quizManager->getQuizResults($quizType, null, $classId);
            echo json_encode($result);
            break;
            
        case 'get_quiz_statistics':
            if (!$isTeacher) {
                echo json_encode(['success' => false, 'message' => 'Teacher authentication required']);
                break;
            }
            $classId = $_GET['class_id'] ?? null;
            $result = $quizManager->getQuizStatistics(null, false, $classId);
            echo json_encode($result);
            break;
            
        case 'get_quiz_settings':
            $classId = $_GET['class_id'] ?? null;
            $result = $quizManager->getQuizSettings($classId);
            echo json_encode($result);
            break;
            
        case 'toggle_quiz_status':
            if (!$isTeacher) {
                echo json_encode(['success' => false, 'message' => 'Teacher authentication required']);
                break;
            }
            $quizType = $_POST['quiz_type'] ?? '';
            $isOpen = $_POST['is_open'] ?? '0';
            $classId = $_POST['class_id'] ?? null;
            $result = $quizManager->toggleQuizStatus($quizType, $isOpen, $classId);
            echo json_encode($result);
            break;
            
        case 'get_quiz_status':
            $classId = $_GET['class_id'] ?? null;
            $result = $quizManager->getQuizStatus($classId);
            echo json_encode($result);
            break;
            
        case 'mark_abandoned_attempts':
            $studentId = $isStudent ? $_SESSION['user_id'] : null;
            $attemptId = $_POST['attempt_id'] ?? null;
            $result = $quizManager->markAbandonedAttempts($studentId, $attemptId);
            echo json_encode($result);
            break;
            
        case 'get_quiz_attempt':
            $attemptId = $_GET['attempt_id'] ?? null;
            if (!$attemptId) {
                echo json_encode(['success' => false, 'message' => 'Attempt ID required']);
                break;
            }
            $result = $quizManager->getQuizAttemptById($attemptId);
            echo json_encode($result);
            break;
            
        case 'reset_student_quiz':
            if (!$isTeacher) {
                echo json_encode(['success' => false, 'message' => 'Teacher authentication required']);
                break;
            }
            $studentId = $_POST['student_id'] ?? null;
            $quizType = $_POST['quiz_type'] ?? '';
            $teacherId = $_SESSION['teacher_id'] ?? null;
            
            if (!$studentId || !$quizType || !$teacherId) {
                echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
                break;
            }
            
            $result = $quizManager->resetStudentQuizAttempt($studentId, $quizType, $teacherId);
            echo json_encode($result);
            break;
            
        case 'heartbeat':
            $attemptId = $_POST['attempt_id'] ?? null;
            if (!$attemptId) {
                echo json_encode(['success' => false, 'message' => 'Attempt ID required']);
                break;
            }
            $result = $quizManager->updateHeartbeat($attemptId);
            echo json_encode($result);
            break;
            
        case 'mark_cheating':
            $attemptId = $_POST['attempt_id'] ?? null;
            $reason = $_POST['reason'] ?? 'unknown';
            if (!$attemptId) {
                echo json_encode(['success' => false, 'message' => 'Attempt ID required']);
                break;
            }
            $result = $quizManager->markAsCheating($attemptId, $reason);
            echo json_encode($result);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    error_log("Quiz management error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>
