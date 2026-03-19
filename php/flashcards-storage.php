<?php
// Flashcards storage endpoint (save/load) for students.
// Keeps flashcard content in `mathease_database3` without exposing any AI keys.

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Force intended DB name (avoid accidental env mismatch).
putenv('DB_NAME=mathease_database3');
$_ENV['DB_NAME'] = 'mathease_database3';
$_SERVER['DB_NAME'] = 'mathease_database3';

require_once __DIR__ . '/config.php';

function respond_error(int $status, string $message, array $extra = []): void {
    http_response_code($status);
    echo json_encode(array_merge(['success' => false, 'message' => $message], $extra));
    exit;
}

function read_json_input(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function getAllowedTopics(): array {
    return [
        'functions' => ['dbName' => 'Functions', 'lessons' => 4],
        'evaluating-functions' => ['dbName' => 'Evaluating Functions', 'lessons' => 4],
        'operations-on-functions' => ['dbName' => 'Operations on Functions', 'lessons' => 5],
        'solving-real-life-problems' => ['dbName' => 'Solving Real-Life Problems', 'lessons' => 4],
        'rational-functions' => ['dbName' => 'Rational Functions', 'lessons' => 4],
        'solving-rational-equations-inequalities' => ['dbName' => 'Solving Rational Equations and Inequalities', 'lessons' => 4],
        'representations-of-rational-functions' => ['dbName' => 'Representations of Rational Functions', 'lessons' => 4],
        'domain-range-rational-functions' => ['dbName' => 'Domain and Range of Rational Functions', 'lessons' => 4],
        'domain-range-inverse-functions' => ['dbName' => 'Domain and Range of Inverse Functions', 'lessons' => 4],
        'one-to-one-functions' => ['dbName' => 'One-to-One Functions', 'lessons' => 4],
        'simple-interest' => ['dbName' => 'Simple Interest', 'lessons' => 4],
        'compound-interest' => ['dbName' => 'Compound Interest', 'lessons' => 5],
        'simple-and-compound-values' => ['dbName' => 'Interest, Maturity, Future, and Present Values', 'lessons' => 5],
        'solving-interest-problems' => ['dbName' => 'Solving Problems: Simple and Compound Interest', 'lessons' => 5],
    ];
}

function ensure_student_access(string $topicDbName, PDO $pdo): void {
    if (!isset($_SESSION['user_id'])) {
        respond_error(401, 'Not authenticated');
    }

    // Check for approved enrollment.
    $stmt = $pdo->prepare("
        SELECT ce.id, ce.class_id
        FROM class_enrollments ce
        JOIN classes c ON ce.class_id = c.id
        WHERE ce.student_id = ? AND ce.enrollment_status = 'approved'
        LIMIT 1
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $enrollment = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$enrollment) {
        respond_error(403, 'You are not enrolled in any class');
    }

    // Check if topic is locked by teacher.
    $stmt = $pdo->prepare("
        SELECT ctl.is_locked
        FROM class_topic_locks ctl
        JOIN topics t ON ctl.topic_id = t.id
        WHERE ctl.class_id = ? AND t.name = ?
        LIMIT 1
    ");
    $stmt->execute([$enrollment['class_id'], $topicDbName]);
    $lock = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($lock && !empty($lock['is_locked'])) {
        respond_error(403, 'This topic is currently locked by your teacher');
    }
}

function ensure_flashcard_tables(PDO $pdo): void {
    // Use simple tables (no FKs) for easier setup on existing MySQL/MariaDB.
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS flashcard_sets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            topic_slug VARCHAR(100) NOT NULL,
            lesson_number INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_topic_lesson (user_id, topic_slug, lesson_number)
        ) ENGINE=InnoDB;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS flashcard_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            set_id INT NOT NULL,
            card_index INT NOT NULL,
            front TEXT NOT NULL,
            back TEXT NOT NULL,
            explanation TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_set_card (set_id, card_index),
            INDEX idx_set_card (set_id, card_index)
        ) ENGINE=InnoDB;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS flashcard_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            set_id INT NOT NULL,
            card_index INT NOT NULL,
            learned TINYINT(1) NOT NULL DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_set_card_progress (set_id, card_index),
            INDEX idx_set_card_progress (set_id, card_index)
        ) ENGINE=InnoDB;
    ");
}

function normalize_flashcards(array $flashcards): array {
    // Accept up to 10 but store exactly 10.
    $flashcards = array_values($flashcards);
    if (count($flashcards) !== 10) {
        respond_error(400, 'Expected exactly 10 flashcards to save.');
    }

    $out = [];
    foreach ($flashcards as $idx => $card) {
        if (!is_array($card)) {
            respond_error(400, 'Invalid flashcard format at index ' . $idx);
        }
        $front = isset($card['front']) ? trim((string)$card['front']) : '';
        $back = isset($card['back']) ? trim((string)$card['back']) : '';
        $explanation = isset($card['explanation']) ? trim((string)$card['explanation']) : '';

        if ($front === '' || $back === '' || $explanation === '') {
            respond_error(400, 'Flashcard missing required fields at index ' . $idx);
        }

        $out[] = [
            'front' => $front,
            'back' => $back,
            'explanation' => $explanation
        ];
    }
    return $out;
}

$input = read_json_input();
$action = $input['action'] ?? $_GET['action'] ?? '';

if (!in_array($action, ['save', 'load', 'toggle_learned', 'reset_progress'], true)) {
    respond_error(400, 'Unsupported action');
}

if (!isset($_SESSION['user_id'])) {
    respond_error(401, 'Not authenticated');
}

$topicSlug = (string)($input['topic'] ?? $_GET['topic'] ?? '');
$lessonNum = (int)($input['lesson'] ?? $_GET['lesson'] ?? 0);

