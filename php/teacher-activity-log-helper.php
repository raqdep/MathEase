<?php
/**
 * Central teacher audit trail for admin "View activity".
 * Call log_teacher_activity() after successful actions. DDL stays in ensure_* only (never inside app transactions).
 */

function ensure_teacher_activity_log_table(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS teacher_activity_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            action VARCHAR(100) NOT NULL,
            details TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_teacher (teacher_id),
            INDEX idx_action (action),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function log_teacher_activity(PDO $pdo, int $teacherId, string $action, ?string $details = null): void
{
    if ($teacherId <= 0 || $action === '') {
        return;
    }
    try {
        ensure_teacher_activity_log_table($pdo);
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $ua = isset($_SERVER['HTTP_USER_AGENT']) ? substr((string) $_SERVER['HTTP_USER_AGENT'], 0, 65000) : '';
        $stmt = $pdo->prepare(
            'INSERT INTO teacher_activity_log (teacher_id, action, details, ip_address, user_agent) VALUES (?,?,?,?,?)'
        );
        $stmt->execute([$teacherId, $action, $details, $ip, $ua]);
    } catch (Throwable $e) {
        error_log('log_teacher_activity: ' . $e->getMessage());
    }
}
