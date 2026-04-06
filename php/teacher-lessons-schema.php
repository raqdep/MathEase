<?php
/**
 * Ensures teacher_lessons exists; adds published flag, teacher_lesson_classes junction,
 * and helpers for multi-class assignment + publish state.
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
        error_log('ensure_teacher_lessons_schema class_id: ' . $e->getMessage());
    }

    try {
        $r = $pdo->query("SHOW COLUMNS FROM teacher_lessons LIKE 'published'");
        if ($r && $r->rowCount() === 0) {
            $pdo->exec("ALTER TABLE teacher_lessons ADD COLUMN published TINYINT(1) NOT NULL DEFAULT 1 AFTER html_content");
            $pdo->exec("ALTER TABLE teacher_lessons ADD INDEX idx_teacher_published (teacher_id, published)");
        }
    } catch (Throwable $e) {
        error_log('ensure_teacher_lessons_schema published: ' . $e->getMessage());
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS teacher_lesson_classes (
            lesson_id INT NOT NULL,
            class_id INT NOT NULL,
            PRIMARY KEY (lesson_id, class_id),
            INDEX idx_tlc_class (class_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    try {
        $chk = $pdo->query("
            SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'teacher_lesson_classes'
              AND CONSTRAINT_NAME = 'fk_tlc_lesson'
        ");
        if ($chk && $chk->rowCount() === 0) {
            $pdo->exec("
                ALTER TABLE teacher_lesson_classes
                ADD CONSTRAINT fk_tlc_lesson
                FOREIGN KEY (lesson_id) REFERENCES teacher_lessons(id) ON DELETE CASCADE
            ");
        }
    } catch (Throwable $e) {
        error_log('ensure_teacher_lessons_schema fk_tlc_lesson: ' . $e->getMessage());
    }

    try {
        $pdo->exec("
            INSERT IGNORE INTO teacher_lesson_classes (lesson_id, class_id)
            SELECT id, class_id FROM teacher_lessons
            WHERE class_id IS NOT NULL AND class_id > 0
        ");
    } catch (Throwable $e) {
        error_log('ensure_teacher_lessons_schema migrate junction: ' . $e->getMessage());
    }
}

/**
 * @return int[]
 */
function get_teacher_active_class_ids(PDO $pdo, int $teacherId): array
{
    $st = $pdo->prepare("SELECT id FROM classes WHERE teacher_id = ? AND is_active = TRUE ORDER BY id ASC");
    $st->execute([$teacherId]);
    return array_map('intval', array_column($st->fetchAll(PDO::FETCH_ASSOC), 'id'));
}

/**
 * @param int[] $classIds
 */
function validate_class_ids_for_teacher(PDO $pdo, int $teacherId, array $classIds): bool
{
    $ids = array_values(array_unique(array_filter(array_map('intval', $classIds))));
    if (empty($ids)) {
        return false;
    }
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $sql = "SELECT COUNT(*) FROM classes WHERE teacher_id = ? AND is_active = TRUE AND id IN ($placeholders)";
    $st = $pdo->prepare($sql);
    $st->execute(array_merge([$teacherId], $ids));
    return (int) $st->fetchColumn() === count($ids);
}

/**
 * @param int[] $classIds
 */
function replace_teacher_lesson_class_assignments(PDO $pdo, int $lessonId, array $classIds): void
{
    $ids = array_values(array_unique(array_filter(array_map('intval', $classIds))));
    $del = $pdo->prepare("DELETE FROM teacher_lesson_classes WHERE lesson_id = ?");
    $del->execute([$lessonId]);
    if (empty($ids)) {
        return;
    }
    $ins = $pdo->prepare("INSERT INTO teacher_lesson_classes (lesson_id, class_id) VALUES (?, ?)");
    foreach ($ids as $cid) {
        if ($cid > 0) {
            $ins->execute([$lessonId, $cid]);
        }
    }
}

/**
 * @return int[]
 */
function get_lesson_assigned_class_ids(PDO $pdo, int $lessonId): array
{
    $st = $pdo->prepare("SELECT class_id FROM teacher_lesson_classes WHERE lesson_id = ? ORDER BY class_id ASC");
    $st->execute([$lessonId]);
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($rows)) {
        return array_map('intval', array_column($rows, 'class_id'));
    }
    $st2 = $pdo->prepare("SELECT class_id FROM teacher_lessons WHERE id = ?");
    $st2->execute([$lessonId]);
    $row = $st2->fetch(PDO::FETCH_ASSOC);
    $cid = isset($row['class_id']) ? (int) $row['class_id'] : 0;
    return $cid > 0 ? [$cid] : [];
}
