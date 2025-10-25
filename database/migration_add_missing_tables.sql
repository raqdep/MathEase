-- Migration script to add missing tables and columns
-- Run this script to update existing MathEase database

USE mathease_db;

-- Add last_step column to user_topic_progress table if it doesn't exist
ALTER TABLE user_topic_progress 
ADD COLUMN IF NOT EXISTS last_step VARCHAR(32) AFTER last_attempt;

-- Create user_quiz_attempt_answers table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_quiz_attempt_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    quiz_id INT NOT NULL,
    attempt_id INT NOT NULL,
    question_index INT NOT NULL,
    selected_option_index INT NOT NULL,
    correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES user_quiz_attempts(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_quiz_id (quiz_id),
    INDEX idx_attempt_id (attempt_id),
    INDEX idx_question_index (question_index)
);

-- Verify the changes
SHOW TABLES LIKE 'user_quiz_attempt_answers';
DESCRIBE user_topic_progress;
