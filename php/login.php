<?php
require_once 'config.php';

// Handle login form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $response = array();
    
    try {
        // Validate required fields
        if (!isset($_POST['email']) || !isset($_POST['password'])) {
            throw new Exception("Email and password are required");
        }
        
        $email = sanitize_input($_POST['email']);
        $password = $_POST['password'];
        
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

        require_once __DIR__ . '/maintenance-helper.php';
        if (isMaintenanceMode($pdo)) {
            $p = getMaintenancePayload($pdo);
            $msg = trim((string) ($p['message'] ?? '')) !== ''
                ? $p['message']
                : 'MathEase is temporarily unavailable while we apply updates. Please try again later.';
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
        
        // Check if user exists and get verification status
        $stmt = $pdo->prepare("
            SELECT id, first_name, last_name, email, student_id, grade_level, strand, password, newsletter_subscribed, email_verified 
            FROM users 
            WHERE email = ?
        ");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() === 0) {
            $response = array(
                'success' => false,
                'message' => 'Email address not found. Please check your email or sign up.',
                'error_type' => 'email_not_found',
                'field' => 'email'
            );
            header('Content-Type: application/json');
            echo json_encode($response);
            exit;
        }
        
        $user = $stmt->fetch();
        
        // Check if email is verified
        if (!$user['email_verified']) {
            $response = array(
                'success' => false,
                'message' => 'Please verify your email before logging in. Enter the OTP sent to your email during signup.',
                'error_type' => 'email_not_verified',
                'field' => 'email'
            );
            header('Content-Type: application/json');
            echo json_encode($response);
            exit;
        }
        
        // Verify password
        if (!password_verify($password, $user['password'])) {
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
        
        // Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
        $_SESSION['student_id'] = $user['student_id'];
        $_SESSION['grade_level'] = $user['grade_level'];
        $_SESSION['strand'] = $user['strand'];
        $_SESSION['login_time'] = time();
        
        // Update last login time
        $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        require_once __DIR__ . '/student-activity-log-helper.php';
        log_student_activity($pdo, (int) $user['id'], 'login', 'Successfully signed in');

        // Log successful login
        error_log("User logged in: $email (ID: {$user['id']})");
        
        // Set success response
        $response = array(
            'success' => true,
            'message' => 'Login successful! Welcome back, ' . $user['first_name'] . '!',
            'redirect' => '../dashboard.html'
        );
        
    } catch (Exception $e) {
        $response = array(
            'success' => false,
            'message' => $e->getMessage()
        );
        
        // Log failed login attempt
        error_log("Login failed for email: $email - " . $e->getMessage());
    }
    
    // Return JSON response
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

// If not POST request, redirect to login page
header('Location: ../login.html');
exit;
?>
