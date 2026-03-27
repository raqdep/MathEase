<?php
// Prevent any output before JSON response
ob_start();

// Disable error display, log errors instead
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Load config.php with error handling
try {
    require_once 'config.php';
    
    // Check if config.php produced any output (like from die() statements)
    $output = ob_get_contents();
    if (!empty(trim($output))) {
        // Config.php produced output (likely a die() statement)
        ob_clean();
        if (!headers_sent()) {
            header('Content-Type: application/json');
        }
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed. Please check server configuration.',
            'error_type' => 'db_connection_error',
            'error_details' => trim($output)
        ]);
        ob_end_flush();
        exit;
    }
    
    // Check if database connection exists
    if (!isset($pdo) || !$pdo) {
        ob_clean();
        if (!headers_sent()) {
            header('Content-Type: application/json');
        }
        echo json_encode([
            'success' => false,
            'message' => 'Database connection not available. Please check server configuration.',
            'error_type' => 'db_connection_missing'
        ]);
        ob_end_flush();
        exit;
    }
    
    // Test database connection
    try {
        $pdo->query("SELECT 1");
    } catch (PDOException $e) {
        ob_clean();
        if (!headers_sent()) {
            header('Content-Type: application/json');
        }
        echo json_encode([
            'success' => false,
            'message' => 'Database connection test failed. Please check server configuration.',
            'error_type' => 'db_connection_test_failed'
        ]);
        error_log("Database connection test failed: " . $e->getMessage());
        ob_end_flush();
        exit;
    }
    
} catch (Exception $e) {
    ob_clean();
    if (!headers_sent()) {
        header('Content-Type: application/json');
    }
    echo json_encode([
        'success' => false,
        'message' => 'Configuration error. Please check server logs.',
        'error_type' => 'config_error'
    ]);
    error_log("Config loading error: " . $e->getMessage());
    ob_end_flush();
    exit;
} catch (Error $e) {
    ob_clean();
    if (!headers_sent()) {
        header('Content-Type: application/json');
    }
    echo json_encode([
        'success' => false,
        'message' => 'Fatal configuration error. Please check server logs.',
        'error_type' => 'config_fatal_error'
    ]);
    error_log("Config fatal error: " . $e->getMessage());
    ob_end_flush();
    exit;
}

// Clear any output that might have been generated
ob_clean();

