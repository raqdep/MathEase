-- ============================================================================
-- MathEase Complete Database Schema
-- Database: mathease_database3
-- Consolidated from all migration files
-- Created for Grade 11 STEM Pre-Calculus Learning Platform
-- ============================================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS mathease_database3;
USE mathease_database3;

-- ============================================================================
-- CORE USER TABLES
-- ============================================================================

-- Users table (students)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    student_id VARCHAR(20) NULL UNIQUE,
    grade_level ENUM('11', '12') NOT NULL,
    strand ENUM('STEM', 'ABM', 'HUMSS', 'GAS') NOT NULL,
    password VARCHAR(255) NOT NULL,
    newsletter_subscribed BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    password_reset_token VARCHAR(255) NULL,
    password_reset_expires DATETIME NULL,
    otp VARCHAR(10) NULL,
    expiration_otp DATETIME NULL,
    verification_link_token VARCHAR(255) NULL,
    verification_link_expires DATETIME NULL,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_student_id (student_id),
    INDEX idx_strand (strand),
    INDEX idx_created_at (created_at),
    INDEX idx_otp (otp),
    INDEX idx_verification_token (verification_link_token),
    INDEX idx_email_verified (email_verified),
    INDEX idx_password_reset_token (password_reset_token),
    INDEX idx_password_reset_expires (password_reset_expires)
);

-- Remember me tokens table
CREATE TABLE IF NOT EXISTS remember_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);

-- ============================================================================
-- TEACHER TABLES
-- ============================================================================

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    teacher_id VARCHAR(20) NULL UNIQUE,
    department ENUM('Mathematics', 'STEM', 'General Education') NOT NULL,
    subject ENUM('General Mathematics', 'Pre-Calculus', 'Calculus', 'Statistics') NOT NULL,
    experience ENUM('0-2', '3-5', '6-10', '10+') DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT NULL,
    approved_at DATETIME NULL,
    rejection_reason TEXT NULL,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_department (department),
    INDEX idx_subject (subject),
    INDEX idx_approval_status (approval_status),
    INDEX idx_created_at (created_at)
);

-- Teacher remember me tokens table
CREATE TABLE IF NOT EXISTS teacher_remember_tokens (
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
CREATE TABLE IF NOT EXISTS teacher_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    total_students INT DEFAULT 0,
    active_assignments INT DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_average_score (average_score)
);

-- ============================================================================
-- ADMIN TABLES
-- ============================================================================

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

-- ============================================================================
-- CONTENT TABLES (Topics, Lessons, Quizzes)
-- ============================================================================

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    order_index INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_order (order_index)
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    topic_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    video_url VARCHAR(255),
    duration_minutes INT,
    order_index INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    INDEX idx_topic_id (topic_id),
    INDEX idx_order (order_index)
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    topic_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    time_limit_minutes INT DEFAULT 30,
    passing_score INT DEFAULT 70,
    total_questions INT DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    INDEX idx_topic_id (topic_id),
    INDEX idx_difficulty (difficulty_level)
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'fill_blank', 'essay', 'problem_solving') NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INT DEFAULT 1,
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_quiz_id (quiz_id),
    INDEX idx_order (order_index)
);

-- Quiz question options table (for multiple choice questions)
CREATE TABLE IF NOT EXISTS quiz_question_options (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id)
);

-- Quiz settings table
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

-- Quiz status table
CREATE TABLE IF NOT EXISTS quiz_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_type VARCHAR(50) NOT NULL UNIQUE,
    is_open TINYINT(1) DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_quiz_type (quiz_type),
    INDEX idx_is_open (is_open)
);

-- ============================================================================
-- PROGRESS TRACKING TABLES
-- ============================================================================

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_score INT DEFAULT 0,
    completed_lessons INT DEFAULT 0,
    current_topic VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_total_score (total_score)
);

-- User lesson progress table
CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    lesson_id INT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    time_spent_minutes INT DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_lesson (user_id, lesson_id),
    INDEX idx_user_id (user_id),
    INDEX idx_lesson_id (lesson_id),
    INDEX idx_completed (completed)
);

-- User topic progress table
CREATE TABLE IF NOT EXISTS user_topic_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    topic_id INT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    best_score INT DEFAULT 0,
    attempts INT DEFAULT 0,
    last_attempt DATETIME,
    last_step VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_topic (user_id, topic_id),
    INDEX idx_user_id (user_id),
    INDEX idx_topic_id (topic_id),
    INDEX idx_completed (completed)
);

