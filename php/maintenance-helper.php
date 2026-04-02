<?php
/**
 * System maintenance mode — single-row table (id = 1) in mathease_database3 via config.php PDO.
 */

if (!function_exists('ensureSystemMaintenanceTable')) {
    function ensureSystemMaintenanceTable(PDO $pdo): void
    {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS system_maintenance (
                id TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
                is_active TINYINT(1) NOT NULL DEFAULT 0,
                title VARCHAR(255) NOT NULL DEFAULT '',
                public_message TEXT NULL,
                scheduled_start_at DATETIME NULL,
                scheduled_end_at DATETIME NULL,
                estimated_end_at DATETIME NULL,
                advance_notice_minutes INT NOT NULL DEFAULT 30,
                advance_notice_sent_at DATETIME NULL,
                start_notice_sent_at DATETIME NULL,
                send_email_on_start TINYINT(1) NOT NULL DEFAULT 0,
                started_at DATETIME NULL,
                ended_at DATETIME NULL,
                updated_by_admin_id INT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // If the table already existed (older deployments), add missing columns.
        $columnsToEnsure = [
            'scheduled_start_at' => 'ALTER TABLE system_maintenance ADD COLUMN scheduled_start_at DATETIME NULL AFTER public_message',
            'scheduled_end_at' => 'ALTER TABLE system_maintenance ADD COLUMN scheduled_end_at DATETIME NULL AFTER scheduled_start_at',
            'advance_notice_minutes' => 'ALTER TABLE system_maintenance ADD COLUMN advance_notice_minutes INT NOT NULL DEFAULT 30 AFTER estimated_end_at',
            'advance_notice_sent_at' => 'ALTER TABLE system_maintenance ADD COLUMN advance_notice_sent_at DATETIME NULL AFTER advance_notice_minutes',
            'start_notice_sent_at' => 'ALTER TABLE system_maintenance ADD COLUMN start_notice_sent_at DATETIME NULL AFTER advance_notice_sent_at',
            'send_email_on_start' => 'ALTER TABLE system_maintenance ADD COLUMN send_email_on_start TINYINT(1) NOT NULL DEFAULT 0 AFTER start_notice_sent_at',
        ];
        foreach ($columnsToEnsure as $col => $ddl) {
            $check = $pdo->prepare("
                SELECT COUNT(*) AS c
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'system_maintenance'
                  AND COLUMN_NAME = ?
            ");
            $check->execute([$col]);
            $exists = (int) ($check->fetchColumn() ?: 0) > 0;
            if (!$exists) {
                $pdo->exec($ddl);
            }
        }

        $stmt = $pdo->query('SELECT COUNT(*) AS c FROM system_maintenance WHERE id = 1');
        $row = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : null;
        if ($row && (int) ($row['c'] ?? 0) === 0) {
            $pdo->exec("INSERT INTO system_maintenance (id, is_active, title, public_message) VALUES (1, 0, '', '')");
        }
    }
}

if (!function_exists('isMaintenanceMode')) {
    function isMaintenanceMode(PDO $pdo): bool
    {
        $payload = getMaintenancePayload($pdo);
        return !empty($payload['maintenance']);
    }
}

if (!function_exists('computeMaintenanceState')) {
    function computeMaintenanceState(array $row): array
    {
        $nowTs = time();
        $startTs = null;
        $endTs = null;

        if (!empty($row['scheduled_start_at'])) {
            $ts = strtotime((string) $row['scheduled_start_at']);
            if ($ts !== false) {
                $startTs = $ts;
            }
        }
        if (!empty($row['scheduled_end_at'])) {
            $ts = strtotime((string) $row['scheduled_end_at']);
            if ($ts !== false) {
                $endTs = $ts;
            }
        }

        $manualActive = (int) ($row['is_active'] ?? 0) === 1;
        $windowActive = false;
        if ($startTs !== null && $nowTs >= $startTs) {
            // Keep maintenance active after the scheduled start until an admin ends it.
            // The scheduled end remains informational (ETA) and can be extended as needed.
            $windowActive = true;
        }

        $active = $manualActive || $windowActive;
        $upcoming = false;
        if (!$active && $startTs !== null && $startTs > $nowTs) {
            $upcoming = true;
        }

        return [
            'active' => $active,
            'upcoming' => $upcoming,
            'start_ts' => $startTs,
            'end_ts' => $endTs,
            'now_ts' => $nowTs,
        ];
    }
}

if (!function_exists('getMaintenancePayload')) {
    function getMaintenancePayload(PDO $pdo): array
    {
        ensureSystemMaintenanceTable($pdo);
        $stmt = $pdo->query('
            SELECT is_active, title, public_message, scheduled_start_at, scheduled_end_at, estimated_end_at,
                   advance_notice_minutes, advance_notice_sent_at, start_notice_sent_at, send_email_on_start,
                   started_at, ended_at, updated_by_admin_id
            FROM system_maintenance WHERE id = 1
        ');
        $row = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : null;
        if (!$row) {
            return [
                'maintenance' => false,
                'is_active' => false,
                'is_upcoming' => false,
                'cannot_schedule_new' => false,
                'admin_notice' => null,
                'window_auto_extended' => false,
                'title' => '',
                'message' => '',
                'public_message' => '',
                'scheduled_start_at' => null,
                'scheduled_end_at' => null,
                'estimated_end_at' => null,
                'advance_notice_minutes' => 30,
                'advance_notice_sent_at' => null,
                'start_notice_sent_at' => null,
                'send_email_on_start' => false,
                'started_at' => null,
                'ended_at' => null,
            ];
        }

        $state = computeMaintenanceState($row);
        $endTs = $state['end_ts'];
        $hadPassedEnd = $state['active'] && $endTs !== null && $state['now_ts'] >= $endTs;

        $active = $state['active'];
        $msg = $row['public_message'] ?? '';
        $advanceMinutes = (int) ($row['advance_notice_minutes'] ?? 30);
        if ($advanceMinutes < 1) {
            $advanceMinutes = 1;
        }

        $cannotScheduleNew = $active || $state['upcoming'];
        $adminNotice = $hadPassedEnd
            ? 'Maintenance time expired. Set a new end date and time above, then click Save details — or end maintenance.'
            : null;

        return [
            'maintenance' => $active,
            'is_active' => $active,
            'is_upcoming' => $state['upcoming'],
            'cannot_schedule_new' => $cannotScheduleNew,
            'admin_notice' => $adminNotice,
            'window_auto_extended' => false,
            'title' => $row['title'] ?? '',
            'message' => $msg,
            'public_message' => $msg,
            'scheduled_start_at' => $row['scheduled_start_at'] ?? null,
            'scheduled_end_at' => $row['scheduled_end_at'] ?? null,
            'estimated_end_at' => $row['estimated_end_at'],
            'advance_notice_minutes' => $advanceMinutes,
            'advance_notice_sent_at' => $row['advance_notice_sent_at'] ?? null,
            'start_notice_sent_at' => $row['start_notice_sent_at'] ?? null,
            'send_email_on_start' => (int)($row['send_email_on_start'] ?? 0) === 1,
            'started_at' => $row['started_at'],
            'ended_at' => $row['ended_at'],
            'updated_by_admin_id' => $row['updated_by_admin_id'] ?? null,
        ];
    }
}
