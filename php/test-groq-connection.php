<?php
/**
 * Test script for Groq AI Performance Analysis
 * This helps debug connection and configuration issues
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Groq AI Performance Analysis - Connection Test</h2>";

// Test 1: Check if config.php exists and loads
echo "<h3>1. Testing config.php</h3>";
if (file_exists('config.php')) {
    echo "✅ config.php exists<br>";
    try {
        require_once 'config.php';
        echo "✅ config.php loaded successfully<br>";
    } catch (Exception $e) {
        echo "❌ Error loading config.php: " . $e->getMessage() . "<br>";
        exit;
    }
} else {
    echo "❌ config.php not found<br>";
    exit;
}

// Test 2: Check database connection
echo "<h3>2. Testing Database Connection</h3>";
if (isset($pdo)) {
    echo "✅ \$pdo variable is set<br>";
    try {
        $stmt = $pdo->query("SELECT 1");
        echo "✅ Database connection works<br>";
    } catch (PDOException $e) {
        echo "❌ Database connection failed: " . $e->getMessage() . "<br>";
        exit;
    }
} else {
    echo "❌ \$pdo variable is not set<br>";
    exit;
}

// Test 3: Check session
echo "<h3>3. Testing Session</h3>";
if (session_status() == PHP_SESSION_ACTIVE) {
    echo "✅ Session is active<br>";
    if (isset($_SESSION['user_id'])) {
        echo "✅ User ID in session: " . $_SESSION['user_id'] . "<br>";
    } else {
        echo "⚠️ No user_id in session (you may need to log in)<br>";
    }
} else {
    echo "⚠️ Session is not active<br>";
    session_start();
}

// Test 4: Check if quiz_attempts table exists
echo "<h3>4. Testing Database Tables</h3>";
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'quiz_attempts'");
    if ($stmt->rowCount() > 0) {
        echo "✅ quiz_attempts table exists<br>";
        
        // Check table structure
        $stmt = $pdo->query("DESCRIBE quiz_attempts");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Table columns: ";
        foreach ($columns as $col) {
            echo $col['Field'] . " ";
        }
        echo "<br>";
    } else {
        echo "⚠️ quiz_attempts table does not exist (will be created automatically)<br>";
    }
} catch (PDOException $e) {
    echo "❌ Error checking quiz_attempts table: " . $e->getMessage() . "<br>";
}

try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'lesson_completion'");
    if ($stmt->rowCount() > 0) {
        echo "✅ lesson_completion table exists<br>";
    } else {
        echo "⚠️ lesson_completion table does not exist (will be created automatically)<br>";
    }
} catch (PDOException $e) {
    echo "❌ Error checking lesson_completion table: " . $e->getMessage() . "<br>";
}

// Test 5: Check cURL
echo "<h3>5. Testing cURL</h3>";
if (function_exists('curl_init')) {
    echo "✅ cURL extension is enabled<br>";
} else {
    echo "❌ cURL extension is not enabled<br>";
}

// Test 6: Check Groq API key
echo "<h3>6. Testing Groq API Configuration</h3>";
// Load environment variables
require_once __DIR__ . '/load-env.php';
$GROQ_API_KEY = getenv('GROQ_API_KEY');
$GROQ_API_URL = getenv('GROQ_API_URL') ?: 'https://api.groq.com/openai/v1/chat/completions';
$GROQ_MODEL = getenv('GROQ_MODEL') ?: 'llama-3.1-8b-instant';

if (!empty($GROQ_API_KEY)) {
    echo "✅ Groq API key is set<br>";
    echo "API Key (first 10 chars): " . substr($GROQ_API_KEY, 0, 10) . "...<br>";
    echo "API URL: " . $GROQ_API_URL . "<br>";
    echo "Model: " . $GROQ_MODEL . "<br>";
} else {
    echo "❌ Groq API key is not set. Please configure GROQ_API_KEY in your .env file.<br>";
}

echo "<h3>7. Test Complete</h3>";
echo "<p>If all tests pass, try accessing the Groq AI Performance Analysis again.</p>";
echo "<p><a href='groq-ai-performance.php?topic=functions&action=analyze_performance'>Test API Call</a></p>";

?>
