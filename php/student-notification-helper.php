<?php
/**
 * Student notification helper for MathEase.
 * Inserts rows into `notifications` table for student-side notification UI.
 */

function createStudentNotification(PDO $pdo, int $userId, string $type, string $title, string $message): bool {
    try {
        // Guard against accidental duplicate inserts from double-submits/racey UI calls.
        $dupStmt = $pdo->prepare("
            SELECT id
            FROM notifications
            WHERE user_id = ?
              AND type = ?
              AND title = ?
              AND message = ?
              AND created_at >= (NOW() - INTERVAL 30 SECOND)
            ORDER BY id DESC
            LIMIT 1
        ");
        $dupStmt->execute([$userId, $type, $title, $message]);
        if ($dupStmt->fetch(PDO::FETCH_ASSOC)) {
            return true;
        }

        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
            VALUES (?, ?, ?, ?, FALSE, NOW())
        ");
        return $stmt->execute([$userId, $type, $title, $message]);
    } catch (Throwable $e) {
        error_log('createStudentNotification failed: ' . $e->getMessage());
        return false;
    }
}

function getApprovedStudentIdsForClass(PDO $pdo, int $classId): array {
    try {
        $stmt = $pdo->prepare("
            SELECT DISTINCT ce.student_id
            FROM class_enrollments ce
            WHERE ce.class_id = ? AND ce.enrollment_status = 'approved'
        ");
        $stmt->execute([$classId]);
        return array_map('intval', array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'student_id'));
    } catch (Throwable $e) {
        error_log('getApprovedStudentIdsForClass failed: ' . $e->getMessage());
        return [];
    }
}

function notifyApprovedStudents(PDO $pdo, int $classId, string $type, string $title, string $message): int {
    $ids = getApprovedStudentIdsForClass($pdo, $classId);
    $count = 0;
    foreach ($ids as $uid) {
        if (createStudentNotification($pdo, (int)$uid, $type, $title, $message)) {
            $count++;
        }
    }
    return $count;
}

function notifyApprovedStudentsForTeacherScope(PDO $pdo, int $teacherId, ?int $classId, string $type, string $title, string $message): int {
    try {
        if (!empty($classId) && (int)$classId > 0) {
            return notifyApprovedStudents($pdo, (int)$classId, $type, $title, $message);
        }

        // Scope == all active classes owned by teacher
        $stmt = $pdo->prepare("SELECT id FROM classes WHERE teacher_id = ? AND is_active = TRUE");
        $stmt->execute([$teacherId]);
        $classIds = array_map('intval', array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'id'));
        $total = 0;
        foreach ($classIds as $cid) {
            $total += notifyApprovedStudents($pdo, $cid, $type, $title, $message);
        }
        return $total;
    } catch (Throwable $e) {
        error_log('notifyApprovedStudentsForTeacherScope failed: ' . $e->getMessage());
        return 0;
    }
}

