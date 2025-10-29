<?php
// Debug registration form data
echo "=== Registration Form Debug ===\n";
echo "Request Method: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "Content Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'Not set') . "\n\n";

echo "POST Data:\n";
foreach ($_POST as $key => $value) {
    echo "  {$key}: " . (is_string($value) ? $value : json_encode($value)) . "\n";
}

echo "\nRaw Input:\n";
$rawInput = file_get_contents('php://input');
echo $rawInput . "\n";

echo "\nForm Data Check:\n";
$required_fields = ['firstName', 'lastName', 'email', 'lrn', 'gradeLevel', 'strand', 'password', 'confirmPassword'];
foreach ($required_fields as $field) {
    $exists = isset($_POST[$field]);
    $value = $exists ? $_POST[$field] : 'NOT SET';
    $empty = $exists ? (empty(trim($_POST[$field])) ? 'YES' : 'NO') : 'N/A';
    echo "  {$field}: " . ($exists ? 'EXISTS' : 'MISSING') . " | Value: '{$value}' | Empty: {$empty}\n";
}

echo "\nEmail Validation:\n";
if (isset($_POST['email'])) {
    $email = $_POST['email'];
    $valid = filter_var($email, FILTER_VALIDATE_EMAIL);
    echo "  Email: '{$email}'\n";
    echo "  Valid: " . ($valid ? 'YES' : 'NO') . "\n";
} else {
    echo "  Email field not found in POST data\n";
}
?>