-- Lesson completion table
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

-- Topic progress table
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

-- ============================================================================
-- QUIZ SYSTEM TABLES
-- ============================================================================

-- User quiz attempts table (from original schema)
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    quiz_id INT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    time_taken_minutes INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_quiz_id (quiz_id),
    INDEX idx_started_at (started_at)
);

-- User quiz attempt answers table
CREATE TABLE IF NOT EXISTS user_quiz_attempt_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    quiz_id INT NOT NULL,
    attempt_id INT NOT NULL,
    question_index INT NOT NULL,
    selected_option_index INT NOT NULL,
    correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES user_quiz_attempts(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_quiz_id (quiz_id),
    INDEX idx_attempt_id (attempt_id),
    INDEX idx_question_index (question_index)
);

-- Quiz attempts table (new quiz system)
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    teacher_id INT NULL,
    quiz_type VARCHAR(50) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 15,
    correct_answers INT NOT NULL DEFAULT 0,
    incorrect_answers INT NOT NULL DEFAULT 0,
    completion_time INT NOT NULL DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    last_heartbeat TIMESTAMP NULL,
    status ENUM('in_progress', 'completed', 'abandoned', 'cheating', 'reset') DEFAULT 'in_progress',
    cheating_reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_quiz (student_id, quiz_type),
    INDEX idx_completed_at (completed_at),
    INDEX idx_score (score DESC),
    INDEX idx_quiz_type_score (quiz_type, score DESC),
    INDEX idx_quiz_type_time (quiz_type, completion_time ASC),
    INDEX idx_student_quiz_date (student_id, quiz_type, completed_at)
);

-- Quiz answers table
CREATE TABLE IF NOT EXISTS quiz_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_number INT NOT NULL,
    question_type ENUM('multiple_choice', 'problem_solving') NOT NULL,
    student_answer TEXT,
    correct_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    points_earned INT NOT NULL DEFAULT 0,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    INDEX idx_attempt_question (attempt_id, question_number)
);

-- Cheating incidents table
CREATE TABLE IF NOT EXISTS cheating_incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    INDEX idx_cheating_attempt_id (attempt_id),
    INDEX idx_cheating_detected_at (detected_at)
);

-- ============================================================================
-- CLASS MANAGEMENT TABLES
-- ============================================================================

-- Teacher classes table
CREATE TABLE IF NOT EXISTS teacher_classes (
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

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
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
    INDEX idx_is_active (is_active),
    INDEX idx_classes_teacher_active (teacher_id, is_active)
);

-- Class enrollments table
CREATE TABLE IF NOT EXISTS class_enrollments (
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
    INDEX idx_enrollment_status (enrollment_status),
    INDEX idx_enrollments_status_class (enrollment_status, class_id)
);

-- Enrollment requests table
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

