-- Simple Admin Migration for MathEase Database
USE mathease_database;

-- Create admins table
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

-- Add approval columns to teachers table (run these one by one)
ALTER TABLE teachers ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE teachers ADD COLUMN approved_by INT NULL;
ALTER TABLE teachers ADD COLUMN approved_at DATETIME NULL;
ALTER TABLE teachers ADD COLUMN rejection_reason TEXT NULL;

-- Add indexes
ALTER TABLE teachers ADD INDEX idx_approval_status (approval_status);

-- Create admin activity log table
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
INSERT INTO admins (first_name, last_name, email, password, role) VALUES
('Admin', 'MathEase', 'matheasenc@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin')
ON DUPLICATE KEY UPDATE 
first_name = VALUES(first_name),
last_name = VALUES(last_name),
password = VALUES(password),
role = VALUES(role);
