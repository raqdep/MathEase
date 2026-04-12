<?php

declare(strict_types=1);

function quiz_gen_ensure_schema(PDO $pdo): void
{
    try {
        $pdo->exec("
CREATE TABLE IF NOT EXISTS teacher_generated_quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    class_id INT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled Quiz',
    public_slug VARCHAR(40) NOT NULL,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    tos_json MEDIUMTEXT NULL,
    topics_json MEDIUMTEXT NULL,
    questions_json MEDIUMTEXT NULL,
    extracted_text MEDIUMTEXT NULL,
    pdf_storage_path VARCHAR(512) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at DATETIME NULL,
    UNIQUE KEY uq_teacher_slug (teacher_id, public_slug),
    KEY idx_teacher_status (teacher_id, status),
    KEY idx_class_published (class_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
CREATE TABLE IF NOT EXISTS generated_quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    answers_json MEDIUMTEXT NOT NULL,
    results_json MEDIUMTEXT NULL,
    questions_order_json MEDIUMTEXT NULL,
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_quiz (quiz_id),
    KEY idx_student_quiz (student_id, quiz_id),
    CONSTRAINT fk_gen_quiz FOREIGN KEY (quiz_id) REFERENCES teacher_generated_quizzes(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    } catch (PDOException $e) {
        error_log('[QuizGen schema] ' . $e->getMessage());
        quiz_gen_json([
            'success' => false,
            'message' => 'Database setup failed. Check the server error log.',
        ], 500);
    }

    // Older installs may have TEXT (64KB) columns; large AI output exceeds that and UPDATE fails with SQLSTATE 22001 / 1406.
    try {
        $pdo->exec('
            ALTER TABLE teacher_generated_quizzes
                MODIFY COLUMN topics_json MEDIUMTEXT NULL,
                MODIFY COLUMN tos_json MEDIUMTEXT NULL,
                MODIFY COLUMN questions_json MEDIUMTEXT NULL,
                MODIFY COLUMN extracted_text MEDIUMTEXT NULL
        ');
    } catch (PDOException $e) {
        error_log('[QuizGen schema widen columns] ' . $e->getMessage());
    }

    try {
        $r = $pdo->query("SHOW COLUMNS FROM teacher_generated_quizzes LIKE 'visible_to_students'");
        if ($r && !$r->fetch()) {
            $pdo->exec('ALTER TABLE teacher_generated_quizzes ADD COLUMN visible_to_students TINYINT(1) NOT NULL DEFAULT 0 AFTER status');
            $pdo->exec('UPDATE teacher_generated_quizzes SET visible_to_students = 1 WHERE status = \'published\'');
        }
    } catch (PDOException $e) {
        error_log('[QuizGen schema visible_to_students] ' . $e->getMessage());
    }
}
