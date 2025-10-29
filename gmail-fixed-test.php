<?php
require_once 'php/config.php';

/**
 * Fixed Gmail SMTP function that handles Gmail's specific behavior
 */
function send_gmail_verification_fixed($to, $subject, $htmlBody) {
    $smtp_host = 'smtp.gmail.com';
    $smtp_port = 465;
    $smtp_user = MAIL_USERNAME;
    $smtp_pass = MAIL_PASSWORD;
    $from_email = MAIL_FROM;
    $from_name = MAIL_FROM_NAME;
    
    // Create SSL context
    $context = stream_context_create([
        "ssl" => [
            "verify_peer" => false,
            "verify_peer_name" => false,
            "allow_self_signed" => true,
        ]
    ]);
    
    // Connect to Gmail SMTP with SSL
    $socket = @stream_socket_client("ssl://{$smtp_host}:{$smtp_port}", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $context);
    
    if (!$socket) {
        error_log("Gmail SSL connection failed: {$errstr} ({$errno})");
        return false;
    }
    
    try {
        // Read initial response
        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) != '220') {
            error_log("Gmail initial response error: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send EHLO
        fputs($socket, "EHLO localhost\r\n");
        $response = fgets($socket, 1024);
        
        // Gmail sometimes sends multiple lines for EHLO, read them all
        while (substr($response, 3, 1) == '-') {
            $response = fgets($socket, 1024);
        }
        
        // Try AUTH LOGIN
        fputs($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 1024);
        
        // Handle Gmail's specific response pattern
        if (substr($response, 0, 3) == '250') {
            // Gmail sent 250-SIZE instead of 334, this is a known issue
            // Try to continue with authentication anyway
            error_log("Gmail sent 250-SIZE response, attempting to continue...");
            
            // Send username directly
            fputs($socket, base64_encode($smtp_user) . "\r\n");
            $response = fgets($socket, 1024);
            
            if (substr($response, 0, 3) == '334') {
                // Send password
                fputs($socket, base64_encode($smtp_pass) . "\r\n");
                $response = fgets($socket, 1024);
                
                if (substr($response, 0, 3) == '235') {
                    // Authentication successful, proceed with email
                    return send_email_content($socket, $from_email, $to, $subject, $htmlBody);
                } else {
                    error_log("Gmail password rejected: " . trim($response));
                    fclose($socket);
                    return false;
                }
            } else {
                error_log("Gmail username rejected: " . trim($response));
                fclose($socket);
                return false;
            }
        } elseif (substr($response, 0, 3) == '334') {
            // Normal authentication flow
            fputs($socket, base64_encode($smtp_user) . "\r\n");
            $response = fgets($socket, 1024);
            
            if (substr($response, 0, 3) == '334') {
                fputs($socket, base64_encode($smtp_pass) . "\r\n");
                $response = fgets($socket, 1024);
                
                if (substr($response, 0, 3) == '235') {
                    return send_email_content($socket, $from_email, $to, $subject, $htmlBody);
                } else {
                    error_log("Gmail password rejected: " . trim($response));
                    fclose($socket);
                    return false;
                }
            } else {
                error_log("Gmail username rejected: " . trim($response));
                fclose($socket);
                return false;
            }
        } else {
            error_log("Gmail AUTH LOGIN failed: " . trim($response));
            fclose($socket);
            return false;
        }
        
    } catch (Exception $e) {
        error_log("Gmail SMTP error: " . $e->getMessage());
        fclose($socket);
        return false;
    }
}

/**
 * Send email content after successful authentication
 */
function send_email_content($socket, $from_email, $to, $subject, $htmlBody) {
    try {
        // Send MAIL FROM
        fputs($socket, "MAIL FROM: <{$from_email}>\r\n");
        $response = fgets($socket, 1024);
        
        if (substr($response, 0, 3) != '250') {
            error_log("Gmail MAIL FROM failed: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send RCPT TO
        fputs($socket, "RCPT TO: <{$to}>\r\n");
        $response = fgets($socket, 1024);
        
        if (substr($response, 0, 3) != '250') {
            error_log("Gmail RCPT TO failed: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send DATA
        fputs($socket, "DATA\r\n");
        $response = fgets($socket, 1024);
        
        if (substr($response, 0, 3) != '354') {
            error_log("Gmail DATA command failed: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send email content
        fputs($socket, "Subject: {$subject}\r\n");
        fputs($socket, "To: {$to}\r\n");
        fputs($socket, "From: MathEase <{$from_email}>\r\n");
        fputs($socket, "MIME-Version: 1.0\r\n");
        fputs($socket, "Content-Type: text/html; charset=UTF-8\r\n");
        fputs($socket, "X-Mailer: MathEase Verification System\r\n");
        fputs($socket, "\r\n");
        fputs($socket, $htmlBody);
        fputs($socket, "\r\n.\r\n");
        
        $response = fgets($socket, 1024);
        
        if (substr($response, 0, 3) != '250') {
            error_log("Gmail email sending failed: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send QUIT
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        
        error_log("Gmail verification email sent successfully to: {$to}");
        return true;
        
    } catch (Exception $e) {
        error_log("Gmail email content error: " . $e->getMessage());
        fclose($socket);
        return false;
    }
}
?>