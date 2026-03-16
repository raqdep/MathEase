-- Ensure quiz_attempts and quiz_answers exist (required for /quiz folder quizzes)
-- Run this if you get "Table 'quiz_answers' doesn't exist" when submitting a quiz.

USE mathease_database3;

-- Quiz attempts table (skip if already exists with correct structure)
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    teacher_id INT NULL,
    quiz_type VARCHAR(50) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 15,
    correct_answers INT NOT NULL DEFAULT 0,
    incorrect_answers INT NOT NULL DEFAULT 0,
    completion_time INT NOT NULL DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    last_heartbeat TIMESTAMP NULL,
    status ENUM('in_progress', 'completed', 'abandoned', 'cheating') DEFAULT 'in_progress',
    cheating_reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_quiz (student_id, quiz_type),
    INDEX idx_quiz_type_score (quiz_type, score DESC),
    INDEX idx_student_quiz_date (student_id, quiz_type, completed_at)
);

-- Quiz answers table (required for saving individual question answers)
CREATE TABLE IF NOT EXISTS quiz_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_number INT NOT NULL,
    question_type ENUM('multiple_choice', 'problem_solving') NOT NULL,
    student_answer TEXT,
    correct_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    points_earned INT NOT NULL DEFAULT 0,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attempt_question (attempt_id, question_number)
);

-- Add foreign key to quiz_answers only if it doesn't exist (avoid errors if table already has it)
-- If this fails, the table may already be correct; ignore and use as-is.
