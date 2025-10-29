<?php
require_once 'config.php';

// Handle teacher login form submission
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
        
        // Check if teacher exists
        $stmt = $pdo->prepare("
            SELECT id, first_name, last_name, email, teacher_id, department, subject, password, last_login 
            FROM teachers 
            WHERE email = ?
        ");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception("Invalid email or password");
        }
        
        $teacher = $stmt->fetch();
        
        // Verify password
        if (!password_verify($password, $teacher['password'])) {
            throw new Exception("Invalid email or password");
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
        
        // Log successful login
        error_log("Teacher logged in: $email (ID: {$teacher['id']})");
        
        // Set success response
        $response = array(
            'success' => true,
            'message' => 'Login successful! Welcome back, ' . $teacher['first_name'] . '!',
            'redirect' => '../teacher-dashboard.html'
        );
        
    } catch (Exception $e) {
        $response = array(
            'success' => false,
            'message' => $e->getMessage()
        );
        
        // Log failed login attempt
        error_log("Teacher login failed for email: $email - " . $e->getMessage());
    }
    
    // Return JSON response
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

// If not POST request, redirect to teacher login page
header('Location: ../teacher-login.html');
exit;
?>
