<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if (!is_logged_in()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Helpers
function get_topic_by_slug_or_name($pdo, $slugOrName) {
    // Try by exact name first, then by slug transform
    $stmt = $pdo->prepare("SELECT id, name, description FROM topics WHERE name = ? LIMIT 1");
    $stmt->execute([$slugOrName]);
    $topic = $stmt->fetch();
    if ($topic) return $topic;
    // Convert slug to spaced title-case
    $name = ucwords(str_replace('-', ' ', strtolower($slugOrName)));
    $stmt = $pdo->prepare("SELECT id, name, description FROM topics WHERE LOWER(name) = LOWER(?) LIMIT 1");
    $stmt->execute([$name]);
    return $stmt->fetch();
}

try {
    $userId = $_SESSION['user_id'];
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // Return overall progress summary + per-topic progress for this user
        // Overall summary from user_progress
        $stmt = $pdo->prepare("SELECT total_score, completed_lessons, current_topic FROM user_progress WHERE user_id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $summary = $stmt->fetch();
        if (!$summary) {
            $summary = [
                'total_score' => 0,
                'completed_lessons' => 0,
                'current_topic' => 'Functions'
            ];
        }

        // Live compute completed lessons from user_topic_progress to avoid drift
        $stmt = $pdo->prepare("SELECT COUNT(*) AS cnt FROM user_topic_progress WHERE user_id = ? AND completed = 1");
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        $summary['completed_lessons'] = isset($row['cnt']) ? (int)$row['cnt'] : (int)$summary['completed_lessons'];

        // Per-topic progress: return ALL topics with user's progress if any
        $stmt = $pdo->prepare("SELECT 
                t.id AS topic_id,
                t.name,
                t.description,
                COALESCE(utp.completed, 0) AS completed,
                COALESCE(utp.best_score, 0) AS best_score,
                utp.attempts,
                utp.updated_at,
                utp.last_step
            FROM topics t
            LEFT JOIN user_topic_progress utp
              ON utp.topic_id = t.id AND utp.user_id = ?
            ORDER BY t.order_index ASC, t.id ASC");
        $stmt->execute([$userId]);
        $topics = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'summary' => $summary,
            'topics' => $topics
        ]);
        exit;
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = isset($input['action']) ? sanitize_input($input['action']) : '';

        if ($action === 'record_visit') {
            $topicKey = isset($input['topic']) ? trim($input['topic']) : '';
            if ($topicKey === '') throw new Exception('Topic is required');
            $topic = get_topic_by_slug_or_name($pdo, $topicKey);
            if (!$topic) throw new Exception('Topic not found');

            // Upsert user_topic_progress row
            $stmt = $pdo->prepare("INSERT INTO user_topic_progress (user_id, topic_id, completed, best_score, attempts, last_attempt) VALUES (?, ?, 0, 0, 1, NOW()) ON DUPLICATE KEY UPDATE attempts = attempts + 1, last_attempt = NOW()");
            $stmt->execute([$userId, $topic['id']]);

            // Update current topic on user_progress
            $stmt = $pdo->prepare("INSERT INTO user_progress (user_id, current_topic) VALUES (?, ?) ON DUPLICATE KEY UPDATE current_topic = VALUES(current_topic)");
            $stmt->execute([$userId, $topic['name']]);

            echo json_encode(['success' => true, 'message' => 'Visit recorded']);
            exit;
        }

        if ($action === 'update_progress') {
            $topicKey = isset($input['topic']) ? trim($input['topic']) : '';
            $completed = !empty($input['completed']);
            $bestScore = isset($input['best_score']) ? max(0, min(100, (int)$input['best_score'])) : null;
            $lastStep = isset($input['last_step']) ? trim($input['last_step']) : null;
            if ($topicKey === '') throw new Exception('Topic is required');
            $topic = get_topic_by_slug_or_name($pdo, $topicKey);
            if (!$topic) throw new Exception('Topic not found');

            // Ensure record exists and update best/complete flags
            // Note: requires a column `last_step` VARCHAR(32) in user_topic_progress
            $stmt = $pdo->prepare("INSERT INTO user_topic_progress (user_id, topic_id, completed, best_score, attempts, last_attempt, last_step) VALUES (?, ?, ?, ?, 1, NOW(), COALESCE(?, last_step)) ON DUPLICATE KEY UPDATE completed = GREATEST(completed, VALUES(completed)), best_score = GREATEST(best_score, VALUES(best_score)), last_step = COALESCE(VALUES(last_step), last_step), updated_at = NOW()");
            $stmt->execute([$userId, $topic['id'], $completed ? 1 : 0, $bestScore !== null ? $bestScore : 0, $lastStep]);

            // Recompute completed lessons accurately and update user_progress
            $stmt = $pdo->prepare("SELECT COUNT(*) AS cnt FROM user_topic_progress WHERE user_id = ? AND completed = 1");
            $stmt->execute([$userId]);
            $row = $stmt->fetch();
            $completedLessons = (int)($row ? $row['cnt'] : 0);
            $stmt = $pdo->prepare("INSERT INTO user_progress (user_id, completed_lessons, current_topic) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE completed_lessons = VALUES(completed_lessons), current_topic = VALUES(current_topic)");
            $stmt->execute([$userId, $completedLessons, $topic['name']]);

            echo json_encode(['success' => true, 'message' => 'Progress updated']);
            exit;
        }

        if ($action === 'save_quiz_attempt') {
            // Expected payload: topic (or quiz_title), score, total_questions, time_taken_minutes
            $topicKey = isset($input['topic']) ? trim($input['topic']) : '';
            $quizTitle = isset($input['quiz_title']) ? trim($input['quiz_title']) : '';
            $score = isset($input['score']) ? (int)$input['score'] : 0;
            $totalQuestions = isset($input['total_questions']) ? (int)$input['total_questions'] : 0;
            $timeTaken = isset($input['time_taken_minutes']) ? (int)$input['time_taken_minutes'] : null;
            $answers = isset($input['answers']) && is_array($input['answers']) ? $input['answers'] : [];

            if ($totalQuestions <= 0) throw new Exception('total_questions is required');

            // Resolve quiz_id by quiz title or by topic name (first active quiz)
            $quizId = null;
            if ($quizTitle !== '') {
                $stmt = $pdo->prepare("SELECT id FROM quizzes WHERE title = ? LIMIT 1");
                $stmt->execute([$quizTitle]);
                $row = $stmt->fetch();
                if ($row) $quizId = (int)$row['id'];
            }
            if (!$quizId && $topicKey !== '') {
                $topic = get_topic_by_slug_or_name($pdo, $topicKey);
                if ($topic) {
                    $stmt = $pdo->prepare("SELECT id FROM quizzes WHERE topic_id = ? AND is_active = 1 ORDER BY id ASC LIMIT 1");
                    $stmt->execute([(int)$topic['id']]);
                    $row = $stmt->fetch();
                    if ($row) $quizId = (int)$row['id'];
                }
            }
            if (!$quizId) throw new Exception('Quiz not found');

            // Insert attempt
            $stmt = $pdo->prepare("INSERT INTO user_quiz_attempts (user_id, quiz_id, score, total_questions, time_taken_minutes, completed_at) VALUES (?, ?, ?, ?, ?, NOW())");
            $stmt->execute([$userId, $quizId, $score, $totalQuestions, $timeTaken]);
            $attemptId = (int)$pdo->lastInsertId();

            // Optionally save per-question answers for review
            if (!empty($answers)) {
                $ins = $pdo->prepare("INSERT INTO user_quiz_attempt_answers (user_id, quiz_id, question_index, selected_option_index, correct, attempt_id) VALUES (?, ?, ?, ?, ?, ?)");
                foreach ($answers as $ans) {
                    $qIndex = isset($ans['index']) ? (int)$ans['index'] : null;
                    $sel = isset($ans['selected']) ? (int)$ans['selected'] : null;
                    $ok = !empty($ans['correct']) ? 1 : 0;
                    if ($qIndex === null || $sel === null) continue;
                    $ins->execute([$userId, $quizId, $qIndex, $sel, $ok, $attemptId]);
                }
            }

            // Update aggregate score
            $points = max(0, (int)round(($score / max(1, $totalQuestions)) * 100));
            $pdo->prepare("INSERT INTO user_progress (user_id, total_score) VALUES (?, ?) ON DUPLICATE KEY UPDATE total_score = total_score + VALUES(total_score)")
                ->execute([$userId, $points]);

            echo json_encode(['success' => true, 'message' => 'Quiz attempt saved', 'attempt_id' => $attemptId]);
            exit;
        }

        if ($action === 'get_latest_quiz_attempt') {
            $topicKey = isset($input['topic']) ? trim($input['topic']) : '';
            $quizTitle = isset($input['quiz_title']) ? trim($input['quiz_title']) : '';
            if ($topicKey === '' && $quizTitle === '') throw new Exception('topic or quiz_title is required');

            // Resolve quiz id
            $quizId = null;
            if ($quizTitle !== '') {
                $stmt = $pdo->prepare("SELECT id FROM quizzes WHERE title = ? LIMIT 1");
                $stmt->execute([$quizTitle]);
                $row = $stmt->fetch();
                if ($row) $quizId = (int)$row['id'];
            }
            if (!$quizId && $topicKey !== '') {
                $topic = get_topic_by_slug_or_name($pdo, $topicKey);
                if ($topic) {
                    $stmt = $pdo->prepare("SELECT id FROM quizzes WHERE topic_id = ? AND is_active = 1 ORDER BY id ASC LIMIT 1");
                    $stmt->execute([(int)$topic['id']]);
                    $row = $stmt->fetch();
                    if ($row) $quizId = (int)$row['id'];
                }
            }
            if (!$quizId) throw new Exception('Quiz not found');

            // Latest attempt header
            $stmt = $pdo->prepare("SELECT id, score, total_questions, time_taken_minutes, completed_at FROM user_quiz_attempts WHERE user_id = ? AND quiz_id = ? ORDER BY completed_at DESC, id DESC LIMIT 1");
            $stmt->execute([$userId, $quizId]);
            $attempt = $stmt->fetch();
            if (!$attempt) {
                echo json_encode(['success' => true, 'attempt' => null, 'answers' => []]);
                exit;
            }

            // Answers for that attempt
            $stmt = $pdo->prepare("SELECT question_index AS `index`, selected_option_index AS selected, correct FROM user_quiz_attempt_answers WHERE user_id = ? AND quiz_id = ? AND attempt_id = ? ORDER BY question_index ASC");
            $stmt->execute([$userId, $quizId, (int)$attempt['id']]);
            $answers = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'attempt' => [
                    'id' => (int)$attempt['id'],
                    'score' => (int)$attempt['score'],
                    'total_questions' => (int)$attempt['total_questions'],
                    'time_taken_minutes' => isset($attempt['time_taken_minutes']) ? (int)$attempt['time_taken_minutes'] : null,
                    'completed_at' => $attempt['completed_at']
                ],
                'answers' => $answers
            ]);
            exit;
        }

        if ($action === 'save_lesson_progress') {
            // Optional endpoint to track lesson-level completion if lesson_id provided
            $lessonId = isset($input['lesson_id']) ? (int)$input['lesson_id'] : 0;
            $completed = !empty($input['completed']);
            $timeSpent = isset($input['time_spent_minutes']) ? max(0, (int)$input['time_spent_minutes']) : 0;
            if ($lessonId <= 0) throw new Exception('lesson_id is required');

            $stmt = $pdo->prepare("INSERT INTO user_lesson_progress (user_id, lesson_id, completed, time_spent_minutes, last_accessed) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE completed = GREATEST(completed, VALUES(completed)), time_spent_minutes = GREATEST(time_spent_minutes, VALUES(time_spent_minutes)), last_accessed = NOW()");
            $stmt->execute([$userId, $lessonId, $completed ? 1 : 0, $timeSpent]);

            echo json_encode(['success' => true, 'message' => 'Lesson progress saved']);
            exit;
        }

        throw new Exception('Unknown action');
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>


