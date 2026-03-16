<?php
/**
 * Diagnostic script to check admin account status
 * This will help identify why admin login is failing
 */

require_once 'config.php';

header('Content-Type: application/json');

try {
    $results = array();
    
    // 1. Check if admins table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'admins'");
    $tableExists = $stmt->rowCount() > 0;
    $results['admins_table_exists'] = $tableExists;
    
    if (!$tableExists) {
        echo json_encode([
            'success' => false,
            'message' => 'Admins table does not exist. Please run setup-admin.php first.',
            'results' => $results
        ]);
        exit;
    }
    
    // 2. Check admin account count
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM admins");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    $results['admin_count'] = $count['count'];
    
    // 3. Check for the specific admin email
    $adminEmail = 'matheasenc2025@gmail.com';
    $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, role, is_active, created_at, last_login FROM admins WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([$adminEmail]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($admin) {
        $results['admin_found'] = true;
        $results['admin_data'] = [
            'id' => $admin['id'],
            'first_name' => $admin['first_name'],
            'last_name' => $admin['last_name'],
            'email' => $admin['email'],
            'role' => $admin['role'],
            'is_active' => $admin['is_active'],
            'created_at' => $admin['created_at'],
            'last_login' => $admin['last_login']
        ];
        
        // Check password hash
        $stmt = $pdo->prepare("SELECT password FROM admins WHERE id = ?");
        $stmt->execute([$admin['id']]);
        $passwordData = $stmt->fetch(PDO::FETCH_ASSOC);
        $results['has_password'] = !empty($passwordData['password']);
        $results['password_length'] = strlen($passwordData['password']);
        
        // Test password verification
        $testPassword = 'MathEase2025!';
        $passwordMatch = password_verify($testPassword, $passwordData['password']);
        $results['password_verification'] = $passwordMatch;
        
        // Check if account is active
        $results['account_active'] = $admin['is_active'] == 1;
        
    } else {
        $results['admin_found'] = false;
        $results['message'] = 'Admin account with email ' . $adminEmail . ' not found in database.';
    }
    
    // 4. Check all admin accounts
    $stmt = $pdo->query("SELECT id, email, is_active, created_at FROM admins");
    $allAdmins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $results['all_admins'] = $allAdmins;
    
    // 5. Check database connection
    $results['database_connected'] = true;
    $results['database_name'] = $pdo->query("SELECT DATABASE()")->fetchColumn();
    
    echo json_encode([
        'success' => true,
        'message' => 'Admin account diagnostic completed',
        'results' => $results,
        'recommendations' => [
            'If admin_found is false: Run php/setup-admin.php to create admin account',
            'If password_verification is false: Password hash might be incorrect, re-run setup-admin.php',
            'If account_active is false: Admin account is inactive, update is_active to 1',
            'If admins_table_exists is false: Database schema not set up, run database setup scripts'
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error checking admin account: ' . $e->getMessage(),
        'error' => $e->getTraceAsString()
    ]);
}
?>