-- Class announcements table
CREATE TABLE IF NOT EXISTS class_announcements (
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

-- Teacher announcements table
CREATE TABLE IF NOT EXISTS teacher_announcements (
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

-- Class assignments table
CREATE TABLE IF NOT EXISTS class_assignments (
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
    INDEX idx_is_published (is_published),
    INDEX idx_assignments_class_published (class_id, is_published)
);

-- Teacher assignments table
CREATE TABLE IF NOT EXISTS teacher_assignments (
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

-- Assignment submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
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
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_submissions_assignment_student (assignment_id, student_id)
);

-- ============================================================================
-- PERFORMANCE TRACKING TABLES
-- ============================================================================

-- Student performance tracking table
CREATE TABLE IF NOT EXISTS student_performance_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    total_score DECIMAL(5,2) DEFAULT 0.00,
    total_lessons_completed INT DEFAULT 0,
    current_topic VARCHAR(100),
    last_activity DATETIME,
    functions_score DECIMAL(5,2) DEFAULT 0.00,
    functions_lessons_completed INT DEFAULT 0,
    functions_quiz_score DECIMAL(5,2) DEFAULT 0.00,
    functions_quiz_attempts INT DEFAULT 0,
    functions_quiz_best_score DECIMAL(5,2) DEFAULT 0.00,
    functions_quiz_status ENUM('NOT_ATTEMPTED', 'FAILED', 'PASSED') DEFAULT 'NOT_ATTEMPTED',
    functions_quiz_last_attempt DATETIME NULL,
    evaluating_functions_score DECIMAL(5,2) DEFAULT 0.00,
    evaluating_functions_lessons_completed INT DEFAULT 0,
    evaluating_functions_quiz_score DECIMAL(5,2) DEFAULT 0.00,
    evaluating_functions_quiz_attempts INT DEFAULT 0,
    evaluating_functions_quiz_best_score DECIMAL(5,2) DEFAULT 0.00,
    evaluating_functions_quiz_status ENUM('NOT_ATTEMPTED', 'FAILED', 'PASSED') DEFAULT 'NOT_ATTEMPTED',
    evaluating_functions_quiz_last_attempt DATETIME NULL,
    operations_on_functions_score DECIMAL(5,2) DEFAULT 0.00,
    operations_on_functions_lessons_completed INT DEFAULT 0,
    operations_on_functions_quiz_score DECIMAL(5,2) DEFAULT 0.00,
    operations_on_functions_quiz_attempts INT DEFAULT 0,
    operations_on_functions_quiz_best_score DECIMAL(5,2) DEFAULT 0.00,
    operations_on_functions_quiz_status ENUM('NOT_ATTEMPTED', 'FAILED', 'PASSED') DEFAULT 'NOT_ATTEMPTED',
    operations_on_functions_quiz_last_attempt DATETIME NULL,
    rational_functions_score DECIMAL(5,2) DEFAULT 0.00,
    rational_functions_lessons_completed INT DEFAULT 0,
    rational_functions_quiz_score DECIMAL(5,2) DEFAULT 0.00,
    rational_functions_quiz_attempts INT DEFAULT 0,
    rational_functions_quiz_best_score DECIMAL(5,2) DEFAULT 0.00,
    rational_functions_quiz_status ENUM('NOT_ATTEMPTED', 'FAILED', 'PASSED') DEFAULT 'NOT_ATTEMPTED',
    rational_functions_quiz_last_attempt DATETIME NULL,
    solving_real_life_problems_score DECIMAL(5,2) DEFAULT 0.00,
    solving_real_life_problems_lessons_completed INT DEFAULT 0,
    solving_real_life_problems_quiz_score DECIMAL(5,2) DEFAULT 0.00,
    solving_real_life_problems_quiz_attempts INT DEFAULT 0,
    solving_real_life_problems_quiz_best_score DECIMAL(5,2) DEFAULT 0.00,
    solving_real_life_problems_quiz_status ENUM('NOT_ATTEMPTED', 'FAILED', 'PASSED') DEFAULT 'NOT_ATTEMPTED',
    solving_real_life_problems_quiz_last_attempt DATETIME NULL,
    total_quiz_attempts INT DEFAULT 0,
    overall_quiz_average DECIMAL(5,2) DEFAULT 0.00,
    passed_quizzes_count INT DEFAULT 0,
    failed_quizzes_count INT DEFAULT 0,
    quiz_pass_rate DECIMAL(5,2) DEFAULT 0.00,
    overall_performance_status ENUM('EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS_IMPROVEMENT', 'POOR') DEFAULT 'NEEDS_IMPROVEMENT',
    engagement_level ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'LOW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_class (student_id, class_id),
    INDEX idx_student_id (student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_total_score (total_score),
    INDEX idx_overall_performance_status (overall_performance_status),
    INDEX idx_last_activity (last_activity),
    INDEX idx_updated_at (updated_at),
    INDEX idx_performance_tracking_composite (class_id, overall_performance_status, last_activity)
);

-- Class performance summary table
CREATE TABLE IF NOT EXISTS class_performance_summary (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    total_students INT DEFAULT 0,
    active_students INT DEFAULT 0,
    approved_students INT DEFAULT 0,
    pending_students INT DEFAULT 0,
    rejected_students INT DEFAULT 0,
    average_total_score DECIMAL(5,2) DEFAULT 0.00,
    average_lessons_completed DECIMAL(5,2) DEFAULT 0.00,
    average_quiz_score DECIMAL(5,2) DEFAULT 0.00,
    total_quiz_attempts INT DEFAULT 0,
    total_passed_quizzes INT DEFAULT 0,
    total_failed_quizzes INT DEFAULT 0,
    overall_quiz_pass_rate DECIMAL(5,2) DEFAULT 0.00,
    functions_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    evaluating_functions_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    operations_on_functions_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    rational_functions_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    solving_real_life_problems_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    excellent_students INT DEFAULT 0,
    good_students INT DEFAULT 0,
    average_students INT DEFAULT 0,
    needs_improvement_students INT DEFAULT 0,
    poor_students INT DEFAULT 0,
    high_engagement_students INT DEFAULT 0,
    medium_engagement_students INT DEFAULT 0,
    low_engagement_students INT DEFAULT 0,
    class_performance_status ENUM('EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS_IMPROVEMENT', 'POOR') DEFAULT 'NEEDS_IMPROVEMENT',
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_class_summary (class_id),
    INDEX idx_class_id (class_id),
    INDEX idx_class_performance_status (class_performance_status),
    INDEX idx_last_calculated_at (last_calculated_at),
    INDEX idx_performance_summary_composite (class_performance_status, last_calculated_at)
);

-- Performance history table
CREATE TABLE IF NOT EXISTS performance_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    total_score DECIMAL(5,2) DEFAULT 0.00,
    total_lessons_completed INT DEFAULT 0,
    overall_quiz_average DECIMAL(5,2) DEFAULT 0.00,
    overall_performance_status ENUM('EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS_IMPROVEMENT', 'POOR') DEFAULT 'NEEDS_IMPROVEMENT',
    score_change DECIMAL(5,2) DEFAULT 0.00,
    lessons_change INT DEFAULT 0,
    quiz_average_change DECIMAL(5,2) DEFAULT 0.00,
    status_change VARCHAR(50),
    change_reason VARCHAR(255),
    recorded_by INT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES teachers(id) ON DELETE SET NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_recorded_at (recorded_at),
    INDEX idx_performance_status (overall_performance_status),
    INDEX idx_performance_history_composite (student_id, recorded_at, overall_performance_status)
);

-- Performance analytics table
CREATE TABLE IF NOT EXISTS performance_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    teacher_id INT NOT NULL,
    analytics_period_start DATE NOT NULL,
    analytics_period_end DATE NOT NULL,
    average_score_trend ENUM('IMPROVING', 'STABLE', 'DECLINING') DEFAULT 'STABLE',
    engagement_trend ENUM('INCREASING', 'STABLE', 'DECREASING') DEFAULT 'STABLE',
    completion_rate_trend ENUM('IMPROVING', 'STABLE', 'DECLINING') DEFAULT 'STABLE',
    top_performing_topic VARCHAR(100),
    struggling_topic VARCHAR(100),
    most_engaged_topic VARCHAR(100),
    least_engaged_topic VARCHAR(100),
    improvement_recommendations TEXT,
    intervention_needed BOOLEAN DEFAULT FALSE,
    intervention_priority ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'LOW',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_class_id (class_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_analytics_period (analytics_period_start, analytics_period_end),
    INDEX idx_calculated_at (calculated_at)
);

-- Teacher analytics table
CREATE TABLE IF NOT EXISTS teacher_analytics (
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

-- ============================================================================
-- BADGES AND ACHIEVEMENTS
-- ============================================================================

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    criteria_type ENUM('score', 'lessons', 'quizzes', 'streak') NOT NULL,
    criteria_value INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_user_id (user_id),
    INDEX idx_badge_id (badge_id)
);

-- ============================================================================
-- TOPIC LOCKS
-- ============================================================================

-- Topic locks table
CREATE TABLE IF NOT EXISTS topic_locks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    class_id INT NULL,
    topic_id VARCHAR(50) NOT NULL,
    topic_name VARCHAR(100) NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_by INT NOT NULL,
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unlocked_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (locked_by) REFERENCES teachers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_teacher_topic (teacher_id, topic_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_topic_id (topic_id),
    INDEX idx_is_locked (is_locked)
);

-- Class topic locks table
CREATE TABLE IF NOT EXISTS class_topic_locks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    class_id INT NOT NULL,
    is_locked TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_class_topic (topic_id, class_id),
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    INDEX idx_class_topic_locks_class_id (class_id),
    INDEX idx_class_topic_locks_topic_id (topic_id),
    INDEX idx_class_topic_locks_is_locked (is_locked)
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at DESC)
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email_notifications BOOLEAN DEFAULT TRUE,
    class_notifications BOOLEAN DEFAULT TRUE,
    quiz_notifications BOOLEAN DEFAULT TRUE,
    assignment_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_preference_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preferences (user_id)
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- User dashboard view
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.student_id,
    u.grade_level,
    u.strand,
    up.total_score,
    up.completed_lessons,
    up.current_topic,
    COUNT(DISTINCT ub.badge_id) as badges_earned,
    COUNT(DISTINCT uqa.quiz_id) as quizzes_taken,
    AVG(uqa.score) as average_quiz_score
