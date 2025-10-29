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
        
        // Validate required fields
        $required_fields = ['firstName', 'lastName', 'email', 'lrn', 'gradeLevel', 'strand', 'password', 'confirmPassword'];
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
        $lrn = sanitize_input($_POST['lrn']);
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
        
        // Generate verification token (no OTP needed)
        $verificationToken = generate_token();
        $linkExpires = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        // Insert user into database with verification fields
        $stmt = $pdo->prepare("
            INSERT INTO users (first_name, last_name, email, student_id, grade_level, strand, password, newsletter_subscribed, email_verified, verification_link_token, verification_link_expires, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $firstName,
            $lastName,
            $email,
            $lrn,
            $gradeLevel,
            $strand,
            $hashedPassword,
            $newsletter,
            $verificationToken,
            $linkExpires
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Create user progress record
        $stmt = $pdo->prepare("
            INSERT INTO user_progress (user_id, total_score, completed_lessons, created_at) 
            VALUES (?, 0, 0, NOW())
        ");
        $stmt->execute([$userId]);
        
        // Send verification email using enhanced system
        $verificationLink = "http://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . "/verify-email.php?token=" . $verificationToken;
        
        $subject = 'Welcome to MathEase - Verify Your Email';
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
                    
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Thank you for registering with MathEase! To complete your registration and start learning, please verify your email address by clicking the button below.
                    </p>
                    
                    <!-- Verification Link -->
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="' . $verificationLink . '" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 10px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">Verify Email Address</a>
                    </div>
                    
                    <div style="background: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 6px; padding: 15px; margin: 20px 0;">
                        <p style="color: #2d5a2d; margin: 0; font-size: 14px; font-weight: 500;">
                            ✅ Simply click the "Verify Email Address" button above to complete your registration.
                        </p>
                    </div>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                        <p style="color: #856404; margin: 0; font-size: 14px; font-weight: 500;">
                            ⏰ Your verification link will expire in 24 hours for security reasons.
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
        
        // Send verification email using dedicated Gmail SMTP
        $verificationLink = "http://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . "/verify-email.php?token=" . $verificationToken;
        
        $subject = 'Welcome to MathEase - Verify Your Email';
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
                    
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Thank you for registering with MathEase! To complete your registration and start learning, please verify your email address by clicking the button below.
                    </p>
                    
                    <!-- Verification Link -->
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="' . $verificationLink . '" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 10px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">Verify Email Address</a>
                    </div>
                    
                    <div style="background: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 6px; padding: 15px; margin: 20px 0;">
                        <p style="color: #2d5a2d; margin: 0; font-size: 14px; font-weight: 500;">
                            ✅ Simply click the "Verify Email Address" button above to complete your registration.
                        </p>
                    </div>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                        <p style="color: #856404; margin: 0; font-size: 14px; font-weight: 500;">
                            ⏰ Your verification link will expire in 24 hours for security reasons.
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
            'message' => 'Registration successful! Please resend verification email.',
            'user_id' => $userId,
            'email_sent' => $emailSent,
            'verification_required' => true
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
