-- MathEase Database Schema
-- Database: mathease_db
-- Created for Grade 11 STEM Pre-Calculus Learning Platform

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS mathease_db;
USE mathease_db;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    grade_level ENUM('11', '12') NOT NULL,
    strand ENUM('STEM', 'ABM', 'HUMSS', 'GAS') NOT NULL,
    password VARCHAR(255) NOT NULL,
    newsletter_subscribed BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_student_id (student_id),
    INDEX idx_strand (strand)
);

-- Remember me tokens table
CREATE TABLE remember_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);

-- User progress table
CREATE TABLE user_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_score INT DEFAULT 0,
    completed_lessons INT DEFAULT 0,
    current_topic VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Topics table
CREATE TABLE topics (
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
CREATE TABLE lessons (
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
CREATE TABLE quizzes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    topic_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    time_limit_minutes INT DEFAULT 30,
    passing_score INT DEFAULT 70,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    INDEX idx_topic_id (topic_id),
    INDEX idx_difficulty (difficulty_level)
);

-- Quiz questions table
CREATE TABLE quiz_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'fill_blank', 'essay') NOT NULL,
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
CREATE TABLE quiz_question_options (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id)
);

-- User quiz attempts table
CREATE TABLE user_quiz_attempts (
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

-- User quiz attempt answers table (for storing individual question responses)
CREATE TABLE user_quiz_attempt_answers (
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

-- User lesson progress table
CREATE TABLE user_lesson_progress (
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
    INDEX idx_lesson_id (lesson_id)
);

-- User topic progress table
CREATE TABLE user_topic_progress (
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
    INDEX idx_topic_id (topic_id)
);

-- Badges table
CREATE TABLE badges (
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
CREATE TABLE user_badges (
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

-- Insert sample topics
INSERT INTO topics (name, description, difficulty_level, order_index) VALUES
('Functions', 'Linear, quadratic, polynomial, rational, and exponential functions', 'beginner', 1),
('Polynomial Equations', 'Solving polynomial equations, factoring, and the Remainder Theorem', 'beginner', 2),
('Trigonometry', 'Trigonometric functions, identities, and solving trigonometric equations', 'intermediate', 3),
('Rational Expressions', 'Simplifying, adding, subtracting, multiplying, and dividing rational expressions', 'intermediate', 4),
('Complex Numbers', 'Operations with complex numbers and solving complex equations', 'advanced', 5),
('Conic Sections', 'Circles, ellipses, hyperbolas, and parabolas', 'advanced', 6);

-- Insert sample badges
INSERT INTO badges (name, description, criteria_type, criteria_value) VALUES
('First Steps', 'Complete your first lesson', 'lessons', 1),
('Quiz Master', 'Score 100% on any quiz', 'score', 100),
('Dedicated Learner', 'Complete 10 lessons', 'lessons', 10),
('Perfect Score', 'Get perfect scores on 5 quizzes', 'quizzes', 5),
('Math Wizard', 'Achieve a total score of 1000 points', 'score', 1000),
('Streak Master', 'Maintain a 7-day learning streak', 'streak', 7);

-- Insert sample lessons for Functions topic
INSERT INTO lessons (topic_id, title, content, duration_minutes, order_index) VALUES
(1, 'Introduction to Functions', 'A function is a relation between a set of inputs and a set of outputs where each input is related to exactly one output. In this lesson, we will explore the basic concepts of functions, their notation, and how to evaluate them.', 45, 1),
(1, 'Linear Functions', 'Linear functions are functions whose graphs are straight lines. They have the form f(x) = mx + b, where m is the slope and b is the y-intercept.', 60, 2),
(1, 'Quadratic Functions', 'Quadratic functions are functions of the form f(x) = ax² + bx + c, where a ≠ 0. Their graphs are parabolas.', 75, 3);

-- Insert sample quiz for Functions topic
INSERT INTO quizzes (topic_id, title, description, difficulty_level, time_limit_minutes, passing_score) VALUES
(1, 'Functions Basics Quiz', 'Test your understanding of basic function concepts', 'beginner', 20, 70);

-- Insert sample questions for the Functions quiz
INSERT INTO quiz_questions (quiz_id, question_text, question_type, correct_answer, explanation, points, order_index) VALUES
(1, 'What is a function?', 'multiple_choice', 'A relation where each input has exactly one output', 'A function is a special type of relation where each input value corresponds to exactly one output value.', 1, 1),
(1, 'What is the general form of a linear function?', 'multiple_choice', 'f(x) = mx + b', 'Linear functions have the form f(x) = mx + b where m is the slope and b is the y-intercept.', 1, 2),
(1, 'What shape is the graph of a quadratic function?', 'multiple_choice', 'Parabola', 'Quadratic functions always graph as parabolas, which are U-shaped curves.', 1, 3);

-- Insert options for multiple choice questions
INSERT INTO quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
(1, 'A relation where each input has exactly one output', TRUE, 1),
(1, 'A relation where each input has multiple outputs', FALSE, 2),
(1, 'A relation where outputs are not related to inputs', FALSE, 3),
(1, 'A mathematical expression without variables', FALSE, 4),
(2, 'f(x) = mx + b', TRUE, 1),
(2, 'f(x) = x² + c', FALSE, 2),
(2, 'f(x) = sin(x)', FALSE, 3),
(2, 'f(x) = log(x)', FALSE, 4),
(3, 'Parabola', TRUE, 1),
(3, 'Straight line', FALSE, 2),
(3, 'Circle', FALSE, 3),
(3, 'Triangle', FALSE, 4);

-- Create indexes for better performance
CREATE INDEX idx_users_created ON users(created_at);
CREATE INDEX idx_user_progress_score ON user_progress(total_score);
CREATE INDEX idx_quiz_attempts_score ON user_quiz_attempts(score);
CREATE INDEX idx_lesson_progress_completed ON user_lesson_progress(completed);
CREATE INDEX idx_topic_progress_completed ON user_topic_progress(completed);

-- Create view for user dashboard data
CREATE VIEW user_dashboard AS
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

-- Create view for topic statistics
CREATE VIEW topic_statistics AS
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
