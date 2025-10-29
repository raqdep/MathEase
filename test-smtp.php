<?php
require_once 'php/config.php';

echo "=== Gmail SMTP Connection Test ===\n";
echo "Host: " . MAIL_HOST . "\n";
echo "Port: " . MAIL_PORT . "\n";
echo "Username: " . MAIL_USERNAME . "\n";
echo "Password: " . str_repeat('*', strlen(MAIL_PASSWORD)) . "\n\n";

// Test basic connection
echo "1. Testing basic connection...\n";
$socket = @fsockopen(MAIL_HOST, MAIL_PORT, $errno, $errstr, 10);
if ($socket) {
    echo "✅ Connected to " . MAIL_HOST . ":" . MAIL_PORT . "\n";
    
    // Read initial response
    $response = fgets($socket, 1024);
    echo "Server response: " . trim($response) . "\n";
    
    if (substr($response, 0, 3) == '220') {
        echo "✅ SMTP server responded correctly\n";
        
        // Send EHLO
        echo "\n2. Sending EHLO...\n";
        fputs($socket, "EHLO localhost\r\n");
        $response = fgets($socket, 1024);
        echo "EHLO response: " . trim($response) . "\n";
        
        // Try STARTTLS
        echo "\n3. Trying STARTTLS...\n";
        fputs($socket, "STARTTLS\r\n");
        $response = fgets($socket, 1024);
        echo "STARTTLS response: " . trim($response) . "\n";
        
        if (substr($response, 0, 3) == '220') {
            echo "✅ STARTTLS supported\n";
            
            // Enable TLS
            echo "\n4. Enabling TLS encryption...\n";
            if (stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                echo "✅ TLS encryption enabled\n";
                
                // Send EHLO again after TLS
                echo "\n5. Sending EHLO after TLS...\n";
                fputs($socket, "EHLO localhost\r\n");
                $response = fgets($socket, 1024);
                echo "EHLO after TLS: " . trim($response) . "\n";
                
                // Try authentication
                echo "\n6. Testing authentication...\n";
                fputs($socket, "AUTH LOGIN\r\n");
                $response = fgets($socket, 1024);
                echo "AUTH LOGIN response: " . trim($response) . "\n";
                
                if (substr($response, 0, 3) == '334') {
                    echo "✅ AUTH LOGIN accepted\n";
                    
                    // Send username
                    echo "\n7. Sending username...\n";
                    fputs($socket, base64_encode(MAIL_USERNAME) . "\r\n");
                    $response = fgets($socket, 1024);
                    echo "Username response: " . trim($response) . "\n";
                    
                    if (substr($response, 0, 3) == '334') {
                        echo "✅ Username accepted\n";
                        
                        // Send password
                        echo "\n8. Sending password...\n";
                        fputs($socket, base64_encode(MAIL_PASSWORD) . "\r\n");
                        $response = fgets($socket, 1024);
                        echo "Password response: " . trim($response) . "\n";
                        
                        if (substr($response, 0, 3) == '235') {
                            echo "✅ Authentication successful!\n";
                            echo "\n🎉 Gmail SMTP is working correctly!\n";
                        } else {
                            echo "❌ Authentication failed: " . trim($response) . "\n";
                            echo "\n🔑 Possible issues:\n";
                            echo "- App Password is incorrect\n";
                            echo "- 2-Factor Authentication not enabled\n";
                            echo "- App Password expired\n";
                        }
                    } else {
                        echo "❌ Username rejected: " . trim($response) . "\n";
                    }
                } else {
                    echo "❌ AUTH LOGIN not supported: " . trim($response) . "\n";
                }
            } else {
                echo "❌ Failed to enable TLS encryption\n";
            }
        } else {
            echo "❌ STARTTLS not supported: " . trim($response) . "\n";
        }
    } else {
        echo "❌ Invalid SMTP greeting: " . trim($response) . "\n";
    }
    
    fclose($socket);
} else {
    echo "❌ Connection failed: $errstr ($errno)\n";
    echo "\nPossible issues:\n";
    echo "- Internet connection problem\n";
    echo "- Firewall blocking port 587\n";
    echo "- Gmail SMTP server down\n";
}

echo "\n=== Test Complete ===\n";
?>
