-- MathEase: system maintenance / update mode
-- Target database: mathease_database3 (run this file against that schema only)

USE mathease_database3;

CREATE TABLE IF NOT EXISTS system_maintenance (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
    is_active TINYINT(1) NOT NULL DEFAULT 0,
    title VARCHAR(255) NOT NULL DEFAULT '',
    public_message TEXT NULL,
    scheduled_start_at DATETIME NULL,
    scheduled_end_at DATETIME NULL,
    estimated_end_at DATETIME NULL,
    started_at DATETIME NULL,
    ended_at DATETIME NULL,
    updated_by_admin_id INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO system_maintenance (id, is_active, title, public_message)
VALUES (1, 0, '', '')
ON DUPLICATE KEY UPDATE id = id;
