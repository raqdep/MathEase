-- Class Management Migration for MathEase
-- This migration adds class management functionality

USE mathease_db;

-- Teachers table (if not exists)
CREATE TABLE IF NOT EXISTS teachers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    teacher_id VARCHAR(20) UNIQUE NOT NULL,
    department VARCHAR(100),
    subject VARCHAR(100),
    experience INT DEFAULT 0,
    password VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_teacher_id (teacher_id)
);

-- Classes table
CREATE TABLE classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    class_code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    grade_level ENUM('11', '12') NOT NULL,
    strand ENUM('STEM', 'ABM', 'HUMSS', 'GAS') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    max_students INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_class_code (class_code),
    INDEX idx_is_active (is_active)
);

-- Class enrollments table
CREATE TABLE class_enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    enrollment_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    approved_by INT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES teachers(id) ON DELETE SET NULL,
    UNIQUE KEY unique_class_student (class_id, student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id),
    INDEX idx_enrollment_status (enrollment_status)
);

-- Class announcements table
CREATE TABLE class_announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    teacher_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_class_id (class_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_created_at (created_at)
);

-- Class assignments table
CREATE TABLE class_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    teacher_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assignment_type ENUM('lesson', 'quiz', 'project', 'homework') NOT NULL,
    topic_id INT,
    due_date DATETIME,
    max_score INT DEFAULT 100,
    instructions TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
    INDEX idx_class_id (class_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_due_date (due_date),
    INDEX idx_is_published (is_published)
);

-- Student assignment submissions table
CREATE TABLE assignment_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    submission_content TEXT,
    attachment_url VARCHAR(255),
    score INT NULL,
    feedback TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP NULL,
    graded_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES class_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES teachers(id) ON DELETE SET NULL,
    UNIQUE KEY unique_assignment_student (assignment_id, student_id),
    INDEX idx_assignment_id (assignment_id),
    INDEX idx_student_id (student_id),
    INDEX idx_submitted_at (submitted_at)
);

-- Note: Class code generation is handled in PHP to avoid SUPER privilege requirements

-- Insert sample teacher (if not exists)
INSERT IGNORE INTO teachers (first_name, last_name, email, teacher_id, department, subject, password) VALUES
('John', 'Doe', 'teacher@school.edu.ph', 'T001', 'Mathematics', 'General Mathematics', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Insert sample class (with manual class code)
INSERT INTO classes (teacher_id, class_name, class_code, description, subject, grade_level, strand) VALUES
(1, 'Grade 11 STEM - General Mathematics', 'MATH001', 'Advanced General Mathematics for STEM students', 'General Mathematics', '11', 'STEM');

-- Create views for easier data access
CREATE VIEW class_student_list AS
SELECT 
    c.id as class_id,
    c.class_name,
    c.class_code,
    c.subject,
    c.grade_level,
    c.strand,
    t.first_name as teacher_first_name,
    t.last_name as teacher_last_name,
    t.email as teacher_email,
    COUNT(ce.id) as total_enrollments,
    COUNT(CASE WHEN ce.enrollment_status = 'approved' THEN 1 END) as approved_students,
    COUNT(CASE WHEN ce.enrollment_status = 'pending' THEN 1 END) as pending_students
FROM classes c
LEFT JOIN teachers t ON c.teacher_id = t.id
LEFT JOIN class_enrollments ce ON c.id = ce.class_id
WHERE c.is_active = TRUE
GROUP BY c.id;

CREATE VIEW student_class_enrollments AS
SELECT 
    u.id as student_id,
    u.first_name,
    u.last_name,
    u.email,
    u.student_id as student_number,
    c.id as class_id,
    c.class_name,
    c.class_code,
    ce.enrollment_status,
    ce.enrolled_at,
    ce.approved_at,
    t.first_name as teacher_first_name,
    t.last_name as teacher_last_name
FROM users u
JOIN class_enrollments ce ON u.id = ce.student_id
JOIN classes c ON ce.class_id = c.id
JOIN teachers t ON c.teacher_id = t.id
WHERE c.is_active = TRUE;

-- Create indexes for better performance
CREATE INDEX idx_classes_teacher_active ON classes(teacher_id, is_active);
CREATE INDEX idx_enrollments_status_class ON class_enrollments(enrollment_status, class_id);
CREATE INDEX idx_assignments_class_published ON class_assignments(class_id, is_published);
CREATE INDEX idx_submissions_assignment_student ON assignment_submissions(assignment_id, student_id);
