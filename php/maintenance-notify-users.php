<?php
/**
 * Bulk email students and teachers about maintenance start/end.
 * Requires config + gmail-fixed-test (send_gmail_verification_fixed).
 *
 * @return array{sent: int, failed: int, errors: string[], total_recipients: int, duration_ms: int}
 */
function sendMaintenanceAnnouncementEmails(PDO $pdo, string $phase, array $payload): array
{
    $startedAt = microtime(true);
    $phase = $phase === 'end' ? 'end' : 'start';
    $title = $payload['title'] ?? '';
    $message = $payload['message'] ?? '';
    $eta = $payload['estimated_end_at'] ?? null;

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

    if ($phase === 'start') {
        $subject = 'MathEase — Scheduled system update';
        $body = maintenanceBuildEmailHtml(
            'System update in progress',
            $title,
            $message,
            $eta,
            'We are applying updates to MathEase. You may be unable to log in until the work is finished.',
            false
        );
    } else {
        $subject = 'MathEase — System update complete';
        $body = maintenanceBuildEmailHtml(
            'You can log in again',
            $title,
            $message,
            null,
            'The scheduled maintenance has ended. You can sign in and use MathEase as usual.',
            true
        );
    }

    // Fast path: send in BCC batches using one SMTP auth per batch.
    $batchSize = 40;
    $chunks = array_chunk(array_values(array_filter($list, static function ($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL);
    })), $batchSize);

    foreach ($chunks as $chunk) {
        if (empty($chunk)) continue;
        try {
            $ok = maintenanceSendBulkGmail($chunk, $subject, $body);
            if ($ok) {
                $sent += count($chunk);
            } else {
                // Fallback to per-recipient to isolate failures.
                foreach ($chunk as $to) {
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
            }
        } catch (Throwable $e) {
            foreach ($chunk as $to) {
                $failed++;
                $errors[] = $to . ': ' . $e->getMessage();
            }
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

function maintenanceSendBulkGmail(array $recipients, string $subject, string $htmlBody): bool
{
    if (empty($recipients)) return true;

    $smtpHost = 'smtp.gmail.com';
    $smtpPort = 465;
    $smtpUser = defined('MAIL_USERNAME') ? MAIL_USERNAME : '';
    $smtpPass = defined('MAIL_PASSWORD') ? MAIL_PASSWORD : '';
    $fromEmail = defined('MAIL_FROM') ? MAIL_FROM : $smtpUser;
    $fromName = defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : 'MathEase';

    if ($smtpUser === '' || $smtpPass === '' || $fromEmail === '') {
        return false;
    }

    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true,
        ],
    ]);

    $socket = @stream_socket_client("ssl://{$smtpHost}:{$smtpPort}", $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $context);
    if (!$socket) return false;

    $readCode = static function ($sock) {
        $line = fgets($sock, 1024);
        if ($line === false) return '';
        while (strlen($line) >= 4 && $line[3] === '-') {
            $line = fgets($sock, 1024);
            if ($line === false) break;
        }
        return (string)$line;
    };
    $expect = static function ($line, array $codes): bool {
        $code = substr((string)$line, 0, 3);
        return in_array($code, $codes, true);
    };

    try {
        if (!$expect($readCode($socket), ['220'])) {
            fclose($socket);
            return false;
        }

        fputs($socket, "EHLO localhost\r\n");
        if (!$expect($readCode($socket), ['250'])) {
            fclose($socket);
            return false;
        }

        fputs($socket, "AUTH LOGIN\r\n");
        $resp = $readCode($socket);
        if (!$expect($resp, ['334'])) {
            fclose($socket);
            return false;
        }

        fputs($socket, base64_encode($smtpUser) . "\r\n");
        if (!$expect($readCode($socket), ['334'])) {
            fclose($socket);
            return false;
        }

        fputs($socket, base64_encode($smtpPass) . "\r\n");
        if (!$expect($readCode($socket), ['235'])) {
            fclose($socket);
            return false;
        }

        fputs($socket, "MAIL FROM: <{$fromEmail}>\r\n");
        if (!$expect($readCode($socket), ['250'])) {
            fclose($socket);
            return false;
        }

        // Envelope recipients
        foreach ($recipients as $to) {
            fputs($socket, "RCPT TO: <{$to}>\r\n");
            if (!$expect($readCode($socket), ['250', '251'])) {
                fclose($socket);
                return false;
            }
        }

        fputs($socket, "DATA\r\n");
        if (!$expect($readCode($socket), ['354'])) {
            fclose($socket);
            return false;
        }

        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $toHeader = 'undisclosed-recipients:;';
        $bccHeader = implode(', ', array_map(static function ($to) {
            return '<' . $to . '>';
        }, $recipients));

        fputs($socket, "Subject: {$encodedSubject}\r\n");
        fputs($socket, "To: {$toHeader}\r\n");
        fputs($socket, "Bcc: {$bccHeader}\r\n");
        fputs($socket, "From: {$fromName} <{$fromEmail}>\r\n");
        fputs($socket, "MIME-Version: 1.0\r\n");
        fputs($socket, "Content-Type: text/html; charset=UTF-8\r\n");
        fputs($socket, "X-Mailer: MathEase Maintenance System\r\n\r\n");
        fputs($socket, $htmlBody);
        fputs($socket, "\r\n.\r\n");

        if (!$expect($readCode($socket), ['250'])) {
            fclose($socket);
            return false;
        }

        fputs($socket, "QUIT\r\n");
        fclose($socket);
        return true;
    } catch (Throwable $e) {
        @fclose($socket);
        return false;
    }
}

function maintenanceBuildEmailHtml(
    string $headline,
    string $title,
    string $message,
    ?string $eta,
    string $footerNote,
    bool $completed
): string {
    $etaHtml = '';
    if ($eta) {
        $etaHtml = '<p><strong>Estimated completion:</strong> ' . htmlspecialchars($eta, ENT_QUOTES, 'UTF-8') . '</p>';
    }
    $titleHtml = $title !== '' ? '<p><strong>' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '</strong></p>' : '';
    $msgHtml = $message !== '' ? '<p style="white-space:pre-wrap;">' . nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8')) . '</p>' : '';

    $color = $completed ? '#059669' : '#b45309';
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="color:' . $color . ';">' . htmlspecialchars($headline, ENT_QUOTES, 'UTF-8') . '</h2>
      ' . $titleHtml . $msgHtml . $etaHtml . '
      <p>' . htmlspecialchars($footerNote, ENT_QUOTES, 'UTF-8') . '</p>
      <p style="font-size:12px;color:#666;">— MathEase</p>
    </div></body></html>';
}
