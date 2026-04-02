<?php
/**
 * Email students and teachers about maintenance schedule and status.
 * Sends one recipient per email to avoid BCC/scam-like appearance.
 * Requires config + gmail-fixed-test (send_gmail_verification_fixed).
 *
 * @return array{sent: int, failed: int, errors: string[], total_recipients: int, duration_ms: int}
 */
function sendMaintenanceAnnouncementEmails(PDO $pdo, string $phase, array $payload): array
{
    @set_time_limit(0);
    @ini_set('max_execution_time', '0');
    $startedAt = microtime(true);
    $phase = in_array($phase, ['advance', 'start', 'end'], true) ? $phase : 'start';
    $title = trim((string)($payload['title'] ?? ''));
    $message = trim((string)($payload['message'] ?? $payload['public_message'] ?? ''));
    $eta = $payload['estimated_end_at'] ?? ($payload['scheduled_end_at'] ?? null);
    $scheduledStart = $payload['scheduled_start_at'] ?? null;
    $scheduledEnd = $payload['scheduled_end_at'] ?? null;
    $advanceNoticeMinutes = (int) ($payload['advance_notice_minutes'] ?? 30);
    if ($advanceNoticeMinutes < 1) {
        $advanceNoticeMinutes = 1;
    }

    $sent = 0;
    $failed = 0;
    $errors = [];

    $emails = [];

    try {
        $stmt = $pdo->query('SELECT DISTINCT email FROM users WHERE email IS NOT NULL AND TRIM(email) <> \'\'');
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $emails[strtolower(trim($row['email']))] = true;
        }
    } catch (Throwable $e) {
        $errors[] = 'users: ' . $e->getMessage();
    }

    try {
        $stmt = $pdo->query('SELECT DISTINCT email FROM teachers WHERE email IS NOT NULL AND TRIM(email) <> \'\'');
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $emails[strtolower(trim($row['email']))] = true;
        }
    } catch (Throwable $e) {
        $errors[] = 'teachers: ' . $e->getMessage();
    }

    $list = array_keys($emails);
    sort($list);

    if (!function_exists('send_gmail_verification_fixed')) {
        $gmailPath = __DIR__ . '/../gmail-fixed-test.php';
        if (is_file($gmailPath)) {
            require_once $gmailPath;
        }
    }

    if (!function_exists('send_gmail_verification_fixed')) {
        return [
            'sent' => 0,
            'failed' => count($list),
            'errors' => ['Mail helper not available'],
            'total_recipients' => count($list),
            'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
        ];
    }
    if (!defined('MAIL_USERNAME') || trim((string) MAIL_USERNAME) === '') {
        return [
            'sent' => 0,
            'failed' => count($list),
            'errors' => ['MAIL_USERNAME is missing in .env.'],
            'total_recipients' => count($list),
            'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
        ];
    }
    if (!defined('MAIL_PASSWORD') || trim((string) MAIL_PASSWORD) === '') {
        return [
            'sent' => 0,
            'failed' => count($list),
            'errors' => ['MAIL_PASSWORD is missing in .env. Use a Gmail App Password.'],
            'total_recipients' => count($list),
            'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
        ];
    }

    [$subject, $body] = maintenanceBuildStandardEmail($phase, [
        'title' => $title,
        'message' => $message,
        'estimated_end_at' => $eta,
        'scheduled_start_at' => $scheduledStart,
        'scheduled_end_at' => $scheduledEnd,
        'advance_notice_minutes' => $advanceNoticeMinutes,
    ]);

    if (!empty($list)) {
        $probeTo = $list[0];
        if (filter_var($probeTo, FILTER_VALIDATE_EMAIL)) {
            $probeOk = false;
            try {
                $probeOk = send_gmail_verification_fixed($probeTo, $subject, $body);
            } catch (Throwable $e) {
                $errors[] = 'smtp_probe: ' . $e->getMessage();
            }
            if (!$probeOk) {
                return [
                    'sent' => 0,
                    'failed' => count($list),
                    'errors' => array_slice(array_merge($errors, [
                        'SMTP authentication/delivery failed. Check MAIL_USERNAME and MAIL_PASSWORD in .env.',
                    ]), 0, 20),
                    'total_recipients' => count($list),
                    'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                ];
            }
            $sent++;
        }
    }

    $startIndex = $sent > 0 ? 1 : 0;
    $total = count($list);
    for ($i = $startIndex; $i < $total; $i++) {
        $to = $list[$i];
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            $failed++;
            $errors[] = $to . ': invalid_email';
            continue;
        }
        try {
            $singleOk = send_gmail_verification_fixed($to, $subject, $body);
            if ($singleOk) {
                $sent++;
            } else {
                $failed++;
            }
        } catch (Throwable $e) {
            $failed++;
            $errors[] = $to . ': ' . $e->getMessage();
        }
    }

    $durationMs = (int) round((microtime(true) - $startedAt) * 1000);
    return [
        'sent' => $sent,
        'failed' => $failed,
        'errors' => array_slice($errors, 0, 20),
        'total_recipients' => count($list),
        'duration_ms' => $durationMs,
    ];
}

