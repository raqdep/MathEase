<?php
// Start output buffering to prevent any output before JSON
ob_start();

session_start();
require_once 'config.php';
require_once __DIR__ . '/teacher-lessons-schema.php';
require_once __DIR__ . '/teacher-activity-log-helper.php';

// Clean any output that might have been generated
ob_clean();

header('Content-Type: application/json');

// Check if user is logged in as teacher
if (!isset($_SESSION['teacher_id']) || !isset($_SESSION['user_type']) || $_SESSION['user_type'] !== 'teacher') {
    ob_clean();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Teacher access required.']);
    ob_end_flush();
    exit;
}

/**
 * @param array<string,mixed> $row
 * @return array<string,mixed>
 */
function mathease_enrich_teacher_lesson_row(PDO $pdo, int $teacherId, array $row): array
{
    $row['published'] = isset($row['published']) ? (int) $row['published'] : 1;
    $ids = get_lesson_assigned_class_ids($pdo, (int) $row['id']);
    $row['assigned_class_ids'] = $ids;
    $names = [];
    if (!empty($ids)) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $sn = $pdo->prepare("SELECT class_name FROM classes WHERE teacher_id = ? AND id IN ($placeholders) ORDER BY class_name ASC");
        $sn->execute(array_merge([$teacherId], $ids));
        while ($r = $sn->fetch(PDO::FETCH_ASSOC)) {
            $names[] = $r['class_name'];
        }
    }
    $row['assigned_class_names'] = $names;
    $row['assigned_classes_label'] = empty($names) ? 'No class assigned' : implode(', ', $names);
    return $row;
}

