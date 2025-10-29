-- Add Missing Columns for Recent Activity
USE mathease_database;

-- Add teacher_id to quiz_attempts
ALTER TABLE quiz_attempts ADD COLUMN teacher_id INT AFTER student_id;

-- Add missing columns to topic_locks
ALTER TABLE topic_locks 
ADD COLUMN class_id INT AFTER teacher_id,
ADD COLUMN topic_name VARCHAR(100) AFTER topic_id,
ADD COLUMN unlocked_at TIMESTAMP NULL AFTER locked_at;

-- Create enrollment_requests table
CREATE TABLE IF NOT EXISTS enrollment_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    teacher_id INT NOT NULL,
    class_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    request_message TEXT,
    response_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_student_class_request (student_id, class_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_student_id (student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
