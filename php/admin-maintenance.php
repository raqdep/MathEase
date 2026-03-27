<?php
/**
 * Admin API: get / update system maintenance (mathease_database3).
 */
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/maintenance-helper.php';
require_once __DIR__ . '/maintenance-notify-users.php';

if (!isset($_SESSION['admin_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    ensureSystemMaintenanceTable($pdo);

    if ($method === 'GET') {
        $payload = getMaintenancePayload($pdo);
        echo json_encode([
            'success' => true,
            'data' => [
                'is_active' => $payload['is_active'],
                'title' => $payload['title'],
                'public_message' => $payload['public_message'],
                'scheduled_start_at' => $payload['scheduled_start_at'],
                'scheduled_end_at' => $payload['scheduled_end_at'],
                'estimated_end_at' => $payload['estimated_end_at'],
                'started_at' => $payload['started_at'],
                'ended_at' => $payload['ended_at'],
            ],
        ]);
        exit;
    }

    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }

    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        $input = [];
    }

    $action = $input['action'] ?? '';

    if ($action === 'get') {
        $payload = getMaintenancePayload($pdo);
        echo json_encode(['success' => true, 'data' => $payload]);
        exit;
    }

    if ($action === 'start') {
        $title = trim((string) ($input['title'] ?? ''));
        $publicMessage = trim((string) ($input['public_message'] ?? ''));
        $scheduledStart = $input['scheduled_start_at'] ?? null;
        $scheduledEnd = $input['scheduled_end_at'] ?? null;
        $estimatedEnd = $input['estimated_end_at'] ?? null;
        $sendEmail = !empty($input['send_email']);

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

        $stmt = $pdo->prepare('
            UPDATE system_maintenance SET
                is_active = 1,
                title = ?,
                public_message = ?,
                scheduled_start_at = ?,
                scheduled_end_at = ?,
                estimated_end_at = ?,
                started_at = NOW(),
                ended_at = NULL,
                updated_by_admin_id = ?
            WHERE id = 1
        ');
        $stmt->execute([
            $title,
            $publicMessage,
            $startSql,
            $endSql,
            $etaSql,
            $_SESSION['admin_id'],
        ]);

        $payload = getMaintenancePayload($pdo);
        $emailResult = ['sent' => 0, 'failed' => 0, 'errors' => []];
        if ($sendEmail) {
            $emailResult = sendMaintenanceAnnouncementEmails($pdo, 'start', $payload);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Maintenance mode is ON. Students and teachers cannot log in.',
            'data' => getMaintenancePayload($pdo),
            'email' => $emailResult,
        ]);
        exit;
    }

    if ($action === 'update') {
        $title = trim((string) ($input['title'] ?? ''));
        $publicMessage = trim((string) ($input['public_message'] ?? ''));
        $scheduledStart = $input['scheduled_start_at'] ?? null;
        $scheduledEnd = $input['scheduled_end_at'] ?? null;
        $estimatedEnd = $input['estimated_end_at'] ?? null;

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

        $stmt = $pdo->prepare('
            UPDATE system_maintenance SET
                title = ?,
                public_message = ?,
                scheduled_start_at = ?,
                scheduled_end_at = ?,
                estimated_end_at = ?,
                updated_by_admin_id = ?
            WHERE id = 1
        ');
        $stmt->execute([
            $title,
            $publicMessage,
            $startSql,
            $endSql,
            $etaSql,
            $_SESSION['admin_id'],
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Maintenance details updated.',
            'data' => getMaintenancePayload($pdo),
        ]);
        exit;
    }

    if ($action === 'end') {
        $sendEmail = !empty($input['send_email']);
        $title = trim((string) ($input['title'] ?? ''));
        $publicMessage = trim((string) ($input['public_message'] ?? ''));
        $estimatedEnd = $input['estimated_end_at'] ?? null;

        $etaSql = null;
        if ($estimatedEnd !== null && $estimatedEnd !== '') {
            $dt = date('Y-m-d H:i:s', strtotime((string) $estimatedEnd));
            $etaSql = $dt ?: null;
        }

        // Always persist latest form values before sending completion emails.
        $payloadBefore = getMaintenancePayload($pdo);
        $finalTitle = $title !== '' ? $title : (string)($payloadBefore['title'] ?? '');
        $finalMessage = $publicMessage !== '' ? $publicMessage : (string)($payloadBefore['public_message'] ?? $payloadBefore['message'] ?? '');
        $finalEta = $etaSql !== null ? $etaSql : ($payloadBefore['estimated_end_at'] ?? null);

        $stmt = $pdo->prepare('
            UPDATE system_maintenance SET
                is_active = 0,
                title = ?,
                public_message = ?,
                estimated_end_at = ?,
                ended_at = NOW(),
                updated_by_admin_id = ?
            WHERE id = 1
        ');
        $stmt->execute([$finalTitle, $finalMessage, $finalEta, $_SESSION['admin_id']]);

        $payload = getMaintenancePayload($pdo);
        $emailResult = ['sent' => 0, 'failed' => 0, 'errors' => []];
        if ($sendEmail) {
            $merge = array_merge($payloadBefore, [
                'title' => $finalTitle,
                'public_message' => $finalMessage,
                'message' => $finalMessage,
                'estimated_end_at' => $finalEta,
            ]);
            $emailResult = sendMaintenanceAnnouncementEmails($pdo, 'end', $merge);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Maintenance mode is OFF. Users can log in again.',
            'data' => getMaintenancePayload($pdo),
            'email' => $emailResult,
        ]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Unknown action']);
} catch (Throwable $e) {
    error_log('admin-maintenance.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
