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
    
    if (!$studentId || !$quizType || $score === null || !$totalQuestions) {
        error_log("Badge check failed - Missing parameters: student_id=$studentId, quiz_type=$quizType, score=$score, total_questions=$totalQuestions");
        throw new Exception('Missing required parameters');
    }
    
    // Ensure score and totalQuestions are numeric
    $score = (int)$score;
    $totalQuestions = (int)$totalQuestions;
    $studentId = (int)$studentId;
    
    if ($totalQuestions <= 0) {
        error_log("Badge check failed - Invalid total_questions: $totalQuestions");
        throw new Exception('Invalid total questions');
    }
    
    $percentage = ($score / $totalQuestions) * 100;
    
    error_log("Badge check started: Student $studentId, Quiz: $quizType, Score: $score/$totalQuestions ($percentage%)");
    
    // Get all badges that could be awarded
    $badgesQuery = "SELECT * FROM badges WHERE is_active = 1";
    $badges = $pdo->query($badgesQuery)->fetchAll(PDO::FETCH_ASSOC);
    
    $awardedBadges = [];
    $useUserBadges = $pdo->query("SHOW TABLES LIKE 'user_badges'")->rowCount() > 0;
    
    foreach ($badges as $badge) {
        $shouldAward = false;
        
        // Check if student already has this badge (user_badges.user_id or student_badges.student_id)
        if ($useUserBadges) {
            $existingBadge = $pdo->prepare("SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?");
        } else {
            $existingBadge = $pdo->prepare("SELECT id FROM student_badges WHERE student_id = ? AND badge_id = ?");
        }
        $existingBadge->execute([$studentId, $badge['id']]);
        
        if ($existingBadge->fetch()) {
            continue; // Student already has this badge
        }
        
        // Check badge criteria - but skip general score check for quiz-specific badges
        $isQuizSpecificBadge = in_array($badge['name'], [
            'Functions Master', 'Functions Expert', 'Functions Achiever',
            'Evaluating Functions Champion', 'Evaluating Functions Expert',
            'Operations on Functions Champion', 'Operations on Functions Expert',
            'Real-Life Problems Champion', 'Real-Life Problems Expert'
        ]);
        
        if (!$isQuizSpecificBadge) {
            switch ($badge['criteria_type']) {
                case 'score':
                    if ($percentage >= $badge['criteria_value']) {
                        $shouldAward = true;
                    }
                    break;
                case 'quizzes':
                    // Quiz completion badges handled in quiz-specific sections
                    break;
            }
        }
        
        // Special handling for evaluating-functions quiz
        if ($quizType === 'evaluating-functions') {
            // Check for Evaluating Functions Champion badge (100%) - highest priority
            if ($badge['name'] === 'Evaluating Functions Champion' && $percentage >= 100) {
                $shouldAward = true;
                error_log("✅ Evaluating Functions Champion badge qualified: $percentage% >= 100%");
            }
            // Check for Evaluating Functions Expert badge (60%+ but less than 100%)
            elseif ($badge['name'] === 'Evaluating Functions Expert' && $percentage >= 60 && $percentage < 100) {
                $shouldAward = true;
                error_log("✅ Evaluating Functions Expert badge qualified: $percentage% >= 60% and < 100%");
            }
        }
        // Skip all other badge checks if not evaluating-functions quiz
        elseif ($quizType !== 'evaluating-functions' && ($badge['name'] === 'Evaluating Functions Champion' || $badge['name'] === 'Evaluating Functions Expert')) {
            // Skip evaluating functions badges for other quiz types
            continue;
        }
        
        // Special handling for functions quiz
        if ($quizType === 'functions' || $quizType === 'functions_topic_1') {
            // Check for Functions Master badge (100%) - highest priority
            if ($badge['name'] === 'Functions Master' && $percentage >= 100) {
                $shouldAward = true;
                error_log("✅ Functions Master badge qualified: $percentage% >= 100%");
            }
            // Check for Functions Expert badge (60%+ but less than 100%)
            // Only award if they don't qualify for Functions Master
            elseif ($badge['name'] === 'Functions Expert' && $percentage >= 60 && $percentage < 100) {
                $shouldAward = true;
                error_log("✅ Functions Expert badge qualified: $percentage% >= 60% and < 100%");
            }
            // Check for Functions Achiever badge (50%+ but less than 60%)
            // Only award if they don't qualify for higher badges
            elseif ($badge['name'] === 'Functions Achiever' && $percentage >= 50 && $percentage < 60) {
                $shouldAward = true;
                error_log("✅ Functions Achiever badge qualified: $percentage% >= 50% and < 60%");
            }
        }
        // Skip all other badge checks if not functions quiz
        elseif ($quizType !== 'functions' && $quizType !== 'functions_topic_1' && ($badge['name'] === 'Functions Master' || $badge['name'] === 'Functions Expert' || $badge['name'] === 'Functions Achiever')) {
            // Skip functions badges for other quiz types
            continue;
        }
        
        // Special handling for operations-on-functions quiz
        if ($quizType === 'operations-on-functions') {
            // Check for Operations on Functions Champion badge (100%) - highest priority
            if ($badge['name'] === 'Operations on Functions Champion' && $percentage >= 100) {
                $shouldAward = true;
                error_log("✅ Operations on Functions Champion badge qualified: $percentage% >= 100%");
            }
            // Check for Operations on Functions Expert badge (60%+ but less than 100%)
            elseif ($badge['name'] === 'Operations on Functions Expert' && $percentage >= 60 && $percentage < 100) {
                $shouldAward = true;
                error_log("✅ Operations on Functions Expert badge qualified: $percentage% >= 60% and < 100%");
            }
        }
        // Skip all other badge checks if not operations-on-functions quiz
        elseif ($quizType !== 'operations-on-functions' && ($badge['name'] === 'Operations on Functions Champion' || $badge['name'] === 'Operations on Functions Expert')) {
            // Skip operations-on-functions badges for other quiz types
            continue;
        }
        
        // Special handling for real-life-problems quiz
        if ($quizType === 'real-life-problems') {
            // Check for Real-Life Problems Champion badge (100%) - highest priority
            if ($badge['name'] === 'Real-Life Problems Champion' && $percentage >= 100) {
                $shouldAward = true;
                error_log("✅ Real-Life Problems Champion badge qualified: $percentage% >= 100%");
            }
            // Check for Real-Life Problems Expert badge (60%+ but less than 100%)
            elseif ($badge['name'] === 'Real-Life Problems Expert' && $percentage >= 60 && $percentage < 100) {
                $shouldAward = true;
                error_log("✅ Real-Life Problems Expert badge qualified: $percentage% >= 60% and < 100%");
            }
        }
        // Skip all other badge checks if not real-life-problems quiz
        elseif ($quizType !== 'real-life-problems' && ($badge['name'] === 'Real-Life Problems Champion' || $badge['name'] === 'Real-Life Problems Expert')) {
            // Skip real-life-problems badges for other quiz types
            continue;
        }
        
        if ($shouldAward) {
            try {
                // Award the badge (user_badges has user_id, badge_id only)
                if ($useUserBadges) {
                    $pdo->prepare("INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)")->execute([$studentId, $badge['id']]);
                } else {
                    $columnExists = $pdo->query("SHOW COLUMNS FROM student_badges LIKE 'quiz_attempt_id'")->rowCount() > 0;
                    if ($columnExists && $attemptId) {
                        $pdo->prepare("INSERT INTO student_badges (student_id, badge_id, quiz_attempt_id) VALUES (?, ?, ?)")->execute([$studentId, $badge['id'], $attemptId]);
                    } else {
                        $pdo->prepare("INSERT INTO student_badges (student_id, badge_id) VALUES (?, ?)")->execute([$studentId, $badge['id']]);
                    }
                }
                
                error_log("✅ Badge awarded: {$badge['name']} (ID: {$badge['id']}) to student $studentId for quiz $quizType");
                
                $awardedBadges[] = [
                    'id' => $badge['id'],
                    'name' => $badge['name'],
                    'description' => $badge['description'] ?? '',
                    'icon_url' => $badge['icon_url'] ?? '',
                    'rarity' => $badge['rarity'] ?? 'common'
                ];
                
                // Create notification for the badge award
                try {
                    // Student notifications table uses user_id column
                    $notificationQuery = "
                        INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                        VALUES (?, ?, ?, 'badge', 0, NOW())
                    ";
                    $notificationMessage = "Congratulations! You earned the '{$badge['name']}' badge! 🏆";
                    $pdo->prepare($notificationQuery)->execute([
                        $studentId,
                        "New Badge Earned!",
                        $notificationMessage
                    ]);
                    error_log("✅ Notification created for badge: {$badge['name']}");
                } catch (PDOException $e) {
                    error_log("⚠️ Could not create notification for badge: " . $e->getMessage());
                    // Don't fail badge awarding if notification fails
                }
            } catch (PDOException $e) {
                error_log("❌ Error awarding badge {$badge['name']} to student $studentId: " . $e->getMessage());
                // Continue with other badges even if one fails
            }
        }
    }
    
    // Sort badges by priority (highest first) for display
    $badgePriority = [
        'Functions Master' => 1,
        'Functions Expert' => 2,
        'Functions Achiever' => 3,
        'Evaluating Functions Champion' => 1,
        'Evaluating Functions Expert' => 2,
        'Operations on Functions Champion' => 1,
        'Operations on Functions Expert' => 2,
        'Real-Life Problems Champion' => 1,
        'Real-Life Problems Expert' => 2
    ];
    
    usort($awardedBadges, function($a, $b) use ($badgePriority) {
        $priorityA = $badgePriority[$a['name']] ?? 999;
        $priorityB = $badgePriority[$b['name']] ?? 999;
        return $priorityA - $priorityB;
    });
    
    error_log("Badge check completed: Student $studentId, Quiz: $quizType, Score: $score/$totalQuestions ($percentage%), Awarded: " . count($awardedBadges) . " badges");
    
    echo json_encode([
        'success' => true,
        'awarded_badges' => $awardedBadges,
        'message' => count($awardedBadges) > 0 ? 'New badges earned!' : 'No new badges earned',
        'quiz_type' => $quizType,
        'percentage' => round($percentage, 2)
    ]);
}

