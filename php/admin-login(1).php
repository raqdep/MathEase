<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

try {
    $email = sanitize_input($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Email and password are required']);
        exit;
    }
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit;
    }
    
    // Get admin from database
    $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, password, role, is_active FROM admins WHERE email = ? AND is_active = TRUE");
    $stmt->execute([$email]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin) {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        exit;
    }
    
    // Verify password
    if (!password_verify($password, $admin['password'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        exit;
    }
    
    // Update last login
    $stmt = $pdo->prepare("UPDATE admins SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$admin['id']]);
    
    // Log admin activity
    $stmt = $pdo->prepare("INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address, user_agent) VALUES (?, 'login', 'admin', ?, ?, ?, ?)");
    $stmt->execute([
        $admin['id'],
        $admin['id'],
        'Admin login successful',
        $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ]);
    
    // Set session variables
    $_SESSION['admin_id'] = $admin['id'];
    $_SESSION['admin_email'] = $admin['email'];
    $_SESSION['admin_name'] = $admin['first_name'] . ' ' . $admin['last_name'];
    $_SESSION['admin_role'] = $admin['role'];
    
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'admin_id' => $admin['id'],
        'admin_name' => $admin['first_name'] . ' ' . $admin['last_name'],
        'admin_role' => $admin['role']
    ]);
    
} catch (Exception $e) {
    error_log("Admin login error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred. Please try again.']);
}
?>
