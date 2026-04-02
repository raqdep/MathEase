<?php
/**
 * Public read-only maintenance status (no auth).
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

try {
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/maintenance-helper.php';
    require_once __DIR__ . '/maintenance-notify-users.php';

    $payload = getMaintenancePayload($pdo);
    $scheduledStart = $payload['scheduled_start_at'] ?? null;
    $scheduledEnd = $payload['scheduled_end_at'] ?? null;
    $active = !empty($payload['maintenance']);
    $nowTs = time();
    $upcoming = false;
    $startTs = $scheduledStart ? strtotime((string) $scheduledStart) : false;
    if (!$active && $startTs !== false && $startTs > $nowTs) {
        $upcoming = true;
    }

    if ($startTs !== false) {
        $startNoticeSent = !empty($payload['start_notice_sent_at']);
        $sendEmailOnStart = !empty($payload['send_email_on_start']);

        if ($active && !$startNoticeSent && $sendEmailOnStart) {
            $emailResult = sendMaintenanceAnnouncementEmails($pdo, 'start', $payload);
            if ((int) ($emailResult['sent'] ?? 0) > 0) {
                $pdo->prepare('UPDATE system_maintenance SET start_notice_sent_at = NOW() WHERE id = 1')->execute();
            }
            $payload = getMaintenancePayload($pdo);
        }
    }

    $scheduledStart = $payload['scheduled_start_at'] ?? null;
    $scheduledEnd = $payload['scheduled_end_at'] ?? null;

    echo json_encode([
        'success' => true,
        'maintenance' => $payload['maintenance'],
        'upcoming' => $upcoming,
        'title' => $payload['title'],
        'message' => $payload['message'],
        'estimated_end_at' => $payload['estimated_end_at'],
        'scheduled_start_at' => $scheduledStart,
        'scheduled_end_at' => $scheduledEnd,
        'send_email_on_start' => !empty($payload['send_email_on_start']),
        'started_at' => $payload['started_at'],
    ]);
} catch (Throwable $e) {
    error_log('maintenance-status.php: ' . $e->getMessage());
    http_response_code(200);
    echo json_encode([
        'success' => false,
        'maintenance' => false,
        'upcoming' => false,
        'title' => '',
        'message' => '',
        'estimated_end_at' => null,
        'scheduled_start_at' => null,
        'scheduled_end_at' => null,
        'error' => 'status_unavailable',
    ]);
}
