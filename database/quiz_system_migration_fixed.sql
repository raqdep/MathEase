-- Quiz System Database Migration - FIXED VERSION
-- This file creates tables for quiz management, results, and leaderboards

-- First, let's check if we're using the correct database
USE mathease_database;

-- Create quiz_attempts table to track student quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    quiz_type VARCHAR(50) NOT NULL, -- 'functions', 'evaluating-functions', etc.
    score INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 15,
    correct_answers INT NOT NULL DEFAULT 0,
    incorrect_answers INT NOT NULL DEFAULT 0,
    completion_time INT NOT NULL DEFAULT 0, -- in seconds
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_quiz_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_quiz (student_id, quiz_type),
    INDEX idx_completed_at (completed_at),
    INDEX idx_score (score DESC)
);

-- Create quiz_answers table to store individual question answers
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
    
    CONSTRAINT fk_quiz_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    INDEX idx_attempt_question (attempt_id, question_number)
);

-- Create quiz_leaderboard view for easy leaderboard queries
CREATE OR REPLACE VIEW quiz_leaderboard AS
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
    qa.quiz_type,
    ROW_NUMBER() OVER (
        PARTITION BY qa.quiz_type 
        ORDER BY qa.score DESC, qa.completion_time ASC
    ) as rank_position
FROM quiz_attempts qa
JOIN users u ON qa.student_id = u.id
WHERE qa.status = 'completed' 
    AND qa.completed_at IS NOT NULL
ORDER BY qa.quiz_type, qa.score DESC, qa.completion_time ASC;

-- Create quiz_statistics view for quiz analytics
CREATE OR REPLACE VIEW quiz_statistics AS
SELECT 
    quiz_type,
    COUNT(*) as total_attempts,
    COUNT(DISTINCT student_id) as unique_students,
    AVG(score) as average_score,
    AVG(completion_time) as average_time,
    MAX(score) as highest_score,
    MIN(completion_time) as fastest_time,
    ROUND(AVG((score / total_questions) * 100), 1) as average_percentage
FROM quiz_attempts 
WHERE status = 'completed' 
    AND completed_at IS NOT NULL
GROUP BY quiz_type;

-- Only insert sample data if users exist
-- First, let's check if we have any users in the database
SET @user_count = (SELECT COUNT(*) FROM users);

-- If we have users, insert sample quiz attempts
-- We'll use the first few user IDs that exist
INSERT INTO quiz_attempts (student_id, quiz_type, score, total_questions, correct_answers, incorrect_answers, completion_time, started_at, completed_at, status) 
SELECT 
    u.id as student_id,
    'functions' as quiz_type,
    CASE 
        WHEN u.id % 10 = 1 THEN 15
        WHEN u.id % 10 = 2 THEN 14
        WHEN u.id % 10 = 3 THEN 14
        WHEN u.id % 10 = 4 THEN 13
        WHEN u.id % 10 = 5 THEN 13
        WHEN u.id % 10 = 6 THEN 12
        WHEN u.id % 10 = 7 THEN 12
        WHEN u.id % 10 = 8 THEN 11
        WHEN u.id % 10 = 9 THEN 11
        ELSE 10
    END as score,
    15 as total_questions,
    CASE 
        WHEN u.id % 10 = 1 THEN 15
        WHEN u.id % 10 = 2 THEN 14
        WHEN u.id % 10 = 3 THEN 14
        WHEN u.id % 10 = 4 THEN 13
        WHEN u.id % 10 = 5 THEN 13
        WHEN u.id % 10 = 6 THEN 12
        WHEN u.id % 10 = 7 THEN 12
        WHEN u.id % 10 = 8 THEN 11
        WHEN u.id % 10 = 9 THEN 11
        ELSE 10
    END as correct_answers,
    CASE 
        WHEN u.id % 10 = 1 THEN 0
        WHEN u.id % 10 = 2 THEN 1
        WHEN u.id % 10 = 3 THEN 1
        WHEN u.id % 10 = 4 THEN 2
        WHEN u.id % 10 = 5 THEN 2
        WHEN u.id % 10 = 6 THEN 3
        WHEN u.id % 10 = 7 THEN 3
        WHEN u.id % 10 = 8 THEN 4
        WHEN u.id % 10 = 9 THEN 4
        ELSE 5
    END as incorrect_answers,
    CASE 
        WHEN u.id % 10 = 1 THEN 512
        WHEN u.id % 10 = 2 THEN 555
        WHEN u.id % 10 = 3 THEN 642
        WHEN u.id % 10 = 4 THEN 448
        WHEN u.id % 10 = 5 THEN 665
        WHEN u.id % 10 = 6 THEN 590
        WHEN u.id % 10 = 7 THEN 738
        WHEN u.id % 10 = 8 THEN 525
        WHEN u.id % 10 = 9 THEN 802
        ELSE 615
    END as completion_time,
    DATE_SUB(NOW(), INTERVAL (u.id % 7) DAY) as started_at,
    DATE_SUB(NOW(), INTERVAL (u.id % 7) DAY) + INTERVAL (CASE 
        WHEN u.id % 10 = 1 THEN 512
        WHEN u.id % 10 = 2 THEN 555
        WHEN u.id % 10 = 3 THEN 642
        WHEN u.id % 10 = 4 THEN 448
        WHEN u.id % 10 = 5 THEN 665
        WHEN u.id % 10 = 6 THEN 590
        WHEN u.id % 10 = 7 THEN 738
        WHEN u.id % 10 = 8 THEN 525
        WHEN u.id % 10 = 9 THEN 802
        ELSE 615
    END) SECOND as completed_at,
    'completed' as status
FROM users u
WHERE u.id <= 10
LIMIT 10;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_type_score ON quiz_attempts(quiz_type, score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_type_time ON quiz_attempts(quiz_type, completion_time ASC);
CREATE INDEX IF NOT EXISTS idx_student_quiz_date ON quiz_attempts(student_id, quiz_type, completed_at);
