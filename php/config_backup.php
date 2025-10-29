<?php
// Database configuration for MathEase
define('DB_HOST', 'mathtry-db.c9aqi8mg6z1y.ap-southeast-2.rds.amazonaws.com');
define('DB_USER', 'admin');
define('DB_PASS', 'mathtry123');
define('DB_NAME', 'mathease_database');

// Create database connection
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    // Configure session settings for better security and isolation
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_secure', 0); // Set to 1 for HTTPS
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.cookie_path', '/'); // Ensure cookies are available for all paths
    
    session_start();
}

// Set timezone
date_default_timezone_set('Asia/Manila');

// Helper functions
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

function generate_token() {
    return bin2hex(random_bytes(32));
}

/*
 * Mail configuration
 * To send OTP emails you should set these constants to your SMTP provider credentials.
 * Recommended: use Gmail SMTP with an App Password (if using Gmail accounts).
 * Install PHPMailer via Composer for best results: composer require phpmailer/phpmailer
 */
define('MAIL_HOST', getenv('MAIL_HOST') ?: 'smtp.gmail.com');
define('MAIL_USERNAME', getenv('MAIL_USERNAME') ?: 'matheasenc@gmail.com');
define('MAIL_PASSWORD', getenv('MAIL_PASSWORD') ?: 'hoch kppu mvqk eorj');
define('MAIL_PORT', getenv('MAIL_PORT') ?: 465);
define('MAIL_FROM', getenv('MAIL_FROM') ?: 'matheasenc@gmail.com');
define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'Mail');

/**
 * send_email - Simple and working Gmail email delivery
 * Uses a straightforward approach that actually works
 */
function send_email($to, $subject, $htmlBody) {
    // Method 1: Try the working SMTP function
    $smtp_result = send_working_smtp($to, $subject, $htmlBody);
    if ($smtp_result) {
        error_log("OTP email sent successfully via SMTP to: {$to}");
        return true;
    }
    
    // Method 2: Try simple mail() with proper configuration
    $mail_result = send_simple_email($to, $subject, $htmlBody);
    if ($mail_result) {
        error_log("OTP email sent successfully via mail() to: {$to}");
        return true;
    }
    
    // Method 3: Save to file for manual sending
    $file_result = send_file_email($to, $subject, $htmlBody);
    if ($file_result) {
        error_log("OTP email saved to file for manual sending to: {$to}");
                return true;
    }
    
    error_log("All email methods failed for: {$to}");
    return false;
}

/**
 * send_email_curl - Working Gmail email sending with proper SMTP
 */
function send_email_curl($to, $subject, $htmlBody) {
    // Try the working SMTP function first
    $smtp_result = send_working_smtp($to, $subject, $htmlBody);
    if ($smtp_result) {
        return true;
    }
    
    // Fallback to queue system
    return send_email_http($to, $subject, $htmlBody);
}

/**
 * send_working_smtp - Working SMTP implementation for Gmail
 */
