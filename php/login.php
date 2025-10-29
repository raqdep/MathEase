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
        $remember = isset($_POST['remember']) ? true : false;
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format");
        }
        
        // Check if user exists and get verification status
        $stmt = $pdo->prepare("
            SELECT id, first_name, last_name, email, student_id, grade_level, strand, password, newsletter_subscribed, email_verified 
            FROM users 
            WHERE email = ?
        ");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception("Invalid email or password");
        }
        
        $user = $stmt->fetch();
        
        // Check if email is verified
        if (!$user['email_verified']) {
            throw new Exception("Please verify your email before logging in. Check your email for verification instructions.");
        }
        
        // Verify password
        if (!password_verify($password, $user['password'])) {
            throw new Exception("Invalid email or password");
        }
        
        // Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
        $_SESSION['student_id'] = $user['student_id'];
        $_SESSION['grade_level'] = $user['grade_level'];
        $_SESSION['strand'] = $user['strand'];
        $_SESSION['login_time'] = time();
        
        // Handle remember me functionality
        if ($remember) {
            $token = generate_token();
            $expiry = date('Y-m-d H:i:s', strtotime('+30 days'));
            
            // Store remember me token in database
            $stmt = $pdo->prepare("
                INSERT INTO remember_tokens (user_id, token, expires_at) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$user['id'], $token, $expiry]);
            
            // Set remember me cookie
            setcookie('remember_token', $token, time() + (30 * 24 * 60 * 60), '/', '', true, true);
        }
        
        // Update last login time
        $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
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
