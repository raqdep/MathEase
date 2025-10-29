-- Quiz System Database Migration
-- This file creates tables for quiz management, results, and leaderboards

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

-- Insert sample quiz attempts for demonstration
INSERT INTO quiz_attempts (student_id, quiz_type, score, total_questions, correct_answers, incorrect_answers, completion_time, started_at, completed_at, status) VALUES
(1, 'functions', 15, 15, 15, 0, 512, '2024-01-15 09:00:00', '2024-01-15 09:08:32', 'completed'),
(2, 'functions', 14, 15, 14, 1, 555, '2024-01-15 09:15:00', '2024-01-15 09:24:15', 'completed'),
(3, 'functions', 14, 15, 14, 1, 642, '2024-01-15 09:30:00', '2024-01-15 09:40:42', 'completed'),
(4, 'functions', 13, 15, 13, 2, 448, '2024-01-15 10:00:00', '2024-01-15 10:07:28', 'completed'),
(5, 'functions', 13, 15, 13, 2, 665, '2024-01-15 10:15:00', '2024-01-15 10:26:05', 'completed'),
(6, 'functions', 12, 15, 12, 3, 590, '2024-01-15 10:30:00', '2024-01-15 10:39:50', 'completed'),
(7, 'functions', 12, 15, 12, 3, 738, '2024-01-15 11:00:00', '2024-01-15 11:12:18', 'completed'),
(8, 'functions', 11, 15, 11, 4, 525, '2024-01-15 11:15:00', '2024-01-15 11:23:45', 'completed'),
(9, 'functions', 11, 15, 11, 4, 802, '2024-01-15 11:30:00', '2024-01-15 11:43:22', 'completed'),
(10, 'functions', 10, 15, 10, 5, 615, '2024-01-15 12:00:00', '2024-01-15 12:10:15', 'completed');

-- Insert sample quiz answers for the first attempt
INSERT INTO quiz_answers (attempt_id, question_number, question_type, student_answer, correct_answer, is_correct, points_earned) VALUES
(1, 1, 'multiple_choice', 'a', 'a', TRUE, 1),
(1, 2, 'multiple_choice', 'b', 'b', TRUE, 1),
(1, 3, 'multiple_choice', 'a', 'a', TRUE, 1),
(1, 4, 'multiple_choice', 'b', 'b', TRUE, 1),
(1, 5, 'multiple_choice', 'b', 'b', TRUE, 1),
(1, 6, 'multiple_choice', 'a', 'a', TRUE, 1),
(1, 7, 'multiple_choice', 'b', 'b', TRUE, 1),
(1, 8, 'multiple_choice', 'b', 'b', TRUE, 1),
(1, 9, 'multiple_choice', 'a', 'a', TRUE, 1),
(1, 10, 'multiple_choice', 'a', 'a', TRUE, 1),
(1, 11, 'problem_solving', '450,10,100', '450,10,100', TRUE, 5);

-- Create indexes for better performance
CREATE INDEX idx_quiz_type_score ON quiz_attempts(quiz_type, score DESC);
CREATE INDEX idx_quiz_type_time ON quiz_attempts(quiz_type, completion_time ASC);
CREATE INDEX idx_student_quiz_date ON quiz_attempts(student_id, quiz_type, completed_at);