FROM users u
LEFT JOIN user_progress up ON u.id = up.user_id
LEFT JOIN user_badges ub ON u.id = ub.user_id
LEFT JOIN user_quiz_attempts uqa ON u.id = uqa.user_id
GROUP BY u.id;

-- Topic statistics view
CREATE OR REPLACE VIEW topic_statistics AS
SELECT 
    t.id,
    t.name,
    t.difficulty_level,
    COUNT(DISTINCT ulp.user_id) as users_started,
    COUNT(DISTINCT CASE WHEN ulp.completed = 1 THEN ulp.user_id END) as users_completed,
    AVG(CASE WHEN ulp.completed = 1 THEN ulp.time_spent_minutes END) as avg_completion_time
FROM topics t
LEFT JOIN lessons l ON t.id = l.topic_id
LEFT JOIN user_lesson_progress ulp ON l.id = ulp.lesson_id
GROUP BY t.id;

-- Teacher dashboard view
CREATE OR REPLACE VIEW teacher_dashboard AS
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

-- Class performance analytics view
CREATE OR REPLACE VIEW class_performance_analytics AS
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

-- Quiz leaderboard view
CREATE OR REPLACE VIEW quiz_leaderboard AS
SELECT 
    qa.id as attempt_id,
    u.id as student_id,
    CONCAT(u.first_name, ' ', u.last_name) as student_name,
    qa.score,
    qa.total_questions,
    ROUND((qa.score / qa.total_questions) * 100, 1) as percentage,
    qa.completion_time,
    TIME_FORMAT(SEC_TO_TIME(qa.completion_time), '%i:%s') as formatted_time,
    qa.completed_at,
    DATE(qa.completed_at) as quiz_date,
    qa.quiz_type,
    qa.cheating_reason,
    ce.class_id,
    c.class_name,
    c.class_code,
    c.teacher_id,
    CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
    ROW_NUMBER() OVER (
        PARTITION BY qa.quiz_type, c.teacher_id 
        ORDER BY qa.score DESC, qa.completion_time ASC
    ) as rank_position
