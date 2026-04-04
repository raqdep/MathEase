<?php
/**
 * Ensures teacher_lessons exists and has class_id for per-class PDF lessons.
 */
function ensure_teacher_lessons_schema(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS teacher_lessons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            class_id INT NULL DEFAULT NULL,
            title VARCHAR(255) NOT NULL,
            topic VARCHAR(100) NOT NULL,
            html_content LONGTEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_teacher (teacher_id),
            INDEX idx_teacher_lessons_class (class_id),
            INDEX idx_topic (topic)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    try {
        $r = $pdo->query("SHOW COLUMNS FROM teacher_lessons LIKE 'class_id'");
        if ($r && $r->rowCount() === 0) {
            $pdo->exec("ALTER TABLE teacher_lessons ADD COLUMN class_id INT NULL DEFAULT NULL AFTER teacher_id");
            $pdo->exec("ALTER TABLE teacher_lessons ADD INDEX idx_teacher_lessons_class (class_id)");
        }
    } catch (Throwable $e) {
        error_log('ensure_teacher_lessons_schema: ' . $e->getMessage());
    }
}
