<?php
/**
 * Test script to check teacher login PHP file for errors
 * This will help identify what's causing the PHP error
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

echo "<h2>Testing Teacher Login PHP File</h2>";

// Test 1: Check if config.php loads
echo "<h3>1. Testing config.php</h3>";
try {
    require_once 'config.php';
    echo "✅ config.php loaded successfully<br>";
    
    if (isset($pdo)) {
        echo "✅ Database connection object exists<br>";
        try {
            $pdo->query("SELECT 1");
            echo "✅ Database connection test passed<br>";
        } catch (PDOException $e) {
            echo "❌ Database connection test failed: " . htmlspecialchars($e->getMessage()) . "<br>";
        }
    } else {
        echo "❌ Database connection object not set<br>";
    }
} catch (Exception $e) {
    echo "❌ Exception loading config.php: " . htmlspecialchars($e->getMessage()) . "<br>";
    echo "Stack trace: <pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
} catch (Error $e) {
    echo "❌ Fatal error loading config.php: " . htmlspecialchars($e->getMessage()) . "<br>";
    echo "Stack trace: <pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}

// Test 2: Check if admins table exists
echo "<h3>2. Testing admins table</h3>";
try {
    if (isset($pdo)) {
        $stmt = $pdo->query("SHOW TABLES LIKE 'admins'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Admins table exists<br>";
            
            // Check admin account
            $stmt = $pdo->prepare("SELECT id, email, is_active FROM admins WHERE LOWER(email) = LOWER(?)");
            $stmt->execute(['matheasenc2025@gmail.com']);
            $admin = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($admin) {
                echo "✅ Admin account found:<br>";
                echo "&nbsp;&nbsp;- ID: {$admin['id']}<br>";
                echo "&nbsp;&nbsp;- Email: {$admin['email']}<br>";
                echo "&nbsp;&nbsp;- Active: " . ($admin['is_active'] ? 'YES' : 'NO') . "<br>";
            } else {
                echo "⚠️ Admin account not found. Run setup-admin.php to create it.<br>";
            }
        } else {
            echo "❌ Admins table does not exist. Run setup-admin.php to create it.<br>";
        }
    }
} catch (Exception $e) {
    echo "❌ Error checking admins table: " . htmlspecialchars($e->getMessage()) . "<br>";
}

// Test 3: Test output buffering
echo "<h3>3. Testing output buffering</h3>";
ob_start();
echo "Test output";
$output = ob_get_clean();
if ($output === "Test output") {
    echo "✅ Output buffering works<br>";
} else {
    echo "❌ Output buffering failed<br>";
}

// Test 4: Test session
echo "<h3>4. Testing session</h3>";
if (session_status() == PHP_SESSION_NONE) {
    session_start();
    echo "✅ Session started<br>";
} else {
    echo "✅ Session already active<br>";
}

// Test 5: Simulate login POST request
echo "<h3>5. Testing login logic (simulated)</h3>";
try {
    if (isset($pdo)) {
        $testEmail = 'matheasenc2025@gmail.com';
        $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, password, role, is_active, created_at FROM admins WHERE LOWER(email) = LOWER(?)");
        $stmt->execute([$testEmail]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin) {
            echo "✅ Admin query works<br>";
            echo "&nbsp;&nbsp;- Admin found: YES<br>";
            echo "&nbsp;&nbsp;- is_active: {$admin['is_active']}<br>";
            echo "&nbsp;&nbsp;- has_password: " . (!empty($admin['password']) ? 'YES' : 'NO') . "<br>";
        } else {
            echo "⚠️ Admin query returned no results<br>";
        }
    }
} catch (Exception $e) {
    echo "❌ Error in login logic test: " . htmlspecialchars($e->getMessage()) . "<br>";
    echo "Stack trace: <pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}

echo "<hr>";
echo "<p><strong>Next steps:</strong></p>";
echo "<ul>";
echo "<li>If config.php failed to load, check the file for syntax errors</li>";
echo "<li>If database connection failed, check database credentials in config.php</li>";
echo "<li>If admins table doesn't exist, run: <a href='setup-admin.php'>setup-admin.php</a></li>";
echo "<li>If admin account doesn't exist, run: <a href='setup-admin.php'>setup-admin.php</a></li>";
echo "</ul>";
?>
