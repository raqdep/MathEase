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
        ensureSystemMaintenanceTable($pdo);
        $stmt = $pdo->query('SELECT is_active FROM system_maintenance WHERE id = 1');
        $row = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : null;
        return $row && (int) ($row['is_active'] ?? 0) === 1;
    }
}

if (!function_exists('getMaintenancePayload')) {
    function getMaintenancePayload(PDO $pdo): array
    {
        ensureSystemMaintenanceTable($pdo);
        $stmt = $pdo->query('
            SELECT is_active, title, public_message, scheduled_start_at, scheduled_end_at, estimated_end_at, started_at, ended_at, updated_by_admin_id
            FROM system_maintenance WHERE id = 1
        ');
        $row = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : null;
        if (!$row) {
            return [
                'maintenance' => false,
                'is_active' => false,
                'title' => '',
                'message' => '',
                'public_message' => '',
                'scheduled_start_at' => null,
                'scheduled_end_at' => null,
                'estimated_end_at' => null,
                'started_at' => null,
                'ended_at' => null,
            ];
        }
        $active = (int) ($row['is_active'] ?? 0) === 1;
        $msg = $row['public_message'] ?? '';
        return [
            'maintenance' => $active,
            'is_active' => $active,
            'title' => $row['title'] ?? '',
            'message' => $msg,
            'public_message' => $msg,
            'scheduled_start_at' => $row['scheduled_start_at'] ?? null,
            'scheduled_end_at' => $row['scheduled_end_at'] ?? null,
            'estimated_end_at' => $row['estimated_end_at'],
            'started_at' => $row['started_at'],
            'ended_at' => $row['ended_at'],
            'updated_by_admin_id' => $row['updated_by_admin_id'] ?? null,
        ];
    }
}