// Handle teacher login form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Set JSON header early
    header('Content-Type: application/json');
    
    $response = array();
    
    try {
        // Validate required fields
        if (!isset($_POST['email']) || !isset($_POST['password'])) {
            throw new Exception("Email and password are required");
        }
        
        $email = sanitize_input($_POST['email']);
        $password = $_POST['password'];
        $remember = isset($_POST['remember']) ? true : false;
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $response = array(
                'success' => false,
                'message' => 'Please enter a valid email address.',
                'error_type' => 'invalid_email_format',
                'field' => 'email'
            );
            header('Content-Type: application/json');
            echo json_encode($response);
            exit;
        }
        
        // Check if admin credentials first
        // Check admin account WITHOUT is_active filter first to handle inactive accounts properly
        $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, password, role, is_active, created_at FROM admins WHERE LOWER(email) = LOWER(?)");
        $stmt->execute([$email]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Debug logging
        error_log("Admin login attempt - Email: $email, Admin found: " . ($admin ? 'YES' : 'NO'));
        if ($admin) {
            error_log("Admin data - ID: {$admin['id']}, Email: {$admin['email']}, is_active: {$admin['is_active']}, has_password: " . (!empty($admin['password']) ? 'YES' : 'NO'));
        }
        
        // If admin exists but is inactive, show specific error BEFORE password check
        if ($admin && isset($admin['is_active']) && $admin['is_active'] == 0) {
            error_log("Failed admin login attempt: Inactive account for email: $email");
            $response = array(
                'success' => false,
                'message' => 'Your admin account is inactive. Please contact system administrator.',
                'error_type' => 'account_inactive',
                'field' => 'email'
            );
            header('Content-Type: application/json');
            echo json_encode($response);
            exit;
        }
        
        // If admin exists and is active, verify password
        if ($admin && isset($admin['is_active']) && $admin['is_active'] == 1) {
            $passwordVerified = password_verify($password, $admin['password']);
            error_log("Password verification - Email: $email, Verified: " . ($passwordVerified ? 'YES' : 'NO'));
            
            if ($passwordVerified) {
                // If created_at is NULL, update it to current timestamp
                if (empty($admin['created_at']) || is_null($admin['created_at'])) {
                    try {
                        $updateStmt = $pdo->prepare("UPDATE admins SET created_at = NOW() WHERE id = ?");
                        $updateStmt->execute([$admin['id']]);
                        $admin['created_at'] = date('Y-m-d H:i:s');
                        error_log("Updated admin account created_at timestamp for email: $email");
                    } catch (Exception $e) {
                        error_log("Failed to update admin created_at: " . $e->getMessage());
                        // Continue with login even if update fails
                    }
                }
                
                // Admin login successful - Update last login
                $stmt = $pdo->prepare("UPDATE admins SET last_login = NOW() WHERE id = ?");
                $stmt->execute([$admin['id']]);
                
                // Log admin activity
                try {
                    $pdo->exec("
                        CREATE TABLE IF NOT EXISTS admin_activity_log (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            admin_id INT NOT NULL,
                            action VARCHAR(100) NOT NULL,
                            target_type VARCHAR(50),
                            target_id INT,
                            details TEXT,
                            ip_address VARCHAR(45),
                            user_agent TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            INDEX idx_admin (admin_id),
                            INDEX idx_action (action),
                            INDEX idx_created (created_at)
                        )
                    ");
                    
                    $stmt = $pdo->prepare("INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address, user_agent) VALUES (?, 'login', 'admin', ?, ?, ?, ?)");
                    $stmt->execute([
                        $admin['id'],
                        $admin['id'],
                        'Admin login successful via teacher login page',
                        $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                        $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
                    ]);
                } catch (Exception $e) {
                    error_log("Failed to log admin activity: " . $e->getMessage());
                }
                
                // Set admin session variables
                $_SESSION['admin_id'] = $admin['id'];
                $_SESSION['admin_email'] = $admin['email'];
                $_SESSION['admin_name'] = $admin['first_name'] . ' ' . $admin['last_name'];
                $_SESSION['admin_role'] = $admin['role'];
                $_SESSION['login_time'] = time();
                $_SESSION['user_type'] = 'admin';
                
                // Log successful admin login
                error_log("Admin logged in via teacher login: $email (ID: {$admin['id']}) from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
                
                // Return admin success response
                $response = array(
                    'success' => true,
                    'message' => 'Admin login successful! Welcome back, ' . $admin['first_name'] . '!',
                    'redirect' => '../admin.html',
                    'user_type' => 'admin',
                    'admin_id' => $admin['id'],
                    'admin_name' => $admin['first_name'] . ' ' . $admin['last_name'],
                    'admin_role' => $admin['role'],
                    'admin_email' => $admin['email']
                );
                header('Content-Type: application/json');
                echo json_encode($response);
                exit;
            }
        }
        
        // If admin email exists but password is wrong, log failed attempt
        if ($admin && isset($admin['is_active']) && $admin['is_active'] == 1 && !password_verify($password, $admin['password'])) {
            error_log("Failed admin login attempt: Incorrect password for email: $email from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
            $response = array(
                'success' => false,
                'message' => 'Incorrect password. Please try again.',
                'error_type' => 'wrong_password',
                'field' => 'password'
            );
            header('Content-Type: application/json');
            echo json_encode($response);
            exit;
        }

        require_once __DIR__ . '/maintenance-helper.php';
        if (isMaintenanceMode($pdo)) {
            $p = getMaintenancePayload($pdo);
            $msg = trim((string) ($p['message'] ?? '')) !== ''
                ? $p['message']
                : 'MathEase is temporarily unavailable while we apply updates. Teacher login is disabled until maintenance ends.';
            header('Content-Type: application/json');
            http_response_code(503);
            echo json_encode([
                'success' => false,
                'message' => $msg,
                'error_type' => 'maintenance',
                'field' => 'email',
            ]);
            exit;
        }
        
        // If not admin, check if teacher exists - include email_verified and approval_status
        $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers LIKE 'email_verified'");
        $stmt->execute();
        $hasEmailVerified = $stmt->rowCount() > 0;
        
        $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers LIKE 'approval_status'");
        $stmt->execute();
        $hasApprovalStatus = $stmt->rowCount() > 0;
        
        $selectFields = "id, first_name, last_name, email, teacher_id, department, subject, password, last_login";
        if ($hasEmailVerified) {
            $selectFields .= ", email_verified";
        }
        if ($hasApprovalStatus) {
            $selectFields .= ", approval_status";
        }
        
        $stmt = $pdo->prepare("
            SELECT {$selectFields}
            FROM teachers 
            WHERE LOWER(email) = LOWER(?)
        ");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() === 0) {
            // Double-check if admin account exists (for better error message)
            // This handles the case where admin exists but wasn't matched due to password or other issues
            if ($admin) {
                // Admin exists but password was wrong or account is inactive (already handled above)
                // This shouldn't reach here, but just in case
                $response = array(
                    'success' => false,
                    'message' => 'Incorrect password. Please try again.',
                    'error_type' => 'wrong_password',
                    'field' => 'password'
                );
            } else {
                $response = array(
                    'success' => false,
                    'message' => 'Email address not found. Please check your email or register.',
                    'error_type' => 'email_not_found',
                    'field' => 'email'
                );
            }
            header('Content-Type: application/json');
            echo json_encode($response);
            exit;
        }
        
        $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Verify password
        if (!password_verify($password, $teacher['password'])) {
            $response = array(
                'success' => false,
                'message' => 'Incorrect password. Please try again or reset your password.',
                'error_type' => 'wrong_password',
                'field' => 'password'
            );
            header('Content-Type: application/json');
            echo json_encode($response);
            exit;
        }
        
        // Check email verification
        if ($hasEmailVerified && isset($teacher['email_verified']) && $teacher['email_verified'] == 0) {
            $response = array(
                'success' => false,
                'message' => 'Please verify your email address before logging in. Check your inbox for the verification link.',
                'error_type' => 'email_not_verified',
                'field' => 'email'
            );
            header('Content-Type: application/json');
            echo json_encode($response);
            exit;
        }
        
        // Check approval status
        if ($hasApprovalStatus && isset($teacher['approval_status'])) {
            if ($teacher['approval_status'] === 'pending') {
                $response = array(
                    'success' => false,
                    'message' => 'Your account is pending admin approval. You will receive an email once your account is approved.',
                    'error_type' => 'pending_approval',
                    'field' => 'email'
                );
                header('Content-Type: application/json');
                echo json_encode($response);
                exit;
            } elseif ($teacher['approval_status'] === 'rejected') {
                $response = array(
                    'success' => false,
                    'message' => 'Your account has been rejected. Please contact admin for more information.',
                    'error_type' => 'account_rejected',
                    'field' => 'email'
                );
                header('Content-Type: application/json');
                echo json_encode($response);
                exit;
            }
        }
        
        // Set session variables
        $_SESSION['teacher_id'] = $teacher['id'];
        $_SESSION['teacher_email'] = $teacher['email'];
        $_SESSION['teacher_name'] = $teacher['first_name'] . ' ' . $teacher['last_name'];
        $_SESSION['teacher_id_number'] = $teacher['teacher_id'];
        $_SESSION['department'] = $teacher['department'];
        $_SESSION['subject'] = $teacher['subject'];
        $_SESSION['login_time'] = time();
        $_SESSION['user_type'] = 'teacher';
        
        // Handle remember me functionality
        if ($remember) {
            $token = generate_token();
            $expiry = date('Y-m-d H:i:s', strtotime('+30 days'));
            
            // Store remember me token in database
            $stmt = $pdo->prepare("
                INSERT INTO teacher_remember_tokens (teacher_id, token, expires_at) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$teacher['id'], $token, $expiry]);
            
            // Set remember me cookie
            setcookie('teacher_remember_token', $token, time() + (30 * 24 * 60 * 60), '/', '', true, true);
        }
        
        // Update last login time
        $stmt = $pdo->prepare("UPDATE teachers SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$teacher['id']]);
        
        // Log teacher activity
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS teacher_activity_log (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    teacher_id INT NOT NULL,
                    action VARCHAR(100) NOT NULL,
                    details TEXT,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_teacher (teacher_id),
                    INDEX idx_action (action),
                    INDEX idx_created (created_at)
                )
            ");
            
            $stmt = $pdo->prepare("
                INSERT INTO teacher_activity_log (teacher_id, action, details, ip_address, user_agent)
                VALUES (?, 'login', 'Teacher logged in successfully', ?, ?)
            ");
            $stmt->execute([
                $teacher['id'],
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ]);
        } catch (Exception $e) {
            error_log("Failed to log teacher activity: " . $e->getMessage());
        }
        
        // Log successful login
        error_log("Teacher logged in: $email (ID: {$teacher['id']})");
        
        // Set success response
        $response = array(
            'success' => true,
            'message' => 'Login successful! Welcome back, ' . $teacher['first_name'] . '!',
            'redirect' => '../teacher-dashboard.html'
        );
        
    } catch (Exception $e) {
        // Clear any output
        ob_clean();
        
        $response = array(
            'success' => false,
            'message' => 'An error occurred. Please try again.',
            'error_type' => 'server_error'
        );
        
        // Log failed login attempt
        $email = isset($email) ? $email : 'unknown';
        error_log("Teacher login failed for email: $email - " . $e->getMessage());
        error_log("Exception trace: " . $e->getTraceAsString());
    } catch (Error $e) {
        // Clear any output
        ob_clean();
        
        $response = array(
            'success' => false,
            'message' => 'A fatal error occurred. Please contact administrator.',
            'error_type' => 'fatal_error'
        );
        
        error_log("Fatal error in teacher login: " . $e->getMessage());
        error_log("Error trace: " . $e->getTraceAsString());
    }
    
    // Clear any remaining output
    ob_clean();
    
    // Return JSON response
    if (!headers_sent()) {
        header('Content-Type: application/json');
    }
    echo json_encode($response);
    ob_end_flush();
    exit;
}

// If not POST request, redirect to teacher login page
ob_clean();
if (!headers_sent()) {
    header('Location: ../teacher-login.html');
}
ob_end_flush();
exit;
?>
