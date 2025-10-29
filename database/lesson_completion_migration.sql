-- Lesson Completion System Migration
-- This migration adds tables to track student lesson completion progress
-- Compatible with existing mathease_db schema

-- Use the correct database
USE mathease_db;

-- Table to store lesson completions
CREATE TABLE IF NOT EXISTS lesson_completion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    topic_name VARCHAR(255) NOT NULL,
    lesson_number INT NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_lesson_completion (user_id, topic_name, lesson_number),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_topic (user_id, topic_name),
    INDEX idx_topic_lesson (topic_name, lesson_number),
    INDEX idx_completed_at (completed_at)
);

-- Table to store topic-specific progress (separate from main user_progress)
CREATE TABLE IF NOT EXISTS topic_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    topic_name VARCHAR(255) NOT NULL,
    lessons_completed INT DEFAULT 0,
    total_lessons INT DEFAULT 4,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_topic_progress (user_id, topic_name),
    INDEX idx_user_topic_progress (user_id),
    INDEX idx_topic_progress (topic_name)
);

-- Insert sample data for existing users (optional)
-- This will create progress records for existing users
INSERT IGNORE INTO topic_progress (user_id, topic_name, lessons_completed, total_lessons, progress_percentage)
SELECT 
    u.id,
    'functions',
    0,
    4,
    0.00
FROM users u
WHERE u.id IS NOT NULL;

-- Insert initial progress records for users who don't have them in the main user_progress table
INSERT IGNORE INTO user_progress (user_id, total_score, completed_lessons, current_topic)
SELECT 
    u.id,
    0,
    0,
    'functions'
FROM users u
WHERE u.id NOT IN (SELECT user_id FROM user_progress);

-- Add comments for documentation
ALTER TABLE lesson_completion COMMENT = 'Tracks individual lesson completions for each student';
ALTER TABLE topic_progress COMMENT = 'Stores progress summary for each topic per student';
