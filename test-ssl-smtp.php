<?php
require_once 'php/config.php';

echo "=== Gmail SMTP SSL Test (Port 465) ===\n";
echo "Testing SSL connection instead of STARTTLS...\n\n";

// Test SSL connection on port 465
$context = stream_context_create([
    "ssl" => [
        "verify_peer" => false,
        "verify_peer_name" => false,
    ]
]);

$socket = @stream_socket_client("ssl://smtp.gmail.com:465", $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $context);

if ($socket) {
    echo "✅ SSL connection successful to smtp.gmail.com:465\n";
    
    // Read initial response
    $response = fgets($socket, 1024);
    echo "Server response: " . trim($response) . "\n";
    
    if (substr($response, 0, 3) == '220') {
        echo "✅ SMTP server responded correctly\n";
        
        // Send EHLO
        echo "\nSending EHLO...\n";
        fputs($socket, "EHLO localhost\r\n");
        $response = fgets($socket, 1024);
        echo "EHLO response: " . trim($response) . "\n";
        
        // Try authentication directly (no STARTTLS needed with SSL)
        echo "\nTesting authentication...\n";
        fputs($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 1024);
        echo "AUTH LOGIN response: " . trim($response) . "\n";
        
        if (substr($response, 0, 3) == '334') {
            echo "✅ AUTH LOGIN accepted\n";
            
            // Send username
            echo "\nSending username...\n";
            fputs($socket, base64_encode(MAIL_USERNAME) . "\r\n");
            $response = fgets($socket, 1024);
            echo "Username response: " . trim($response) . "\n";
            
            if (substr($response, 0, 3) == '334') {
                echo "✅ Username accepted\n";
                
                // Send password
                echo "\nSending password...\n";
                fputs($socket, base64_encode(MAIL_PASSWORD) . "\r\n");
                $response = fgets($socket, 1024);
                echo "Password response: " . trim($response) . "\n";
                
                if (substr($response, 0, 3) == '235') {
                    echo "✅ Authentication successful!\n";
                    echo "\n🎉 Gmail SMTP SSL is working!\n";
                    echo "\n📧 Solution: Use port 465 with SSL instead of port 587 with STARTTLS\n";
                } else {
                    echo "❌ Authentication failed: " . trim($response) . "\n";
                    echo "\n🔑 Check your App Password:\n";
                    echo "- Make sure 2FA is enabled on matheasenc@gmail.com\n";
                    echo "- Generate a new App Password\n";
                    echo "- Update the password in php/config.php\n";
                }
            } else {
                echo "❌ Username rejected: " . trim($response) . "\n";
            }
        } else {
            echo "❌ AUTH LOGIN not supported: " . trim($response) . "\n";
        }
    } else {
        echo "❌ Invalid SMTP greeting: " . trim($response) . "\n";
    }
    
    fclose($socket);
} else {
    echo "❌ SSL connection failed: $errstr ($errno)\n";
    echo "\nPossible issues:\n";
    echo "- SSL not supported by your PHP installation\n";
    echo "- Firewall blocking port 465\n";
    echo "- Network restrictions\n";
}

echo "\n=== Test Complete ===\n";
?>
