<?php
/**
 * Diagnostic script to test quiz backend and database connectivity
 * Run this file directly in browser to check for issues
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h1>Quiz Backend Diagnostic Test</h1>";
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
</style>";

$issues = [];
$warnings = [];

// Test 1: Database Connection
echo "<h2>1. Database Connection Test</h2>";
try {
    if (!$pdo) {
        throw new Exception("PDO object is null");
    }
    
    $testQuery = $pdo->query("SELECT 1");
    if ($testQuery) {
        echo "<p class='success'>✅ Database connection successful</p>";
    } else {
        throw new Exception("Test query failed");
    }
} catch (Exception $e) {
    $issues[] = "Database connection failed: " . $e->getMessage();
    echo "<p class='error'>❌ Database connection failed: " . htmlspecialchars($e->getMessage()) . "</p>";
}

// Test 2: Session
echo "<h2>2. Session Test</h2>";
session_start();
if (session_status() === PHP_SESSION_ACTIVE) {
    echo "<p class='success'>✅ Session is active</p>";
    echo "<p class='info'>Session ID: " . session_id() . "</p>";
    echo "<p class='info'>Session data: <pre>" . print_r($_SESSION, true) . "</pre></p>";
    
    if (isset($_SESSION['user_id'])) {
        echo "<p class='success'>✅ User ID in session: " . $_SESSION['user_id'] . "</p>";
    } else {
        $warnings[] = "No user_id in session - user may not be logged in";
        echo "<p class='warning'>⚠️ No user_id in session - user may not be logged in</p>";
    }
} else {
    $issues[] = "Session is not active";
    echo "<p class='error'>❌ Session is not active</p>";
}

// Test 3: Authentication Functions
echo "<h2>3. Authentication Functions Test</h2>";
try {
    $isLoggedIn = is_logged_in();
    $isStudent = is_student_logged_in();
    $isTeacher = is_teacher_logged_in();
    
    echo "<p class='info'>is_logged_in(): " . ($isLoggedIn ? 'TRUE' : 'FALSE') . "</p>";
    echo "<p class='info'>is_student_logged_in(): " . ($isStudent ? 'TRUE' : 'FALSE') . "</p>";
    echo "<p class='info'>is_teacher_logged_in(): " . ($isTeacher ? 'TRUE' : 'FALSE') . "</p>";
    
    if (!$isLoggedIn && !$isStudent && !$isTeacher) {
        $warnings[] = "User is not authenticated - this is normal if running test directly";
        echo "<p class='warning'>⚠️ User is not authenticated (normal if running test directly)</p>";
    }
} catch (Exception $e) {
    $issues[] = "Authentication functions error: " . $e->getMessage();
    echo "<p class='error'>❌ Authentication functions error: " . htmlspecialchars($e->getMessage()) . "</p>";
}

// Test 4: quiz_attempts Table Structure
echo "<h2>4. quiz_attempts Table Structure Test</h2>";
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'quiz_attempts'");
    if ($stmt->rowCount() > 0) {
        echo "<p class='success'>✅ quiz_attempts table exists</p>";
        
        // Check table structure
        $columns = $pdo->query("DESCRIBE quiz_attempts")->fetchAll(PDO::FETCH_ASSOC);
        echo "<p class='info'>Table columns:</p>";
        echo "<table>";
        echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
        foreach ($columns as $col) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($col['Field']) . "</td>";
            echo "<td>" . htmlspecialchars($col['Type']) . "</td>";
            echo "<td>" . htmlspecialchars($col['Null']) . "</td>";
            echo "<td>" . htmlspecialchars($col['Key']) . "</td>";
            echo "<td>" . htmlspecialchars($col['Default'] ?? 'NULL') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Check required columns
        $requiredColumns = ['id', 'student_id', 'quiz_type', 'status'];
        $existingColumns = array_column($columns, 'Field');
        $missingColumns = array_diff($requiredColumns, $existingColumns);
        
        if (empty($missingColumns)) {
            echo "<p class='success'>✅ All required columns exist</p>";
        } else {
            $issues[] = "Missing required columns: " . implode(', ', $missingColumns);
            echo "<p class='error'>❌ Missing required columns: " . implode(', ', $missingColumns) . "</p>";
        }
    } else {
        $issues[] = "quiz_attempts table does not exist";
        echo "<p class='error'>❌ quiz_attempts table does not exist</p>";
    }
} catch (Exception $e) {
    $issues[] = "Table structure check failed: " . $e->getMessage();
    echo "<p class='error'>❌ Table structure check failed: " . htmlspecialchars($e->getMessage()) . "</p>";
}

// Test 5: Test Quiz Start (if user is logged in)
echo "<h2>5. Quiz Start Function Test</h2>";
if (isset($_SESSION['user_id'])) {
    try {
        require_once 'quiz-management.php';
        $quizManager = new QuizManager();
        
        $testResult = $quizManager->startQuiz($_SESSION['user_id'], 'functions');
        
        echo "<p class='info'>Test result:</p>";
        echo "<pre>" . print_r($testResult, true) . "</pre>";
        
        if ($testResult['success']) {
            echo "<p class='success'>✅ Quiz start function works</p>";
            echo "<p class='info'>Attempt ID: " . ($testResult['attempt_id'] ?? 'N/A') . "</p>";
            
            // Clean up test attempt
            if (isset($testResult['attempt_id'])) {
                $cleanupStmt = $pdo->prepare("DELETE FROM quiz_attempts WHERE id = ?");
                $cleanupStmt->execute([$testResult['attempt_id']]);
                echo "<p class='info'>🧹 Test attempt cleaned up</p>";
            }
        } else {
            $warnings[] = "Quiz start returned false: " . ($testResult['message'] ?? 'Unknown error');
            echo "<p class='warning'>⚠️ Quiz start returned false: " . htmlspecialchars($testResult['message'] ?? 'Unknown error') . "</p>";
        }
    } catch (Exception $e) {
        $issues[] = "Quiz start test failed: " . $e->getMessage();
        echo "<p class='error'>❌ Quiz start test failed: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
} else {
    echo "<p class='warning'>⚠️ Skipping quiz start test - user not logged in</p>";
}

// Test 6: Check for existing in-progress attempts
echo "<h2>6. Existing Quiz Attempts Check</h2>";
if (isset($_SESSION['user_id'])) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, quiz_type, status, started_at, completion_time
            FROM quiz_attempts 
            WHERE student_id = ? 
            AND status = 'in_progress'
            AND quiz_type NOT LIKE '%_topic_%'
            AND quiz_type NOT LIKE '%_lesson_%'
            ORDER BY started_at DESC
        ");
        $stmt->execute([$_SESSION['user_id']]);
        $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($attempts)) {
            echo "<p class='success'>✅ No in-progress attempts found</p>";
        } else {
            echo "<p class='warning'>⚠️ Found " . count($attempts) . " in-progress attempt(s):</p>";
            echo "<table>";
            echo "<tr><th>ID</th><th>Quiz Type</th><th>Status</th><th>Started At</th><th>Completion Time</th></tr>";
            foreach ($attempts as $attempt) {
                echo "<tr>";
                echo "<td>" . htmlspecialchars($attempt['id']) . "</td>";
                echo "<td>" . htmlspecialchars($attempt['quiz_type']) . "</td>";
                echo "<td>" . htmlspecialchars($attempt['status']) . "</td>";
                echo "<td>" . htmlspecialchars($attempt['started_at'] ?? 'N/A') . "</td>";
                echo "<td>" . htmlspecialchars($attempt['completion_time'] ?? '0') . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    } catch (Exception $e) {
        $issues[] = "Existing attempts check failed: " . $e->getMessage();
        echo "<p class='error'>❌ Existing attempts check failed: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
} else {
    echo "<p class='warning'>⚠️ Skipping existing attempts check - user not logged in</p>";
}

// Test 7: PHP Error Log Check
echo "<h2>7. PHP Error Log</h2>";
$errorLogPath = ini_get('error_log');
if ($errorLogPath && file_exists($errorLogPath)) {
    echo "<p class='info'>Error log path: " . htmlspecialchars($errorLogPath) . "</p>";
    $recentErrors = tail($errorLogPath, 20);
    if ($recentErrors) {
        echo "<p class='info'>Recent errors (last 20 lines):</p>";
        echo "<pre>" . htmlspecialchars($recentErrors) . "</pre>";
    } else {
        echo "<p class='success'>✅ No recent errors in log</p>";
    }
} else {
    echo "<p class='warning'>⚠️ Error log not found or not configured</p>";
}

// Summary
echo "<h2>Summary</h2>";
if (empty($issues) && empty($warnings)) {
    echo "<p class='success'>✅ All tests passed! No issues found.</p>";
} else {
    if (!empty($issues)) {
        echo "<p class='error'>❌ Issues found (" . count($issues) . "):</p>";
        echo "<ul>";
        foreach ($issues as $issue) {
            echo "<li class='error'>" . htmlspecialchars($issue) . "</li>";
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
}

// Helper function to read last N lines of a file
function tail($filepath, $lines = 20) {
    if (!file_exists($filepath)) {
        return false;
    }
    
    $file = file($filepath);
    if ($file === false) {
        return false;
    }
    
    return implode('', array_slice($file, -$lines));
}
?>
