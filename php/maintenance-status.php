<?php
/**
 * Public read-only maintenance status (no auth).
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

try {
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/maintenance-helper.php';

    $payload = getMaintenancePayload($pdo);
    $scheduledStart = $payload['scheduled_start_at'] ?? null;
    $scheduledEnd = $payload['scheduled_end_at'] ?? null;
    $active = !empty($payload['maintenance']);
    $upcoming = false;
    if (!$active && $scheduledStart) {
        $startTs = strtotime((string) $scheduledStart);
        if ($startTs !== false && $startTs > time()) {
            $upcoming = true;
        }
    }

    echo json_encode([
        'success' => true,
        'maintenance' => $payload['maintenance'],
        'upcoming' => $upcoming,
        'title' => $payload['title'],
        'message' => $payload['message'],
        'estimated_end_at' => $payload['estimated_end_at'],
        'scheduled_start_at' => $scheduledStart,
        'scheduled_end_at' => $scheduledEnd,
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
