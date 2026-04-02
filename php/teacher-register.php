<?php
require_once 'config.php';
// Include Gmail verification function
require_once __DIR__ . '/../gmail-fixed-test.php';

// Handle teacher registration form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $response = array();
    
    try {
        // Validate required fields (teacherId removed - now optional)
        $required_fields = ['firstName', 'lastName', 'email', 'department', 'subject', 'password', 'confirmPassword'];
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
        $teacherId = isset($_POST['teacherId']) && !empty(trim($_POST['teacherId'])) ? sanitize_input($_POST['teacherId']) : null; // Optional Teacher ID
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
        
        // Check if teacher ID already exists (only if provided)
        if ($teacherId !== null && !empty(trim($teacherId))) {
            $stmt = $pdo->prepare("SELECT id FROM teachers WHERE teacher_id = ?");
            $stmt->execute([$teacherId]);
            if ($stmt->rowCount() > 0) {
                throw new Exception("Teacher ID already registered");
            }
        }
        
        // Validate password (8–30 chars, lowercase, uppercase, number, special)
        if (strlen($password) < 8) {
            throw new Exception("Password must be at least 8 characters long");
        }
        if (strlen($password) > 30) {
            throw new Exception("Password must be at most 30 characters");
        }
        if (!preg_match('/[a-z]/', $password)) {
            throw new Exception("Password must contain at least one lowercase letter");
        }
        if (!preg_match('/[A-Z]/', $password)) {
            throw new Exception("Password must contain at least one uppercase letter");
        }
        if (!preg_match('/[0-9]/', $password)) {
            throw new Exception("Password must contain at least one number");
        }
        if (!preg_match('/[^a-zA-Z0-9]/', $password)) {
            throw new Exception("Password must contain at least one special character");
        }
        
        if ($password !== $confirmPassword) {
            throw new Exception("Passwords do not match");
        }
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Generate OTP for email verification
        $otp = (string) random_int(100000, 999999);
        $otpExpires = date('Y-m-d H:i:s', strtotime('+15 minutes'));
        
        // Ensure OTP columns exist for teacher email verification
        try {
            $pdo->exec("ALTER TABLE teachers ADD COLUMN otp VARCHAR(10) NULL");
        } catch (Exception $e) {
            // ignore if column already exists
        }
        try {
            $pdo->exec("ALTER TABLE teachers ADD COLUMN expiration_otp DATETIME NULL");
        } catch (Exception $e) {
            // ignore if column already exists
        }

        // Check if approval_status column exists
        $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers LIKE 'approval_status'");
        $stmt->execute();
        $hasApprovalStatus = $stmt->rowCount() > 0;
        
        // Check if email_verified column exists
        $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers LIKE 'email_verified'");
        $stmt->execute();
        $hasEmailVerified = $stmt->rowCount() > 0;
        
        // Check if OTP columns exist
        $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers LIKE 'otp'");
        $stmt->execute();
        $hasOtpColumn = $stmt->rowCount() > 0;

        $stmt = $pdo->prepare("SHOW COLUMNS FROM teachers LIKE 'expiration_otp'");
        $stmt->execute();
        $hasOtpExpiryColumn = $stmt->rowCount() > 0;
        
        // Build INSERT query based on available columns (teacher_id is now optional)
        $columns = ['first_name', 'last_name', 'email', 'department', 'subject', 'password', 'created_at'];
        $values = [$firstName, $lastName, $email, $department, $subject, $hashedPassword, 'NOW()'];
        $placeholders = ['?', '?', '?', '?', '?', '?', 'NOW()'];
        
        // Add teacher_id only if provided
        if ($teacherId !== null && !empty(trim($teacherId))) {
            $columns[] = 'teacher_id';
            $values[] = $teacherId;
            $placeholders[] = '?';
        }
        
        if ($hasApprovalStatus) {
            $columns[] = 'approval_status';
            $values[] = 'pending';
            $placeholders[] = '?';
        }
        
        if ($hasEmailVerified) {
            $columns[] = 'email_verified';
            $values[] = 0;
            $placeholders[] = '?';
        }
        
        if ($hasOtpColumn) {
            $columns[] = 'otp';
            $values[] = $otp;
            $placeholders[] = '?';
        }

        if ($hasOtpExpiryColumn) {
            $columns[] = 'expiration_otp';
            $values[] = $otpExpires;
            $placeholders[] = '?';
        }
        
        $columnsStr = implode(', ', $columns);
        $placeholdersStr = implode(', ', $placeholders);
        
        // Insert teacher into database
        $stmt = $pdo->prepare("
            INSERT INTO teachers ({$columnsStr}) 
            VALUES ({$placeholdersStr})
        ");
        
        // Prepare values for execution (remove NOW() from array)
        $executeValues = [];
        foreach ($values as $val) {
            if ($val !== 'NOW()') {
                $executeValues[] = $val;
            }
        }
        
        $stmt->execute($executeValues);
        
        $teacherDbId = $pdo->lastInsertId();
        
        // Create teacher profile record if table exists
        try {
            $stmt = $pdo->prepare("
                INSERT INTO teacher_profiles (teacher_id, total_students, active_assignments, created_at) 
                VALUES (?, 0, 0, NOW())
            ");
            $stmt->execute([$teacherDbId]);
        } catch (Exception $e) {
            // Table might not exist, that's okay
            error_log("Teacher profile table not found: " . $e->getMessage());
        }
        
        // Send OTP email
        $email_subject = "Your MathEase Teacher verification code";
        $email_body = "
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
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                .button:hover { background: #5568d3; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .info-box { background: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 6px; padding: 15px; margin: 20px 0; }
                .warning-box { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1 style='margin: 0;'>MathEase Teacher Portal</h1>
                </div>
                <div class='content'>
                    <h2 style='color: #667eea; margin-top: 0;'>Teacher Email Verification Required</h2>
                    <p>Hello " . htmlspecialchars($firstName) . " " . htmlspecialchars($lastName) . ",</p>
                    <p>Thank you for registering as a teacher on MathEase! Enter this OTP to verify your email:</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <div style='background: #ffffff; color: #667eea; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px; border-radius: 8px; display: inline-block; min-width: 220px; border: 1px solid #e5e7eb;'>{$otp}</div>
                    </div>
                    <div class='info-box'>
                        <p style='margin: 0; color: #2d5a2d; font-weight: 500;'><strong>✓ Next Steps:</strong> After entering this OTP, your account will be sent to the admin for approval. You will receive another email once your account is approved.</p>
                    </div>
                    <div class='warning-box'>
                        <p style='margin: 0; color: #856404; font-weight: 500;'><strong>⏰ Important:</strong> This OTP expires in 15 minutes for security reasons.</p>
                    </div>
                    <p style='color: #666; font-size: 14px; margin-top: 30px;'>If you did not register for MathEase, please ignore this email.</p>
                </div>
                <div class='footer'>
                    <p>&copy; " . date('Y') . " MathEase. All rights reserved.</p>
                    <p style='font-size: 11px; color: #999;'>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>";
        
        // Use dedicated Gmail SMTP for verification emails
        $email_sent = send_gmail_verification_fixed($email, $email_subject, $email_body);
        
        // If Gmail fails, save to file as backup
        if (!$email_sent) {
            $file_result = save_email_to_file($email, $email_subject, $email_body);
            error_log("Gmail SMTP failed for teacher {$email}, saved to file: " . ($file_result ? 'Yes' : 'No'));
            // Still consider it successful if saved to file
            $email_sent = $file_result;
        } else {
            error_log("Teacher verification email sent successfully via Gmail to: {$email}");
        }
        
        // Set success response
        $response = array(
            'success' => true,
            'message' => 'Registration successful! Enter the OTP sent to your email to verify your account.',
            'teacher_id' => $teacherDbId,
            'email_sent' => $email_sent,
            'verification_required' => true,
            'account_type' => 'teacher'
        );
        
        // Log successful registration
        error_log("New teacher registered: $email (ID: $teacherDbId) - Verification email " . ($email_sent ? "sent" : "failed"));
        
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