FROM quiz_attempts qa
JOIN users u ON qa.student_id = u.id
LEFT JOIN class_enrollments ce ON u.id = ce.student_id AND ce.enrollment_status = 'approved'
LEFT JOIN classes c ON ce.class_id = c.id AND c.is_active = TRUE
LEFT JOIN teachers t ON c.teacher_id = t.id
WHERE qa.status = 'completed' 
    AND qa.completed_at IS NOT NULL
    AND ce.id IS NOT NULL
ORDER BY qa.quiz_type, c.teacher_id, qa.score DESC, qa.completion_time ASC;

-- Quiz statistics view
CREATE OR REPLACE VIEW quiz_statistics AS
SELECT 
    quiz_type,
    COUNT(*) as total_attempts,
    COUNT(DISTINCT student_id) as unique_students,
    AVG(score) as average_score,
    AVG(completion_time) as average_time,
    MAX(score) as highest_score,
    MIN(completion_time) as fastest_time,
    ROUND(AVG((score / total_questions) * 100), 1) as average_percentage
FROM quiz_attempts 
WHERE status = 'completed' 
    AND completed_at IS NOT NULL
GROUP BY quiz_type;

-- Admin dashboard view
CREATE OR REPLACE VIEW admin_dashboard AS
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

-- Class student list view
CREATE OR REPLACE VIEW class_student_list AS
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

-- Student class enrollments view
CREATE OR REPLACE VIEW student_class_enrollments AS
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

-- Student performance view
CREATE OR REPLACE VIEW student_performance_view AS
SELECT 
    spt.*,
    u.first_name,
    u.last_name,
    u.student_id as student_number,
    u.email,
    c.class_name,
    c.class_code,
    ce.enrollment_status,
    ce.enrolled_at,
    ce.approved_at
