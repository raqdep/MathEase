<?php
/**
 * Debug script for groq-ai-performance.php
 * This will help identify what's causing the 500 error
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

echo "<h2>Debug Test for groq-ai-performance.php</h2>";

// Test 1: Check if we can start output buffering
echo "<h3>Test 1: Output Buffering</h3>";
ob_start();
echo "Output buffering works";
$test = ob_get_contents();
ob_clean();
echo "✅ Output buffering: " . ($test === "Output buffering works" ? "OK" : "FAILED") . "<br>";

// Test 2: Check session
echo "<h3>Test 2: Session</h3>";
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
echo "✅ Session started<br>";
if (isset($_SESSION['user_id'])) {
    echo "✅ User ID in session: " . $_SESSION['user_id'] . "<br>";
} else {
    echo "⚠️ No user_id in session (this is expected if not logged in)<br>";
}

// Test 3: Check config.php
echo "<h3>Test 3: config.php</h3>";
ob_start();
try {
    require_once 'config.php';
    echo "✅ config.php loaded successfully<br>";
    if (isset($pdo)) {
        echo "✅ Database connection object exists<br>";
        try {
            $pdo->query("SELECT 1");
            echo "✅ Database connection test passed<br>";
        } catch (PDOException $e) {
            echo "❌ Database connection test failed: " . $e->getMessage() . "<br>";
        }
    } else {
        echo "❌ Database connection object not set<br>";
    }
} catch (Exception $e) {
    echo "❌ Exception loading config.php: " . $e->getMessage() . "<br>";
} catch (Error $e) {
    echo "❌ Fatal error loading config.php: " . $e->getMessage() . "<br>";
}
$configOutput = ob_get_clean();
if (!empty(trim($configOutput))) {
    echo "⚠️ config.php produced output: " . htmlspecialchars(substr($configOutput, 0, 200)) . "<br>";
}

// Test 4: Check load-env.php
echo "<h3>Test 4: load-env.php</h3>";
ob_start();
try {
    require_once __DIR__ . '/load-env.php';
    echo "✅ load-env.php loaded successfully<br>";
} catch (Exception $e) {
    echo "❌ Exception loading load-env.php: " . $e->getMessage() . "<br>";
} catch (Error $e) {
    echo "❌ Fatal error loading load-env.php: " . $e->getMessage() . "<br>";
}
$envOutput = ob_get_clean();
if (!empty(trim($envOutput))) {
    echo "⚠️ load-env.php produced output: " . htmlspecialchars(substr($envOutput, 0, 200)) . "<br>";
}

// Test 5: Check environment variables
echo "<h3>Test 5: Environment Variables</h3>";
$GROQ_API_KEY = getenv('GROQ_API_KEY');
$GROQ_MODEL = getenv('GROQ_MODEL');
if (!empty($GROQ_API_KEY)) {
    echo "✅ GROQ_API_KEY is set (first 10 chars: " . substr($GROQ_API_KEY, 0, 10) . "...)<br>";
} else {
    echo "❌ GROQ_API_KEY is not set<br>";
}
if (!empty($GROQ_MODEL)) {
    echo "✅ GROQ_MODEL is set: " . $GROQ_MODEL . "<br>";
} else {
    echo "⚠️ GROQ_MODEL is not set (will use default)<br>";
}

// Test 6: Check if groq-ai-performance.php has syntax errors
echo "<h3>Test 6: Syntax Check</h3>";
$phpFile = __DIR__ . '/groq-ai-performance.php';
if (file_exists($phpFile)) {
    $output = [];
    $return = 0;
    exec("php -l " . escapeshellarg($phpFile) . " 2>&1", $output, $return);
    if ($return === 0) {
        echo "✅ groq-ai-performance.php has no syntax errors<br>";
    } else {
        echo "❌ Syntax errors found:<br>";
        echo "<pre>" . htmlspecialchars(implode("\n", $output)) . "</pre>";
    }
} else {
    echo "❌ groq-ai-performance.php not found<br>";
}

echo "<h3>Test Complete</h3>";
echo "<p>If all tests pass, try accessing groq-ai-performance.php directly to see the actual error.</p>";
?>
