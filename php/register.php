<?php
require_once 'config.php';
require_once '../gmail-fixed-test.php';

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
        // Debug: Log all POST data
        error_log("All POST data: " . print_r($_POST, true));
        
        // Validate required fields (LRN removed - now optional)
        $required_fields = ['firstName', 'lastName', 'email', 'gradeLevel', 'strand', 'password', 'confirmPassword'];
        $missing_fields = [];
        
        foreach ($required_fields as $field) {
            $exists = isset($_POST[$field]);
            $value = $exists ? $_POST[$field] : 'NOT_SET';
            $empty = $exists ? (empty(trim($_POST[$field])) ? 'YES' : 'NO') : 'N/A';
            
            error_log("Field {$field}: exists={$exists}, value='{$value}', empty={$empty}");
            
            if (!$exists || empty(trim($_POST[$field]))) {
                $missing_fields[] = $field;
            }
        }
        
        if (!empty($missing_fields)) {
            error_log("Missing fields: " . implode(', ', $missing_fields));
            throw new Exception("Missing required fields: " . implode(', ', $missing_fields));
        }
        
        // Sanitize inputs
        $firstName = sanitize_input($_POST['firstName']);
        $lastName = sanitize_input($_POST['lastName']);
        $email = sanitize_input($_POST['email']);
        $lrn = isset($_POST['lrn']) && !empty(trim($_POST['lrn'])) ? sanitize_input($_POST['lrn']) : null; // Optional LRN
        $gradeLevel = sanitize_input($_POST['gradeLevel']);
        $strand = sanitize_input($_POST['strand']);
        $password = $_POST['password'];
        $confirmPassword = $_POST['confirmPassword'];
        $newsletter = isset($_POST['newsletter']) ? 1 : 0;
        
        // Debug: Log form data
        error_log("Registration attempt - Email: " . $email . ", First Name: " . $firstName . ", Last Name: " . $lastName);
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format");
        }
        
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id, email_verified FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->rowCount() > 0) {
            $existingUser = $stmt->fetch();
            if ($existingUser['email_verified']) {
                throw new Exception("Email already registered and verified");
            } else {
                // For unverified emails, return a special response instead of throwing an exception
                $response = array(
                    'success' => false,
                    'message' => 'Email already registered but not verified. Please resend verification email.',
                    'unverified_email' => true,
                    'email' => $email
                );
                
                header('Content-Type: application/json');
                if (ob_get_length() !== false) {
                    ob_clean();
                }
                echo json_encode($response);
                exit;
            }
        }
        
        // Validate LRN format if provided (optional field)
        if ($lrn !== null && !empty(trim($lrn))) {
            if (!preg_match('/^\d{12}$/', $lrn)) {
                throw new Exception("LRN must be exactly 12 digits if provided");
            }
            
            // Check if LRN already exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE student_id = ?");
            $stmt->execute([$lrn]);
            if ($stmt->rowCount() > 0) {
                throw new Exception("LRN already registered");
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
        
        // Insert user into database with OTP verification fields (LRN is optional)
        $stmt = $pdo->prepare("
            INSERT INTO users (first_name, last_name, email, student_id, grade_level, strand, password, newsletter_subscribed, email_verified, otp, expiration_otp, verification_link_token, verification_link_expires, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NULL, NULL, NOW())
        ");
        
        $stmt->execute([
            $firstName,
            $lastName,
            $email,
            $lrn, // Can be NULL if not provided
            $gradeLevel,
            $strand,
            $hashedPassword,
            $newsletter,
            $otp,
            $otpExpires
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Create user progress record
        $stmt = $pdo->prepare("
            INSERT INTO user_progress (user_id, total_score, completed_lessons, created_at) 
            VALUES (?, 0, 0, NOW())
        ");
        $stmt->execute([$userId]);
        
        // Send OTP email using enhanced system
        $subject = 'Welcome to MathEase - Your verification code';
        $htmlBody = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MathEase Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">MathEase</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Email Verification</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Welcome to MathEase!</h2>
                    
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi ' . htmlspecialchars($firstName) . ',
                    </p>
                    
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Thank you for registering with MathEase! Enter this OTP to complete your registration:
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0;">
                        <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                        <div style="background: #ffffff; color: #667eea; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px; border-radius: 8px; display: inline-block; min-width: 200px;">' . $otp . '</div>
                    </div>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                        <p style="color: #856404; margin: 0; font-size: 14px; font-weight: 500;">
                            ⏰ Your verification code will expire in 15 minutes for security reasons.
                        </p>
                    </div>
                    
                    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                        If you did not create an account with MathEase, please ignore this email.
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #6c757d; margin: 0; font-size: 14px;">
                        Best regards,<br>
                        <strong>The MathEase Team</strong>
                    </p>
                    <p style="color: #adb5bd; margin: 10px 0 0 0; font-size: 12px;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            </div>
        </body>
        </html>';
        
        // Duplicate template block retained from legacy file; keep subject/body aligned to OTP flow
        $subject = 'Welcome to MathEase - Your verification code';
        $htmlBody = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MathEase Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">MathEase</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Email Verification</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Welcome to MathEase!</h2>
                    
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi ' . htmlspecialchars($firstName) . ',
                    </p>
                    
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Thank you for registering with MathEase! Enter this OTP to complete your registration:
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0;">
                        <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                        <div style="background: #ffffff; color: #667eea; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px; border-radius: 8px; display: inline-block; min-width: 200px;">' . $otp . '</div>
                    </div>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                        <p style="color: #856404; margin: 0; font-size: 14px; font-weight: 500;">
                            ⏰ Your verification code will expire in 15 minutes for security reasons.
                        </p>
                    </div>
                    
                    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                        If you did not create an account with MathEase, please ignore this email.
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #6c757d; margin: 0; font-size: 14px;">
                        Best regards,<br>
                        <strong>The MathEase Team</strong>
                    </p>
                    <p style="color: #adb5bd; margin: 10px 0 0 0; font-size: 12px;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            </div>
        </body>
        </html>';
        
        // Use dedicated Gmail SMTP for verification emails
        $emailSent = send_gmail_verification_fixed($email, $subject, $htmlBody);
        
        // If Gmail fails, save to file as backup
        if (!$emailSent) {
            $file_result = save_email_to_file($email, $subject, $htmlBody);
            error_log("Gmail SMTP failed for {$email}, saved to file: " . ($file_result ? 'Yes' : 'No'));
        }
        
        // Set success response
        $response = array(
            'success' => true,
            'message' => 'Registration successful! Enter the OTP sent to your email to verify your account.',
            'user_id' => $userId,
            'email_sent' => $emailSent,
            'verification_required' => true,
            'account_type' => 'student'
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