FROM student_performance_tracking spt
JOIN users u ON spt.student_id = u.id
JOIN classes c ON spt.class_id = c.id
JOIN class_enrollments ce ON spt.student_id = ce.student_id AND spt.class_id = ce.class_id;

-- Class performance overview view
CREATE OR REPLACE VIEW class_performance_overview AS
SELECT 
    cps.*,
    c.class_name,
    c.class_code,
    c.grade_level,
    c.strand,
    t.first_name as teacher_first_name,
    t.last_name as teacher_last_name
FROM class_performance_summary cps
JOIN classes c ON cps.class_id = c.id
JOIN teachers t ON c.teacher_id = t.id;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

DELIMITER //

-- Procedure to calculate class performance summary
CREATE PROCEDURE IF NOT EXISTS CalculateClassPerformanceSummary(IN p_class_id INT)
BEGIN
    DECLARE v_total_students INT DEFAULT 0;
    DECLARE v_active_students INT DEFAULT 0;
    DECLARE v_approved_students INT DEFAULT 0;
    DECLARE v_pending_students INT DEFAULT 0;
    DECLARE v_rejected_students INT DEFAULT 0;
    DECLARE v_average_total_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_average_lessons_completed DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_average_quiz_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_total_quiz_attempts INT DEFAULT 0;
    DECLARE v_total_passed_quizzes INT DEFAULT 0;
    DECLARE v_total_failed_quizzes INT DEFAULT 0;
    DECLARE v_overall_quiz_pass_rate DECIMAL(5,2) DEFAULT 0.00;
    
    SELECT 
        COUNT(*) as total_students,
        COUNT(CASE WHEN enrollment_status = 'approved' THEN 1 END) as approved_students,
        COUNT(CASE WHEN enrollment_status = 'pending' THEN 1 END) as pending_students,
        COUNT(CASE WHEN enrollment_status = 'rejected' THEN 1 END) as rejected_students,
        COUNT(CASE WHEN spt.total_lessons_completed > 0 THEN 1 END) as active_students
    INTO v_total_students, v_approved_students, v_pending_students, v_rejected_students, v_active_students
    FROM class_enrollments ce
    LEFT JOIN student_performance_tracking spt ON ce.student_id = spt.student_id AND ce.class_id = spt.class_id
    WHERE ce.class_id = p_class_id;
    
    SELECT 
        COALESCE(AVG(spt.total_score), 0) as avg_score,
        COALESCE(AVG(spt.total_lessons_completed), 0) as avg_lessons,
        COALESCE(AVG(spt.overall_quiz_average), 0) as avg_quiz_score,
        COALESCE(SUM(spt.total_quiz_attempts), 0) as total_attempts,
        COALESCE(SUM(spt.passed_quizzes_count), 0) as total_passed,
        COALESCE(SUM(spt.failed_quizzes_count), 0) as total_failed
    INTO v_average_total_score, v_average_lessons_completed, v_average_quiz_score, 
         v_total_quiz_attempts, v_total_passed_quizzes, v_total_failed_quizzes
    FROM student_performance_tracking spt
    WHERE spt.class_id = p_class_id;
    
    IF v_total_quiz_attempts > 0 THEN
        SET v_overall_quiz_pass_rate = (v_total_passed_quizzes / v_total_quiz_attempts) * 100;
    END IF;
    
    INSERT INTO class_performance_summary (
        class_id, total_students, active_students, approved_students, pending_students, rejected_students,
        average_total_score, average_lessons_completed, average_quiz_score,
        total_quiz_attempts, total_passed_quizzes, total_failed_quizzes, overall_quiz_pass_rate,
        last_calculated_at
    )
    VALUES (
        p_class_id, v_total_students, v_active_students, v_approved_students, v_pending_students, v_rejected_students,
        v_average_total_score, v_average_lessons_completed, v_average_quiz_score,
        v_total_quiz_attempts, v_total_passed_quizzes, v_total_failed_quizzes, v_overall_quiz_pass_rate,
        NOW()
    )
    ON DUPLICATE KEY UPDATE
        total_students = v_total_students,
        active_students = v_active_students,
        approved_students = v_approved_students,
        pending_students = v_pending_students,
        rejected_students = v_rejected_students,
        average_total_score = v_average_total_score,
        average_lessons_completed = v_average_lessons_completed,
        average_quiz_score = v_average_quiz_score,
        total_quiz_attempts = v_total_quiz_attempts,
        total_passed_quizzes = v_total_passed_quizzes,
        total_failed_quizzes = v_total_failed_quizzes,
        overall_quiz_pass_rate = v_overall_quiz_pass_rate,
        last_calculated_at = NOW(),
        updated_at = NOW();
