<?php
/**
 * Archive (soft-delete) and restore teacher accounts.
 * - Requires admin session
 * - Ensures archive columns exist on teachers table
 * - Sends email on archive/restore (Gmail helper + file fallback)
 * - Logs to admin_activity_log and teacher_activity_log
 */
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

function ensureTeacherArchiveColumns(PDO $pdo): void
{
    $cols = [
        'is_archived' => "ALTER TABLE teachers ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0",
        'archived_at' => "ALTER TABLE teachers ADD COLUMN archived_at DATETIME NULL",
        'archived_by_admin_id' => "ALTER TABLE teachers ADD COLUMN archived_by_admin_id INT NULL",
        'archive_reason' => "ALTER TABLE teachers ADD COLUMN archive_reason TEXT NULL",
    ];

    foreach ($cols as $col => $ddl) {
        $check = $pdo->prepare("
            SELECT COUNT(*) AS c
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'teachers'
              AND COLUMN_NAME = ?
        ");
        $check->execute([$col]);
        $exists = (int) ($check->fetchColumn() ?: 0) > 0;
        if (!$exists) {
            $pdo->exec($ddl);
        }
    }
}

function ensureAdminActivityLog(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admin_activity_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            admin_id INT NOT NULL,
            action VARCHAR(100) NOT NULL,
            target_type VARCHAR(50),
            target_id INT,
            details TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_admin (admin_id),
            INDEX idx_action (action),
            INDEX idx_created (created_at)
        )
    ");
}

function ensureTeacherActivityLog(PDO $pdo): void
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
        )
    ");
}

function ipAddr(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function userAgent(): string
{
    return $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
}

function jsonBody(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);
    return is_array($data) ? $data : [];
}

