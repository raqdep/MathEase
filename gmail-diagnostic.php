<?php
require_once 'php/config.php';

echo "=== Gmail SMTP Diagnostic Tool ===\n";
echo "Current Configuration:\n";
echo "Username: " . MAIL_USERNAME . "\n";
echo "Password Length: " . strlen(MAIL_PASSWORD) . " characters\n";
echo "Password Preview: " . substr(MAIL_PASSWORD, 0, 4) . "..." . substr(MAIL_PASSWORD, -4) . "\n";
echo "Port: " . MAIL_PORT . "\n\n";

echo "=== Testing Gmail SMTP Connection ===\n";

// Test 1: Basic SSL Connection
echo "1. Testing SSL connection to Gmail...\n";
$context = stream_context_create([
    "ssl" => [
        "verify_peer" => false,
        "verify_peer_name" => false,
        "allow_self_signed" => true,
    ]
]);

$socket = @stream_socket_client("ssl://smtp.gmail.com:465", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $context);

if (!$socket) {
    echo "❌ SSL connection failed: {$errstr} ({$errno})\n";
    echo "\nPossible issues:\n";
    echo "- Internet connection problem\n";
    echo "- Firewall blocking port 465\n";
    echo "- SSL not supported by PHP\n";
    exit;
}

echo "✅ SSL connection successful\n";

// Test 2: SMTP Greeting
echo "\n2. Testing SMTP greeting...\n";
$response = fgets($socket, 1024);
echo "Server response: " . trim($response) . "\n";

if (substr($response, 0, 3) != '220') {
    echo "❌ Invalid SMTP greeting\n";
    fclose($socket);
    exit;
}

echo "✅ SMTP greeting correct\n";

// Test 3: EHLO Command
echo "\n3. Testing EHLO command...\n";
fputs($socket, "EHLO localhost\r\n");
$response = fgets($socket, 1024);
echo "EHLO response: " . trim($response) . "\n";

if (substr($response, 0, 3) != '250') {
    echo "❌ EHLO command failed\n";
    fclose($socket);
    exit;
}

echo "✅ EHLO command successful\n";

// Test 4: Authentication
echo "\n4. Testing authentication...\n";
fputs($socket, "AUTH LOGIN\r\n");
$response = fgets($socket, 1024);
echo "AUTH LOGIN response: " . trim($response) . "\n";

if (substr($response, 0, 3) != '334') {
    echo "❌ AUTH LOGIN not supported\n";
    echo "Response: " . trim($response) . "\n";
    fclose($socket);
    exit;
}

echo "✅ AUTH LOGIN accepted\n";

// Test 5: Username
echo "\n5. Testing username...\n";
fputs($socket, base64_encode(MAIL_USERNAME) . "\r\n");
$response = fgets($socket, 1024);
echo "Username response: " . trim($response) . "\n";

if (substr($response, 0, 3) != '334') {
    echo "❌ Username rejected\n";
    echo "Response: " . trim($response) . "\n";
    echo "\nPossible issues:\n";
    echo "- Username is incorrect\n";
    echo "- Gmail account doesn't exist\n";
    echo "- Account is suspended\n";
    fclose($socket);
    exit;
}

echo "✅ Username accepted\n";

// Test 6: Password
echo "\n6. Testing password...\n";
fputs($socket, base64_encode(MAIL_PASSWORD) . "\r\n");
$response = fgets($socket, 1024);
echo "Password response: " . trim($response) . "\n";

if (substr($response, 0, 3) != '235') {
    echo "❌ Password rejected\n";
    echo "Response: " . trim($response) . "\n";
    echo "\nPossible issues:\n";
    echo "- App Password is incorrect\n";
    echo "- App Password has spaces\n";
    echo "- 2-Factor Authentication not enabled\n";
    echo "- App Password expired\n";
    echo "- Wrong App Password format\n";
    fclose($socket);
    exit;
}

echo "✅ Password accepted - Authentication successful!\n";

// Test 7: Send Test Email
echo "\n7. Testing email sending...\n";
$testEmail = "test@example.com"; // We'll just test the commands, not actually send

fputs($socket, "MAIL FROM: <" . MAIL_FROM . ">\r\n");
$response = fgets($socket, 1024);
echo "MAIL FROM response: " . trim($response) . "\n";

if (substr($response, 0, 3) != '250') {
    echo "❌ MAIL FROM failed\n";
    fclose($socket);
    exit;
}

echo "✅ MAIL FROM successful\n";

fputs($socket, "RCPT TO: <{$testEmail}>\r\n");
$response = fgets($socket, 1024);
echo "RCPT TO response: " . trim($response) . "\n";

if (substr($response, 0, 3) != '250') {
    echo "❌ RCPT TO failed\n";
    fclose($socket);
    exit;
}

echo "✅ RCPT TO successful\n";

fputs($socket, "QUIT\r\n");
fclose($socket);

echo "\n🎉 Gmail SMTP is working correctly!\n";
echo "\n=== Summary ===\n";
echo "✅ SSL Connection: Working\n";
echo "✅ SMTP Greeting: Working\n";
echo "✅ Authentication: Working\n";
echo "✅ Email Commands: Working\n";
echo "\nThe issue might be in the email sending function or email content.\n";
echo "Try the web-based test: http://localhost/MathEase/gmail-smtp-test.php\n";
?>