END//

-- Procedure to update overall performance status for a student
CREATE PROCEDURE IF NOT EXISTS UpdateStudentPerformanceStatus(IN p_student_id INT, IN p_class_id INT)
BEGIN
    DECLARE v_total_score DECIMAL(5,2);
    DECLARE v_quiz_average DECIMAL(5,2);
    DECLARE v_lessons_completed INT;
    DECLARE v_performance_status VARCHAR(20);
    DECLARE v_engagement_level VARCHAR(10);
    
    SELECT 
        total_score, overall_quiz_average, total_lessons_completed
    INTO v_total_score, v_quiz_average, v_lessons_completed
    FROM student_performance_tracking
    WHERE student_id = p_student_id AND class_id = p_class_id;
    
    IF v_total_score >= 90 AND v_quiz_average >= 85 AND v_lessons_completed >= 15 THEN
        SET v_performance_status = 'EXCELLENT';
        SET v_engagement_level = 'HIGH';
    ELSEIF v_total_score >= 80 AND v_quiz_average >= 75 AND v_lessons_completed >= 12 THEN
        SET v_performance_status = 'GOOD';
        SET v_engagement_level = 'HIGH';
    ELSEIF v_total_score >= 70 AND v_quiz_average >= 65 AND v_lessons_completed >= 8 THEN
        SET v_performance_status = 'AVERAGE';
        SET v_engagement_level = 'MEDIUM';
    ELSEIF v_total_score >= 60 AND v_quiz_average >= 55 AND v_lessons_completed >= 5 THEN
        SET v_performance_status = 'NEEDS_IMPROVEMENT';
        SET v_engagement_level = 'MEDIUM';
    ELSE
        SET v_performance_status = 'POOR';
        SET v_engagement_level = 'LOW';
    END IF;
    
    UPDATE student_performance_tracking
    SET 
        overall_performance_status = v_performance_status,
        engagement_level = v_engagement_level,
        updated_at = NOW()
    WHERE student_id = p_student_id AND class_id = p_class_id;
END//

DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- Trigger to update student performance when quiz is completed
CREATE TRIGGER IF NOT EXISTS update_student_performance_after_quiz
AFTER INSERT ON quiz_attempts
FOR EACH ROW
BEGIN
    DECLARE student_class_id INT;
    DECLARE quiz_percentage DECIMAL(5,2);
    
    IF NEW.status = 'completed' AND NEW.completed_at IS NOT NULL THEN
        SELECT class_id INTO student_class_id
        FROM class_enrollments 
        WHERE student_id = NEW.student_id AND enrollment_status = 'approved'
        LIMIT 1;
        
        IF student_class_id IS NOT NULL THEN
            SET quiz_percentage = (NEW.score / NEW.total_questions) * 100;
            
            INSERT INTO student_performance_tracking (
                student_id, class_id, last_activity,
                functions_quiz_score, functions_quiz_attempts, functions_quiz_best_score, 
                functions_quiz_status, functions_quiz_last_attempt
            )
            VALUES (
                NEW.student_id, student_class_id, NOW(),
                quiz_percentage, 1, quiz_percentage,
                CASE WHEN quiz_percentage >= 70 THEN 'PASSED' ELSE 'FAILED' END, NOW()
            )
            ON DUPLICATE KEY UPDATE
                last_activity = NOW(),
                functions_quiz_score = quiz_percentage,
                functions_quiz_attempts = functions_quiz_attempts + 1,
                functions_quiz_best_score = GREATEST(functions_quiz_best_score, quiz_percentage),
                functions_quiz_status = CASE WHEN GREATEST(functions_quiz_best_score, quiz_percentage) >= 70 THEN 'PASSED' ELSE 'FAILED' END,
                functions_quiz_last_attempt = NOW(),
                updated_at = NOW();
        END IF;
    END IF;
END//