if ($topicSlug === '' || $lessonNum <= 0) {
    respond_error(400, 'Missing topic or lesson');
}

$topics = getAllowedTopics();
if (!isset($topics[$topicSlug])) {
    respond_error(400, 'Invalid topic');
}

if ($lessonNum < 1 || $lessonNum > (int)$topics[$topicSlug]['lessons']) {
    respond_error(400, 'Invalid lesson for selected topic');
}

// Enforce access: enrollment + lock.
ensure_student_access($topics[$topicSlug]['dbName'], $pdo);

ensure_flashcard_tables($pdo);

if ($action === 'save') {
    $flashcards = $input['flashcards'] ?? null;
    if (!is_array($flashcards)) {
        respond_error(400, 'Missing flashcards array');
    }

    $flashcards = normalize_flashcards($flashcards);
    $userId = (int)$_SESSION['user_id'];

    $pdo->beginTransaction();
    try {
        // Create a new set each save (so student can regenerate later).
        $stmt = $pdo->prepare("
            INSERT INTO flashcard_sets (user_id, topic_slug, lesson_number)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$userId, $topicSlug, $lessonNum]);
        $setId = (int)$pdo->lastInsertId();

        $insertItem = $pdo->prepare("
            INSERT INTO flashcard_items (set_id, card_index, front, back, explanation)
            VALUES (?, ?, ?, ?, ?)
        ");

        foreach ($flashcards as $i => $card) {
            $insertItem->execute([$setId, $i, $card['front'], $card['back'], $card['explanation']]);
        }

        $pdo->commit();
        echo json_encode([
            'success' => true,
            'set_id' => $setId,
            'topic' => $topicSlug,
            'lesson' => $lessonNum,
            'flashcards_saved' => 10
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond_error(500, 'Failed to save flashcards: ' . $e->getMessage());
    }

    exit;
}

// For progress-related actions we also validate set ownership.
$userId = (int)$_SESSION['user_id'];

if ($action === 'load') {
    $stmt = $pdo->prepare("
        SELECT id
        FROM flashcard_sets
        WHERE user_id = ? AND topic_slug = ? AND lesson_number = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 1
    ");
    $stmt->execute([$userId, $topicSlug, $lessonNum]);
    $setRow = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$setRow) {
        echo json_encode([
            'success' => false,
            'message' => 'No saved flashcards found for this topic/lesson'
        ]);
        exit;
    }

    $setId = (int)$setRow['id'];

    $stmt = $pdo->prepare("
        SELECT
            i.card_index,
            i.front,
            i.back,
            i.explanation,
            COALESCE(p.learned, 0) AS learned
        FROM flashcard_items i
        LEFT JOIN flashcard_progress p
            ON p.set_id = i.set_id AND p.card_index = i.card_index
        WHERE i.set_id = ?
        ORDER BY i.card_index ASC
    ");
    $stmt->execute([$setId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$rows || count($rows) !== 10) {
        respond_error(500, 'Saved flashcards are incomplete.');
    }

    $flashcards = [];
    $learnedByCard = [];
    foreach ($rows as $r) {
        $flashcards[] = [
            'front' => (string)$r['front'],
            'back' => (string)$r['back'],
            'explanation' => (string)$r['explanation']
        ];
        $learnedByCard[] = ((int)$r['learned']) === 1;
    }

    echo json_encode([
        'success' => true,
        'topic' => $topicSlug,
        'lesson' => $lessonNum,
        'set_id' => $setId,
        'flashcards' => $flashcards,
        'learned' => $learnedByCard
    ]);

    exit;
}

if ($action === 'toggle_learned') {
    $setId = (int)($input['set_id'] ?? 0);
    $cardIndex = (int)($input['card_index'] ?? -1);
    $learned = (int)($input['learned'] ?? 0);

    if ($setId <= 0 || $cardIndex < 0 || $cardIndex > 9) {
        respond_error(400, 'Invalid set_id/card_index/learned payload');
    }

    // Verify set belongs to this user (and topic/lesson access).
    $stmt = $pdo->prepare("
        SELECT id
        FROM flashcard_sets
        WHERE id = ? AND user_id = ? AND topic_slug = ? AND lesson_number = ?
        LIMIT 1
    ");
    $stmt->execute([$setId, $userId, $topicSlug, $lessonNum]);
    $setRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$setRow) {
        respond_error(403, 'Flashcard set not found for this user/topic/lesson');
    }

    $stmt = $pdo->prepare("
        INSERT INTO flashcard_progress (set_id, card_index, learned)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE learned = VALUES(learned)
    ");
    $stmt->execute([$setId, $cardIndex, $learned ? 1 : 0]);

    echo json_encode([
        'success' => true,
        'set_id' => $setId,
        'card_index' => $cardIndex,
        'learned' => ($learned ? 1 : 0)
    ]);
    exit;
}

if ($action === 'reset_progress') {
    $setId = (int)($input['set_id'] ?? 0);
    if ($setId <= 0) {
        respond_error(400, 'Invalid set_id');
    }

    $stmt = $pdo->prepare("
        SELECT id
        FROM flashcard_sets
        WHERE id = ? AND user_id = ? AND topic_slug = ? AND lesson_number = ?
        LIMIT 1
    ");
    $stmt->execute([$setId, $userId, $topicSlug, $lessonNum]);
    $setRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$setRow) {
        respond_error(403, 'Flashcard set not found for this user/topic/lesson');
    }

    $stmt = $pdo->prepare("DELETE FROM flashcard_progress WHERE set_id = ?");
    $stmt->execute([$setId]);

    echo json_encode([
        'success' => true,
        'set_id' => $setId
    ]);
    exit;
}

respond_error(400, 'Unsupported action flow');

?>