try {
    $teacher_id = $_SESSION['teacher_id'];
    ensure_teacher_lessons_schema($pdo);

    // Toggle published (students only see published lessons)
    if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        if (($input['action'] ?? '') !== 'set_published') {
            ob_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action.']);
            ob_end_flush();
            exit;
        }
        $lesson_id = (int) ($input['lesson_id'] ?? 0);
        $published = !empty($input['published']) ? 1 : 0;
        if ($lesson_id <= 0) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Lesson ID required.']);
            ob_end_flush();
            exit;
        }
        $stmt = $pdo->prepare('UPDATE teacher_lessons SET published = ? WHERE id = ? AND teacher_id = ?');
        $stmt->execute([$published, $lesson_id, $teacher_id]);
        $chk = $pdo->prepare('SELECT published, title FROM teacher_lessons WHERE id = ? AND teacher_id = ?');
        $chk->execute([$lesson_id, $teacher_id]);
        $row = $chk->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            ob_clean();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Lesson not found or unauthorized.']);
            ob_end_flush();
            exit;
        }
        $finalPub = (int) $row['published'];
        $ltitle = $row['title'] ?? ('Lesson #' . $lesson_id);
        log_teacher_activity(
            $pdo,
            (int) $teacher_id,
            $finalPub ? 'lesson_published' : 'lesson_unpublished',
            ($finalPub ? 'Published' : 'Unpublished') . ' lesson "' . $ltitle . '" (ID ' . $lesson_id . ').'
        );
        ob_clean();
        echo json_encode([
            'success' => true,
            'message' => $finalPub ? 'Lesson published.' : 'Lesson unpublished.',
            'published' => $finalPub,
        ]);
        ob_end_flush();
        exit;
    }

    // Handle DELETE request
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        $lesson_id = $input['lesson_id'] ?? null;
        
        if (!$lesson_id) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Lesson ID required.']);
            ob_end_flush();
            exit;
        }
        
        // Verify lesson belongs to teacher
        $stmt = $pdo->prepare("
            SELECT id FROM teacher_lessons 
            WHERE id = ? AND teacher_id = ?
        ");
        $stmt->execute([$lesson_id, $teacher_id]);
        $lesson = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$lesson) {
            ob_clean();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Lesson not found or unauthorized.']);
            ob_end_flush();
            exit;
        }
        
        // Remove class links then lesson (FK may be absent on some installs)
        $pdo->prepare('DELETE FROM teacher_lesson_classes WHERE lesson_id = ?')->execute([$lesson_id]);
        $delTitleStmt = $pdo->prepare('SELECT title FROM teacher_lessons WHERE id = ? AND teacher_id = ?');
        $delTitleStmt->execute([$lesson_id, $teacher_id]);
        $delTitleRow = $delTitleStmt->fetch(PDO::FETCH_ASSOC);
        $delTitle = $delTitleRow['title'] ?? ('Lesson #' . $lesson_id);

        $stmt = $pdo->prepare("DELETE FROM teacher_lessons WHERE id = ? AND teacher_id = ?");
        $stmt->execute([$lesson_id, $teacher_id]);
        
        log_teacher_activity(
            $pdo,
            (int) $teacher_id,
            'lesson_deleted',
            'Deleted lesson "' . $delTitle . '" (ID ' . $lesson_id . ').'
        );

        ob_clean();
        echo json_encode([
            'success' => true,
            'message' => 'Lesson deleted successfully.'
        ]);
        ob_end_flush();
        exit;
    }
    
    // Handle GET request for specific lesson
    if (isset($_GET['lesson_id'])) {
        $lesson_id = (int)$_GET['lesson_id'];
        
        $stmt = $pdo->prepare("
            SELECT tl.id, tl.title, tl.topic, tl.html_content, tl.created_at, tl.updated_at,
                   tl.class_id, tl.published, c.class_name
            FROM teacher_lessons tl
            LEFT JOIN classes c ON c.id = tl.class_id
            WHERE tl.id = ? AND tl.teacher_id = ?
        ");
        
        $stmt->execute([$lesson_id, $teacher_id]);
        $lesson = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($lesson) {
            $lesson = mathease_enrich_teacher_lesson_row($pdo, (int) $teacher_id, $lesson);
            // One log per lesson per browser session (avoids spam on auto-refresh)
            $lvKey = 'mathease_lesson_view_logged_' . (int) $teacher_id;
            $logged = isset($_SESSION[$lvKey]) && is_array($_SESSION[$lvKey]) ? $_SESSION[$lvKey] : [];
            if (!in_array($lesson_id, $logged, true)) {
                log_teacher_activity(
                    $pdo,
                    (int) $teacher_id,
                    'lesson_viewed',
                    'Opened lesson "' . ($lesson['title'] ?? 'Lesson') . '" (ID ' . $lesson_id . ') in the editor.'
                );
                $logged[] = $lesson_id;
                if (count($logged) > 50) {
                    $logged = array_slice($logged, -50);
                }
                $_SESSION[$lvKey] = $logged;
            }
            ob_clean();
            echo json_encode([
                'success' => true,
                'lesson' => $lesson
            ]);
            ob_end_flush();
        } else {
            ob_clean();
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Lesson not found.'
            ]);
            ob_end_flush();
        }
        exit;
    }
    
    // Handle GET request for all lessons
    $stmt = $pdo->prepare("
        SELECT tl.id, tl.title, tl.topic, tl.created_at, tl.updated_at, tl.class_id, tl.published, c.class_name
        FROM teacher_lessons tl
        LEFT JOIN classes c ON c.id = tl.class_id
        WHERE tl.teacher_id = ?
        ORDER BY tl.created_at DESC
    ");

    $stmt->execute([$teacher_id]);
    $lessons = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($lessons as $i => $L) {
        $lessons[$i] = mathease_enrich_teacher_lesson_row($pdo, (int) $teacher_id, $L);
    }

    ob_clean();
    echo json_encode([
        'success' => true,
        'lessons' => $lessons
    ]);
    ob_end_flush();

} catch (PDOException $e) {
    error_log("Get Teacher Lessons Error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load lessons.'
    ]);
    ob_end_flush();
}
?>
