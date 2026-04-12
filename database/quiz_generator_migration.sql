-- Teacher PDF → TOS quiz generator (MathEase)
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS teacher_generated_quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    class_id INT NULL COMMENT 'Target class when published',
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled Quiz',
    public_slug VARCHAR(40) NOT NULL,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    tos_json MEDIUMTEXT NULL COMMENT 'Table of specification JSON',
    topics_json MEDIUMTEXT NULL COMMENT 'Segmented topics from PDF',
    questions_json MEDIUMTEXT NULL COMMENT 'Draft or published questions (teacher-edited)',
    extracted_text MEDIUMTEXT NULL COMMENT 'Truncated PDF text used for generation',
    pdf_storage_path VARCHAR(512) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at DATETIME NULL,
    UNIQUE KEY uq_teacher_slug (teacher_id, public_slug),
    KEY idx_teacher_status (teacher_id, status),
    KEY idx_class_published (class_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS generated_quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    answers_json MEDIUMTEXT NOT NULL,
    results_json MEDIUMTEXT NULL COMMENT 'Per-question grading + feedback',
    questions_order_json MEDIUMTEXT NULL COMMENT 'Shuffled order indices',
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_quiz (quiz_id),
    KEY idx_student_quiz (student_id, quiz_id),
    CONSTRAINT fk_gen_quiz FOREIGN KEY (quiz_id) REFERENCES teacher_generated_quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
