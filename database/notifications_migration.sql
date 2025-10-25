-- Notifications System Migration
-- This file creates the notifications table for student notifications

USE mathease_db;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'class_deleted', 'class_created', 'enrollment_approved', etc.
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT UTC_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT UTC_TIMESTAMP ON UPDATE UTC_TIMESTAMP,
    
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at DESC)
);

-- Create notification preferences table (optional - for future use)
CREATE TABLE IF NOT EXISTS notification_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email_notifications BOOLEAN DEFAULT TRUE,
    class_notifications BOOLEAN DEFAULT TRUE,
    quiz_notifications BOOLEAN DEFAULT TRUE,
    assignment_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT UTC_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT UTC_TIMESTAMP ON UPDATE UTC_TIMESTAMP,
    
    CONSTRAINT fk_preference_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preferences (user_id)
);
