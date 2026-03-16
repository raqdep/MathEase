-- Create student_badges table (used by quiz reset and badge system)
-- Code expects: student_id, badge_id, quiz_attempt_id (nullable)
USE mathease_database3;

-- Badges table (if not exists)
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

-- Student badges (links students to badges; used by quiz reset and badge-management)
CREATE TABLE IF NOT EXISTS student_badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    badge_id INT NOT NULL,
    quiz_attempt_id INT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_badge_id (badge_id),
    INDEX idx_quiz_attempt_id (quiz_attempt_id),
    UNIQUE KEY unique_student_badge (student_id, badge_id)
);
