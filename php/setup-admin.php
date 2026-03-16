<?php
/**
 * Setup Default Admin Account
 * Run this script once to create the default admin account
 * Email: matheasenc2025@gmail.com
 * Password: MathEase2025!
 */

require_once 'config.php';

header('Content-Type: application/json');

try {
    // Ensure admins table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'super_admin',
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP NULL,
            INDEX idx_email (email),
            INDEX idx_active (is_active)
        )
    ");
    
    $adminEmail = 'matheasenc2025@gmail.com';
    $adminPassword = 'MathEase2025!';

    // Check if admin already exists
    $stmt = $pdo->prepare("SELECT id FROM admins WHERE email = ?");
    $stmt->execute([$adminEmail]);
    
    if ($stmt->rowCount() > 0) {
        // Optional: reset password if you forgot it (use ?reset_password=1 in URL)
        $resetPassword = isset($_GET['reset_password']) && $_GET['reset_password'] === '1';
        if ($resetPassword) {
            $hashedPassword = password_hash($adminPassword, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE admins SET password = ?, is_active = 1 WHERE email = ?");
            $stmt->execute([$hashedPassword, $adminEmail]);
            echo json_encode([
                'success' => true,
                'message' => 'Admin password has been reset. Use the credentials below to login.',
                'email' => $adminEmail,
                'password' => $adminPassword,
                'note' => 'Remove ?reset_password=1 from the URL after saving these credentials for security.'
            ]);
            exit;
        }
        echo json_encode([
            'success' => false,
            'message' => 'Admin account already exists. Use the existing credentials to login. Forgot password? Visit this page with ?reset_password=1 to reset.',
            'email' => $adminEmail
        ]);
        exit;
    }
    
    // Create default admin account
    $hashedPassword = password_hash($adminPassword, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("
        INSERT INTO admins (first_name, last_name, email, password, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        'MathEase',
        'Administrator',
        $adminEmail,
        $hashedPassword,
        'super_admin',
        1
    ]);
    
    $adminId = $pdo->lastInsertId();
    
    // Ensure admin_activity_log table exists
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
            INDEX idx_created (created_at),
            FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
        )
    ");
    
    // Log admin creation
    try {
        $stmt = $pdo->prepare("
            INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address, user_agent)
            VALUES (?, 'admin_created', 'admin', ?, 'Default admin account created via setup script', ?, ?)
        ");
        $stmt->execute([
            $adminId,
            $adminId,
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    } catch (Exception $e) {
        error_log("Failed to log admin creation: " . $e->getMessage());
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Default admin account created successfully!',
        'admin_id' => $adminId,
        'email' => $adminEmail,
        'password' => $adminPassword,
        'note' => 'Please save these credentials securely. You can now login to the admin portal.'
    ]);
    
} catch (Exception $e) {
    error_log("Setup admin error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to create admin account: ' . $e->getMessage()
    ]);
}
?>