function getStudentBadges() {
    global $pdo;
    
    $studentId = $_POST['student_id'] ?? null;
    
    if (!$studentId) {
        throw new Exception('Student ID required');
    }
    
    // Ensure studentId is an integer
    $studentId = (int)$studentId;
    
    try {
        $useUserBadges = $pdo->query("SHOW TABLES LIKE 'user_badges'")->rowCount() > 0;
        if ($useUserBadges) {
            $query = "SELECT b.*, ub.earned_at FROM badges b INNER JOIN user_badges ub ON b.id = ub.badge_id WHERE ub.user_id = ? ORDER BY ub.earned_at DESC";
        } else {
            $query = "SELECT b.*, sb.earned_at FROM badges b INNER JOIN student_badges sb ON b.id = sb.badge_id WHERE sb.student_id = ? ORDER BY sb.earned_at DESC";
        }
        $stmt = $pdo->prepare($query);
        $stmt->execute([$studentId]);
        $badges = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Retrieved " . count($badges) . " badges for student $studentId");
        
        echo json_encode([
            'success' => true,
            'badges' => $badges
        ]);
    } catch (PDOException $e) {
        error_log("Error fetching student badges: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Error fetching badges: ' . $e->getMessage(),
            'badges' => []
        ]);
    }
}

function awardBadge() {
    global $pdo;
    
    $studentId = $_POST['student_id'] ?? null;
    $badgeId = $_POST['badge_id'] ?? null;
    $attemptId = $_POST['attempt_id'] ?? null;
    
    if (!$studentId || !$badgeId) {
        throw new Exception('Student ID and Badge ID required');
    }
    
    $useUserBadges = $pdo->query("SHOW TABLES LIKE 'user_badges'")->rowCount() > 0;
    if ($useUserBadges) {
        $existingBadge = $pdo->prepare("SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?");
    } else {
        $existingBadge = $pdo->prepare("SELECT id FROM student_badges WHERE student_id = ? AND badge_id = ?");
    }
    $existingBadge->execute([$studentId, $badgeId]);
    
    if ($existingBadge->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'Student already has this badge'
        ]);
        return;
    }
    
    if ($useUserBadges) {
        $pdo->prepare("INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)")->execute([$studentId, $badgeId]);
    } else {
        $pdo->prepare("INSERT INTO student_badges (student_id, badge_id, quiz_attempt_id) VALUES (?, ?, ?)")->execute([$studentId, $badgeId, $attemptId]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Badge awarded successfully'
    ]);
}
?>
