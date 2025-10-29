-- Safe Admin Migration for MathEase Database
-- This migration only adds columns that don't already exist

USE mathease_database;

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin account (password: MathEase123!!!)
-- Only insert if no admin accounts exist
INSERT INTO admins (first_name, last_name, email, password, role) 
SELECT 'Admin', 'MathEase', 'matheasenc@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin'
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE email = 'matheasenc@gmail.com');

-- Add indexes if they don't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = 'mathease_database' 
     AND TABLE_NAME = 'teachers' 
     AND INDEX_NAME = 'idx_approval_status') = 0,
    'ALTER TABLE teachers ADD INDEX idx_approval_status (approval_status)',
    'SELECT ''Index idx_approval_status already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
