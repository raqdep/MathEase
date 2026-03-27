-- Add teacher_notifications for existing mathease_database3 installs that lack this table.
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS).

USE mathease_database3;

CREATE TABLE IF NOT EXISTS teacher_notifications (
    id INT(11) NOT NULL AUTO_INCREMENT,
    teacher_id INT(11) NOT NULL,
    class_id INT(11) DEFAULT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_teacher_notifications_teacher_id (teacher_id),
    KEY idx_teacher_notifications_class_id (class_id),
    KEY idx_teacher_notifications_is_read (is_read),
    KEY idx_teacher_notifications_created_at (created_at),
    CONSTRAINT fk_teacher_notifications_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    CONSTRAINT fk_teacher_notifications_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