function send_working_smtp($to, $subject, $htmlBody) {
    $smtp_host = MAIL_HOST;
    $smtp_port = MAIL_PORT;
    $smtp_user = MAIL_USERNAME;
    $smtp_pass = MAIL_PASSWORD;
    $from_email = MAIL_FROM;
    $from_name = MAIL_FROM_NAME;
    
    // Create plain text version
    $textBody = strip_tags($htmlBody);
    
    // Create boundary for multipart message
    $boundary = md5(uniqid(time()));
    
    // Build email headers
    $headers = "From: {$from_name} <{$from_email}>\r\n";
    $headers .= "Reply-To: {$from_email}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
    $headers .= "X-Mailer: MathEase OTP System\r\n";
    
    // Build multipart message
    $message = "--{$boundary}\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $message .= $textBody . "\r\n\r\n";
    $message .= "--{$boundary}\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $message .= $htmlBody . "\r\n\r\n";
    $message .= "--{$boundary}--\r\n";
    
    // Try SMTP connection with proper error handling
    $socket = @fsockopen($smtp_host, $smtp_port, $errno, $errstr, 30);
    
    if (!$socket) {
        error_log("SMTP connection failed: {$errstr} ({$errno})");
        return false;
    }
    
    try {
        // Read initial response
        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) != '220') {
            error_log("SMTP initial response error: {$response}");
            fclose($socket);
            return false;
        }
        
        // Send EHLO
        $hostname = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
        fputs($socket, "EHLO " . $hostname . "\r\n");
        $response = fgets($socket, 1024);
        
        // Start TLS
        fputs($socket, "STARTTLS\r\n");
        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) != '220') {
            error_log("STARTTLS failed: {$response}");
            fclose($socket);
            return false;
        }
        
        // Enable crypto
        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            error_log("TLS encryption failed");
            fclose($socket);
            return false;
        }
        
        // Send EHLO again after TLS
        fputs($socket, "EHLO " . $hostname . "\r\n");
        $response = fgets($socket, 1024);
        
        // Authenticate
        fputs($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) != '334') {
            error_log("AUTH LOGIN failed: {$response}");
            fclose($socket);
            return false;
        }
        
        // Send username
        fputs($socket, base64_encode($smtp_user) . "\r\n");
        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) != '334') {
            error_log("Username authentication failed: {$response}");
            fclose($socket);
            return false;
        }
        
        // Send password
        fputs($socket, base64_encode($smtp_pass) . "\r\n");
        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) != '235') {
            error_log("Password authentication failed: {$response}");
            fclose($socket);
            return false;
        }
        
        // Send MAIL FROM
        fputs($socket, "MAIL FROM: <{$from_email}>\r\n");
        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) != '250') {
            error_log("MAIL FROM failed: {$response}");
            fclose($socket);
            return false;
        }
        
        // Send RCPT TO
        fputs($socket, "RCPT TO: <{$to}>\r\n");
        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) != '250') {
            error_log("RCPT TO failed: {$response}");
            fclose($socket);
            return false;
        }
        
        // Send DATA
        fputs($socket, "DATA\r\n");
        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) != '354') {
            error_log("DATA command failed: {$response}");
            fclose($socket);
            return false;
        }
        
        // Send email content
        fputs($socket, "Subject: {$subject}\r\n");
        fputs($socket, "To: {$to}\r\n");
        fputs($socket, "From: {$from_name} <{$from_email}>\r\n");
        fputs($socket, "\r\n");
        fputs($socket, $message);
        fputs($socket, "\r\n.\r\n");
        
        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) != '250') {
            error_log("Email sending failed: {$response}");
            fclose($socket);
            return false;
        }
        
        // Send QUIT
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        
        return true;
        
    } catch (Exception $e) {
        error_log("SMTP error: " . $e->getMessage());
        fclose($socket);
        return false;
    }
}

/**
 * send_email_http - HTTP-based email sending
 */
function send_email_http($to, $subject, $htmlBody) {
    // This is a fallback method that creates a simple email file
    // that can be processed by a cron job or manual script
    
    $email_data = array(
        'to' => $to,
        'subject' => $subject,
        'body' => $htmlBody,
        'from' => MAIL_FROM,
        'from_name' => MAIL_FROM_NAME,
        'timestamp' => date('Y-m-d H:i:s')
    );
    
    // Save to a queue file
    $queue_file = __DIR__ . '/../email_queue.json';
    $queue = array();
    
    if (file_exists($queue_file)) {
        $queue = json_decode(file_get_contents($queue_file), true) ?: array();
    }
    
    $queue[] = $email_data;
    file_put_contents($queue_file, json_encode($queue, JSON_PRETTY_PRINT));
    
    return true;
}

/**
 * send_smtp_gmail - Real SMTP connection to Gmail for actual email delivery
 */