try {
    ensureTeacherArchiveColumns($pdo);
    ensureAdminActivityLog($pdo);
    ensureTeacherActivityLog($pdo);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }

    $in = jsonBody();
    $action = (string) ($in['action'] ?? '');
    $teacherId = (int) ($in['teacher_id'] ?? 0);
    $reason = trim((string) ($in['reason'] ?? ''));

    if ($teacherId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Teacher ID is required']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, COALESCE(is_archived, 0) AS is_archived FROM teachers WHERE id = ?");
    $stmt->execute([$teacherId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$teacher) {
        echo json_encode(['success' => false, 'message' => 'Teacher not found']);
        exit;
    }

    $fullName = trim(($teacher['first_name'] ?? '') . ' ' . ($teacher['last_name'] ?? ''));
    $email = (string) ($teacher['email'] ?? '');
    $isArchived = (int) ($teacher['is_archived'] ?? 0) === 1;

    $pdo->beginTransaction();

    if ($action === 'archive') {
        if ($isArchived) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'Teacher is already archived']);
            exit;
        }

        $upd = $pdo->prepare("
            UPDATE teachers
            SET is_archived = 1,
                archived_at = NOW(),
                archived_by_admin_id = ?,
                archive_reason = ?
            WHERE id = ?
        ");
        $upd->execute([$_SESSION['admin_id'], $reason !== '' ? $reason : null, $teacherId]);

        $details = "Archived teacher account: {$fullName} ({$email})" . ($reason !== '' ? " | Reason: {$reason}" : '');
        $log = $pdo->prepare("
            INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address, user_agent)
            VALUES (?, 'archive_teacher', 'teacher', ?, ?, ?, ?)
        ");
        $log->execute([$_SESSION['admin_id'], $teacherId, $details, ipAddr(), userAgent()]);

        $tlog = $pdo->prepare("
            INSERT INTO teacher_activity_log (teacher_id, action, details, ip_address, user_agent)
            VALUES (?, 'account_archived', ?, ?, ?)
        ");
        $tlog->execute([$teacherId, 'Account archived by admin', ipAddr(), userAgent()]);

        $pdo->commit();

        // Email teacher
        $emailSent = false;
        if ($email !== '') {
            require_once __DIR__ . '/../gmail-fixed-test.php';
            $subject = "Your MathEase teacher account was removed";
            $body = "
            <!DOCTYPE html>
            <html><head><meta charset='UTF-8'></head>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;'>
              <div style='max-width:600px;margin:0 auto;padding:20px;'>
                <div style='background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:22px 18px;border-radius:12px 12px 0 0;'>
                  <h2 style='margin:0;font-size:18px;'>MathEase</h2>
                  <p style='margin:6px 0 0;opacity:.9;'>Teacher account update</p>
                </div>
                <div style='background:#f8fafc;border:1px solid #e2e8f0;border-top:0;padding:18px;border-radius:0 0 12px 12px;'>
                  <p>Hello {$fullName},</p>
                  <p>Your teacher account has been removed from the MathEase system by an administrator.</p>
                  " . ($reason !== '' ? "<p><strong>Reason:</strong> " . htmlspecialchars($reason, ENT_QUOTES, 'UTF-8') . "</p>" : "") . "
                  <p>If you believe this was a mistake, please contact your administrator.</p>
                  <p style='color:#64748b;font-size:12px;margin-top:18px;'>This is an automated message.</p>
                </div>
              </div>
            </body></html>";

            $emailSent = send_gmail_verification_fixed($email, $subject, $body);
            if (!$emailSent) {
                $emailSent = save_email_to_file($email, $subject, $body);
            }
        }

        echo json_encode(['success' => true, 'message' => 'Teacher archived', 'email_sent' => $emailSent]);
        exit;
    }

    if ($action === 'restore') {
        if (!$isArchived) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'Teacher is not archived']);
            exit;
        }

        $upd = $pdo->prepare("
            UPDATE teachers
            SET is_archived = 0,
                archived_at = NULL,
                archived_by_admin_id = NULL,
                archive_reason = NULL
            WHERE id = ?
        ");
        $upd->execute([$teacherId]);

        $details = "Restored teacher account: {$fullName} ({$email})";
        $log = $pdo->prepare("
            INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address, user_agent)
            VALUES (?, 'restore_teacher', 'teacher', ?, ?, ?, ?)
        ");
        $log->execute([$_SESSION['admin_id'], $teacherId, $details, ipAddr(), userAgent()]);

        $tlog = $pdo->prepare("
            INSERT INTO teacher_activity_log (teacher_id, action, details, ip_address, user_agent)
            VALUES (?, 'account_restored', ?, ?, ?)
        ");
        $tlog->execute([$teacherId, 'Account restored by admin', ipAddr(), userAgent()]);

        $pdo->commit();

        // Email teacher
        $emailSent = false;
        if ($email !== '') {
            require_once __DIR__ . '/../gmail-fixed-test.php';
            $subject = "Your MathEase teacher account was restored";
            $body = "
            <!DOCTYPE html>
            <html><head><meta charset='UTF-8'></head>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;'>
              <div style='max-width:600px;margin:0 auto;padding:20px;'>
                <div style='background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:22px 18px;border-radius:12px 12px 0 0;'>
                  <h2 style='margin:0;font-size:18px;'>MathEase</h2>
                  <p style='margin:6px 0 0;opacity:.9;'>Teacher account update</p>
                </div>
                <div style='background:#f8fafc;border:1px solid #e2e8f0;border-top:0;padding:18px;border-radius:0 0 12px 12px;'>
                  <p>Hello {$fullName},</p>
                  <p>Your teacher account has been restored. You can sign in again using your existing credentials.</p>
                  <div style='margin:16px 0;'>
                    <a href='" . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . "://" . $_SERVER['HTTP_HOST'] . "/MathEase/teacher-login.html' style='display:inline-block;background:#667eea;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:700;'>Go to teacher login</a>
                  </div>
                  <p style='color:#64748b;font-size:12px;margin-top:18px;'>This is an automated message.</p>
                </div>
              </div>
            </body></html>";

            $emailSent = send_gmail_verification_fixed($email, $subject, $body);
            if (!$emailSent) {
                $emailSent = save_email_to_file($email, $subject, $body);
            }
        }

        echo json_encode(['success' => true, 'message' => 'Teacher restored', 'email_sent' => $emailSent]);
        exit;
    }

    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Unknown action']);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    error_log('admin-teacher-archive.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}

