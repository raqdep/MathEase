<?php
/**
 * Student activity / audit trail for teacher dashboards.
 * - Explicit rows in student_activity_log (login, logout, page beacons, etc.)
 * - Derived rows from enrollments, quiz_attempts, lesson_completion, badges, users.last_login
 */

function ensure_student_activity_log_table(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_activity_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            action VARCHAR(64) NOT NULL,
            details VARCHAR(1024) NULL,
            context_class_id INT NULL,
            ip_address VARCHAR(45) NULL,
            user_agent VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_sal_user_time (user_id, created_at),
            INDEX idx_sal_action (action)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function log_student_activity(PDO $pdo, int $userId, string $action, ?string $details = null, ?int $classId = null): void
{
    try {
        ensure_student_activity_log_table($pdo);
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $ua = isset($_SERVER['HTTP_USER_AGENT']) ? substr((string) $_SERVER['HTTP_USER_AGENT'], 0, 250) : '';
        $stmt = $pdo->prepare(
            'INSERT INTO student_activity_log (user_id, action, details, context_class_id, ip_address, user_agent)
             VALUES (?,?,?,?,?,?)'
        );
        $stmt->execute([$userId, $action, $details, $classId, $ip, $ua]);
    } catch (Throwable $e) {
        error_log('log_student_activity: ' . $e->getMessage());
    }
}

function teacher_may_view_student_audit(PDO $pdo, int $teacherId, int $studentId): bool
{
    $stmt = $pdo->prepare(
        "SELECT 1 FROM class_enrollments ce
         INNER JOIN classes c ON ce.class_id = c.id
         WHERE ce.student_id = ? AND c.teacher_id = ? AND ce.enrollment_status = 'approved' AND c.is_active = TRUE
         LIMIT 1"
    );
    $stmt->execute([$studentId, $teacherId]);
    return (bool) $stmt->fetchColumn();
}

function student_audit_action_labels_tl(): array
{
    return [
        'login'                     => 'Nag-log in',
        'logout'                    => 'Nag-log out',
        'class_join_request'        => 'Humiling sumali sa klase',
        'class_join_approved'       => 'Naaprubahan ang pagkasali sa klase',
        'class_join_pending'        => 'Naghintay ng approval sa klase',
        'quiz_completed'            => 'Nag-take ng quiz',
        'quiz_ended'                => 'Natapos ang pagkuha ng quiz',
        'lesson_progress'           => 'Pumasok / natapos ang lesson',
        'flashcards_open'           => 'Nagbukas ng Flashcards',
        'achievements_open'         => 'Bumisita sa Achievements',
        'profile_edit'              => 'Nag-edit ng profile',
        'password_change'           => 'Nagpalit ng password',
        'lesson_quiz_answer'        => 'Nagsagot ng quiz sa loob ng lesson',
        'achievement_earned'        => 'Nakakuha ng achievement',
        'last_session'              => 'Huling naitalang login (account)',
        'teacher_lesson_view'       => 'Tumingin ng teacher lesson',
    ];
}

/**
 * Build merged audit trail newest-first. Only enrollments in classes owned by $teacherId are included for derived rows.
 *
 * @return list<array{action:string,label_tl:string,details:?string,at:string,source:string}>
 */
function build_student_audit_trail_for_teacher(PDO $pdo, int $teacherId, int $studentId, int $limit = 150): array
{
    if (!teacher_may_view_student_audit($pdo, $teacherId, $studentId)) {
        return [];
    }

    ensure_student_activity_log_table($pdo);
    $labels = student_audit_action_labels_tl();
    $rows = [];

    $add = function (string $action, ?string $details, string $at, string $source) use (&$rows, $labels) {
        if ($at === '' || $at === null) {
            return;
        }
        $ts = strtotime($at);
        if ($ts === false) {
            return;
        }
        $rows[] = [
            'action'   => $action,
            'label_tl' => $labels[$action] ?? $action,
            'details'  => $details,
            'at'       => $at,
            'at_ts'    => $ts,
            'source'   => $source,
        ];
    };

    try {
        $stmt = $pdo->prepare(
            'SELECT action, details, created_at FROM student_activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 300'
        );
        $stmt->execute([$studentId]);
        while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $add((string) $r['action'], $r['details'] !== null && $r['details'] !== '' ? (string) $r['details'] : null, (string) $r['created_at'], 'log');
        }
    } catch (Throwable $e) {
        error_log('audit explicit log: ' . $e->getMessage());
    }

    try {
        $stmt = $pdo->prepare(
            "SELECT ce.enrolled_at, ce.approved_at, ce.enrollment_status, c.class_name, c.class_code
             FROM class_enrollments ce
             INNER JOIN classes c ON ce.class_id = c.id
             WHERE ce.student_id = ? AND c.teacher_id = ? AND c.is_active = TRUE"
        );
        $stmt->execute([$studentId, $teacherId]);
        while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $cn = trim((string) ($r['class_name'] ?? ''));
            $cc = trim((string) ($r['class_code'] ?? ''));
            $detail = $cn . ($cc !== '' ? ' (' . $cc . ')' : '');
            $st = strtolower((string) ($r['enrollment_status'] ?? ''));
            if ($st === 'approved' && !empty($r['approved_at'])) {
                $add('class_join_approved', $detail, (string) $r['approved_at'], 'derived');
            } elseif ($st === 'pending' && !empty($r['enrolled_at'])) {
                $add('class_join_request', $detail, (string) $r['enrolled_at'], 'derived');
            } elseif (!empty($r['enrolled_at']) && empty($r['approved_at'])) {
                $add('class_join_request', $detail, (string) $r['enrolled_at'], 'derived');
            }
        }
    } catch (Throwable $e) {
        error_log('audit enrollment: ' . $e->getMessage());
    }

    try {
        $stmt = $pdo->prepare(
            "SELECT quiz_type, score, total_questions, completed_at, status
             FROM quiz_attempts
             WHERE student_id = ? AND completed_at IS NOT NULL
             ORDER BY completed_at DESC
             LIMIT 100"
        );
        $stmt->execute([$studentId]);
        while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $qt = (string) ($r['quiz_type'] ?? '');
            $sc = $r['score'] ?? '';
            $tq = $r['total_questions'] ?? '';
            $det = $qt !== '' ? $qt : 'quiz';
            if ($tq !== '' && $tq !== null) {
                $det .= ' · ' . $sc . '/' . $tq;
            }
            $st = (string) ($r['status'] ?? '');
            $isLessonQuiz = (bool) preg_match('/_topic_\d+|_lesson_|lesson/i', $qt);
            if ($st === 'completed' && $isLessonQuiz) {
                $action = 'lesson_quiz_answer';
            } elseif ($st === 'completed') {
                $action = 'quiz_completed';
            } else {
                $action = 'quiz_ended';
            }
            $add($action, $det, (string) $r['completed_at'], 'derived');
        }
    } catch (Throwable $e) {
        error_log('audit quiz: ' . $e->getMessage());
    }

    try {
        $chk = $pdo->query("SHOW TABLES LIKE 'lesson_completion'");
        if ($chk && $chk->rowCount() > 0) {
            $q = $pdo->prepare(
                'SELECT topic_name, lesson_number, completed_at FROM lesson_completion WHERE user_id = ? ORDER BY completed_at DESC LIMIT 100'
            );
            $q->execute([$studentId]);
            while ($r = $q->fetch(PDO::FETCH_ASSOC)) {
                $tn = (string) ($r['topic_name'] ?? '');
                $ln = (int) ($r['lesson_number'] ?? 0);
                $add('lesson_progress', $tn . ($ln > 0 ? ' · Lesson ' . $ln : ''), (string) $r['completed_at'], 'derived');
            }
        }
    } catch (Throwable $e) {
        error_log('audit lesson: ' . $e->getMessage());
    }

    try {
        $chk = $pdo->query("SHOW TABLES LIKE 'student_badges'");
        if ($chk && $chk->rowCount() > 0) {
            $q = $pdo->prepare(
                "SELECT b.name, sb.earned_at FROM student_badges sb
                 INNER JOIN badges b ON b.id = sb.badge_id
                 WHERE sb.student_id = ? AND sb.earned_at IS NOT NULL
                 ORDER BY sb.earned_at DESC LIMIT 50"
            );
            $q->execute([$studentId]);
            while ($r = $q->fetch(PDO::FETCH_ASSOC)) {
                $add('achievement_earned', (string) ($r['name'] ?? ''), (string) $r['earned_at'], 'derived');
            }
        }
    } catch (Throwable $e) {
        error_log('audit badges: ' . $e->getMessage());
    }

    try {
        $q = $pdo->prepare('SELECT last_login FROM users WHERE id = ? AND last_login IS NOT NULL');
        $q->execute([$studentId]);
        $ll = $q->fetchColumn();
        if ($ll) {
            $add('last_session', null, (string) $ll, 'derived');
        }
    } catch (Throwable $e) {
    }

    usort($rows, static function ($a, $b) {
        return ($b['at_ts'] ?? 0) <=> ($a['at_ts'] ?? 0);
    });

    $out = [];
    foreach (array_slice($rows, 0, $limit) as $r) {
        unset($r['at_ts']);
        $out[] = $r;
    }

    return $out;
}