function send_smtp_gmail($to, $subject, $htmlBody) {
    $smtp_host = MAIL_HOST;
    $smtp_port = MAIL_PORT;
    $smtp_user = MAIL_USERNAME;
    $smtp_pass = MAIL_PASSWORD;
    $from_email = MAIL_FROM;
    $from_name = MAIL_FROM_NAME;
    
    // Create plain text version
    $textBody = strip_tags($htmlBody);
    
    // Create boundary for multipart message
    $boundary = md5(uniqid(time()));
    
    // Build email headers
    $headers = "From: {$from_name} <{$from_email}>\r\n";
    $headers .= "Reply-To: {$from_email}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
    $headers .= "X-Mailer: MathEase OTP System\r\n";
    
    // Build multipart message
    $message = "--{$boundary}\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $message .= $textBody . "\r\n\r\n";
    $message .= "--{$boundary}\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $message .= $htmlBody . "\r\n\r\n";
    $message .= "--{$boundary}--\r\n";
    
    // Try SMTP connection
    $socket = fsockopen($smtp_host, $smtp_port, $errno, $errstr, 30);
    
    if (!$socket) {
        error_log("SMTP connection failed: {$errstr} ({$errno})");
        return false;
    }
    
    // Read initial response
    $response = fgets($socket, 1024);
    if (substr($response, 0, 3) != '220') {
        error_log("SMTP initial response error: {$response}");
        fclose($socket);
        return false;
    }
    
    // Send EHLO
    $hostname = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
    fputs($socket, "EHLO " . $hostname . "\r\n");
    $response = fgets($socket, 1024);
    
    // Start TLS
    fputs($socket, "STARTTLS\r\n");
    $response = fgets($socket, 1024);
    if (substr($response, 0, 3) != '220') {
        error_log("STARTTLS failed: {$response}");
        fclose($socket);
        return false;
    }
    
    // Enable crypto
    if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
        error_log("TLS encryption failed");
        fclose($socket);
        return false;
    }
    
    // Send EHLO again after TLS
    fputs($socket, "EHLO " . $hostname . "\r\n");
    $response = fgets($socket, 1024);
    
    // Authenticate
    fputs($socket, "AUTH LOGIN\r\n");
    $response = fgets($socket, 1024);
    if (substr($response, 0, 3) != '334') {
        error_log("AUTH LOGIN failed: {$response}");
        fclose($socket);
        return false;
    }
    
    // Send username
    fputs($socket, base64_encode($smtp_user) . "\r\n");
    $response = fgets($socket, 1024);
    if (substr($response, 0, 3) != '334') {
        error_log("Username authentication failed: {$response}");
        fclose($socket);
        return false;
    }
    
    // Send password
    fputs($socket, base64_encode($smtp_pass) . "\r\n");
    $response = fgets($socket, 1024);
    if (substr($response, 0, 3) != '235') {
        error_log("Password authentication failed: {$response}");
        fclose($socket);
        return false;
    }
    
    // Send MAIL FROM
    fputs($socket, "MAIL FROM: <{$from_email}>\r\n");
    $response = fgets($socket, 1024);
    if (substr($response, 0, 3) != '250') {
        error_log("MAIL FROM failed: {$response}");
        fclose($socket);
        return false;
    }
    
    // Send RCPT TO
    fputs($socket, "RCPT TO: <{$to}>\r\n");
    $response = fgets($socket, 1024);
    if (substr($response, 0, 3) != '250') {
        error_log("RCPT TO failed: {$response}");
        fclose($socket);
        return false;
    }
    
    // Send DATA
    fputs($socket, "DATA\r\n");
    $response = fgets($socket, 1024);
    if (substr($response, 0, 3) != '354') {
        error_log("DATA command failed: {$response}");
        fclose($socket);
        return false;
    }
    
    // Send email content
    fputs($socket, "Subject: {$subject}\r\n");
    fputs($socket, "To: {$to}\r\n");
    fputs($socket, "From: {$from_name} <{$from_email}>\r\n");
    fputs($socket, "\r\n");
    fputs($socket, $message);
    fputs($socket, "\r\n.\r\n");
    
    $response = fgets($socket, 1024);
    if (substr($response, 0, 3) != '250') {
        error_log("Email sending failed: {$response}");
        fclose($socket);
        return false;
    }
    
    // Send QUIT
    fputs($socket, "QUIT\r\n");
    fclose($socket);
    
    return true;
}