function maintenanceFormatDateTime(?string $value): string
{
    if (!$value) {
        return 'TBA';
    }
    $ts = strtotime((string) $value);
    if ($ts === false) {
        return (string) $value;
    }
    return date('M d, Y h:i A', $ts);
}

function maintenanceBuildStandardEmail(string $phase, array $payload): array
{
    $title = trim((string) ($payload['title'] ?? ''));
    $message = trim((string) ($payload['message'] ?? ''));
    $startAtRaw = $payload['scheduled_start_at'] ?? ($payload['started_at'] ?? null);
    $endAtRaw = $payload['scheduled_end_at'] ?? ($payload['estimated_end_at'] ?? null);
    if ($phase === 'end') {
        $startAtRaw = $payload['started_at'] ?? ($payload['scheduled_start_at'] ?? null);
        $endAtRaw = $payload['ended_at'] ?? ($payload['scheduled_end_at'] ?? ($payload['estimated_end_at'] ?? null));
    }
    $startAt = maintenanceFormatDateTime($startAtRaw);
    $endAt = maintenanceFormatDateTime($endAtRaw);
    $leadMinutes = (int) ($payload['advance_notice_minutes'] ?? 30);

    if ($phase === 'end') {
        $subject = 'MathEase Maintenance Complete - Services Restored';
        $headline = 'Maintenance Completed';
        $intro = 'MathEase maintenance has been completed. You can now log in and continue using the platform.';
    } elseif ($phase === 'advance') {
        $subject = 'Scheduled Maintenance Notice - MathEase';
        $headline = 'Upcoming Scheduled Maintenance';
        $intro = 'This is an advance notice that MathEase will undergo scheduled maintenance soon.';
    } else {
        $subject = 'Maintenance Started - MathEase';
        $headline = 'Scheduled Maintenance Is Now Active';
        $intro = 'MathEase maintenance has started. Student and teacher login is temporarily unavailable until maintenance ends.';
    }

    $reason = $message !== '' ? $message : 'System improvements and performance updates.';
    $titleLine = $title !== '' ? htmlspecialchars($title, ENT_QUOTES, 'UTF-8') : 'MathEase System Maintenance';
    $contact = defined('MAIL_FROM') && MAIL_FROM ? MAIL_FROM : 'support@mathease.com';

    $body = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;">'
        . '<div style="max-width:620px;margin:0 auto;padding:24px;">'
        . '<h2 style="margin:0 0 12px;color:#1e3a8a;">' . htmlspecialchars($headline, ENT_QUOTES, 'UTF-8') . '</h2>'
        . '<p style="margin:0 0 12px;">Hello,</p>'
        . '<p style="margin:0 0 16px;">' . htmlspecialchars($intro, ENT_QUOTES, 'UTF-8') . '</p>'
        . '<div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;background:#f9fafb;">'
        . '<p style="margin:0 0 8px;"><strong>Title:</strong> ' . $titleLine . '</p>'
        . '<p style="margin:0 0 8px;"><strong>Start:</strong> ' . htmlspecialchars($startAt, ENT_QUOTES, 'UTF-8') . '</p>'
        . '<p style="margin:0 0 8px;"><strong>End:</strong> ' . htmlspecialchars($endAt, ENT_QUOTES, 'UTF-8') . '</p>'
        . '<p style="margin:0 0 8px;"><strong>Reason:</strong> ' . nl2br(htmlspecialchars($reason, ENT_QUOTES, 'UTF-8')) . '</p>';

    if ($phase === 'advance') {
        $body .= '<p style="margin:0;"><strong>Advance Notice:</strong> ' . (int) $leadMinutes . ' minutes before maintenance start.</p>';
    } elseif ($phase === 'end') {
        $body .= '<p style="margin:0;"><strong>Status:</strong> Maintenance completed successfully. Student and teacher login access has been restored.</p>';
    } else {
        $body .= '<p style="margin:0;"><strong>Impact:</strong> Student and teacher login may be unavailable during this period.</p>';
    }

    $body .= '</div>'
        . '<p style="margin:16px 0 0;">If you have questions, contact us at ' . htmlspecialchars($contact, ENT_QUOTES, 'UTF-8') . '.</p>'
        . '<p style="margin:12px 0 0;">- MathEase Team</p>'
        . '</div></body></html>';

    return [$subject, $body];
}
