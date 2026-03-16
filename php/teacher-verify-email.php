<?php
require_once 'config.php';

header('Content-Type: application/json');

$token = $_GET['token'] ?? null;

if (!$token) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Verification token is required']);
    exit;
}

try {
    // Check if verification_token column exists
    $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers LIKE 'verification_token'");
    $stmt->execute();
    $hasVerificationToken = $stmt->rowCount() > 0;
    
    if (!$hasVerificationToken) {
        // Add verification_token column if it doesn't exist
        $pdo->exec("ALTER TABLE teachers ADD COLUMN verification_token VARCHAR(64) NULL");
    }
    
    // Check if email_verified column exists
    $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers LIKE 'email_verified'");
    $stmt->execute();
    $hasEmailVerified = $stmt->rowCount() > 0;
    
    if (!$hasEmailVerified) {
        // Add email_verified column if it doesn't exist
        $pdo->exec("ALTER TABLE teachers ADD COLUMN email_verified TINYINT(1) DEFAULT 0");
    }
    
    // Check if approval_status column exists
    $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers LIKE 'approval_status'");
    $stmt->execute();
    $hasApprovalStatus = $stmt->rowCount() > 0;
    
    if (!$hasApprovalStatus) {
        // Add approval_status column if it doesn't exist
        $pdo->exec("ALTER TABLE teachers ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending'");
    }
    
    // Find teacher by verification token
    $stmt = $pdo->prepare("
        SELECT id, first_name, last_name, email, email_verified, approval_status 
        FROM teachers 
        WHERE verification_token = ? 
        LIMIT 1
    ");
    $stmt->execute([$token]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$teacher) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired verification token']);
        exit;
    }
    
    // Check if already verified
    if ($teacher['email_verified'] == 1) {
        echo json_encode([
            'success' => true, 
            'message' => 'Email already verified. Your account is pending admin approval.',
            'already_verified' => true
        ]);
        exit;
    }
    
    // Update email_verified status
    $updateColumns = ['email_verified = 1', 'verification_token = NULL'];
    
    if ($hasApprovalStatus && $teacher['approval_status'] !== 'approved') {
        $updateColumns[] = "approval_status = 'pending'";
    }
    
    $updateQuery = "UPDATE teachers SET " . implode(', ', $updateColumns) . " WHERE id = ?";
    $stmt = $pdo->prepare($updateQuery);
    $stmt->execute([$teacher['id']]);
    
    // Send notification to admin ONLY AFTER email verification
    // Include Gmail verification function for email sending
    require_once __DIR__ . '/../gmail-fixed-test.php';
    
    $admin_email = 'matheasenc2025@gmail.com';
    $admin_subject = "New Teacher Account Pending Approval - MathEase";
    $admin_body = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .info-box { background: #e8f5e8; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 4px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #5568d3; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1 style='margin: 0;'>MathEase Admin Notification</h1>
            </div>
            <div class='content'>
                <h2 style='color: #667eea; margin-top: 0;'>New Teacher Account Pending Approval</h2>
                <p>A new teacher has <strong>verified their email</strong> and is waiting for your approval:</p>
                <div class='info-box'>
                    <p style='margin: 5px 0;'><strong>Name:</strong> " . htmlspecialchars($teacher['first_name']) . " " . htmlspecialchars($teacher['last_name']) . "</p>
                    <p style='margin: 5px 0;'><strong>Email:</strong> " . htmlspecialchars($teacher['email']) . "</p>
                    <p style='margin: 5px 0;'><strong>Teacher ID:</strong> {$teacher['id']}</p>
                    <p style='margin: 5px 0;'><strong>Email Verified:</strong> ✓ Yes</p>
                    <p style='margin: 5px 0;'><strong>Verification Date:</strong> " . date('Y-m-d H:i:s') . "</p>
                </div>
                <p>Please review and approve this teacher account in the admin dashboard.</p>
                <div style='text-align: center;'>
                    <a href='" . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . "://" . $_SERVER['HTTP_HOST'] . dirname(dirname($_SERVER['PHP_SELF'])) . "/admin.html#pending-teachers' class='button'>View Admin Dashboard</a>
                </div>
            </div>
            <div class='footer'>
                <p>&copy; " . date('Y') . " MathEase. All rights reserved.</p>
                <p style='font-size: 11px; color: #999;'>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>";
    
    // Use Gmail SMTP for sending admin notification
    $admin_email_sent = send_gmail_verification_fixed($admin_email, $admin_subject, $admin_body);
    
    // If Gmail fails, save to file as backup
    if (!$admin_email_sent) {
        $file_result = save_email_to_file($admin_email, $admin_subject, $admin_body);
        error_log("Gmail SMTP failed for admin notification about teacher {$teacher['email']}, saved to file: " . ($file_result ? 'Yes' : 'No'));
        // Still consider it successful if saved to file
        $admin_email_sent = $file_result;
    } else {
        error_log("Admin notification email sent successfully via Gmail for teacher: {$teacher['email']}");
    }
    
    // Log activity
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
            VALUES (?, 'email_verified', 'Teacher verified email address', ?, ?)
        ");
        $stmt->execute([
            $teacher['id'],
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    } catch (Exception $e) {
        error_log("Failed to log teacher activity: " . $e->getMessage());
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Email verified successfully! Your account has been sent to admin for approval. You will receive an email once your account is approved.',
        'email_verified' => true,
        'admin_notified' => $admin_email_sent
    ]);
    
} catch (Exception $e) {
    error_log("Email verification error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred during verification. Please try again.']);
}
?>
