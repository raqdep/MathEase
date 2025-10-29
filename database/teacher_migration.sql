-- Teacher Migration for MathEase Database
-- This migration adds teacher-specific tables to the existing MathEase database

USE mathease_db;

-- Teachers table
CREATE TABLE teachers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    teacher_id VARCHAR(20) UNIQUE NOT NULL,
    department ENUM('Mathematics', 'STEM', 'General Education') NOT NULL,
    subject ENUM('General Mathematics', 'Pre-Calculus', 'Calculus', 'Statistics') NOT NULL,
    experience ENUM('0-2', '3-5', '6-10', '10+') DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_department (department),
    INDEX idx_subject (subject)
);

-- Teacher remember me tokens table
CREATE TABLE teacher_remember_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);

-- Teacher profiles table
CREATE TABLE teacher_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    total_students INT DEFAULT 0,
    active_assignments INT DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_teacher_id (teacher_id)
);

-- Teacher classes table (for managing multiple classes)
CREATE TABLE teacher_classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    grade_level ENUM('11', '12') NOT NULL,
    strand ENUM('STEM', 'ABM', 'HUMSS', 'GAS') NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester ENUM('1st', '2nd') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_academic_year (academic_year),
    INDEX idx_is_active (is_active)
);

-- Teacher assignments table
CREATE TABLE teacher_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    class_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assignment_type ENUM('quiz', 'homework', 'project', 'exam') NOT NULL,
    topic_id INT,
    due_date DATETIME,
    total_points INT DEFAULT 100,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES teacher_classes(id) ON DELETE SET NULL,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_class_id (class_id),
    INDEX idx_due_date (due_date),
    INDEX idx_is_published (is_published)
);

-- Teacher announcements table
CREATE TABLE teacher_announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    class_id INT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES teacher_classes(id) ON DELETE SET NULL,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_class_id (class_id),
    INDEX idx_is_published (is_published),
    INDEX idx_created_at (created_at)
);

-- Teacher analytics table (for storing analytics data)
CREATE TABLE teacher_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    class_id INT,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES teacher_classes(id) ON DELETE SET NULL,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_class_id (class_id),
    INDEX idx_metric_name (metric_name),
    INDEX idx_metric_date (metric_date)
);

-- Create view for teacher dashboard data
CREATE VIEW teacher_dashboard AS
SELECT 
    t.id,
    t.first_name,
    t.last_name,
    t.email,
    t.teacher_id,
    t.department,
    t.subject,
    t.experience,
    tp.total_students,
    tp.active_assignments,
    tp.average_score,
    COUNT(DISTINCT tc.id) as total_classes,
    COUNT(DISTINCT ta.id) as total_assignments,
    COUNT(DISTINCT tan.id) as total_announcements
FROM teachers t
LEFT JOIN teacher_profiles tp ON t.id = tp.teacher_id
LEFT JOIN teacher_classes tc ON t.id = tc.teacher_id AND tc.is_active = TRUE
LEFT JOIN teacher_assignments ta ON t.id = ta.teacher_id
LEFT JOIN teacher_announcements tan ON t.id = tan.teacher_id
GROUP BY t.id;

-- Create view for class performance analytics
CREATE VIEW class_performance_analytics AS
SELECT 
    tc.id as class_id,
    tc.class_name,
    tc.grade_level,
    tc.strand,
    t.first_name as teacher_first_name,
    t.last_name as teacher_last_name,
    COUNT(DISTINCT u.id) as total_students,
    COUNT(DISTINCT CASE WHEN up.completed_lessons > 0 THEN u.id END) as active_students,
    AVG(up.total_score) as average_score,
    COUNT(DISTINCT up.completed_lessons) as total_completed_lessons
FROM teacher_classes tc
JOIN teachers t ON tc.teacher_id = t.id
LEFT JOIN users u ON u.grade_level = tc.grade_level AND u.strand = tc.strand
LEFT JOIN user_progress up ON u.id = up.user_id
WHERE tc.is_active = TRUE
GROUP BY tc.id;

-- Insert sample teacher data (for testing)
INSERT INTO teachers (first_name, last_name, email, teacher_id, department, subject, password) VALUES
('Maria', 'Santos', 'maria.santos@school.edu.ph', 'T001', 'STEM', 'General Mathematics', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Juan', 'Cruz', 'juan.cruz@school.edu.ph', 'T002', 'STEM', 'General Mathematics', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Insert sample teacher profiles
INSERT INTO teacher_profiles (teacher_id, total_students, active_assignments, average_score) VALUES
(1, 0, 0, 0.00),
(2, 0, 0, 0.00);

-- Insert sample teacher classes
INSERT INTO teacher_classes (teacher_id, class_name, grade_level, strand, academic_year, semester) VALUES
(1, 'Grade 11 STEM A', '11', 'STEM', '2024-2025', '1st'),
(1, 'Grade 11 STEM B', '11', 'STEM', '2024-2025', '1st'),
(2, 'Grade 11 STEM C', '11', 'STEM', '2024-2025', '1st');

-- Create indexes for better performance
CREATE INDEX idx_teachers_created ON teachers(created_at);
CREATE INDEX idx_teacher_profiles_score ON teacher_profiles(average_score);
CREATE INDEX idx_teacher_assignments_due ON teacher_assignments(due_date);
CREATE INDEX idx_teacher_announcements_priority ON teacher_announcements(priority);

-- Add comments to tables
ALTER TABLE teachers COMMENT = 'Stores teacher account information and credentials';
ALTER TABLE teacher_profiles COMMENT = 'Stores teacher profile and statistics data';
ALTER TABLE teacher_classes COMMENT = 'Stores teacher class information and management';
ALTER TABLE teacher_assignments COMMENT = 'Stores teacher-created assignments and tasks';
ALTER TABLE teacher_announcements COMMENT = 'Stores teacher announcements and communications';
ALTER TABLE teacher_analytics COMMENT = 'Stores teacher analytics and performance metrics';