DELIMITER ;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample topics
INSERT IGNORE INTO topics (name, description, difficulty_level, order_index) VALUES
('Functions', 'Linear, quadratic, polynomial, rational, and exponential functions', 'beginner', 1),
('Polynomial Equations', 'Solving polynomial equations, factoring, and the Remainder Theorem', 'beginner', 2),
('Trigonometry', 'Trigonometric functions, identities, and solving trigonometric equations', 'intermediate', 3),
('Rational Expressions', 'Simplifying, adding, subtracting, multiplying, and dividing rational expressions', 'intermediate', 4),
('Complex Numbers', 'Operations with complex numbers and solving complex equations', 'advanced', 5),
('Conic Sections', 'Circles, ellipses, hyperbolas, and parabolas', 'advanced', 6),
('Rational Functions', 'Master the fundamentals of rational functions including domain analysis, graphing, equation solving, and inequality solving.', 'intermediate', 6),
('Representations of Rational Functions', 'Master the different ways to represent rational functions through algebraic, graphical, and tabular forms.', 'intermediate', 7),
('One-to-One Functions', 'Master the concept of one-to-one functions. Learn to identify injective functions, understand their properties, and explore their relationship with inverse functions.', 'intermediate', 9);

-- Insert sample badges
INSERT IGNORE INTO badges (name, description, criteria_type, criteria_value, is_active) VALUES
('First Steps', 'Complete your first lesson', 'lessons', 1, 1),
('Quiz Master', 'Score 100% on any quiz', 'score', 100, 1),
('Dedicated Learner', 'Complete 10 lessons', 'lessons', 10, 1),
('Perfect Score', 'Get perfect scores on 5 quizzes', 'quizzes', 5, 1),
('Math Wizard', 'Achieve a total score of 1000 points', 'score', 1000, 1),
('Streak Master', 'Maintain a 7-day learning streak', 'streak', 7, 1),
('Functions Achiever', 'Score 50% or higher on the Functions quiz', 'score', 50, 1),
('Real-Life Problems Solver', 'Score 50% or higher on the Solving Real-Life Problems quiz', 'score', 50, 1),
('Real-Life Problems Master', 'Master real-life problem solving with 80%+ score', 'score', 80, 1),
('Real-Life Problems Champion', 'Excel in real-life problem solving with 90%+ score', 'score', 90, 1);

-- Insert default admin account
INSERT IGNORE INTO admins (first_name, last_name, email, password, role) VALUES
('Admin', 'MathEase', 'matheasenc@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin');

-- Insert default quiz settings
INSERT IGNORE INTO quiz_settings (quiz_type, deadline, time_limit, is_open) VALUES
('functions', DATE_ADD(NOW(), INTERVAL 7 DAY), 20, 1),
('evaluating-functions', DATE_ADD(NOW(), INTERVAL 7 DAY), 20, 1),
('operations-on-functions', DATE_ADD(NOW(), INTERVAL 7 DAY), 20, 1),
('real-life-problems', DATE_ADD(NOW(), INTERVAL 7 DAY), 20, 1),
('rational-functions', DATE_ADD(NOW(), INTERVAL 7 DAY), 20, 1);

-- Insert default quiz status
INSERT IGNORE INTO quiz_status (quiz_type, is_open) VALUES
('functions', 1),
('evaluating-functions', 1),
('operations-on-functions', 1),
('real-life-problems', 1),
('rational-functions', 1);

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

ALTER TABLE users COMMENT = 'Stores student account information and credentials';
ALTER TABLE teachers COMMENT = 'Stores teacher account information and credentials';
ALTER TABLE admins COMMENT = 'Stores admin account information for managing teacher approvals';
ALTER TABLE teacher_profiles COMMENT = 'Stores teacher profile and statistics data';
ALTER TABLE teacher_classes COMMENT = 'Stores teacher class information and management';
ALTER TABLE classes COMMENT = 'Stores class information with unique class codes';
ALTER TABLE class_enrollments COMMENT = 'Stores student enrollments in classes';
ALTER TABLE student_performance_tracking COMMENT = 'Comprehensive student performance tracking independent of quiz management';
ALTER TABLE class_performance_summary COMMENT = 'Class-level performance summaries and statistics';
ALTER TABLE performance_history COMMENT = 'Historical performance data for trend analysis';
ALTER TABLE performance_analytics COMMENT = 'Advanced analytics and insights for class performance';
ALTER TABLE quiz_attempts COMMENT = 'Quiz attempts with anti-cheating monitoring support';
ALTER TABLE admin_activity_log COMMENT = 'Stores admin activity logs for audit trail';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
