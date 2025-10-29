-- Admin Migration for MathEase Database
-- This migration adds admin functionality to manage teacher accounts

USE mathease_database;

-- Admins table
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
);

-- Add approval status to teachers table
-- Check if columns exist before adding them
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'mathease_database' 
     AND TABLE_NAME = 'teachers' 
     AND COLUMN_NAME = 'approval_status') = 0,
    'ALTER TABLE teachers ADD COLUMN approval_status ENUM(''pending'', ''approved'', ''rejected'') DEFAULT ''pending''',
    'SELECT ''Column approval_status already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'mathease_database' 
     AND TABLE_NAME = 'teachers' 
     AND COLUMN_NAME = 'approved_by') = 0,
    'ALTER TABLE teachers ADD COLUMN approved_by INT NULL',
    'SELECT ''Column approved_by already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'mathease_database' 
     AND TABLE_NAME = 'teachers' 
     AND COLUMN_NAME = 'approved_at') = 0,
    'ALTER TABLE teachers ADD COLUMN approved_at DATETIME NULL',
    'SELECT ''Column approved_at already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'mathease_database' 
     AND TABLE_NAME = 'teachers' 
     AND COLUMN_NAME = 'rejection_reason') = 0,
    'ALTER TABLE teachers ADD COLUMN rejection_reason TEXT NULL',
    'SELECT ''Column rejection_reason already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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

-- Insert default admin account
INSERT INTO admins (first_name, last_name, email, password, role) VALUES
('Admin', 'MathEase', 'matheasenc@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin')
ON DUPLICATE KEY UPDATE 
first_name = VALUES(first_name),
last_name = VALUES(last_name),
password = VALUES(password),
role = VALUES(role);

-- Admin activity log table
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
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_target_type (target_type),
    INDEX idx_created_at (created_at)
);

-- Create view for admin dashboard
CREATE VIEW admin_dashboard AS
SELECT 
    a.id,
    a.first_name,
    a.last_name,
    a.email,
    a.role,
    a.is_active,
    a.last_login,
    COUNT(DISTINCT CASE WHEN t.approval_status = 'pending' THEN t.id END) as pending_teachers,
    COUNT(DISTINCT CASE WHEN t.approval_status = 'approved' THEN t.id END) as approved_teachers,
    COUNT(DISTINCT CASE WHEN t.approval_status = 'rejected' THEN t.id END) as rejected_teachers,
    COUNT(DISTINCT CASE WHEN u.email_verified = 1 THEN u.id END) as verified_students
FROM admins a
LEFT JOIN teachers t ON 1=1
LEFT JOIN users u ON 1=1
WHERE a.is_active = TRUE
GROUP BY a.id;

-- Add comments to tables
ALTER TABLE admins COMMENT = 'Stores admin account information for managing teacher approvals';
ALTER TABLE admin_activity_log COMMENT = 'Stores admin activity logs for audit trail';
