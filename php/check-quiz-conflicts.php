<?php
/**
 * Check for conflicts between /quiz folder quizzes and /topics folder quizzes
 * This script identifies potential database conflicts
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h1>Quiz System Conflict Checker</h1>";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    .warning { color: orange; font-weight: bold; }
    .info { color: blue; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #667eea; color: white; }
    .conflict { background-color: #fee; }
</style>";

$conflicts = [];
$warnings = [];

session_start();

// Test 1: Check quiz_attempts table structure
echo "<h2>1. Table Structure Check</h2>";
try {
    $columns = $pdo->query("DESCRIBE quiz_attempts")->fetchAll(PDO::FETCH_ASSOC);
    $hasStatus = false;
    $statusDefault = null;
    
    foreach ($columns as $col) {
        if ($col['Field'] === 'status') {
            $hasStatus = true;
            $statusDefault = $col['Default'];
            echo "<p class='info'>Status column found. Default value: " . ($statusDefault ?? 'NULL') . "</p>";
            break;
        }
    }
    
    if (!$hasStatus) {
        $conflicts[] = "quiz_attempts table missing 'status' column - this could cause conflicts";
        echo "<p class='error'>❌ quiz_attempts table missing 'status' column</p>";
    } else {
        echo "<p class='success'>✅ Status column exists</p>";
    }
} catch (Exception $e) {
    echo "<p class='error'>❌ Error checking table structure: " . htmlspecialchars($e->getMessage()) . "</p>";
}

// Test 2: Check for quiz_type conflicts
echo "<h2>2. Quiz Type Conflict Check</h2>";
if (isset($_SESSION['user_id'])) {
    try {
        // Check for /quiz folder quiz types (simple names)
        $quizFolderStmt = $pdo->prepare("
            SELECT quiz_type, COUNT(*) as count, status
            FROM quiz_attempts 
            WHERE student_id = ?
            AND quiz_type NOT LIKE '%_topic_%'
            AND quiz_type NOT LIKE '%_lesson_%'
            AND quiz_type NOT LIKE '%topic%'
            AND quiz_type NOT LIKE '%lesson%'
            GROUP BY quiz_type, status
            ORDER BY quiz_type, status
        ");
        $quizFolderStmt->execute([$_SESSION['user_id']]);
        $quizFolderAttempts = $quizFolderStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Check for topic quiz types
        $topicStmt = $pdo->prepare("
            SELECT quiz_type, COUNT(*) as count, status
            FROM quiz_attempts 
            WHERE student_id = ?
            AND (quiz_type LIKE '%_topic_%' OR quiz_type LIKE '%_lesson_%' OR quiz_type LIKE '%topic%' OR quiz_type LIKE '%lesson%')
            GROUP BY quiz_type, status
            ORDER BY quiz_type, status
        ");
        $topicStmt->execute([$_SESSION['user_id']]);
        $topicAttempts = $topicStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<h3>/quiz Folder Quizzes:</h3>";
        if (empty($quizFolderAttempts)) {
            echo "<p class='info'>No /quiz folder quiz attempts found</p>";
        } else {
            echo "<table>";
            echo "<tr><th>Quiz Type</th><th>Status</th><th>Count</th></tr>";
            foreach ($quizFolderAttempts as $attempt) {
                $rowClass = ($attempt['status'] === 'in_progress') ? 'class="warning"' : '';
                echo "<tr $rowClass>";
                echo "<td>" . htmlspecialchars($attempt['quiz_type']) . "</td>";
                echo "<td>" . htmlspecialchars($attempt['status'] ?? 'NULL') . "</td>";
                echo "<td>" . htmlspecialchars($attempt['count']) . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
        
        echo "<h3>/topics Folder Quizzes:</h3>";
        if (empty($topicAttempts)) {
            echo "<p class='info'>No topic quiz attempts found</p>";
        } else {
            echo "<table>";
            echo "<tr><th>Quiz Type</th><th>Status</th><th>Count</th></tr>";
            foreach ($topicAttempts as $attempt) {
                $rowClass = '';
                if ($attempt['status'] === 'in_progress') {
                    $conflicts[] = "Topic quiz '{$attempt['quiz_type']}' has 'in_progress' status - topic quizzes should be 'completed'";
                    $rowClass = 'class="conflict"';
                }
                echo "<tr $rowClass>";
                echo "<td>" . htmlspecialchars($attempt['quiz_type']) . "</td>";
                echo "<td>" . htmlspecialchars($attempt['status'] ?? 'NULL') . "</td>";
                echo "<td>" . htmlspecialchars($attempt['count']) . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
        
        // Check for ambiguous quiz types
        $ambiguousStmt = $pdo->prepare("
            SELECT DISTINCT quiz_type
            FROM quiz_attempts 
            WHERE student_id = ?
            AND quiz_type NOT LIKE '%_topic_%'
            AND quiz_type NOT LIKE '%_lesson_%'
            AND quiz_type NOT LIKE '%topic%'
            AND quiz_type NOT LIKE '%lesson%'
            AND quiz_type LIKE '%functions%'
        ");
        $ambiguousStmt->execute([$_SESSION['user_id']]);
        $ambiguousTypes = $ambiguousStmt->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($ambiguousTypes as $type) {
            // Check if this could be confused with a topic quiz
            if (preg_match('/functions.*\d/', $type) && !preg_match('/_topic_|_lesson_/', $type)) {
                $warnings[] = "Quiz type '$type' might be ambiguous - verify it's not a topic quiz";
            }
        }
        
    } catch (Exception $e) {
        echo "<p class='error'>❌ Error checking quiz types: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
} else {
    echo "<p class='warning'>⚠️ User not logged in - cannot check user-specific conflicts</p>";
}

// Test 3: Check for in_progress conflicts
echo "<h2>3. In-Progress Status Conflict Check</h2>";
if (isset($_SESSION['user_id'])) {
    try {
        // Check for topic quizzes with in_progress status (should not exist)
        $topicInProgressStmt = $pdo->prepare("
            SELECT id, quiz_type, status, started_at
            FROM quiz_attempts 
            WHERE student_id = ?
            AND status = 'in_progress'
            AND (quiz_type LIKE '%_topic_%' OR quiz_type LIKE '%_lesson_%' OR quiz_type LIKE '%topic%' OR quiz_type LIKE '%lesson%')
        ");
        $topicInProgressStmt->execute([$_SESSION['user_id']]);
        $topicInProgress = $topicInProgressStmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($topicInProgress)) {
            $conflicts[] = "Found " . count($topicInProgress) . " topic quiz(es) with 'in_progress' status - these should be 'completed'";
            echo "<p class='error'>❌ Found " . count($topicInProgress) . " topic quiz(es) with 'in_progress' status:</p>";
            echo "<table class='conflict'>";
            echo "<tr><th>ID</th><th>Quiz Type</th><th>Status</th><th>Started At</th></tr>";
            foreach ($topicInProgress as $attempt) {
                echo "<tr>";
                echo "<td>" . htmlspecialchars($attempt['id']) . "</td>";
                echo "<td>" . htmlspecialchars($attempt['quiz_type']) . "</td>";
                echo "<td>" . htmlspecialchars($attempt['status']) . "</td>";
                echo "<td>" . htmlspecialchars($attempt['started_at'] ?? 'N/A') . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p class='success'>✅ No topic quizzes with 'in_progress' status found</p>";
        }
        
        // Check for /quiz folder quizzes without status
        $quizNoStatusStmt = $pdo->prepare("
            SELECT id, quiz_type, status
            FROM quiz_attempts 
            WHERE student_id = ?
            AND (status IS NULL OR status = '')
            AND quiz_type NOT LIKE '%_topic_%'
            AND quiz_type NOT LIKE '%_lesson_%'
            AND quiz_type NOT LIKE '%topic%'
            AND quiz_type NOT LIKE '%lesson%'
        ");
        $quizNoStatusStmt->execute([$_SESSION['user_id']]);
        $quizNoStatus = $quizNoStatusStmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($quizNoStatus)) {
            $warnings[] = "Found " . count($quizNoStatus) . " /quiz folder quiz(es) without status";
            echo "<p class='warning'>⚠️ Found " . count($quizNoStatus) . " /quiz folder quiz(es) without status:</p>";
            echo "<table>";
            echo "<tr><th>ID</th><th>Quiz Type</th><th>Status</th></tr>";
            foreach ($quizNoStatus as $attempt) {
                echo "<tr>";
                echo "<td>" . htmlspecialchars($attempt['id']) . "</td>";
                echo "<td>" . htmlspecialchars($attempt['quiz_type']) . "</td>";
                echo "<td>" . htmlspecialchars($attempt['status'] ?? 'NULL') . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
        
    } catch (Exception $e) {
        echo "<p class='error'>❌ Error checking in-progress conflicts: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
} else {
    echo "<p class='warning'>⚠️ User not logged in - cannot check user-specific conflicts</p>";
}

// Test 4: Check if store-quiz-data.php sets status
echo "<h2>4. store-quiz-data.php Status Handling</h2>";
$storeQuizDataFile = file_get_contents('store-quiz-data.php');
if (strpos($storeQuizDataFile, "status") === false && strpos($storeQuizDataFile, "INSERT INTO quiz_attempts") !== false) {
    $conflicts[] = "store-quiz-data.php does not set 'status' column - topic quizzes might have NULL status";
    echo "<p class='error'>❌ store-quiz-data.php does not explicitly set 'status' column</p>";
    echo "<p class='info'>This means topic quizzes will use the table's default status value (if any)</p>";
} else {
    echo "<p class='success'>✅ store-quiz-data.php handles status column</p>";
}

// Test 5: Check quiz-management.php filtering
echo "<h2>5. quiz-management.php Filtering Check</h2>";
$quizManagementFile = file_get_contents('quiz-management.php');
$filterPatterns = [
    "NOT LIKE '%_topic_%'",
    "NOT LIKE '%_lesson_%'",
    "NOT LIKE '%topic%'",
    "NOT LIKE '%lesson%'"
];

$missingFilters = [];
foreach ($filterPatterns as $pattern) {
    if (strpos($quizManagementFile, $pattern) === false) {
        $missingFilters[] = $pattern;
    }
}

if (!empty($missingFilters)) {
    $warnings[] = "quiz-management.php missing some filter patterns: " . implode(', ', $missingFilters);
    echo "<p class='warning'>⚠️ Some filter patterns missing in quiz-management.php</p>";
} else {
    echo "<p class='success'>✅ quiz-management.php has all required filter patterns</p>";
}

// Summary
echo "<h2>Summary</h2>";
if (empty($conflicts) && empty($warnings)) {
    echo "<p class='success'>✅ No conflicts found! The two quiz systems are properly separated.</p>";
} else {
    if (!empty($conflicts)) {
        echo "<p class='error'>❌ Conflicts found (" . count($conflicts) . "):</p>";
        echo "<ul>";
        foreach ($conflicts as $conflict) {
            echo "<li class='error'>" . htmlspecialchars($conflict) . "</li>";
        }
        echo "</ul>";
    }
    
    if (!empty($warnings)) {
        echo "<p class='warning'>⚠️ Warnings (" . count($warnings) . "):</p>";
        echo "<ul>";
        foreach ($warnings as $warning) {
            echo "<li class='warning'>" . htmlspecialchars($warning) . "</li>";
        }
        echo "</ul>";
    }
    
    echo "<h3>Recommendations:</h3>";
    echo "<ol>";
    if (in_array("store-quiz-data.php does not set 'status' column", $conflicts)) {
        echo "<li><strong>Fix store-quiz-data.php:</strong> Add 'status' => 'completed' to the INSERT statement for topic quizzes</li>";
    }
    if (in_array("Found topic quiz(es) with 'in_progress' status", $conflicts)) {
        echo "<li><strong>Clean up database:</strong> Update topic quizzes with 'in_progress' status to 'completed'</li>";
    }
    echo "</ol>";
}
?>
