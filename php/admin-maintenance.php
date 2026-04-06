<?php
/**
 * Admin API: get / update system maintenance (mathease_database3).
 */
session_start();
header('Content-Type: application/json; charset=utf-8');
@ini_set('display_errors', '0');
@ob_start();

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/maintenance-helper.php';

if (!function_exists('adminMaintenanceJson')) {
    function adminMaintenanceJson(array $payload, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        if (ob_get_length()) {
            @ob_clean();
        }
        echo json_encode($payload);
        exit;
    }
}

/** Reject when both parse as datetimes and end is strictly before start. */
function maintenanceEndOnOrAfterStart(?string $startSql, ?string $endSql): bool
{
    if ($startSql === null || $endSql === null) {
        return true;
    }
    $tsStart = strtotime($startSql);
    $tsEnd = strtotime($endSql);
    if ($tsStart === false || $tsEnd === false) {
        return true;
    }
    return $tsEnd >= $tsStart;
}

if (!isset($_SESSION['admin_id'])) {
    adminMaintenanceJson(['success' => false, 'message' => 'Unauthorized'], 403);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    ensureSystemMaintenanceTable($pdo);

    if ($method === 'GET') {
        $payload = getMaintenancePayload($pdo);
        adminMaintenanceJson([
            'success' => true,
            'data' => [
                'is_active' => $payload['is_active'],
                'is_upcoming' => $payload['is_upcoming'],
                'title' => $payload['title'],
                'public_message' => $payload['public_message'],
                'scheduled_start_at' => $payload['scheduled_start_at'],
                'scheduled_end_at' => $payload['scheduled_end_at'],
                'estimated_end_at' => $payload['estimated_end_at'],
                'advance_notice_minutes' => $payload['advance_notice_minutes'],
                'advance_notice_sent_at' => $payload['advance_notice_sent_at'],
                'start_notice_sent_at' => $payload['start_notice_sent_at'],
                'send_email_on_start' => $payload['send_email_on_start'],
                'started_at' => $payload['started_at'],
                'ended_at' => $payload['ended_at'],
                'cannot_schedule_new' => $payload['cannot_schedule_new'],
                'admin_notice' => $payload['admin_notice'],
                'window_auto_extended' => $payload['window_auto_extended'],
            ],
        ]);
    }

    if ($method !== 'POST') {
        adminMaintenanceJson(['success' => false, 'message' => 'Method not allowed'], 405);
    }

    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        $input = [];
    }

    $action = $input['action'] ?? '';

    if ($action === 'get') {
        $payload = getMaintenancePayload($pdo);
        adminMaintenanceJson(['success' => true, 'data' => $payload]);
    }

    if ($action === 'start') {
        $title = trim((string) ($input['title'] ?? ''));
        $publicMessage = trim((string) ($input['public_message'] ?? ''));
        $scheduledStart = $input['scheduled_start_at'] ?? null;
        $scheduledEnd = $input['scheduled_end_at'] ?? null;
        $estimatedEnd = $input['estimated_end_at'] ?? null;
        $advanceNoticeMinutes = (int) ($input['advance_notice_minutes'] ?? 30);
        if ($advanceNoticeMinutes < 1) {
            $advanceNoticeMinutes = 1;
        }

        $existing = getMaintenancePayload($pdo);
        if (!empty($existing['cannot_schedule_new'])) {
            adminMaintenanceJson(['success' => false, 'message' => 'Maintenance is currently active. You cannot schedule another.'], 409);
        }

        $startSql = null;
        if ($scheduledStart !== null && $scheduledStart !== '') {
            $dt = date('Y-m-d H:i:s', strtotime((string) $scheduledStart));
            $startSql = $dt ?: null;
        }

        $endSql = null;
        if ($scheduledEnd !== null && $scheduledEnd !== '') {
            $dt = date('Y-m-d H:i:s', strtotime((string) $scheduledEnd));
            $endSql = $dt ?: null;
        }

        $etaSql = null;
        if ($estimatedEnd !== null && $estimatedEnd !== '') {
            $dt = date('Y-m-d H:i:s', strtotime((string) $estimatedEnd));
            $etaSql = $dt ?: null;
        }

        // Prefer scheduled end time as ETA if provided (keeps older clients working).
        if ($endSql !== null) {
            $etaSql = $endSql;
        }

        if ($startSql === null) {
            adminMaintenanceJson(['success' => false, 'message' => 'Start date is required'], 400);
        }
        if ($endSql === null) {
            adminMaintenanceJson(['success' => false, 'message' => 'End date is required'], 400);
        }
        if (!maintenanceEndOnOrAfterStart($startSql, $endSql)) {
            adminMaintenanceJson(['success' => false, 'message' => 'End date and time must be on or after the start date and time.'], 400);
        }

        $nowTs = time();
        $startTs = $startSql ? strtotime($startSql) : false;
        $startsNow = ($startTs === false || $startTs <= $nowTs);
        $initialActive = $startsNow ? 1 : 0;

        $stmt = $pdo->prepare('
            UPDATE system_maintenance SET
                is_active = ?,
                title = ?,
                public_message = ?,
                scheduled_start_at = ?,
                scheduled_end_at = ?,
                estimated_end_at = ?,
                advance_notice_minutes = ?,
                advance_notice_sent_at = NULL,
                start_notice_sent_at = NULL,
                send_email_on_start = 0,
                started_at = CASE WHEN ? = 1 THEN NOW() ELSE NULL END,
                ended_at = NULL,
                updated_by_admin_id = ?
            WHERE id = 1
        ');
        $stmt->execute([
            $initialActive,
            $title,
            $publicMessage,
            $startSql,
            $endSql,
            $etaSql,
            $advanceNoticeMinutes,
            $initialActive,
            $_SESSION['admin_id'],
        ]);

        adminMaintenanceJson([
            'success' => true,
            'message' => $startsNow
                ? 'Maintenance mode is ON. Students and teachers cannot log in.'
                : 'Maintenance schedule saved. Login will be blocked automatically at the start time.',
            'data' => getMaintenancePayload($pdo),
        ]);
    }

    if ($action === 'update') {
        $title = trim((string) ($input['title'] ?? ''));
        $publicMessage = trim((string) ($input['public_message'] ?? ''));
        $scheduledStart = $input['scheduled_start_at'] ?? null;
        $scheduledEnd = $input['scheduled_end_at'] ?? null;
        $estimatedEnd = $input['estimated_end_at'] ?? null;
        $advanceNoticeMinutes = (int) ($input['advance_notice_minutes'] ?? 30);
        if ($advanceNoticeMinutes < 1) {
            $advanceNoticeMinutes = 1;
        }

        $payloadBefore = getMaintenancePayload($pdo);

        $startSql = null;
        if ($scheduledStart !== null && $scheduledStart !== '') {
            $dt = date('Y-m-d H:i:s', strtotime((string) $scheduledStart));
            $startSql = $dt ?: null;
        }

        $endSql = null;
        if ($scheduledEnd !== null && $scheduledEnd !== '') {
            $dt = date('Y-m-d H:i:s', strtotime((string) $scheduledEnd));
            $endSql = $dt ?: null;
        }

        $etaSql = null;
        if ($estimatedEnd !== null && $estimatedEnd !== '') {
            $dt = date('Y-m-d H:i:s', strtotime((string) $estimatedEnd));
            $etaSql = $dt ?: null;
        }

        if ($endSql !== null) {
            $etaSql = $endSql;
        }

        if (!empty($payloadBefore['maintenance']) || !empty($payloadBefore['is_upcoming'])) {
            if ($startSql === null || $endSql === null) {
                adminMaintenanceJson(['success' => false, 'message' => 'Start and end date and time are required while a maintenance window is scheduled or active.'], 400);
            }
        } else {
            if ($startSql === null && $endSql !== null) {
                adminMaintenanceJson(['success' => false, 'message' => 'Start date is required'], 400);
            }
            if ($startSql !== null && $endSql === null) {
                adminMaintenanceJson(['success' => false, 'message' => 'End date is required'], 400);
            }
        }
        if (!maintenanceEndOnOrAfterStart($startSql, $endSql)) {
            adminMaintenanceJson(['success' => false, 'message' => 'End date and time must be on or after the start date and time.'], 400);
        }

        $stmt = $pdo->prepare('
            UPDATE system_maintenance SET
                title = ?,
                public_message = ?,
                scheduled_start_at = ?,
                scheduled_end_at = ?,
                estimated_end_at = ?,
                advance_notice_minutes = ?,
                send_email_on_start = 0,
                updated_by_admin_id = ?
            WHERE id = 1
        ');
        $stmt->execute([
            $title,
            $publicMessage,
            $startSql,
            $endSql,
            $etaSql,
            $advanceNoticeMinutes,
            $_SESSION['admin_id'],
        ]);

        adminMaintenanceJson([
            'success' => true,
            'message' => 'Maintenance details updated.',
            'data' => getMaintenancePayload($pdo),
        ]);
    }

    if ($action === 'end') {
        $title = trim((string) ($input['title'] ?? ''));
        $publicMessage = trim((string) ($input['public_message'] ?? ''));
        $estimatedEnd = $input['estimated_end_at'] ?? null;

        $etaSql = null;
        if ($estimatedEnd !== null && $estimatedEnd !== '') {
            $dt = date('Y-m-d H:i:s', strtotime((string) $estimatedEnd));
            $etaSql = $dt ?: null;
        }

        $payloadBefore = getMaintenancePayload($pdo);
        if ($etaSql !== null) {
            $refStart = $payloadBefore['scheduled_start_at'] ?? $payloadBefore['started_at'] ?? null;
            if ($refStart !== null && $refStart !== '') {
                if (!maintenanceEndOnOrAfterStart((string) $refStart, $etaSql)) {
                    adminMaintenanceJson(['success' => false, 'message' => 'End date and time must be on or after the start date and time.'], 400);
                }
            }
        }
        $finalTitle = $title !== '' ? $title : (string)($payloadBefore['title'] ?? '');
        $finalMessage = $publicMessage !== '' ? $publicMessage : (string)($payloadBefore['public_message'] ?? $payloadBefore['message'] ?? '');
        $finalEta = $etaSql !== null ? $etaSql : ($payloadBefore['estimated_end_at'] ?? null);

        $stmt = $pdo->prepare('
            UPDATE system_maintenance SET
                is_active = 0,
                title = ?,
                public_message = ?,
                scheduled_start_at = NULL,
                scheduled_end_at = NULL,
                estimated_end_at = ?,
                advance_notice_sent_at = NULL,
                start_notice_sent_at = NULL,
                send_email_on_start = 0,
                ended_at = NOW(),
                updated_by_admin_id = ?
            WHERE id = 1
        ');
        $stmt->execute([$finalTitle, $finalMessage, $finalEta, $_SESSION['admin_id']]);

        adminMaintenanceJson([
            'success' => true,
            'message' => 'Maintenance mode is OFF. Users can log in again.',
            'data' => getMaintenancePayload($pdo),
        ]);
    }

    adminMaintenanceJson(['success' => false, 'message' => 'Unknown action']);
} catch (Throwable $e) {
    error_log('admin-maintenance.php: ' . $e->getMessage());
    adminMaintenanceJson(['success' => false, 'message' => 'Server error'], 500);
}
