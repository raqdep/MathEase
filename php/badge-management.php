<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$action = $_POST['action'] ?? '';

try {
    switch ($action) {
        case 'check_and_award_badges':
            checkAndAwardBadges();
            break;
        case 'get_student_badges':
            getStudentBadges();
            break;
        case 'award_badge':
            awardBadge();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

function checkAndAwardBadges() {
    global $pdo;
    
    $studentId = $_POST['student_id'] ?? null;
    $quizType = $_POST['quiz_type'] ?? null;
    $score = $_POST['score'] ?? null;
    $totalQuestions = $_POST['total_questions'] ?? null;
    $attemptId = $_POST['attempt_id'] ?? null;
    
    if (!$studentId || !$quizType || !$score || !$totalQuestions) {
        throw new Exception('Missing required parameters');
    }
    
    $percentage = ($score / $totalQuestions) * 100;
    
    // Get all badges that could be awarded
    $badgesQuery = "SELECT * FROM badges WHERE is_active = 1";
    $badges = $pdo->query($badgesQuery)->fetchAll(PDO::FETCH_ASSOC);
    
    $awardedBadges = [];
    
    foreach ($badges as $badge) {
        $shouldAward = false;
        
        // Check if student already has this badge
        $existingBadge = $pdo->prepare("
            SELECT id FROM student_badges 
            WHERE student_id = ? AND badge_id = ?
        ");
        $existingBadge->execute([$studentId, $badge['id']]);
        
        if ($existingBadge->fetch()) {
            continue; // Student already has this badge
        }
        
        // Check badge criteria - but skip general score check for quiz-specific badges
        $isQuizSpecificBadge = in_array($badge['name'], [
            'Functions Master', 'Functions Achiever', 'Functions Explorer',
            'Evaluating Functions Champion', 'Evaluating Functions Expert',
            'Operations on Functions Champion', 'Operations on Functions Master', 'Operations on Functions Expert',
            'Real-Life Problems Champion', 'Real-Life Problems Master', 'Real-Life Problems Solver'
        ]);
        
        if (!$isQuizSpecificBadge) {
            switch ($badge['criteria_type']) {
                case 'score':
                    if ($percentage >= $badge['criteria_value']) {
                        $shouldAward = true;
                    }
                    break;
                case 'quizzes':
                    // Check if this is a quiz completion
                    if ($quizType === 'functions' && $badge['name'] === 'Functions Explorer') {
                        $shouldAward = true;
                    }
                    break;
            }
        }
        
        // Special handling for evaluating-functions quiz
        if ($quizType === 'evaluating-functions') {
            // Check for Evaluating Functions Champion badge (80%+) - highest priority
            if ($badge['name'] === 'Evaluating Functions Champion' && $percentage >= 80) {
                $shouldAward = true;
            }
            // Check for Evaluating Functions Expert badge (75%+ but less than 80%)
            elseif ($badge['name'] === 'Evaluating Functions Expert' && $percentage >= 75 && $percentage < 80) {
                $shouldAward = true;
            }
        }
        // Skip all other badge checks if not evaluating-functions quiz
        elseif ($quizType !== 'evaluating-functions' && ($badge['name'] === 'Evaluating Functions Champion' || $badge['name'] === 'Evaluating Functions Expert')) {
            // Skip evaluating functions badges for other quiz types
            continue;
        }
        
        // Special handling for functions quiz
        if ($quizType === 'functions') {
            // Check for Functions Master badge (100%) - highest priority
            if ($badge['name'] === 'Functions Master' && $percentage >= 100) {
                $shouldAward = true;
            }
            // Check for Functions Achiever badge (50%+ but less than 100%)
            elseif ($badge['name'] === 'Functions Achiever' && $percentage >= 50 && $percentage < 100) {
                $shouldAward = true;
            }
            // Check for Functions Explorer badge (any completion)
            elseif ($badge['name'] === 'Functions Explorer' && $percentage >= 0) {
                $shouldAward = true;
            }
        }
        // Skip all other badge checks if not functions quiz
        elseif ($quizType !== 'functions' && ($badge['name'] === 'Functions Master' || $badge['name'] === 'Functions Achiever' || $badge['name'] === 'Functions Explorer')) {
            // Skip functions badges for other quiz types
            continue;
        }
        
        // Special handling for operations-on-functions quiz
        if ($quizType === 'operations-on-functions') {
            // Check for Operations on Functions Champion badge (90%+) - highest priority
            if ($badge['name'] === 'Operations on Functions Champion' && $percentage >= 90) {
                $shouldAward = true;
            }
            // Check for Operations on Functions Master badge (80%+ but less than 90%)
            elseif ($badge['name'] === 'Operations on Functions Master' && $percentage >= 80 && $percentage < 90) {
                $shouldAward = true;
            }
            // Check for Operations on Functions Expert badge (60%+ but less than 80%)
            elseif ($badge['name'] === 'Operations on Functions Expert' && $percentage >= 60 && $percentage < 80) {
                $shouldAward = true;
            }
        }
        // Skip all other badge checks if not operations-on-functions quiz
        elseif ($quizType !== 'operations-on-functions' && ($badge['name'] === 'Operations on Functions Champion' || $badge['name'] === 'Operations on Functions Master' || $badge['name'] === 'Operations on Functions Expert')) {
            // Skip operations-on-functions badges for other quiz types
            continue;
        }
        
        // Special handling for real-life-problems quiz
        if ($quizType === 'real-life-problems') {
            // Check for Real-Life Problems Champion badge (90%+) - highest priority
            if ($badge['name'] === 'Real-Life Problems Champion' && $percentage >= 90) {
                $shouldAward = true;
            }
            // Check for Real-Life Problems Master badge (80%+ but less than 90%)
            elseif ($badge['name'] === 'Real-Life Problems Master' && $percentage >= 80 && $percentage < 90) {
                $shouldAward = true;
            }
            // Check for Real-Life Problems Solver badge (50%+ but less than 80%)
            elseif ($badge['name'] === 'Real-Life Problems Solver' && $percentage >= 50 && $percentage < 80) {
                $shouldAward = true;
            }
        }
        // Skip all other badge checks if not real-life-problems quiz
        elseif ($quizType !== 'real-life-problems' && ($badge['name'] === 'Real-Life Problems Champion' || $badge['name'] === 'Real-Life Problems Master' || $badge['name'] === 'Real-Life Problems Solver')) {
            // Skip real-life-problems badges for other quiz types
            continue;
        }
        
        if ($shouldAward) {
            // Award the badge
            $awardQuery = "
                INSERT INTO student_badges (student_id, badge_id, quiz_attempt_id) 
                VALUES (?, ?, ?)
            ";
            $pdo->prepare($awardQuery)->execute([$studentId, $badge['id'], $attemptId]);
            
            $awardedBadges[] = [
                'id' => $badge['id'],
                'name' => $badge['name'],
                'description' => $badge['description'],
                'icon_url' => $badge['icon_url']
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'awarded_badges' => $awardedBadges,
        'message' => count($awardedBadges) > 0 ? 'New badges earned!' : 'No new badges earned'
    ]);
}

function getStudentBadges() {
    global $pdo;
    
    $studentId = $_POST['student_id'] ?? null;
    
    if (!$studentId) {
        throw new Exception('Student ID required');
    }
    
    $query = "
        SELECT b.*, sb.earned_at 
        FROM badges b
        JOIN student_badges sb ON b.id = sb.badge_id
        WHERE sb.student_id = ?
        ORDER BY sb.earned_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$studentId]);
    $badges = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'badges' => $badges
    ]);
}

function awardBadge() {
    global $pdo;
    
    $studentId = $_POST['student_id'] ?? null;
    $badgeId = $_POST['badge_id'] ?? null;
    $attemptId = $_POST['attempt_id'] ?? null;
    
    if (!$studentId || !$badgeId) {
        throw new Exception('Student ID and Badge ID required');
    }
    
    // Check if student already has this badge
    $existingBadge = $pdo->prepare("
        SELECT id FROM student_badges 
        WHERE student_id = ? AND badge_id = ?
    ");
    $existingBadge->execute([$studentId, $badgeId]);
    
    if ($existingBadge->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'Student already has this badge'
        ]);
        return;
    }
    
    // Award the badge
    $awardQuery = "
        INSERT INTO student_badges (student_id, badge_id, quiz_attempt_id) 
        VALUES (?, ?, ?)
    ";
    $pdo->prepare($awardQuery)->execute([$studentId, $badgeId, $attemptId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Badge awarded successfully'
    ]);
}
?>
