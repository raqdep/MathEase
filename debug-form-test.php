<?php
// Simple test to see what's being received
header('Content-Type: application/json');

echo "=== Raw Request Debug ===\n";
echo "Method: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'Not set') . "\n\n";

echo "POST Data:\n";
foreach ($_POST as $key => $value) {
    echo "  {$key}: '" . $value . "'\n";
}

echo "\nRaw Input:\n";
$rawInput = file_get_contents('php://input');
echo $rawInput . "\n";

echo "\nForm Data Check:\n";
$email = $_POST['email'] ?? 'NOT_SET';
echo "Email field: '{$email}'\n";
echo "Email exists: " . (isset($_POST['email']) ? 'YES' : 'NO') . "\n";
echo "Email empty: " . (empty(trim($email)) ? 'YES' : 'NO') . "\n";

// Return JSON response
$response = [
    'success' => false,
    'message' => 'Debug test - check server output',
    'email_received' => $email,
    'email_exists' => isset($_POST['email']),
    'email_empty' => empty(trim($email))
];

echo "\n=== JSON Response ===\n";
echo json_encode($response, JSON_PRETTY_PRINT);
?>
