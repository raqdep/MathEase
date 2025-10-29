-- Quiz Settings Migration
-- This file creates the quiz_settings table for teacher quiz management

USE mathease_database;

-- Create quiz_settings table for teacher quiz management
CREATE TABLE IF NOT EXISTS quiz_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_type VARCHAR(50) NOT NULL UNIQUE,
    deadline DATETIME NOT NULL,
    time_limit INT NOT NULL DEFAULT 20,
    is_open TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_quiz_type (quiz_type),
    INDEX idx_deadline (deadline),
    INDEX idx_is_open (is_open)
);

-- Insert default settings for functions quiz
INSERT IGNORE INTO quiz_settings (quiz_type, deadline, time_limit, is_open) 
VALUES ('functions', DATE_ADD(NOW(), INTERVAL 7 DAY), 20, 1);

-- Insert default settings for other quiz types
INSERT IGNORE INTO quiz_settings (quiz_type, deadline, time_limit, is_open) 
VALUES 
    ('evaluating-functions', DATE_ADD(NOW(), INTERVAL 7 DAY), 20, 1),
    ('operations-on-functions', DATE_ADD(NOW(), INTERVAL 7 DAY), 20, 1),
    ('real-life-problems', DATE_ADD(NOW(), INTERVAL 7 DAY), 20, 1),
    ('rational-functions', DATE_ADD(NOW(), INTERVAL 7 DAY), 20, 1);

-- Create quiz_status table for tracking quiz availability
CREATE TABLE IF NOT EXISTS quiz_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_type VARCHAR(50) NOT NULL UNIQUE,
    is_open TINYINT(1) DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_quiz_type (quiz_type),
    INDEX idx_is_open (is_open)
);

-- Insert default status for all quiz types
INSERT IGNORE INTO quiz_status (quiz_type, is_open) 
VALUES 
    ('functions', 1),
    ('evaluating-functions', 1),
    ('operations-on-functions', 1),
    ('real-life-problems', 1),
    ('rational-functions', 1);