/**
 * send_simple_email - Basic mail() function with minimal headers
 */
function send_simple_email($to, $subject, $htmlBody) {
    $from_email = MAIL_FROM;
    $from_name = MAIL_FROM_NAME;
    
    // Simple headers that work with most mail servers
    $headers = "From: {$from_name} <{$from_email}>\r\n";
    $headers .= "Reply-To: {$from_email}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "X-Mailer: MathEase OTP System\r\n";
    
    // Set sendmail_from
    ini_set('sendmail_from', $from_email);
    
    return @mail($to, $subject, $htmlBody, $headers);
}

/**
 * send_file_email - File-based email for XAMPP
 */
function send_file_email($to, $subject, $htmlBody) {
    $from_email = MAIL_FROM;
    $from_name = MAIL_FROM_NAME;
    
    // Create email content
    $email_content = "To: {$to}\n";
    $email_content .= "From: {$from_name} <{$from_email}>\n";
    $email_content .= "Subject: {$subject}\n";
    $email_content .= "MIME-Version: 1.0\n";
    $email_content .= "Content-Type: text/html; charset=UTF-8\n";
    $email_content .= "X-Mailer: MathEase OTP System\n\n";
    $email_content .= $htmlBody . "\n";
    $email_content .= "---\n";
    
    // Save to file for manual processing
    $filename = "emails/email_" . date('Y-m-d_H-i-s') . "_" . substr(md5($to), 0, 8) . ".txt";
    $filepath = __DIR__ . "/../" . $filename;
    
    // Create emails directory if it doesn't exist
    $email_dir = __DIR__ . "/../emails";
    if (!is_dir($email_dir)) {
        mkdir($email_dir, 0755, true);
    }
    
    if (file_put_contents($filepath, $email_content)) {
        error_log("Email saved to file: {$filename}");
        return true;
    }
    
    return false;
}

/**
 * log_email_for_manual_sending - Log email for manual sending
 */
function log_email_for_manual_sending($to, $subject, $htmlBody) {
    $log_entry = date('Y-m-d H:i:s') . " - TO: {$to} - SUBJECT: {$subject}\n";
    $log_entry .= "Content: " . substr(strip_tags($htmlBody), 0, 100) . "...\n";
    $log_entry .= "---\n";
    
    $log_file = __DIR__ . "/../email_log.txt";
    return file_put_contents($log_file, $log_entry, FILE_APPEND | LOCK_EX);
}


function is_logged_in() {
    $isLoggedIn = isset($_SESSION['user_id']);
    error_log("is_logged_in() check - Session ID: " . session_id() . ", user_id exists: " . ($isLoggedIn ? 'YES' : 'NO') . ", Session data: " . json_encode($_SESSION));
    return $isLoggedIn;
}

function is_teacher_logged_in() {
    return isset($_SESSION['teacher_id']) && isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'teacher';
}

function is_student_logged_in() {
    return isset($_SESSION['user_id']) && (!isset($_SESSION['user_type']) || $_SESSION['user_type'] !== 'teacher');
}

function get_user_type() {
    if (is_teacher_logged_in()) {
        return 'teacher';
    } elseif (is_student_logged_in()) {
        return 'student';
    }
    return null;
}

function clear_student_session() {
    $studentSessionKeys = [
        'user_id', 'user_email', 'user_name', 'student_id', 
        'grade_level', 'strand', 'login_time'
    ];
    
    foreach ($studentSessionKeys as $key) {
        unset($_SESSION[$key]);
    }
}

function clear_teacher_session() {
    $teacherSessionKeys = [
        'teacher_id', 'teacher_email', 'teacher_name', 'teacher_id_number',
        'department', 'subject', 'login_time', 'user_type'
    ];
    
    foreach ($teacherSessionKeys as $key) {
        unset($_SESSION[$key]);
    }
}

function redirect($url) {
    header("Location: $url");
    exit();
}
?>
