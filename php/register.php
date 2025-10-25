<?php
require_once 'config.php';

// Handle registration form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Start output buffering to prevent accidental warnings/HTML from
    // being sent before our JSON response (which would break the client parser).
    ob_start();
    $response = array();
    
    try {
        // Provide defaults for optional grade/strand if not provided
        if (!isset($_POST['gradeLevel']) || trim($_POST['gradeLevel']) === '') {
            $_POST['gradeLevel'] = '11';
        }
        if (!isset($_POST['strand']) || trim($_POST['strand']) === '') {
            $_POST['strand'] = 'STEM';
        }
        // Validate required fields
        $required_fields = ['firstName', 'lastName', 'email', 'lrn', 'gradeLevel', 'strand', 'password', 'confirmPassword'];
        $missing_fields = [];
        
        foreach ($required_fields as $field) {
            if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
                $missing_fields[] = $field;
            }
        }
        
        if (!empty($missing_fields)) {
            throw new Exception("Missing required fields: " . implode(', ', $missing_fields));
        }
        
        // Sanitize inputs
        $firstName = sanitize_input($_POST['firstName']);
        $lastName = sanitize_input($_POST['lastName']);
        $email = sanitize_input($_POST['email']);
        $lrn = sanitize_input($_POST['lrn']);
        $gradeLevel = sanitize_input($_POST['gradeLevel']);
        $strand = sanitize_input($_POST['strand']);
        $password = $_POST['password'];
        $confirmPassword = $_POST['confirmPassword'];
        $newsletter = isset($_POST['newsletter']) ? 1 : 0;
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format");
        }
        
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->rowCount() > 0) {
            throw new Exception("Email already registered");
        }
        
        // Validate LRN format (12 digits)
        if (!preg_match('/^\d{12}$/', $lrn)) {
            throw new Exception("LRN must be exactly 12 digits");
        }
        
        // Check if LRN already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE student_id = ?");
        $stmt->execute([$lrn]);
        if ($stmt->rowCount() > 0) {
            throw new Exception("LRN already registered");
        }
        
        // Validate password
        if (strlen($password) < 8) {
            throw new Exception("Password must be at least 8 characters long");
        }
        
        if ($password !== $confirmPassword) {
            throw new Exception("Passwords do not match");
        }
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert user into database
        $stmt = $pdo->prepare("
            INSERT INTO users (first_name, last_name, email, student_id, grade_level, strand, password, newsletter_subscribed, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $firstName,
            $lastName,
            $email,
            $lrn,
            $gradeLevel,
            $strand,
            $hashedPassword,
            $newsletter
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Create user progress record
        $stmt = $pdo->prepare("
            INSERT INTO user_progress (user_id, total_score, completed_lessons, created_at) 
            VALUES (?, 0, 0, NOW())
        ");
        $stmt->execute([$userId]);
        
        // Set success response
        $response = array(
            'success' => true,
            'message' => 'Registration successful! Welcome to MathEase.',
            'user_id' => $userId
        );
        
        // Log successful registration
        error_log("New user registered: $email (ID: $userId)");
        
    } catch (Exception $e) {
        $response = array(
            'success' => false,
            'message' => $e->getMessage()
        );
        
        // Log error
        error_log("Registration error: " . $e->getMessage());
    }
    
    // Return JSON response
    header('Content-Type: application/json');
    // Discard any buffered output (warnings/HTML) so the response is clean JSON
    if (ob_get_length() !== false) {
        ob_clean();
    }
    echo json_encode($response);
    exit;
}

// If not POST request, redirect to registration page
header('Location: ../register.html');
exit;
?>
