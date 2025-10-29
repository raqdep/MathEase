-- Admin Dashboard Database Fix
-- This script ensures the teachers table has the necessary columns for admin functionality

USE mathease_database;

-- Add approval_status column if it doesn't exist
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';

-- Add approval tracking columns if they don't exist
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS approved_by INT NULL;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS rejected_at DATETIME NULL;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;

-- Add indexes for better performance
ALTER TABLE teachers ADD INDEX IF NOT EXISTS idx_approval_status (approval_status);
ALTER TABLE teachers ADD INDEX IF NOT EXISTS idx_approved_by (approved_by);

-- Update existing teachers to have pending status if they don't have a status
UPDATE teachers SET approval_status = 'pending' WHERE approval_status IS NULL;

-- Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create admin activity log table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type ENUM('teacher', 'student', 'admin') NOT NULL,
    target_id INT NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- Insert default admin account if it doesn't exist (password: MathEase123!!!)
INSERT INTO admins (first_name, last_name, email, password, role) VALUES
('Admin', 'MathEase', 'matheasenc@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin')
ON DUPLICATE KEY UPDATE 
first_name = VALUES(first_name),
last_name = VALUES(last_name),
password = VALUES(password),
role = VALUES(role);

-- Add some sample teachers for testing if none exist
INSERT INTO teachers (first_name, last_name, email, teacher_id, department, subject, password, approval_status) VALUES
('John', 'Doe', 'john.doe@school.edu.ph', 'T001', 'STEM', 'General Mathematics', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pending'),
('Jane', 'Smith', 'jane.smith@school.edu.ph', 'T002', 'STEM', 'Pre-Calculus', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pending'),
('Mike', 'Johnson', 'mike.johnson@school.edu.ph', 'T003', 'STEM', 'Calculus', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'approved')
ON DUPLICATE KEY UPDATE 
first_name = VALUES(first_name),
last_name = VALUES(last_name),
department = VALUES(department),
subject = VALUES(subject),
approval_status = VALUES(approval_status);
