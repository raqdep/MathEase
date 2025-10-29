<?php
require_once 'config.php';

// Handle teacher registration form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $response = array();
    
    try {
        // Validate required fields
        $required_fields = ['firstName', 'lastName', 'email', 'teacherId', 'department', 'subject', 'password', 'confirmPassword'];
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
        $teacherId = sanitize_input($_POST['teacherId']);
        $department = sanitize_input($_POST['department']);
        $subject = sanitize_input($_POST['subject']);
        $password = $_POST['password'];
        $confirmPassword = $_POST['confirmPassword'];
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format");
        }
        
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM teachers WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->rowCount() > 0) {
            throw new Exception("Email already registered");
        }
        
        // Check if teacher ID already exists
        $stmt = $pdo->prepare("SELECT id FROM teachers WHERE teacher_id = ?");
        $stmt->execute([$teacherId]);
        if ($stmt->rowCount() > 0) {
            throw new Exception("Teacher ID already registered");
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
        
        // Insert teacher into database
        $stmt = $pdo->prepare("
            INSERT INTO teachers (first_name, last_name, email, teacher_id, department, subject, password, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $firstName,
            $lastName,
            $email,
            $teacherId,
            $department,
            $subject,
            $hashedPassword
        ]);
        
        $teacherId = $pdo->lastInsertId();
        
        // Create teacher profile record
        $stmt = $pdo->prepare("
            INSERT INTO teacher_profiles (teacher_id, total_students, active_assignments, created_at) 
            VALUES (?, 0, 0, NOW())
        ");
        $stmt->execute([$teacherId]);
        
        // Set success response
        $response = array(
            'success' => true,
            'message' => 'Teacher registration successful! Welcome to MathEase.',
            'teacher_id' => $teacherId
        );
        
        // Log successful registration
        error_log("New teacher registered: $email (ID: $teacherId)");
        
    } catch (Exception $e) {
        $response = array(
            'success' => false,
            'message' => $e->getMessage()
        );
        
        // Log error
        error_log("Teacher registration error: " . $e->getMessage());
    }
    
    // Return JSON response
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

// If not POST request, redirect to teacher registration page
header('Location: ../teacher-register.html');
exit;
?>
